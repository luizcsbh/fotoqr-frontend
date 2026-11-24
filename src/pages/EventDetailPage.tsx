import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  MessageSquareHeart,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Tv,
  Sparkles,
  Users,
  QrCode,
  ScanLine,
  Palette,
  BarChart3,
  Camera,
  Pencil,
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
import { DJManager } from '../components/Music/DJManager';
import { PendingPhotosPanel } from '../components/Gallery/PendingPhotosPanel';
import { GuestManager } from '../components/Event/GuestManager';
import { InvitationManager } from '../components/Event/InvitationManager';
import { ReaderManager } from '../components/Event/ReaderManager';
import { CoverEditor } from '../components/Event/CoverEditor';
import { EventDashboardHub } from '../components/Event/EventDashboardHub';
import { MessageWallManager } from '../components/Event/MessageWallManager';
import { EditEventModal } from '../components/Event/EditEventModal';
import toast from 'react-hot-toast';

export const EventDetailPage: React.FC = () => {
  const { id, tab: routeTab } = useParams<{ id: string; tab?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  type TabType = 'photos' | 'guests' | 'invitations' | 'readers' | 'dj' | 'mural' | 'cover' | 'metrics';
  const EVENT_TABS: { id: TabType; label: string; Icon: React.ElementType }[] = [
    { id: 'photos', label: 'Galeria & Fotos', Icon: Camera },
    { id: 'guests', label: 'Convidados', Icon: Users },
    { id: 'invitations', label: 'Convites & Envios', Icon: QrCode },
    { id: 'readers', label: 'Portaria & Leitores', Icon: ScanLine },
    { id: 'dj', label: 'DJ & Playlist', Icon: Music2 },
    { id: 'mural', label: 'Mural de Recados', Icon: MessageSquareHeart },
    { id: 'cover', label: 'Capa & Convite', Icon: Palette },
    { id: 'metrics', label: 'Métricas & Relatórios', Icon: BarChart3 },
  ];

  const parseTab = (val?: string | null): TabType | null => {
    if (!val) return null;
    const v = val.toLowerCase();
    if (v === 'dj' || v === 'playlist') return 'dj';
    if (v === 'photos' || v === 'fotos' || v === 'galeria') return 'photos';
    if (v === 'guests' || v === 'convidados') return 'guests';
    if (v === 'invitations' || v === 'convites') return 'invitations';
    if (v === 'readers' || v === 'leitores' || v === 'portaria') return 'readers';
    if (v === 'mural' || v === 'recados') return 'mural';
    if (v === 'cover' || v === 'capa') return 'cover';
    if (v === 'metrics' || v === 'metricas' || v === 'relatorios') return 'metrics';
    return null;
  };

  const initialTab = parseTab(routeTab) || parseTab(searchParams.get('tab')) || parseTab(searchParams.get('aba')) || 'photos';
  const [activeTab, setActiveTabState] = useState<TabType>(initialTab);

  useEffect(() => {
    const tabFromUrl = parseTab(routeTab) || parseTab(searchParams.get('tab')) || parseTab(searchParams.get('aba'));
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
    if (searchParams.get('edit') === 'true' || routeTab === 'edit' || routeTab === 'editar') {
      setIsEditModalOpen(true);
    }
  }, [routeTab, searchParams]);

  const setActiveTab = (newTab: TabType) => {
    setActiveTabState(newTab);
    setSearchParams({ tab: newTab }, { replace: true });
  };

  const [page, setPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(
    searchParams.get('edit') === 'true' || routeTab === 'edit' || routeTab === 'editar'
  );
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

  // Turn the guest message wall on/off
  const messageWallMutation = useMutation({
    mutationFn: (enabled: boolean) => eventService.setMessageWall(id!, enabled),
    onSuccess: (updated) => {
      queryClient.setQueryData(['event', id], updated);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(
        updated.enable_message_wall
          ? 'Mural ativado! Os convidados já podem deixar recados.'
          : 'Mural desativado. Novos recados estão bloqueados.'
      );
    },
    onError: () => {
      toast.error('Erro ao atualizar o mural de recados.');
    },
  });

  // Turn host review of guest photos on/off
  const photoApprovalMutation = useMutation({
    mutationFn: (enabled: boolean) => eventService.setPhotoApproval(id!, enabled),
    onSuccess: (updated) => {
      queryClient.setQueryData(['event', id], updated);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPhotos'] });
      toast.success(
        updated.require_photo_approval
          ? 'Moderação ativada! Novas fotos só aparecem na galeria depois da sua aprovação.'
          : 'Moderação desativada. Novas fotos aparecem na galeria na hora.'
      );
    },
    onError: () => {
      toast.error('Erro ao atualizar a moderação de fotos.');
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: () => eventService.deleteEvent(id!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(result.message || 'Evento excluído com sucesso.');
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
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
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
          {/* Edit event details button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Pencil className="w-4 h-4 text-brand-600" />}
          >
            Editar Evento
          </Button>

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
          <button
            type="button"
            onClick={() => djPlaylistMutation.mutate(!event.enable_dj_playlist)}
            disabled={djPlaylistMutation.isPending}
            title={
              event.enable_dj_playlist
                ? 'Clique para desativar a playlist do DJ'
                : 'Clique para permitir que os convidados peçam músicas'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              event.enable_dj_playlist
                ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Music2 className={`w-3.5 h-3.5 ${event.enable_dj_playlist ? 'text-violet-600' : 'text-slate-400'}`} />
            <span>{event.enable_dj_playlist ? 'Playlist DJ: Ativa' : 'Playlist DJ: Desativada'}</span>
            {event.enable_dj_playlist ? (
              <ToggleRight className="w-4 h-4 text-violet-600 ml-0.5" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-400 ml-0.5" />
            )}
          </button>

          {/* Toggle guest message wall button */}
          <button
            type="button"
            onClick={() => messageWallMutation.mutate(!event.enable_message_wall)}
            disabled={messageWallMutation.isPending}
            title={
              event.enable_message_wall
                ? 'Clique para desativar o mural de recados'
                : 'Clique para os convidados deixarem recados que aparecem no telão'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              event.enable_message_wall
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <MessageSquareHeart className={`w-3.5 h-3.5 ${event.enable_message_wall ? 'text-rose-500' : 'text-slate-400'}`} />
            <span>{event.enable_message_wall ? 'Mural: Ativo' : 'Ativar mural'}</span>
            {event.enable_message_wall ? (
              <ToggleRight className="w-4 h-4 text-rose-500 ml-0.5" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-400 ml-0.5" />
            )}
          </button>

          {/* Toggle photo approval (moderation) button */}
          <button
            type="button"
            onClick={() => photoApprovalMutation.mutate(!event.require_photo_approval)}
            disabled={photoApprovalMutation.isPending}
            title={
              event.require_photo_approval
                ? 'Clique para publicar as fotos na hora, sem moderação'
                : 'Clique para revisar as fotos dos convidados antes de aparecerem na galeria'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              event.require_photo_approval
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${event.require_photo_approval ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>{event.require_photo_approval ? 'Moderação: Ativa' : 'Moderação: Desativada'}</span>
            {event.require_photo_approval ? (
              <ToggleRight className="w-4 h-4 text-amber-600 ml-0.5" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-slate-400 ml-0.5" />
            )}
          </button>

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
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 min-w-0 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={event.is_active ? 'success' : 'neutral'} dot={event.is_active}>
              {event.is_active ? 'Recebendo Fotos em Tempo Real' : 'Envios Pausados'}
            </Badge>
            {event.enable_dj_playlist && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full">
                <Music2 className="w-3 h-3" />
                Playlist DJ Ativa
              </span>
            )}
            {event.enable_message_wall && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                <MessageSquareHeart className="w-3 h-3" />
                Mural Ativo
              </span>
            )}
            {event.require_photo_approval && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                Moderação Ativa
              </span>
            )}
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {storageLabels[event.storage_mode] || event.storage_mode}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {event.title}
          </h1>

          {event.description && (
            <p className="text-slate-600 text-sm sm:text-base sm:leading-6 leading-relaxed">
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
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3 lg:w-[36rem] lg:shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={handleDownloadAllZip}
            isLoading={isDownloadingZip}
            leftIcon={<Download className="w-4 h-4" />}
            className="w-full sm:col-span-2 shadow-brand-600/20"
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
              className="w-full from-brand-50 to-emerald-50 border-brand-200 text-brand-900 hover:border-brand-300"
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
              className="w-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-700"
              leftIcon={<Tv className="w-4 h-4 text-brand-400" />}
            >
              Modo Apresentação (Telão)
            </Button>
          </a>
        </div>
      </div>

      {/* Module Tabs Navigation: wraps into rows and stretches to fill the width, never scrolls sideways */}
      <nav
        aria-label="Seções do evento"
        className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap bg-white p-2 rounded-2xl border border-slate-200/80"
      >
        {EVENT_TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          const activeColor = id === 'dj' ? 'bg-violet-600' : id === 'mural' ? 'bg-rose-500' : 'bg-indigo-600';
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex sm:flex-auto items-center justify-center gap-2 min-h-11 py-2 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm text-left leading-tight sm:whitespace-nowrap last:col-span-2 transition-all ${
                isActive
                  ? `${activeColor} text-white shadow-xs`
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Tab 1: Photos & Live Gallery */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* Photo review queue & moderation controls */}
          <PendingPhotosPanel
            eventId={event.id}
            approvalRequired={event.require_photo_approval}
            onToggleApproval={() => photoApprovalMutation.mutate(!event.require_photo_approval)}
            isTogglingApproval={photoApprovalMutation.isPending}
          />

          {/* Grid: QR Code & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Col 1 & 2: Stats cards & photo gallery */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                    <ImageIcon className="w-4 h-4 text-brand-600" />
                    <span>Total de Fotos</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {stats?.total_photos ?? photoData?.total ?? 0}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
                    <HardDrive className="w-4 h-4 text-brand-600" />
                    <span>Espaço Ocupado</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {stats?.total_size_bytes ? formatFileSize(stats.total_size_bytes) : '0 B'}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 col-span-2 sm:col-span-1">
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
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
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

        </div>
      )}

      {/* Tab 2: Guest Management */}
      {activeTab === 'guests' && (
        <GuestManager eventId={event.id} />
      )}

      {/* Tab 3: Invitation Management & Deliveries */}
      {activeTab === 'invitations' && (
        <InvitationManager eventId={event.id} eventTitle={event.title} />
      )}

      {/* Tab 4: QR Code Readers & Security */}
      {activeTab === 'readers' && (
        <ReaderManager eventId={event.id} />
      )}

      {/* Tab 5: DJ & Playlist Management */}
      {activeTab === 'dj' && (
        <DJManager
          eventId={event.id}
          eventUuid={event.uuid}
          djPlaylistEnabled={!!event.enable_dj_playlist}
          onToggleDjPlaylist={() => djPlaylistMutation.mutate(!event.enable_dj_playlist)}
          isTogglingDjPlaylist={djPlaylistMutation.isPending}
        />
      )}

      {/* Guest message wall */}
      {activeTab === 'mural' && (
        <MessageWallManager
          eventId={event.id}
          eventUuid={event.uuid}
          enabled={!!event.enable_message_wall}
          onToggle={() => messageWallMutation.mutate(!event.enable_message_wall)}
          isToggling={messageWallMutation.isPending}
        />
      )}

      {/* Tab 6: Cover & Invitation Design */}
      {activeTab === 'cover' && (
        <CoverEditor
          eventId={event.id}
          eventTitle={event.title}
          eventDescription={event.description}
          eventLocation={event.location}
          eventDate={event.start_at || event.start_date || event.event_date}
          initialCoverImage={event.cover_image}
          initialBgImage={event.background_image}
          initialTemplate={event.invitation_template}
          // Refresh the event so reopening the tab shows what was just saved
          onSave={() => queryClient.invalidateQueries({ queryKey: ['event', id] })}
        />
      )}

      {/* Tab 8: Dashboard Metrics & Reports */}
      {activeTab === 'metrics' && (
        <EventDashboardHub eventId={event.id} />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir este álbum?"
        description="Esta ação é irreversível. Todas as fotos do evento serão apagadas e o QR Code deixará de funcionar."
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
          <strong className="text-slate-900 font-semibold">{event.title}</strong>
{' '}e <strong className="text-slate-900 font-semibold">todas as suas fotos</strong>
          {(event.photo_count ?? 0) > 0 && <> ({event.photo_count} publicadas, além das pendentes)</>}? Baixe as fotos
          antes, se quiser guardá-las.
        </p>
      </Modal>

      {/* Edit Event Modal */}
      <EditEventModal
        event={event}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
