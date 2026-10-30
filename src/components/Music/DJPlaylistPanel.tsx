import React, { useState } from 'react';
import { Music2, Disc3, Trash2, Check, Clock, X, CheckCircle2, Play, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { musicService } from '../../services/music.service';
import { MusicRequest } from '../../types';
import toast from 'react-hot-toast';

interface DJPlaylistPanelProps {
  eventUuid: string;
}

const MAX_SONGS = 15;

const STATUS_LABELS: Record<MusicRequest['status'], string> = {
  pending: 'Na fila',
  approved: 'Aprovada',
  rejected: 'Recusada',
  played: 'Tocada',
};

const STATUS_COLORS: Record<MusicRequest['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  played: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const STATUS_ICONS: Record<MusicRequest['status'], React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  approved: <Check className="w-3 h-3" />,
  rejected: <X className="w-3 h-3" />,
  played: <Play className="w-3 h-3" />,
};

export const DJPlaylistPanel: React.FC<DJPlaylistPanelProps> = ({ eventUuid }) => {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: musicData, isLoading } = useQuery({
    queryKey: ['music', eventUuid],
    queryFn: () => musicService.getEventMusic(eventUuid),
    refetchInterval: 20000,
  });

  const songs = musicData?.data ?? [];
  const total = musicData?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: ({ songId }: { songId: string }) => musicService.deleteSong(eventUuid, songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music', eventUuid] });
      toast.success('Música removida da lista.');
      setDeletingId(null);
    },
    onError: () => {
      toast.error('Erro ao remover música.');
      setDeletingId(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ songId, status }: { songId: string; status: MusicRequest['status'] }) =>
      musicService.updateStatus(eventUuid, songId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music', eventUuid] });
      setUpdatingId(null);
    },
    onError: () => {
      toast.error('Erro ao atualizar status.');
      setUpdatingId(null);
    },
  });

  const handleDelete = (songId: string) => {
    setDeletingId(songId);
    deleteMutation.mutate({ songId });
  };

  const handleStatus = (songId: string, status: MusicRequest['status']) => {
    setUpdatingId(songId);
    statusMutation.mutate({ songId, status });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex items-center gap-3 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        <span className="text-sm">Carregando lista de músicas...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-sm">
            <Music2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Lista de Pedidos para o DJ</h3>
            <p className="text-xs text-slate-500">
              {total}/{MAX_SONGS} músicas • Convidados podem pedir até {MAX_SONGS} músicas
            </p>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (total / MAX_SONGS) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-500">{total}/{MAX_SONGS}</span>
        </div>
      </div>

      {/* Song List */}
      {songs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <Disc3 className="w-7 h-7 text-violet-300" />
          </div>
          <p className="text-sm font-semibold text-slate-600 mb-1">Nenhuma música pedida ainda</p>
          <p className="text-xs text-slate-400">
            Os convidados podem pedir músicas diretamente pela página de envio de fotos.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {songs.map((song, idx) => {
            const isDeleting = deletingId === song.id;
            const isUpdating = updatingId === song.id;
            const isPlayed = song.status === 'played';

            return (
              <div
                key={song.id}
                className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/60 ${
                  isPlayed ? 'opacity-55' : ''
                }`}
              >
                {/* Position */}
                <span className="text-xs font-black text-slate-300 w-5 text-center shrink-0">{idx + 1}</span>

                {/* Album art */}
                {song.albumArtUrl ? (
                  <img
                    src={song.albumArtUrl}
                    alt={song.albumName || song.title}
                    className="w-10 h-10 rounded-xl object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <Music2 className="w-5 h-5 text-violet-300" />
                  </div>
                )}

                {/* Song details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-sm truncate ${isPlayed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {song.title}
                    </span>
                    {song.spotifyTrackId && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full shrink-0">
                        SPOTIFY
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="truncate">{song.artist}</span>
                    {song.guestName && (
                      <>
                        <span>•</span>
                        <span className="text-violet-600 font-medium shrink-0">por {song.guestName}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[song.status]}`}
                >
                  {STATUS_ICONS[song.status]}
                  {STATUS_LABELS[song.status]}
                </span>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                  ) : (
                    <>
                      {song.status !== 'played' && (
                        <button
                          type="button"
                          title="Marcar como tocada"
                          onClick={() => handleStatus(song.id, 'played')}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {song.status === 'pending' && (
                        <button
                          type="button"
                          title="Aprovar"
                          onClick={() => handleStatus(song.id, 'approved')}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}

                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                  ) : (
                    <button
                      type="button"
                      title="Remover da lista"
                      onClick={() => handleDelete(song.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer legend */}
      {songs.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40 flex flex-wrap gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> Na fila</span>
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-blue-500" /> Aprovada</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Tocada</span>
          <span className="flex items-center gap-1"><X className="w-3 h-3 text-red-400" /> Recusada</span>
        </div>
      )}
    </div>
  );
};

export default DJPlaylistPanel;
