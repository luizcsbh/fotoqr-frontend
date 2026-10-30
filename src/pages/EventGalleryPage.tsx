import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Camera,
  Upload,
  Calendar,
  Image as ImageIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  Check,
  Tv,
} from 'lucide-react';
import { api } from '../services/api';
import { photoService, resolvePhotoUrls } from '../services/photo.service';
import { Photo } from '../types';
import { Button } from '../components/UI/Button';
import { LoadingScreen } from '../components/Layout/LoadingScreen';
import { ColdStartBanner } from '../components/ColdStartBanner';
import toast from 'react-hot-toast';
import { AdSenseAd, adSlots } from '../components/AdSenseAd';

// ─── Types ──────────────────────────────────────────────────────────────────

interface GalleryEvent {
  uuid: string;
  title: string;
  description?: string;
  eventDate?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  photoCount: number;
}

interface GalleryResponse {
  event: GalleryEvent;
  photos: Photo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── API helper ──────────────────────────────────────────────────────────────

async function fetchGallery(uuid: string, page: number, limit: number): Promise<GalleryResponse> {
  const res = await api.get(`/api/events/${uuid}/gallery`, {
    params: { page, limit },
    timeout: 90_000,
  });
  const d = res.data?.data ?? res.data;
  if (!d?.event || !Array.isArray(d.photos)) {
    throw new Error('A resposta do servidor não contém os dados da galeria.');
  }

  return {
    event: d.event,
    photos: resolvePhotoUrls(Array.isArray(d.photos) ? d.photos : []),
    total: d.total ?? 0,
    page: d.page ?? page,
    limit: d.limit ?? limit,
    totalPages: d.totalPages ?? d.total_pages ?? 1,
  };
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

interface LightboxProps {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ photos, index, onClose, onPrev, onNext }) => {
  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white text-sm font-semibold">
          {index + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={photo.url}
            download={photo.filename}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Baixar foto"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Image */}
      <img
        src={photo.url}
        alt={photo.filename}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {index < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

export const EventGalleryPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [page, setPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const LIMIT = 24;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['gallery', uuid, page],
    queryFn: () => fetchGallery(uuid!, page, LIMIT),
    enabled: !!uuid,
    staleTime: 30_000,
    retry: false,
  });

  // Reset selection on page change
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  const handleDownloadAll = async () => {
    if (!uuid || !data?.event) return;
    try {
      setIsDownloading(true);
      toast.loading('Preparando arquivo ZIP...', { id: 'gallery-zip' });
      await photoService.downloadPhotos(uuid, data.event.title);
      toast.success('Download iniciado!', { id: 'gallery-zip' });
    } catch {
      toast.error('Erro ao baixar fotos.', { id: 'gallery-zip' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSelected = async () => {
    if (!uuid || !data?.event || selectedIds.size === 0) return;
    try {
      setIsDownloading(true);
      toast.loading(`Preparando ZIP com ${selectedIds.size} fotos...`, { id: 'gallery-zip' });
      await photoService.downloadPhotos(uuid, data.event.title, Array.from(selectedIds));
      toast.success('Download iniciado!', { id: 'gallery-zip' });
    } catch {
      toast.error('Erro ao baixar fotos selecionadas.', { id: 'gallery-zip' });
    } finally {
      setIsDownloading(false);
    }
  };

  const allCurrentSelected = data && data.photos.length > 0 && data.photos.every((p) => selectedIds.has(p.id));

  const handleToggleSelectAll = () => {
    if (allCurrentSelected) {
      setSelectedIds(new Set());
    } else if (data) {
      setSelectedIds(new Set(data.photos.map((p) => p.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Keyboard nav for lightbox
  React.useEffect(() => {
    if (lightboxIndex === null || !data) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      else if (e.key === 'ArrowRight')
        setLightboxIndex((i) => (i !== null && i < data.photos.length - 1 ? i + 1 : i));
      else if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, data]);

  if (isLoading) {
    return <LoadingScreen message="Carregando galeria..." subMessage="Buscando as fotos do evento." />;
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <ColdStartBanner />
        <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Não foi possível carregar a galeria</h2>
          <p className="text-sm text-slate-500 mb-6">
            O servidor pode estar iniciando ou a conexão falhou. Aguarde um pouco e tente novamente.
          </p>
          <Button variant="primary" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
        </div>
      </div>
    );
  }

  const { event, photos, total, totalPages } = data;

  const formattedDate = (() => {
    const rawStart = event.startDate || event.eventDate;
    if (!rawStart) return null;
    try {
      const dStart = new Date(rawStart.includes('T') ? rawStart : rawStart + 'T00:00:00');
      if (isNaN(dStart.getTime())) return null;

      const datePart = dStart.toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      });

      const hasStartTime = rawStart.includes('T') && !rawStart.endsWith('T00:00:00.000Z') && !rawStart.endsWith('T00:00:00');
      const timeStart = hasStartTime ? dStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;

      if (event.endDate) {
        const dEnd = new Date(event.endDate);
        if (!isNaN(dEnd.getTime())) {
          const timeEnd = dEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          if (timeStart) {
            return `${datePart} • das ${timeStart} às ${timeEnd}`;
          }
        }
      }

      return timeStart ? `${datePart} às ${timeStart}` : datePart;
    } catch {
      return null;
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
          onNext={() =>
            setLightboxIndex((i) => (i !== null && i < photos.length - 1 ? i + 1 : i))
          }
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">
              Foto<span className="text-brand-400">QR</span>
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Link to={`/evento/${uuid}/apresentacao`} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Tv className="w-4 h-4 text-brand-400" />}
                className="text-white border-white/20 hover:bg-white/10"
              >
                Telão
              </Button>
            </Link>

            <Link to={`/evento/${uuid}`}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Enviar Fotos
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Event Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-brand-400 bg-brand-900/30 px-3 py-1 rounded-full mb-2">
            Álbum do Evento
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              {event.description}
            </p>
          )}
          <div className="flex items-center justify-center flex-wrap gap-4 pt-2 text-xs text-slate-400">
            {formattedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              {total} {total === 1 ? 'foto' : 'fotos'}
            </span>
            {event.isActive && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Recebendo fotos ao vivo
              </span>
            )}
          </div>
        </div>

        <AdSenseAd
          slot={adSlots.gallery}
          placement="galeria pública"
          className="mb-8"
        />

        {/* Gallery grid */}
        {photos.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto">
              <ImageIcon className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">Nenhuma foto ainda</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Seja o primeiro a contribuir com este álbum!
            </p>
            <Link to={`/evento/${uuid}`}>
              <Button variant="primary" leftIcon={<Upload className="w-4 h-4" />}>
                Enviar Fotos
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Selection & Download Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer select-none">
                  <input
                    id="gallery-select-all-photos"
                    name="gallery_select_all"
                    type="checkbox"
                    checked={allCurrentSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-white/20 bg-slate-800"
                  />
                  <span>Selecionar Todas ({photos.length})</span>
                </label>

                {selectedIds.size > 0 && (
                  <span className="text-xs font-bold text-brand-400 bg-brand-950/60 px-2.5 py-1 rounded-full border border-brand-800/40">
                    {selectedIds.size} selecionada{selectedIds.size > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedIds.size > 0 ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleDownloadSelected}
                      isLoading={isDownloading}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Baixar Selecionadas ({selectedIds.size})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIds(new Set())}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Desmarcar
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAll}
                    isLoading={isDownloading}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    Baixar Todas em ZIP ({total})
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`group relative aspect-square rounded-xl overflow-hidden bg-slate-700/50 hover:ring-2 hover:ring-brand-500 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    selectedIds.has(photo.id) ? 'ring-2 ring-brand-500' : ''
                  }`}
                >
                  {/* Selection Checkbox */}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(photo.id);
                    }}
                    className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      selectedIds.has(photo.id)
                        ? 'bg-brand-600 text-white shadow-md ring-1 ring-white scale-105'
                        : 'bg-black/50 text-white/70 hover:text-white opacity-80 sm:opacity-0 group-hover:opacity-100'
                    }`}
                    title={selectedIds.has(photo.id) ? 'Desmarcar foto' : 'Selecionar foto'}
                  >
                    {selectedIds.has(photo.id) ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded border border-white/80" />
                    )}
                  </span>

                  <img
                    src={photo.thumbnail_url || photo.url}
                    alt={photo.original_name || photo.filename}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (photo.thumbnail_url && target.src === photo.thumbnail_url && photo.url && photo.url !== photo.thumbnail_url) {
                        target.src = photo.url;
                      }
                    }}
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Download className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                <p className="text-xs text-slate-400">
                  Página <span className="font-semibold text-white">{page}</span> de{' '}
                  <span className="font-semibold text-white">{totalPages}</span> ({total} fotos)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating upload CTA */}
      {event.isActive && (
        <div className="fixed bottom-6 right-6 z-30">
          <Link to={`/evento/${uuid}`}>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Upload className="w-5 h-5" />}
              className="shadow-2xl shadow-brand-600/40 rounded-2xl"
            >
              Enviar Fotos
            </Button>
          </Link>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-500 border-t border-white/5">
        Criado com FotoQR &bull; Momentos reais compartilhados na hora
      </footer>
    </div>
  );
};
