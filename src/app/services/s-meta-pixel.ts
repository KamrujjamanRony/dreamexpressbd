import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

interface MetaTrackItem {
  id: string;
  quantity: number;
  item_price: number;
}

interface MetaTrackPayload {
  value: number;
  currency?: string;
  num_items?: number;
  contents?: MetaTrackItem[];
  content_ids?: string[];
  content_type?: string;
}

interface PurchasePayload extends MetaTrackPayload {
  orderId: string;
}

@Injectable({ providedIn: 'root' })
export class SMetaPixel {
  private http = inject(HttpClient);
  private doc = inject(DOCUMENT);

  private initialized = false;

  private get pixelId(): string {
    return (environment.metaPixelId || '').trim();
  }

  private get capiProxyUrl(): string {
    return (environment.metaCapiProxyUrl || '').trim();
  }

  init(): void {
    if (this.initialized || !this.pixelId || typeof window === 'undefined') return;

    const w = window as any;

    if (!w.fbq) {
      w.fbq = function (...args: any[]) {
        if (w.fbq.callMethod) {
          w.fbq.callMethod.apply(w.fbq, args);
        } else {
          w.fbq.queue.push(args);
        }
      };
      w._fbq = w.fbq;
      w.fbq.push = w.fbq;
      w.fbq.loaded = true;
      w.fbq.version = '2.0';
      w.fbq.queue = [];

      const scriptId = 'meta-pixel-script';
      if (!this.doc.getElementById(scriptId)) {
        const script = this.doc.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        this.doc.head.appendChild(script);
      }
    }

    w.fbq('init', this.pixelId);
    this.initialized = true;
  }

  trackPageView(url?: string): void {
    this.track('PageView', {}, { eventSourceUrl: url });
  }

  trackAddToCart(payload: MetaTrackPayload): void {
    this.track('AddToCart', this.withDefaults(payload));
  }

  trackInitiateCheckout(payload: MetaTrackPayload): void {
    this.track('InitiateCheckout', this.withDefaults(payload));
  }

  trackPurchase(payload: PurchasePayload): void {
    const eventId = `purchase_${payload.orderId}`;
    this.track('Purchase', this.withDefaults(payload), { eventId });
  }

  private withDefaults(payload: MetaTrackPayload): MetaTrackPayload {
    return {
      ...payload,
      currency: payload.currency || 'BDT',
      content_type: payload.content_type || 'product',
    };
  }

  private track(eventName: string, payload: Record<string, any>, options?: { eventId?: string; eventSourceUrl?: string }): void {
    if (!this.pixelId || typeof window === 'undefined') return;

    this.init();

    const eventId = options?.eventId || this.createEventId(eventName);
    const sourceUrl = options?.eventSourceUrl || window.location.href;
    const w = window as any;

    if (w.fbq) {
      if (eventName === 'PageView') {
        w.fbq('track', eventName, {}, { eventID: eventId });
      } else {
        w.fbq('track', eventName, payload, { eventID: eventId });
      }
    }

    this.sendCapi(eventName, eventId, payload, sourceUrl);
  }

  private sendCapi(eventName: string, eventId: string, customData: Record<string, any>, sourceUrl: string): void {
    if (!this.capiProxyUrl) return;

    this.http.post(this.capiProxyUrl, {
      pixelId: this.pixelId,
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: sourceUrl,
      custom_data: customData,
    }).subscribe({
      error: () => {
        // Do not block UX if tracking endpoint fails.
      },
    });
  }

  createContents(items: Array<{ productId: any; quantity?: number; price?: number }>): MetaTrackItem[] {
    return (items || []).map(item => ({
      id: String(item.productId),
      quantity: Number(item.quantity || 1),
      item_price: Number(item.price || 0),
    }));
  }

  private createEventId(eventName: string): string {
    return `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
