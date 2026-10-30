import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Upload, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { eventService } from '../services/event.service';
import { Event } from '../types';
import { useUpload } from '../hooks/useUpload';
import { PhotoDropzone } from '../components/Upload/PhotoDropzone';
import { PhotoPreview } from '../components/Upload/PhotoPreview';
import { UploadProgress } from '../components/Upload/UploadProgress';
import { ColdStartBanner } from '../components/ColdStartBanner';
import { Button } from '../components/UI/Button';
import { LoadingScreen } from '../components/Layout/LoadingScreen';
import { DJMusicRequestWidget } from '../components/Music/DJMusicRequestWidget';

export const PublicUploadPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hook for uploads
  const {
    items,
    isUploading,
    overallProgress,
    failedFiles,
    completedFiles,
    addFiles,
    removeFile,
    uploadAll,
    retryFailed,
  } = useUpload(uuid || '', () => {
    // Navigate to success page upon completion
    navigate(`/evento/${uuid}/sucesso`, {
      state: {
        eventTitle: event?.title || 'Álbum do Evento',
        uploadedCount: items.length,
      },
    });
  });

  // Fetch public event details
  useEffect(() => {
    if (!uuid) return;

    let isMounted = true;
    setIsLoading(true);

    eventService
      .getEventByUuid(uuid)
      .then((data) => {
        if (isMounted) {
          setEvent(data);
          setErrorMessage(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const error = err as { message?: string };
          setErrorMessage(
            error.message ||
              'Não foi possível encontrar este evento. Verifique o link ou o QR Code escaneado.'
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [uuid]);

  if (isLoading) {
    return <LoadingScreen message="Conectando ao álbum do evento..." subMessage="Quase pronto para enviar suas fotos!" />;
  }

  // Error State: Not Found
  if (errorMessage || !event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Álbum não encontrado</h2>
          <p className="text-sm text-slate-500 mb-6">
            {errorMessage || 'O link escaneado é inválido ou expirou.'}
          </p>
          <a href="/" className="inline-block">
            <Button variant="secondary" size="md">
              Conhecer o FotoQR
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const isInactive = !event.is_active;

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/40 via-slate-50 to-slate-100 flex flex-col justify-between">
      {/* Cold Start Banner at top */}
      <ColdStartBanner />

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* FotoQR Branding Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              Foto<span className="text-brand-600">QR</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sem login necessário</span>
          </div>
        </header>

        {/* Event Info Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm text-center">
          <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-3">
            Álbum de Fotos
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            {event.title}
          </h1>

          {event.description ? (
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {event.description}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500">
              Envie suas fotos favoritas tiradas hoje para fazerem parte desta lembrança!
            </p>
          )}

          {(() => {
            const rawStart = event.start_date || event.event_date;
            if (!rawStart) return null;
            try {
              const dStart = new Date(rawStart.includes('T') ? rawStart : rawStart + 'T00:00:00');
              if (isNaN(dStart.getTime())) return null;

              const datePart = dStart.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              });

              const hasStartTime = rawStart.includes('T') && !rawStart.endsWith('T00:00:00.000Z') && !rawStart.endsWith('T00:00:00');
              const timeStart = hasStartTime ? dStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;

              let timeText = datePart;
              if (event.end_date) {
                const dEnd = new Date(event.end_date);
                if (!isNaN(dEnd.getTime())) {
                  const timeEnd = dEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  if (timeStart) {
                    timeText = `${datePart} • das ${timeStart} às ${timeEnd}`;
                  }
                }
              } else if (timeStart) {
                timeText = `${datePart} às ${timeStart}`;
              }

              return (
                <p className="mt-3 text-xs text-slate-400 font-medium">
                  Horário: {timeText}
                </p>
              );
            } catch {
              return null;
            }
          })()}
        </div>

        {/* Inactive Notice Banner */}
        {isInactive ? (
          <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-amber-900">
              Envios Temporariamente Pausados
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed max-w-sm mx-auto">
              O organizador deste evento pausou o recebimento de novas fotos neste momento. Por favor, tente novamente mais tarde.
            </p>
          </div>
        ) : (
          <>
            {event.require_photo_approval && (
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>As fotos passam pela aprovação do anfitrião antes de aparecer na galeria do evento.</span>
              </div>
            )}

            {/* Dropzone component */}
            <PhotoDropzone
              onFilesSelected={addFiles}
              disabled={isUploading}
              currentCount={items.length}
            />

            {/* Selected Photos Preview */}
            {items.length > 0 && (
              <PhotoPreview
                items={items}
                onRemove={removeFile}
                disabled={isUploading}
              />
            )}

            {/* Upload Progress Status */}
            {(isUploading || failedFiles > 0) && (
              <UploadProgress
                items={items}
                overallProgress={overallProgress}
                isUploading={isUploading}
                failedCount={failedFiles}
                completedCount={completedFiles}
                onRetryFailed={retryFailed}
              />
            )}

            {/* Bottom Floating Action Bar / Submit Button */}
            {items.length > 0 && !isUploading && (
              <div className="sticky bottom-4 z-20 pt-2 animate-in slide-in-from-bottom-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={uploadAll}
                  isLoading={isUploading}
                  leftIcon={<Upload className="w-5 h-5" />}
                  className="w-full text-base font-bold shadow-xl shadow-brand-600/30 rounded-2xl py-4"
                >
                  Enviar {items.length} {items.length === 1 ? 'Foto' : 'Fotos'} para o Álbum
                </Button>
              </div>
            )}
          </>
        )}

        {/* Security & Privacy assurance */}
        <div className="pt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Suas fotos são enviadas diretamente para os anfitriões do evento.</span>
        </div>

        {/* DJ Music Request Widget */}
        {!isInactive && event.enable_dj_playlist && uuid && (
          <DJMusicRequestWidget eventUuid={uuid} />
        )}
      </main>

      {/* Public Footer */}
      <footer className="py-6 text-center text-xs text-slate-400">
        Criado com FotoQR &bull; Momentos reais compartilhados na hora
      </footer>
    </div>
  );
};
