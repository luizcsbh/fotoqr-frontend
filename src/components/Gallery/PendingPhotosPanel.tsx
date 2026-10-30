import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, Trash2, Loader2, CheckCheck } from 'lucide-react';
import { photoService } from '../../services/photo.service';
import { ApiError } from '../../types';
import { Button } from '../UI/Button';
import toast from 'react-hot-toast';

interface PendingPhotosPanelProps {
  /** Numeric event id (owner routes) */
  eventId: string;
  /** Whether new uploads currently wait for approval */
  approvalRequired: boolean;
}

const PAGE_SIZE = 48;

/**
 * Review queue for the event owner: guest photos waiting for approval before they
 * show up in the public gallery, slideshow and downloads.
 */
export const PendingPhotosPanel: React.FC<PendingPhotosPanelProps> = ({ eventId, approvalRequired }) => {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pendingPhotos', eventId],
    queryFn: () => photoService.getEventPhotos(eventId, 1, PAGE_SIZE, 'pending'),
    refetchInterval: 15000, // new guest uploads keep arriving during the event
  });

  const pending = data?.data ?? [];
  const total = data?.total ?? 0;

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['pendingPhotos', eventId] });
    queryClient.invalidateQueries({ queryKey: ['photos', eventId] });
    queryClient.invalidateQueries({ queryKey: ['eventStats', eventId] });
    queryClient.invalidateQueries({ queryKey: ['event', eventId] });
  };

  const showError = (err: unknown, fallback: string) =>
    toast.error((err as ApiError)?.message || fallback);

  const approveMutation = useMutation({
    mutationFn: (photoId: string) => photoService.approvePhoto(photoId),
    onMutate: (photoId) => setBusyId(photoId),
    onSuccess: () => {
      toast.success('Foto aprovada e publicada na galeria.');
      refreshAll();
    },
    onError: (err) => showError(err, 'Erro ao aprovar foto.'),
    onSettled: () => setBusyId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: (photoId: string) => photoService.deletePhoto(photoId),
    onMutate: (photoId) => setBusyId(photoId),
    onSuccess: () => {
      toast.success('Foto recusada e excluída.');
      refreshAll();
    },
    onError: (err) => showError(err, 'Erro ao recusar foto.'),
    onSettled: () => setBusyId(null),
  });

  const approveAllMutation = useMutation({
    mutationFn: () => photoService.approveAllPhotos(eventId),
    onSuccess: (approved) => {
      toast.success(approved > 0 ? `${approved} foto(s) publicada(s) na galeria.` : 'Nenhuma foto pendente.');
      refreshAll();
    },
    onError: (err) => showError(err, 'Erro ao aprovar fotos.'),
  });

  // Nothing to show when review is off and the queue is empty
  if (!approvalRequired && !isLoading && total === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Fotos aguardando aprovação {total > 0 && <span className="text-amber-600">({total})</span>}
            </h3>
            <p className="text-xs text-slate-500">
              Só aparecem na galeria, no telão e nos downloads depois que você aprovar.
            </p>
          </div>
        </div>

        {total > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => approveAllMutation.mutate()}
            isLoading={approveAllMutation.isPending}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Aprovar todas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-400 py-6">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          <span className="text-sm">Carregando fotos pendentes...</span>
        </div>
      ) : total === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">
          Nenhuma foto pendente. As próximas fotos dos convidados aparecerão aqui para revisão.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {pending.map((photo) => {
              const isBusy = busyId === photo.id || approveAllMutation.isPending;
              return (
                <div
                  key={photo.id}
                  className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group"
                >
                  <img
                    src={photo.thumbnail_url || photo.url}
                    alt={photo.original_name || photo.filename}
                    loading="lazy"
                    className={`w-full aspect-square object-cover ${isBusy ? 'opacity-50' : ''}`}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2 flex gap-2 bg-gradient-to-t from-black/70 to-transparent">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => approveMutation.mutate(photo.id)}
                      title="Aprovar e publicar"
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold disabled:opacity-60 transition-colors"
                    >
                      {busyId === photo.id && approveMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Aprovar
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => rejectMutation.mutate(photo.id)}
                      title="Recusar e excluir"
                      className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-red-50 text-red-600 disabled:opacity-60 transition-colors"
                    >
                      {busyId === photo.id && rejectMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {total > pending.length && (
            <p className="text-xs text-slate-500 text-center">
              Mostrando {pending.length} de {total}. Aprove ou recuse estas para ver as próximas.
            </p>
          )}
        </>
      )}
    </div>
  );
};
