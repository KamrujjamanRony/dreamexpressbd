import * as QRCode from 'qrcode';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

interface QrCodeOptions {
  text: string;
  size?: number;
  fill?: string;
  background?: string;
  ecLevel?: ErrorCorrectionLevel;
  radius?: number;
}

export async function createQrDataUrl({
  text,
  size = 120,
  fill = '#111827',
  background = '#ffffff',
  ecLevel = 'M',
}: QrCodeOptions): Promise<string> {
  const canvas = document.createElement('canvas');

  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 0,
    errorCorrectionLevel: ecLevel,
    color: {
      dark: fill,
      light: background ?? '#ffffff',
    },
  });

  return canvas.toDataURL('image/png');
}
