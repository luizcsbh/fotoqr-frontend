import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Music2,
  Disc3,
  Check,
  X,
  Clock,
  Play,
  Trash2,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  ListMusic,
} from 'lucide-react';
import { musicService } from '../services/music.service';
import { MusicRequest } from '../types';
import { Button } from '../components/UI/Button';
import toast from 'react-hot-toast';

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

type FilterTab = 'all' | MusicRequest['status'];

export const DJConsolePage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');

  const { data: musicData, isLoading, refetch } = useQuery({
    queryKey: ['music', uuid],
    queryFn: () => musicService.getEventMusic(uuid!),
    refetchInterval: 15000,
    enabled: !!uuid,
  });

  const songs = musicData?.data ?? [];
  const total = musicData?.total ?? 0;

  const counts = {
    all: songs.length,
    pending: songs.filter((s) => s.status === 'pending').length,
    approved: songs.filter((s) => s.status === 'approved').length,
    played: songs.filter((s) => s.status === 'played').length,
    rejected: songs.filter((s) => s.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? songs : songs.filter((s) => s.status === filter);

  const deleteMutation = useMutation({
    mutationFn: ({ songId }: { songId: string }) => musicService.deleteSong(uuid!, songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['music', uuid] });
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
      musicService.updateStatus(uuid!, songId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['music', uuid] });
      const labels: Record<MusicRequest['status'], string> = {
        played: '✅ Música marcada como tocada!',
        approved: '✅ Música aprovada!',
        rejected: '❌ Música recusada.',
        pending: 'Música voltou para a fila.',
      };
      toast.success(labels[variables.status]);
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

  const FILTER_TABS: { key: FilterTab; label: string; color: string }[] = [
    { key: 'all', label: 'Todas', color: 'text-slate-700' },
    { key: 'pending', label: 'Na fila', color: 'text-amber-700' },
    { key: 'approved', label: 'Aprovadas', color: 'text-blue-700' },
    { key: 'played', label: 'Tocadas', color: 'text-emerald-700' },
    { key: 'rejected', label: 'Recusadas', color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-tight">Painel do DJ</h1>
              <p className="text-[11px] text-white/50">
                {total}/{MAX_SONGS} pedidos • atualiza a cada 15s
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Atualizar lista"
            >
              <RefreshCw className="w-4 h-4 text-white/70" />
            </button>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white/90 transition-colors px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Na fila', count: counts.pending, color: 'text-amber-400' },
            { label: 'Aprovadas', count: counts.approved, color: 'text-blue-400' },
            { label: 'Tocadas', count: counts.played, color: 'text-emerald-400' },
            { label: 'Recusadas', count: counts.rejected, color: 'text-red-400' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/5 backdrop-blur rounded-2xl p-3 text-center border border-white/10"
            >
              <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
              <p className="text-[11px] text-white/50 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    filter === tab.key ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Song List */}
        <div className="bg-white/5 backdrop-blur rounded-3xl border border-white/10 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-white/40">
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              <span className="text-sm">Carregando pedidos...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                {filter === 'all' ? (
                  <Disc3 className="w-7 h-7 text-violet-400/50" />
                ) : (
                  <ListMusic className="w-7 h-7 text-violet-400/50" />
                )}
              </div>
              <p className="text-sm font-semibold text-white/50 mb-1">
                {filter === 'all' ? 'Nenhuma música pedida ainda' : `Nenhuma música "${STATUS_LABELS[filter as MusicRequest['status']]}"`}
              </p>
              <p className="text-xs text-white/30">
                {filter === 'all'
                  ? 'Os convidados podem pedir músicas pela página do evento.'
                  : 'Mude o filtro para ver outros pedidos.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((song, idx) => {
                const isDeleting = deletingId === song.id;
                const isUpdating = updatingId === song.id;
                const isPlayed = song.status === 'played';
                const isRejected = song.status === 'rejected';

                return (
                  <div
                    key={song.id}
                    className={`flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/5 ${
                      isPlayed || isRejected ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Position */}
                    <span className="text-xs font-black text-white/20 w-5 text-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Album art */}
                    {song.albumArtUrl ? (
                      <img
                        src={song.albumArtUrl}
                        alt={song.albumName || song.title}
                        className="w-11 h-11 rounded-xl object-cover shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-violet-900/50 flex items-center justify-center shrink-0">
                        <Music2 className="w-5 h-5 text-violet-400/50" />
                      </div>
                    )}

                    {/* Song info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-bold text-sm truncate ${
                            isPlayed ? 'line-through text-white/30' : 'text-white'
                          }`}
                        >
                          {song.title}
                        </span>
                        {song.spotifyTrackId && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-900/60 text-green-400 rounded-full border border-green-700/40 shrink-0">
                            SPOTIFY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/40 mt-0.5">
                        <span className="truncate">{song.artist}</span>
                        {song.guestName && (
                          <>
                            <span>•</span>
                            <span className="text-violet-400 font-medium shrink-0">
                              por {song.guestName}
                            </span>
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

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      ) : (
                        <>
                          {/* Mark as played */}
                          {song.status !== 'played' && (
                            <button
                              type="button"
                              title="Marcar como tocada"
                              onClick={() => handleStatus(song.id, 'played')}
                              className="p-2 rounded-xl hover:bg-emerald-500/20 text-white/30 hover:text-emerald-400 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Approve (pending only) */}
                          {song.status === 'pending' && (
                            <button
                              type="button"
                              title="Aprovar"
                              onClick={() => handleStatus(song.id, 'approved')}
                              className="p-2 rounded-xl hover:bg-blue-500/20 text-white/30 hover:text-blue-400 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {/* Reject (pending or approved only) */}
                          {(song.status === 'pending' || song.status === 'approved') && (
                            <button
                              type="button"
                              title="Recusar"
                              onClick={() => handleStatus(song.id, 'rejected')}
                              className="p-2 rounded-xl hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {/* Delete */}
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <button
                          type="button"
                          title="Remover da lista"
                          onClick={() => handleDelete(song.id)}
                          className="p-2 rounded-xl hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors"
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
        </div>

        {/* Legend */}
        {songs.length > 0 && (
          <div className="flex flex-wrap gap-4 text-[11px] text-white/30 px-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Marcar como tocada
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-blue-400" /> Aprovar pedido
            </span>
            <span className="flex items-center gap-1.5">
              <X className="w-3 h-3 text-red-400" /> Recusar pedido
            </span>
            <span className="flex items-center gap-1.5">
              <Trash2 className="w-3 h-3 text-white/30" /> Remover da lista
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DJConsolePage;
