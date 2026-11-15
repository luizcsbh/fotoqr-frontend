import { useEffect, useState } from 'react';
import { CookieConsent, getCookieConsent, onCookieConsentChange } from '../utils/cookieConsent';

/** Consentimento atual; `null` enquanto o usuário ainda não escolheu. */
export const useCookieConsent = (): CookieConsent | null => {
  const [consent, setConsent] = useState<CookieConsent | null>(() => getCookieConsent());

  useEffect(() => onCookieConsentChange(setConsent), []);

  return consent;
};
