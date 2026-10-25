/**
 * FotoQR Brand Logo for embedded QR Codes
 * High-contrast, vector SVG encoded as Data URL for QRCodeCanvas imageSettings
 */
export const FOTOQR_LOGO_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="%23059669"/><path d="M22 21h-4a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V25a4 4 0 0 0-4-4h-4l-2.5-4.5A2 2 0 0 0 37.7 15h-11.4a2 2 0 0 0-1.8 1.5L22 21z" fill="%23ffffff"/><circle cx="32" cy="34" r="8" fill="%23059669"/><circle cx="32" cy="34" r="4.5" fill="%23ffffff"/><circle cx="42" cy="24" r="1.5" fill="%23ffffff"/></svg>`;

/**
 * Returns imageSettings configuration for QRCodeCanvas with FotoQR branding
 * @param qrSize The dimension in pixels of the QRCodeCanvas
 */
export const getFotoQrImageSettings = (qrSize: number) => {
  const iconSize = Math.max(16, Math.round(qrSize * 0.22));
  return {
    src: FOTOQR_LOGO_DATA_URL,
    height: iconSize,
    width: iconSize,
    excavate: true,
  };
};
