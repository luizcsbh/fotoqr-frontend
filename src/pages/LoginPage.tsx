import React, { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Camera, QrCode, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/UI/Card';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </Link>

        <Card padding="lg" className="shadow-xl border-slate-200/80">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-brand-500/25">
              <div className="relative">
                <Camera className="w-8 h-8" />
                <QrCode className="w-4 h-4 absolute -bottom-1 -right-1 bg-brand-700 rounded p-0.5" />
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Acesse sua conta
            </h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Faça login para criar álbuns de eventos, gerar QR Codes e baixar todas as fotos enviadas.
            </p>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3.5 px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-semibold text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12c0 2.02.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continuar com Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
                Informação importante
              </span>
            </div>
          </div>

          {/* Guest Clarification Notice */}
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/70 p-4 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Você é um convidado do evento?</span>
            </div>
            <p className="leading-relaxed text-emerald-800/90 pl-6">
              Convidados <strong>não precisam fazer login</strong> nem instalar aplicativo! Basta apontar a câmera do seu celular para a plaquinha com o QR Code do evento para enviar suas fotos imediatamente.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5" />
            <span>Autenticação rápida, segura e sem senhas</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
