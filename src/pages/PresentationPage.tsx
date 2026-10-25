import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  QrCode,
  Clock,
  ArrowLeft,
  Tv,
  Sparkles,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import { api } from '../services/api';
import { resolvePhotoUrls } from '../services/photo.service';
import { Photo } from '../types';
import { getShareableEventUrl } from '../utils/url';
import { getFotoQrImageSettings } from '../utils/qrLogo';
import { LoadingScreen } from '../components/Layout/LoadingScreen';
import { ColdStartBanner } from '../components/ColdStartBanner';
import { Button } from '../components/UI/Button';

// ─── API Helper ──────────────────────────────────────────────────────────────

interface PresentationEvent {
  uuid: string;
  title: string;
  description?: string;
  photoCount: number;
}

interface GalleryResponse {
  event: PresentationEvent;
  photos: Photo[];
  total: number;
}

async function fetchAllPhotosForPresentation(uuid: string): Promise<GalleryResponse> {
  const res = await api.get(`/api/events/${uuid}/gallery`, {
    params: { page: 1, limit: 100 },
    timeout: 90_000,
  });
  const d = res.data?.data ?? res.data;
  if (!d?.event || !Array.isArray(d.photos)) {
    throw new Error('A resposta do servidor não contém os dados da apresentação.');
  }

  return {
    event: d.event,
    photos: resolvePhotoUrls(Array.isArray(d.photos) ? d.photos : []),
    total: d.total ?? 0,
  };
}

// ─── Main Presentation Page Component ────────────────────────────────────────

export const PresentationPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(5);
  const [showControls, setShowControls] = useState(true);
  const [showQR, setShowQR] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [newPhotoAlert, setNewPhotoAlert] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPhotosCountRef = useRef<number>(0);

  // Poll for photos every 10 seconds to detect newly uploaded guest photos live
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['presentation', uuid],
    queryFn: () => fetchAllPhotosForPresentation(uuid!),
    enabled: !!uuid,
    refetchInterval: (query) => (query.state.status === 'error' ? false : 10_000),
    retry: false,
  });

  const photos = data?.photos ?? [];
  const event = data?.event;
  const qrUrl = uuid ? getShareableEventUrl(uuid) : '';

  // Detect newly added photos and notify
  useEffect(() => {
    if (photos.length > 0) {
      if (lastPhotosCountRef.current > 0 && photos.length > lastPhotosCountRef.current) {
        setNewPhotoAlert(true);
        const t = setTimeout(() => setNewPhotoAlert(false), 4000);
        return () => clearTimeout(t);
      }
      lastPhotosCountRef.current = photos.length;
    }
  }, [photos.length]);

  // Slideshow advance handler
  const handleNext = useCallback(() => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrev = useCallback(() => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying || photos.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [isPlaying, intervalSeconds, photos.length, handleNext]);

  // Autohide controls on mouse idle
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resetControlsTimer);
    resetControlsTimer();
    return () => {
      window.removeEventListener('mousemove', resetControlsTimer);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [resetControlsTimer]);

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignored if fullscreen rejected
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Navigate back — fallback to gallery if there's no browser history
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(uuid ? `/evento/${uuid}/galeria` : '/');
    }
  }, [navigate, uuid]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrev();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'q' || e.key === 'Q') {
        setShowQR((s) => !s);
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          goBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, navigate, goBack]);

  if (isLoading) {
    return (
      <LoadingScreen
        message="Iniciando Modo Apresentação..."
        subMessage="Preparando as fotos em alta definição para o retroprojetor."
      />
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-black text-white">
        <ColdStartBanner />
        <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <Tv className="w-16 h-16 text-slate-500 mx-auto" />
          <h2 className="text-2xl font-bold">Não foi possível carregar o telão</h2>
          <p className="text-slate-400 text-sm">
            O servidor pode estar iniciando ou a conexão falhou. Aguarde um pouco e tente novamente.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="primary" onClick={() => void refetch()}>
              Tentar novamente
            </Button>
            <Button variant="outline" onClick={goBack} className="text-white border-white/20 hover:bg-white/10">
              Voltar
            </Button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-black overflow-hidden select-none cursor-default"
      onMouseMove={resetControlsTimer}
    >
      {/* ─── Animated Slide Progress Bar ──────────────────────────────────── */}
      {isPlaying && photos.length > 1 && (
        <div className="absolute top-0 inset-x-0 z-30 h-1 bg-white/10">
          <div
            key={currentIndex}
            className="h-full bg-brand-500 transition-all ease-linear"
            style={{
              animation: `slideProgress ${intervalSeconds}s linear infinite`,
            }}
          />
        </div>
      )}

      {/* ─── Empty State ──────────────────────────────────────────────────── */}
      {photos.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white z-10">
          <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
            <ImageIcon className="w-12 h-12 text-slate-500" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-400 bg-brand-950/80 px-4 py-1 rounded-full mb-3 border border-brand-800/50">
            Telão do Evento
          </span>
          <h1 className="text-3xl sm:text-5xl font-black mb-3">{event.title}</h1>
          <p className="text-slate-400 max-w-md text-sm sm:text-base mb-8">
            Aponte a câmera para o QR Code abaixo e seja o primeiro a enviar uma foto para este telão!
          </p>
          <div className="p-6 bg-white rounded-3xl shadow-2xl">
            <QRCodeCanvas
              value={qrUrl}
              size={220}
              level="H"
              imageSettings={getFotoQrImageSettings(220)}
            />
          </div>
        </div>
      ) : (
        <>
          {/* ─── Ambient Blurred Background ───────────────────────────────── */}
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-110 transition-all duration-1000 ease-in-out pointer-events-none"
            style={{
              backgroundImage: currentPhoto ? `url(${currentPhoto.url})` : undefined,
            }}
          />

          {/* ─── Main Photo Display with subtle Ken Burns zoom ────────────── */}
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 z-10">
            {currentPhoto && (
              <img
                key={currentPhoto.id}
                src={currentPhoto.url}
                alt={currentPhoto.original_name || event.title}
                className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-all duration-700 animate-in fade-in zoom-in-95"
              />
            )}
          </div>
        </>
      )}

      {/* ─── Live Photo Notification Banner ───────────────────────────────── */}
      {newPhotoAlert && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-brand-500 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Nova foto enviada ao vivo!</span>
        </div>
      )}

      {/* ─── Floating QR Code Badge (for guests to scan directly from projector) ─ */}
      {showQR && (
        <div className="absolute bottom-6 left-6 z-30 bg-slate-900/85 hover:bg-slate-900 backdrop-blur-xl border border-white/15 p-4 rounded-3xl shadow-2xl text-white flex items-center gap-4 transition-all duration-300 group max-w-xs sm:max-w-sm">
          <div className="bg-white p-2.5 rounded-2xl shrink-0 shadow-lg">
            <QRCodeCanvas
              value={qrUrl}
              size={88}
              level="H"
              imageSettings={getFotoQrImageSettings(88)}
            />
          </div>
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-brand-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">
              <Camera className="w-3.5 h-3.5" />
              <span>Envie sua foto</span>
            </div>
            <p className="font-extrabold text-sm sm:text-base leading-tight truncate text-white">
              {event.title}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Aponte a câmera do celular para aparecer no telão!
            </p>
          </div>
        </div>
      )}

      {/* ─── Top Overlay Header Bar (Autohides) ────────────────────────────── */}
      <div
        className={`absolute top-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack()}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            title="Sair da Apresentação (Esc)"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Telão ao Vivo
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Counter */}
        {photos.length > 0 && (
          <div className="text-white/80 text-sm font-semibold bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* ─── Bottom Navigation & Control Bar (Autohides) ───────────────────── */}
      <div
        className={`absolute bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-center justify-end sm:justify-center gap-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-white/15 px-3 py-2 rounded-2xl shadow-2xl">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={photos.length <= 1}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
            title="Foto anterior (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md transition-colors"
            title={isPlaying ? 'Pausar (Espaço)' : 'Iniciar apresentação (Espaço)'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={photos.length <= 1}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
            title="Próxima foto (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-white/15 mx-1" />

          {/* Speed Selector (3s, 5s, 8s, 10s) */}
          <div className="flex items-center gap-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400 mr-0.5 hidden sm:inline" />
            {[3, 5, 8, 12].map((s) => (
              <button
                key={s}
                onClick={() => setIntervalSeconds(s)}
                className={`px-2 py-1 rounded-lg font-semibold transition-colors ${
                  intervalSeconds === s
                    ? 'bg-white/20 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={`Avançar a cada ${s} segundos`}
              >
                {s}s
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/15 mx-1" />

          {/* QR Code Visibility Toggle */}
          <button
            onClick={() => setShowQR((s) => !s)}
            className={`p-2 rounded-xl transition-colors ${
              showQR ? 'text-brand-400 bg-brand-950/60' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={showQR ? 'Ocultar QR Code no telão (Q)' : 'Exibir QR Code no telão (Q)'}
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia para retroprojetor (F)'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ─── CSS Animations ───────────────────────────────────────────────── */}
      <style>{`
        @keyframes slideProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
