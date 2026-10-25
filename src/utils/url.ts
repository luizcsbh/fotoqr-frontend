/**
 * Detects and formats the public URL for guests to access via QR Code.
 * When running in local development on localhost, mobile phones cannot access 'localhost'.
 * They must access the local machine's IP address on the Wi-Fi network.
 */

// Detected Wi-Fi LAN IP for this machine
export const DETECTED_LAN_IP = '192.168.1.234';

export function getShareableEventUrl(uuid: string, preferredHost?: string): string {
  if (preferredHost) {
    const protocol = window.location.protocol;
    return `${protocol}//${preferredHost}/evento/${uuid}`;
  }

  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;

  // If accessed via localhost or loopback, use LAN IP so phones can connect
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${DETECTED_LAN_IP}${port}/evento/${uuid}`;
  }

  // Otherwise (production or already accessed via LAN IP)
  return `${window.location.origin}/evento/${uuid}`;
}

/** Returns the public gallery URL for viewing all photos of an event. */
export function getGalleryUrl(uuid: string): string {
  return `${window.location.origin}/evento/${uuid}/galeria`;
}

/** Returns the projector / big screen slideshow presentation URL for an event. */
export function getPresentationUrl(uuid: string): string {
  return `${window.location.origin}/evento/${uuid}/apresentacao`;
}
