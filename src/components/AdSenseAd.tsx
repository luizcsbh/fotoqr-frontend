import React, { useEffect, useRef } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';

// O script do AdSense já vem no <head> (vite-plugins/seo.ts) e os pedidos só são liberados
// depois do aviso de cookies (utils/adsenseConsent.ts). Aqui só se registra o bloco na fila.
const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
const isValidClient = (id?: string) => !!id && /^ca-pub-\d+$/.test(id);

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
  // Nenhum bloco é exibido antes de o usuário responder ao aviso de cookies.
  const hasDecided = consent !== null;
  const enabled = hasDecided && isValidClient(clientId) && !!adSlot;

  useEffect(() => {
    const el = adRef.current;
    if (!enabled || !el) return;
    // Evita registrar o mesmo bloco duas vezes (o StrictMode do React roda o efeito duas vezes em dev)
    if (el.dataset.adsbygoogleStatus || el.dataset.fotoqrQueued) return;
    el.dataset.fotoqrQueued = 'true';
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error(`AdSense indisponível (${placement}):`, error);
    }
  }, [enabled, adSlot, placement]);

  if (!enabled) return null;

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
