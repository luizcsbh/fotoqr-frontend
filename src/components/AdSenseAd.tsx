import React, { useEffect, useRef } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';
import { onCookieConsentChange } from '../utils/cookieConsent';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>> & { requestNonPersonalizedAds?: 0 | 1 };
  }
}

const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
let adsenseScript: Promise<void> | null = null;
/** Preferência de publicidade com que o script do AdSense foi carregado nesta página. */
let loadedWithPersonalizedAds: boolean | null = null;

// O AdSense só lê a preferência ao carregar; se o usuário mudar depois, recarrega a página.
onCookieConsentChange((consent) => {
  if (loadedWithPersonalizedAds !== null && loadedWithPersonalizedAds !== consent.ads) {
    window.location.reload();
  }
});

function loadAdSenseScript(personalizedAds: boolean): Promise<void> {
  if (adsenseScript) return adsenseScript;

  // Sem consentimento para publicidade personalizada → anúncios não personalizados (LGPD).
  window.adsbygoogle = window.adsbygoogle || [];
  window.adsbygoogle.requestNonPersonalizedAds = personalizedAds ? 0 : 1;
  loadedWithPersonalizedAds = personalizedAds;

  adsenseScript = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-fotoqr-adsense]'
    );

    if (existingScript?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script =
      existingScript ??
      Object.assign(document.createElement('script'), {
        async: true,
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId ?? '')}`,
        crossOrigin: 'anonymous',
      });

    script.dataset.fotoqrAdsense = 'true';
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve();
      },
      { once: true }
    );
    script.addEventListener(
      'error',
      () => reject(new Error('Não foi possível carregar o script do Google AdSense.')),
      { once: true }
    );

    if (!existingScript) document.head.appendChild(script);
  });

  return adsenseScript;
}

interface AdSenseAdProps {
  slot?: string;
  placement: string;
  className?: string;
}

export const AdSenseAd: React.FC<AdSenseAdProps> = ({
  slot,
  placement,
  className = '',
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const adSlot = slot?.trim();
  const consent = useCookieConsent();
  // Nenhum anúncio é solicitado antes de o usuário responder ao aviso de cookies.
  const hasDecided = consent !== null;
  const personalizedAds = consent?.ads ?? false;

  useEffect(() => {
    if (!hasDecided || !clientId || !/^ca-pub-\d+$/.test(clientId) || !adSlot || !adRef.current) {
      return;
    }

    let isMounted = true;

    loadAdSenseScript(personalizedAds)
      .then(() => {
        if (!isMounted || !adRef.current) return;
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      })
      .catch((error: unknown) => {
        console.error(`AdSense indisponível (${placement}):`, error);
      });

    return () => {
      isMounted = false;
    };
  }, [adSlot, placement, hasDecided, personalizedAds]);

  if (!hasDecided || !clientId || !/^ca-pub-\d+$/.test(clientId) || !adSlot) return null;

  return (
    <aside
      aria-label="Publicidade"
      className={`mx-auto w-full max-w-5xl px-4 sm:px-6 ${className}`}
    >
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400">
        Publicidade
      </p>
      <ins
        ref={adRef}
        className="adsbygoogle block min-h-[100px] w-full overflow-hidden"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};

export const adSlots = {
  landing: import.meta.env.VITE_ADSENSE_SLOT_LANDING,
  dashboard: import.meta.env.VITE_ADSENSE_SLOT_DASHBOARD,
  gallery: import.meta.env.VITE_ADSENSE_SLOT_GALLERY,
};
