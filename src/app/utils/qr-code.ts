import QrCreator from 'qr-creator';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

interface QrCodeOptions {
    text: string;
    size?: number;
    fill?: string;
    background?: string | null;
    ecLevel?: ErrorCorrectionLevel;
    radius?: number;
}

export function createQrDataUrl({
    text,
    size = 120,
    fill = '#111827',
    background = '#ffffff',
    ecLevel = 'M',
    radius = 0,
}: QrCodeOptions): string {
    const canvas = document.createElement('canvas');

    QrCreator.render(
        {
            text,
            size,
            fill,
            background,
            ecLevel,
            radius,
        },
        canvas,
    );

    return canvas.toDataURL('image/png');
}
