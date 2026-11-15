import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cookie, Settings2, X } from 'lucide-react';
import { useCookieConsent } from '../hooks/useCookieConsent';
import { onOpenCookiePreferences, saveCookieConsent } from '../utils/cookieConsent';

/** Telas exibidas em telões ou impressas: o aviso atrapalharia. */
const HIDDEN_ON = [/\/(telao|apresentacao)\/?$/, /^\/placa\//];

export const CookieConsentBanner: React.FC = () => {
  const consent = useCookieConsent();
  const location = useLocation();
  const [forcedOpen, setForcedOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [adsChoice, setAdsChoice] = useState(consent?.ads ?? false);

  useEffect(
    () =>
      onOpenCookiePreferences(() => {
        setAdsChoice(consent?.ads ?? false);
        setShowDetails(true);
        setForcedOpen(true);
      }),
    [consent],
  );

  const hiddenHere = HIDDEN_ON.some((pattern) => pattern.test(location.pathname));
  const open = forcedOpen || (!consent && !hiddenHere);
  if (!open) return null;

  const decide = (ads: boolean) => {
    saveCookieConsent({ ads });
    setForcedOpen(false);
    setShowDetails(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex w-10 h-10 shrink-0 rounded-xl bg-brand-50 text-brand-600 items-center justify-center">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-slate-900">Usamos cookies</h2>
              {forcedOpen && (
                <button
                  type="button"
                  onClick={() => setForcedOpen(false)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              Usamos cookies essenciais para manter você conectado e o site funcionando. Com a sua permissão, também
              usamos cookies do Google para exibir anúncios personalizados. Saiba mais na nossa{' '}
              <Link
                to="/politica-de-cookies"
                onClick={() => setForcedOpen(false)}
                className="font-semibold text-brand-700 underline underline-offset-2"
              >
                Política de Cookies
              </Link>
              .
            </p>

            {showDetails && (
              <div className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Essenciais</p>
                    <p className="text-xs text-slate-500">
                      Login, segurança e preferências do site. Sempre ativos, pois o site não funciona sem eles.
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-brand-700">Sempre ativos</span>
                </div>
                <label className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Publicidade personalizada</p>
                    <p className="text-xs text-slate-500">
                      Cookies do Google AdSense para mostrar anúncios de acordo com seus interesses. Se desativado, os
                      anúncios continuam aparecendo, mas sem personalização.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={adsChoice}
                    onChange={(event) => setAdsChoice(event.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-brand-600"
                  />
                </label>
              </div>
            )}

            <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              {showDetails ? (
                <button
                  type="button"
                  onClick={() => decide(adsChoice)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Salvar preferências
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Settings2 className="w-4 h-4" />
                  Personalizar
                </button>
              )}
              <button
                type="button"
                onClick={() => decide(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Somente essenciais
              </button>
              <button
                type="button"
                onClick={() => decide(true)}
                className="px-4 py-2.5 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 shadow-xs"
              >
                Aceitar todos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
