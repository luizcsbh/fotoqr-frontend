import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Download,
  Trash2,
  HardDrive,
  Clock,
  Image as ImageIcon,
  Images,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Music2,
  ExternalLink,
  RefreshCw,
  Tv,
  Sparkles,
} from 'lucide-react';
import { eventService } from '../services/event.service';
import { photoService } from '../services/photo.service';
import { QRCodeDisplay } from '../components/Event/QRCodeDisplay';
import { PhotoGrid } from '../components/Gallery/PhotoGrid';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Modal } from '../components/UI/Modal';
import { LoadingScreen } from '../components/Layout/LoadingScreen';
import { formatFileSize } from '../components/Upload/PhotoPreview';
import { getGalleryUrl, getPresentationUrl } from '../utils/url';
import { DJPlaylistPanel } from '../components/Music/DJPlaylistPanel';
import toast from 'react-hot-toast';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  // Fetch Event details
  const {
    data: event,
    isLoading: isLoadingEvent,
    isError: isEventError,
  } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEventById(id!),
    enabled: !!id,
  });

  // Fetch Event Stats
  const { data: stats } = useQuery({
    queryKey: ['eventStats', id],
    queryFn: () => eventService.getEventStats(id!),
    enabled: !!id,
  });

  // Fetch Photos (paginated)
  const {
    data: photoData,
    isLoading: isLoadingPhotos,
    refetch: refetchPhotos,
  } = useQuery({
    queryKey: ['photos', id, page],
    queryFn: () => photoService.getEventPhotos(id!, page, 20),
    enabled: !!id,
  });

  // Toggle active/inactive mutation
  const toggleMutation = useMutation({
    mutationFn: (nextStatus: boolean) => eventService.toggleEvent(id!, nextStatus),
    onSuccess: (updated) => {
      queryClient.setQueryData(['event', id], updated);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(
        updated.is_active
          ? 'Evento reativado! Convidados podem enviar fotos.'
          : 'Evento pausado! Novos envios estão temporariamente suspensos.'
      );
    },
    onError: () => {
      toast.error('Erro ao atualizar status do evento.');
    },
  });

  // Turn the guests' DJ song request playlist on/off
  const djPlaylistMutation = useMutation({
    mutationFn: (enabled: boolean) => eventService.setDjPlaylist(id!, enabled),
    onSuccess: (updated) => {
      queryClient.setQueryData(['event', id], updated);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['music', updated.uuid] });
      toast.success(
        updated.enable_dj_playlist
          ? 'Playlist do DJ ativada! Os convidados já podem pedir músicas.'
          : 'Playlist do DJ desativada. Novos pedidos de música estão bloqueados.'
      );
    },
    onError: () => {
      toast.error('Erro ao atualizar a playlist do DJ.');
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: () => eventService.deleteEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Evento excluído com sucesso.');
      navigate('/dashboard', { replace: true });
    },
    onError: () => {
      toast.error('Erro ao excluir evento.');
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => photoService.deletePhoto(photoId),
    onMutate: (photoId) => {
      setDeletingPhotoId(photoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', id] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['eventStats', id] });
      toast.success('Foto removida.');
    },
    onError: () => {
      toast.error('Erro ao excluir foto.');
    },
    onSettled: () => {
      setDeletingPhotoId(null);
    },
  });

  const handleDownloadAllZip = async () => {
    if (!event) return;
    try {
      setIsDownloadingZip(true);
      toast.loading('Preparando arquivo ZIP...', { id: 'zip-download' });
      await photoService.downloadPhotos(event.id, event.title);
      toast.success('Download iniciado!', { id: 'zip-download' });
    } catch {
      toast.error('Erro ao baixar fotos em ZIP. Tente novamente mais tarde.', {
        id: 'zip-download',
      });
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleDownloadSelected = async (selectedIds: string[]) => {
    if (!event || selectedIds.length === 0) return;
    try {
      setIsDownloadingZip(true);
      toast.loading(`Preparando ZIP com ${selectedIds.length} fotos...`, { id: 'zip-download' });
      await photoService.downloadPhotos(event.id, event.title, selectedIds);
      toast.success('Download iniciado!', { id: 'zip-download' });
    } catch {
      toast.error('Erro ao baixar fotos selecionadas. Tente novamente mais tarde.', {
        id: 'zip-download',
      });
    } finally {
      setIsDownloadingZip(false);
    }
  };

  if (isLoadingEvent) {
    return <LoadingScreen message="Carregando detalhes do álbum..." />;
  }

  if (isEventError || !event) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 text-center bg-white rounded-3xl border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Evento não encontrado</h2>
        <p className="text-sm text-slate-500 mb-6">
          O evento solicitado pode ter sido excluído ou você não possui permissão para acessá-lo.
        </p>
        <Link to="/dashboard">
          <Button variant="primary">Voltar para o Painel</Button>
        </Link>
      </div>
    );
  }

  const formattedDate = (() => {
    const rawStart = event.start_date || event.event_date;
    if (!rawStart) return 'Data não informada';
    try {
      const dStart = new Date(rawStart.includes('T') ? rawStart : rawStart + 'T00:00:00');
      if (isNaN(dStart.getTime())) return 'Data não informada';

      const datePart = dStart.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const hasStartTime = rawStart.includes('T') && !rawStart.endsWith('T00:00:00.000Z') && !rawStart.endsWith('T00:00:00');
      const timeStart = hasStartTime ? dStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : null;

      if (event.end_date) {
        const dEnd = new Date(event.end_date);
        if (!isNaN(dEnd.getTime())) {
          const timeEnd = dEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          if (timeStart) {
            return `${datePart} • das ${timeStart} às ${timeEnd}`;
          }
        }
      }

      return timeStart ? `${datePart} às ${timeStart}` : datePart;
    } catch {
      return 'Data não informada';
    }
  })();

  const lastUpload = stats?.last_upload_at
    ? new Date(stats.last_upload_at).toLocaleString('pt-BR')
    : null;

  const storageLabels: Record<string, string> = {
    local: 'Servidor Local',
    fallback: 'Armazenamento local',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back button & quick bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Meus Eventos</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle status button */}
          <Button
            variant={event.is_active ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => toggleMutation.mutate(!event.is_active)}
            isLoading={toggleMutation.isPending}
            leftIcon={
              event.is_active ? (
                <ToggleRight className="w-4 h-4 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-slate-400" />
              )
            }
          >
            {event.is_active ? 'Evento Ativo' : 'Pausado'}
          </Button>

          {/* Toggle DJ playlist button */}
          <Button
            variant={event.enable_dj_playlist ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => djPlaylistMutation.mutate(!event.enable_dj_playlist)}
            isLoading={djPlaylistMutation.isPending}
            title={
              event.enable_dj_playlist
                ? 'Clique para desativar os pedidos de música dos convidados'
                : 'Clique para permitir que os convidados peçam músicas ao DJ'
            }
            leftIcon={
              <Music2 className={`w-4 h-4 ${event.enable_dj_playlist ? 'text-violet-600' : 'text-slate-400'}`} />
            }
          >
            {event.enable_dj_playlist ? 'Playlist do DJ Ativa' : 'Ativar Playlist do DJ'}
          </Button>

          {/* Delete event button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-red-600 hover:bg-red-50"
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Excluir
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={event.is_active ? 'success' : 'neutral'} dot={event.is_active}>
              {event.is_active ? 'Recebendo Fotos em Tempo Real' : 'Envios Pausados'}
            </Badge>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {storageLabels[event.storage_mode] || event.storage_mode}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {event.title}
          </h1>

          {event.description && (
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500 pt-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
            {lastUpload && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Último envio: {lastUpload}</span>
              </div>
            )}
          </div>
        </div>

        {/* Download All CTA */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={handleDownloadAllZip}
            isLoading={isDownloadingZip}
            leftIcon={<Download className="w-4 h-4" />}
            className="shadow-md shadow-brand-600/20"
          >
            Baixar Todas em ZIP
          </Button>
          <Link
            to={`/dashboard/evento/${event.uuid}/qrcode`}
            className="inline-flex w-full"
          >
            <Button
              variant="secondary"
              size="md"
              className="w-full bg-linear-to-r from-brand-50 to-emerald-50 border-brand-200 text-brand-900 hover:border-brand-300 font-bold shadow-xs"
              leftIcon={<Sparkles className="w-4 h-4 text-brand-600" />}
            >
              Personalizar QR Code & Placas de Mesa
            </Button>
          </Link>
          <a
            href={`/evento/${event.uuid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full"
          >
            <Button
              variant="outline"
              size="md"
              className="w-full"
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              Abrir Link dos Convidados
            </Button>
          </a>
          <a
            href={getGalleryUrl(event.uuid)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full"
          >
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              leftIcon={<Images className="w-4 h-4" />}
            >
              Ver Galeria Pública
            </Button>
          </a>
          <a
            href={getPresentationUrl(event.uuid)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full"
          >
            <Button
              variant="primary"
              size="md"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md border border-slate-700"
              leftIcon={<Tv className="w-4 h-4 text-brand-400" />}
            >
              Modo Apresentação (Telão)
            </Button>
          </a>
        </div>
      </div>

      {/* Grid: QR Code & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Col 1 & 2: Stats cards & photo gallery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <ImageIcon className="w-4 h-4 text-brand-600" />
                <span>Total de Fotos</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {stats?.total_photos ?? photoData?.total ?? 0}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <HardDrive className="w-4 h-4 text-brand-600" />
                <span>Espaço Ocupado</span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {stats?.total_size_bytes ? formatFileSize(stats.total_size_bytes) : '0 B'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Status de Upload</span>
              </div>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {event.is_active ? 'Disponível para envio' : 'Temporariamente pausado'}
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Galeria de Fotos do Evento
                </h3>
                <p className="text-xs text-slate-500">
                  Clique em qualquer foto para ampliar ou baixar individualmente.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchPhotos()}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Atualizar
              </Button>
            </div>

            {isLoadingPhotos ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-12">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <PhotoGrid
                photos={photoData?.data || []}
                totalPhotos={photoData?.total || 0}
                currentPage={photoData?.page || 1}
                totalPages={photoData?.total_pages || 1}
                onPageChange={(p) => setPage(p)}
                onDeletePhoto={(pId) => deletePhotoMutation.mutate(pId)}
                isDeletingId={deletingPhotoId}
                canDelete={true}
                onDownloadSelected={handleDownloadSelected}
                onDownloadAll={handleDownloadAllZip}
                isDownloading={isDownloadingZip}
              />
            )}
          </div>
        </div>

        {/* Right / Col 3: QR Code Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <QRCodeDisplay uuid={event.uuid} eventTitle={event.title} />
          </div>
        </div>
      </div>

      {/* DJ Playlist Panel (only while the owner has the playlist turned on) */}
      {event.uuid && event.enable_dj_playlist && (
        <DJPlaylistPanel eventUuid={event.uuid} />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir este álbum?"
        description="Esta ação é irreversível. Todas as fotos e o QR Code associado deixarão de funcionar."
        maxWidth="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteEventMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteEventMutation.mutate()}
              isLoading={deleteEventMutation.isPending}
            >
              Confirmar Exclusão
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Você tem certeza de que deseja remover permanentemente o evento{' '}
          <strong className="text-slate-900 font-semibold">{event.title}</strong>?
        </p>
      </Modal>
    </div>
  );
};
