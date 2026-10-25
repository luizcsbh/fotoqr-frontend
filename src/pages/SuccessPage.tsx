import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, PlusCircle, Camera, Sparkles, Heart, Images } from 'lucide-react';
import { Button } from '../components/UI/Button';
import confetti from 'canvas-confetti';

export const SuccessPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { eventTitle?: string; uploadedCount?: number } | undefined;
  const eventTitle = state?.eventTitle || 'Álbum do Evento';
  const uploadedCount = state?.uploadedCount || 1;

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#f59e0b'],
      });
    } catch {
      // Ignore if canvas-confetti fails
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/60 via-slate-50 to-slate-100 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Branding */}
      <header className="max-w-md mx-auto w-full pt-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm">
            <Camera className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-lg text-slate-900">
            Foto<span className="text-brand-600">QR</span>
          </span>
        </div>
      </header>

      {/* Main Success Card */}
      <main className="max-w-md mx-auto w-full my-auto">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl text-center space-y-6">
          {/* Animated Checkmark Circle */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce-soft">
              <CheckCircle2 className="w-14 h-14" />
            </div>
            <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Envio Concluído!
            </h1>
            <p className="text-base text-slate-600 font-medium">
              Obrigado! {uploadedCount === 1 ? 'Sua foto foi enviada' : `Suas ${uploadedCount} fotos foram enviadas`} com sucesso para o álbum do evento.
            </p>
          </div>

          {/* Event Title Badge Box */}
          <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-100 text-brand-900">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 block mb-0.5">
              Álbum
            </span>
            <span className="font-extrabold text-slate-900 text-base">
              {eventTitle}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Os anfitriões vão adorar ver esses momentos guardados para sempre!
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(`/evento/${uuid}`)}
              leftIcon={<PlusCircle className="w-5 h-5" />}
              className="w-full text-base font-bold shadow-lg shadow-brand-600/25 py-3.5"
            >
              Enviar Mais Fotos
            </Button>

            <Link to={`/evento/${uuid}/galeria`} className="w-full inline-block">
              <Button
                variant="outline"
                size="lg"
                className="w-full text-base font-semibold py-3.5"
                leftIcon={<Images className="w-5 h-5" />}
              >
                Ver Galeria do Evento
              </Button>
            </Link>

            <Link to="/" className="w-full inline-block">
              <Button variant="ghost" size="md" className="w-full text-slate-500">
                Conheça o FotoQR
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer message */}
      <footer className="text-center text-xs text-slate-400 pb-2 flex items-center justify-center gap-1">
        <span>Momentos especiais guardados com carinho</span>
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
      </footer>
    </div>
  );
};
