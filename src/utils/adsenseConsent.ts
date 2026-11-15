import { CookieConsent, getCookieConsent, onCookieConsentChange } from './cookieConsent';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>> & {
      requestNonPersonalizedAds?: 0 | 1;
      pauseAdRequests?: 0 | 1;
    };
  }
}

/**
 * O script do AdSense é carregado no <head> com os pedidos de anúncio pausados
 * (vite-plugins/seo.ts). Aqui eles são liberados só depois da escolha no aviso de cookies:
 * sem consentimento para publicidade personalizada, os anúncios são não personalizados (LGPD).
 */
let appliedPersonalizedAds: boolean | null = null;

const applyConsent = (consent: CookieConsent) => {
  const queue = (window.adsbygoogle = window.adsbygoogle || []);
  queue.requestNonPersonalizedAds = consent.ads ? 0 : 1;
  queue.pauseAdRequests = 0;
  appliedPersonalizedAds = consent.ads;
};

export const initAdsenseConsent = () => {
  const consent = getCookieConsent();
  if (consent) applyConsent(consent);

  onCookieConsentChange((next) => {
    // O AdSense lê a preferência uma vez por página: se ela mudar depois, recarrega.
    if (appliedPersonalizedAds !== null && appliedPersonalizedAds !== next.ads) {
      window.location.reload();
      return;
    }
    applyConsent(next);
  });
};
