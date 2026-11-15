/**
 * Consentimento de cookies (LGPD).
 *
 * Os cookies essenciais (login, sessão) não dependem de consentimento.
 * A publicidade personalizada (Google AdSense) só é usada quando o usuário aceita;
 * caso contrário, os anúncios são exibidos no modo não personalizado.
 */

export const COOKIE_CONSENT_STORAGE_KEY = 'fotoqr_cookie_consent';
/** Aumente quando a política mudar de forma relevante para pedir o consentimento de novo. */
export const COOKIE_CONSENT_VERSION = 1;

const CHANGE_EVENT = 'fotoqr:cookie-consent-change';
const OPEN_PREFERENCES_EVENT = 'fotoqr:open-cookie-preferences';

export interface CookieConsent {
  version: number;
  /** Publicidade personalizada (cookies de anúncios do Google). */
  ads: boolean;
  decidedAt: string;
}

export const getCookieConsent = (): CookieConsent | null => {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (parsed.version !== COOKIE_CONSENT_VERSION || typeof parsed.ads !== 'boolean') return null;
    return parsed as CookieConsent;
  } catch {
    return null;
  }
};

export const saveCookieConsent = (choice: { ads: boolean }): CookieConsent => {
  const consent: CookieConsent = {
    version: COOKIE_CONSENT_VERSION,
    ads: choice.ads,
    decidedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // Navegação privada ou armazenamento bloqueado: vale apenas para esta visita.
  }
  window.dispatchEvent(new CustomEvent<CookieConsent>(CHANGE_EVENT, { detail: consent }));
  return consent;
};

export const onCookieConsentChange = (listener: (consent: CookieConsent) => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<CookieConsent>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
};

/** Reabre o painel de preferências (ex.: link no rodapé). */
export const openCookiePreferences = () => {
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT));
};

export const onOpenCookiePreferences = (listener: () => void) => {
  window.addEventListener(OPEN_PREFERENCES_EVENT, listener);
  return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, listener);
};
