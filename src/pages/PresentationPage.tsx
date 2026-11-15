import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  MessageSquareHeart,
} from 'lucide-react';
import { api } from '../services/api';
import { resolvePhotoUrls } from '../services/photo.service';
import { Photo } from '../types';
import { getShareableEventUrl } from '../utils/url';
import { getFotoQrImageSettings } from '../utils/qrLogo';
import { LoadingScreen } from '../components/Layout/LoadingScreen';
import { ColdStartBanner } from '../components/ColdStartBanner';
import { Button } from '../components/UI/Button';
import type { WallMessage } from '../services/messageWall.service';

// ─── API Helper ──────────────────────────────────────────────────────────────

interface PresentationEvent {
  uuid: string;
  title: string;
  description?: string;
  photoCount: number;
  enableMessageWall?: boolean;
}

interface GalleryResponse {
  event: PresentationEvent;
  photos: Photo[];
  total: number;
  /** Guest wall messages, newest first (empty when the wall is off). */
  messages: WallMessage[];
}

async function fetchAllPhotosForPresentation(uuid: string): Promise<GalleryResponse> {
  const res = await api.get(`/api/events/${uuid}/gallery`, {
    // messages=1: the wall messages come in the same refresh (one request per poll)
    params: { page: 1, limit: 100, messages: 1 },
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
    messages: Array.isArray(d.messages) ? d.messages : [],
  };
}

const WALL_ROTATE_SECONDS = 9;
const wallPrefKey = (uuid?: string) => `fotoqr_telao_mural_${uuid}`;

// ─── Main Presentation Page Component ────────────────────────────────────────

export const PresentationPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const isPlayingRef = useRef(true);
  isPlayingRef.current = isPlaying;
  const [slideTick, setSlideTick] = useState(0);
  const [intervalSeconds, setIntervalSeconds] = useState(5);
  const [showControls, setShowControls] = useState(true);
  const [showQR, setShowQR] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Message wall on the Telão (a display setting remembered on this screen; on by default)
  const [showWall, setShowWall] = useState<boolean>(() => {
    try {
      return localStorage.getItem(wallPrefKey(uuid)) !== 'off';
    } catch {
      return true;
    }
  });
  const [wallIndex, setWallIndex] = useState(0);
  const [wallTick, setWallTick] = useState(0);
  const [freshMessageId, setFreshMessageId] = useState<string | null>(null);
  const seenMessageIdsRef = useRef<Set<string> | null>(null);

  // Number of photos that just arrived (0 = no banner)
  const [newPhotoAlert, setNewPhotoAlert] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ids already known, the photo on screen and the new photos still waiting to be shown first
  const seenIdsRef = useRef<Set<string> | null>(null);
  const currentIdRef = useRef<string | null>(null);
  const pendingNewIdsRef = useRef<string[]>([]);

  // Poll often so a photo sent by a guest reaches the projector within seconds, with nobody touching it
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['presentation', uuid],
    queryFn: () => fetchAllPhotosForPresentation(uuid!),
    enabled: !!uuid,
    // Keep polling during the whole event: after a failed refresh, retry a bit slower instead of
    // stopping for good (a projector left running must recover on its own)
    refetchInterval: (query) => (query.state.status === 'error' ? 30_000 : 5_000),
    refetchIntervalInBackground: true,
    retry: false,
  });

  const photos = useMemo(() => data?.photos ?? [], [data]);
  const event = data?.event;
  const qrUrl = uuid ? getShareableEventUrl(uuid) : '';
  const wallEnabled = Boolean(event?.enableMessageWall);
  const messages = useMemo(() => (wallEnabled ? data?.messages ?? [] : []), [data, wallEnabled]);
  const currentMessage = messages.length > 0 ? messages[wallIndex % messages.length] : undefined;

  const toggleWall = useCallback(() => {
    setShowWall((on) => {
      try {
        localStorage.setItem(wallPrefKey(uuid), on ? 'off' : 'on');
      } catch {
        // display preference only
      }
      return !on;
    });
  }, [uuid]);

  // A message that just arrived goes straight to the wall card (the list is newest first)
  useEffect(() => {
    if (!data) return;
    const ids = messages.map((m) => String(m.id));
    const firstLoad = seenMessageIdsRef.current === null;
    const seen = seenMessageIdsRef.current ?? new Set<string>();
    seenMessageIdsRef.current = new Set(ids);
    if (firstLoad) return;
    const arrived = ids.filter((id) => !seen.has(id));
    if (arrived.length > 0) {
      setWallIndex(0);
      setWallTick((t) => t + 1);
      setFreshMessageId(ids[0]);
    }
  }, [data, messages]);

  // Rotate the wall messages on their own clock, next to the photos
  useEffect(() => {
    if (!showWall || messages.length <= 1) return;
    const timer = setInterval(() => {
      setWallIndex((i) => (i + 1) % messages.length);
      setFreshMessageId(null);
    }, WALL_ROTATE_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [showWall, messages.length, wallTick]);

  const showPhotoById = useCallback(
    (id: string) => {
      const index = photos.findIndex((p) => String(p.id) === id);
      if (index >= 0) {
        currentIdRef.current = id;
        setCurrentIndex(index);
      }
    },
    [photos]
  );

  // Every refresh: keep the same photo on screen (new ones are added at the top of the list),
  // then put the photos that just arrived at the front of the slideshow
  useEffect(() => {
    // Nothing loaded yet: the photos already in the event must not count as "new"
    if (!data) return;
    const ids = photos.map((p) => String(p.id));
    const firstLoad = seenIdsRef.current === null;
    const seen = seenIdsRef.current ?? new Set<string>();
    const arrived = firstLoad ? [] : ids.filter((id) => !seen.has(id));
    seenIdsRef.current = new Set(ids);

    // Drop queued photos that were removed (deleted / rejected) meanwhile
    pendingNewIdsRef.current = pendingNewIdsRef.current.filter((id) => ids.includes(id));

    const current = currentIdRef.current;
    const stillThere = current ? ids.indexOf(current) : -1;
    if (stillThere >= 0) setCurrentIndex(stillThere);
    else if (ids.length > 0) {
      currentIdRef.current = ids[0];
      setCurrentIndex(0);
    }

    if (arrived.length === 0) return;
    // The list is newest first: show the new ones in the order they were sent
    pendingNewIdsRef.current.push(...arrived.reverse());
    setNewPhotoAlert(arrived.length);
    // A paused slideshow is being driven by hand: only announce, don't jump
    if (isPlayingRef.current) {
      const next = pendingNewIdsRef.current.shift()!;
      const index = ids.indexOf(next);
      currentIdRef.current = next;
      setCurrentIndex(index);
      setSlideTick((t) => t + 1);
    }
  }, [data, photos]);

  useEffect(() => {
    if (!newPhotoAlert) return;
    const t = setTimeout(() => setNewPhotoAlert(0), 5000);
    return () => clearTimeout(t);
  }, [newPhotoAlert]);

  // Slideshow advance: photos that just arrived go first, then the normal order
  const handleNext = useCallback(() => {
    if (photos.length === 0) return;
    const queued = pendingNewIdsRef.current.shift();
    if (queued && photos.some((p) => String(p.id) === queued)) {
      showPhotoById(queued);
      return;
    }
    const nextIndex = (Math.max(0, photos.findIndex((p) => String(p.id) === currentIdRef.current)) + 1) % photos.length;
    currentIdRef.current = String(photos[nextIndex].id);
    setCurrentIndex(nextIndex);
  }, [photos, showPhotoById]);

  const handlePrev = useCallback(() => {
    if (photos.length === 0) return;
    const index = Math.max(0, photos.findIndex((p) => String(p.id) === currentIdRef.current));
    const prevIndex = (index - 1 + photos.length) % photos.length;
    currentIdRef.current = String(photos[prevIndex].id);
    setCurrentIndex(prevIndex);
  }, [photos]);

  // Auto-play timer
  // (slideTick restarts the countdown, so a photo that just arrived stays the full interval on screen)
  useEffect(() => {
    if (!isPlaying || photos.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [isPlaying, intervalSeconds, photos.length, handleNext, slideTick]);

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
      } else if (e.key === 'm' || e.key === 'M') {
        toggleWall();
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
  }, [handleNext, handlePrev, navigate, goBack, toggleWall]);

  if (isLoading) {
    return (
      <LoadingScreen
        message="Iniciando Modo Apresentação..."
        subMessage="Preparando as fotos em alta definição para o retroprojetor."
      />
    );
  }

  // A failed background refresh keeps the photos already loaded on screen
  if ((isError && !data) || !event) {
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
            key={`${currentPhoto?.id}-${slideTick}`}
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
      {newPhotoAlert > 0 && (
        <div
          role="status"
          className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-brand-500 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>
            {newPhotoAlert === 1 ? 'Nova foto enviada ao vivo!' : `${newPhotoAlert} novas fotos enviadas ao vivo!`}
          </span>
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
            <p className="font-extrabold text-sm sm:text-base sm:leading-6 leading-tight truncate text-white">
              {event.title}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Aponte a câmera do celular para aparecer no telão!
            </p>
          </div>
        </div>
      )}

      {/* ─── Message Wall card (guest messages rotate next to the photos) ───── */}
      {showWall && currentMessage && (
        <div
          key={`${currentMessage.id}-${wallTick}`}
          className="absolute bottom-6 right-6 z-20 w-[min(26rem,calc(100vw-3rem))] rounded-3xl border border-white/15 bg-slate-900/85 p-5 text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-300">
              <MessageSquareHeart className="h-4 w-4" />
              Mural de recados
            </span>
            {freshMessageId === String(currentMessage.id) && (
              <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[11px] font-bold">Novo recado!</span>
            )}
          </div>
          <p className="text-base sm:text-lg sm:leading-7 font-semibold leading-snug whitespace-pre-line break-words line-clamp-6">
            “{currentMessage.message}”
          </p>
          <p className="mt-3 text-sm font-bold text-rose-200 truncate">— {currentMessage.name}</p>
          {messages.length > 1 && (
            <p className="mt-1 text-[11px] text-slate-400">
              {(wallIndex % messages.length) + 1} de {messages.length} recados
            </p>
          )}
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold min-h-9 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            title="Sair da Apresentação (Esc)"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Sair</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Telão ao Vivo
              </span>
            </div>
            <h1 className="text-lg sm:text-xl sm:leading-7 font-black text-white leading-tight">
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold min-h-9 px-3 py-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
            title="Foto anterior (←)"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Anterior</span>
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold min-h-9 px-3 py-1 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md transition-colors"
            title={isPlaying ? 'Pausar (Espaço)' : 'Iniciar apresentação (Espaço)'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={photos.length <= 1}
            className="inline-flex items-center gap-1.5 text-xs font-semibold min-h-9 px-3 py-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
            title="Próxima foto (→)"
          >
            <ChevronRight className="w-5 h-5" />
            <span>Próxima</span>
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

          {/* Message wall toggle (display setting) */}
          <button
            onClick={toggleWall}
            disabled={!wallEnabled}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold min-h-9 px-3 py-1 rounded-xl transition-colors disabled:opacity-40 ${
              wallEnabled && showWall ? 'text-rose-300 bg-rose-950/60' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={
              !wallEnabled
                ? 'Ative o mural de recados na página do evento'
                : showWall
                  ? 'Ocultar os recados no telão (M)'
                  : 'Exibir os recados no telão (M)'
            }
          >
            <MessageSquareHeart className="w-5 h-5" />
            <span>{!wallEnabled ? 'Mural desativado' : showWall ? 'Ocultar mural' : 'Ativar mural'}</span>
          </button>

          {/* QR Code Visibility Toggle */}
          <button
            onClick={() => setShowQR((s) => !s)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold min-h-9 px-3 py-1 rounded-xl transition-colors ${
              showQR ? 'text-brand-400 bg-brand-950/60' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={showQR ? 'Ocultar QR Code no telão (Q)' : 'Exibir QR Code no telão (Q)'}
          >
            <QrCode className="w-5 h-5" />
            <span>{showQR ? 'Ocultar QR' : 'Mostrar QR'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 text-xs font-semibold min-h-9 px-3 py-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title={isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia para retroprojetor (F)'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            <span>{isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}</span>
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
