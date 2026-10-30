import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music2, Search, Plus, Check, Clock, Loader2, X, Disc3, User,
  AlertCircle, ChevronDown, ChevronUp, Play, Pause, Volume2, VolumeX,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { musicService } from '../../services/music.service';
import { ApiError, MusicRequest, SpotifyTrack } from '../../types';
import toast from 'react-hot-toast';

interface DJMusicRequestWidgetProps {
  eventUuid: string;
}

const MAX_SONGS = 15;

// Format ms to m:ss
function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function statusBadge(status: MusicRequest['status']) {
  switch (status) {
    case 'played':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
          <Check className="w-2.5 h-2.5" /> Tocada
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
          <Check className="w-2.5 h-2.5" /> Aprovada
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
          <X className="w-2.5 h-2.5" /> Recusada
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
          <Clock className="w-2.5 h-2.5" /> Na fila
        </span>
      );
  }
}

// Format seconds to m:ss
function formatSeconds(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// ── Audio Preview Hook ──────────────────────────────────────────────────────

function useAudioPreview() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 30);
    setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    if (!audio.paused && !audio.ended) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlayingUrl(null);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const play = useCallback((url: string) => {
    if (audioRef.current && playingUrl === url) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        rafRef.current = requestAnimationFrame(tick);
      } else {
        audioRef.current.pause();
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    stop();

    const audio = new Audio(url);
    audio.volume = isMuted ? 0 : 1;
    audioRef.current = audio;
    setPlayingUrl(url);
    setProgress(0);
    setCurrentTime(0);

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration || 30);
    });

    audio.addEventListener('ended', () => {
      setPlayingUrl(null);
      setProgress(0);
      setCurrentTime(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    });

    audio.play().then(() => {
      rafRef.current = requestAnimationFrame(tick);
    }).catch(() => {
      setPlayingUrl(null);
    });
  }, [playingUrl, isMuted, tick, stop]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      if (audioRef.current) audioRef.current.volume = next ? 0 : 1;
      return next;
    });
  }, []);

  const seek = useCallback((ratio: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = ratio * (audioRef.current.duration || 30);
  }, []);

  const isPlaying = useCallback((url: string | null | undefined) => {
    if (!url) return false;
    return playingUrl === url && !!audioRef.current && !audioRef.current.paused;
  }, [playingUrl]);

  useEffect(() => {
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { play, stop, seek, toggleMute, isPlaying, isMuted, playingUrl, progress, currentTime, duration };
}

// ── Mini Player Bar ─────────────────────────────────────────────────────────

interface MiniPlayerProps {
  track: SpotifyTrack;
  progress: number;
  currentTime: number;
  duration: number;
  isMuted: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (ratio: number) => void;
  onToggleMute: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({
  track, progress, currentTime, duration, isMuted,
  isPlaying, onPlayPause, onStop, onSeek, onToggleMute,
}) => {
  const barRef = useRef<HTMLDivElement>(null);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio);
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-violet-950 rounded-2xl border border-violet-800/60 shadow-lg shadow-violet-900/30">
      <div className="flex items-center gap-2.5">
        {track.albumArtUrl ? (
          <img src={track.albumArtUrl} alt={track.albumName} className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-violet-800 flex items-center justify-center shrink-0">
            <Disc3 className="w-4 h-4 text-violet-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xs text-white truncate">{track.title}</div>
          <div className="text-[10px] text-violet-300 truncate">{track.artist}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={onToggleMute} title={isMuted ? 'Ativar som' : 'Silenciar'}
            className="p-1.5 rounded-lg text-violet-400 hover:text-white hover:bg-violet-800 transition-colors">
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button type="button" onClick={onPlayPause} title={isPlaying ? 'Pausar' : 'Reproduzir'}
            className="p-1.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white transition-colors">
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button type="button" onClick={onStop} title="Parar prévia"
            className="p-1.5 rounded-lg text-violet-400 hover:text-white hover:bg-violet-800 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-violet-400 w-8 shrink-0 text-right tabular-nums">{formatSeconds(currentTime)}</span>
        <div ref={barRef} onClick={handleBarClick}
          className="flex-1 h-1.5 bg-violet-800 rounded-full cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-y-0 left-0 bg-violet-400 rounded-full transition-none" style={{ width: `${progress * 100}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress * 100}% - 6px)` }} />
        </div>
        <span className="text-[10px] text-violet-400 w-8 shrink-0 tabular-nums">{formatSeconds(duration)}</span>
      </div>

      <p className="text-[10px] text-violet-500 text-center">🎵 Prévia de 30s</p>
    </div>
  );
};

export const DJMusicRequestWidget: React.FC<DJMusicRequestWidgetProps> = ({ eventUuid }) => {
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef('');

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [spotifyEnabled, setSpotifyEnabled] = useState(false);
  const [searchSource, setSearchSource] = useState<'spotify' | 'deezer' | undefined>();
  const [manualMode, setManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
  // Storage can throw (private mode, blocked site data); a throw here would crash the guest upload page
  const [guestName, setGuestName] = useState(() => {
    try {
      return localStorage.getItem('fotoqr_guest_name') || '';
    } catch {
      return '';
    }
  });
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);

  const audio = useAudioPreview();

  // Fetch current playlist
  const { data: musicData, isLoading } = useQuery({
    queryKey: ['music', eventUuid],
    queryFn: () => musicService.getEventMusic(eventUuid),
    refetchInterval: 15000, // Poll every 15s for live updates
  });

  const songs = musicData?.data ?? [];
  const totalSongs = musicData?.total ?? 0;
  const isFull = totalSongs >= MAX_SONGS;

  // On first load, check if Spotify is available
  useEffect(() => {
    if (musicData) {
      setSpotifyEnabled(musicData.spotifyEnabled);
      if (!musicData.spotifyEnabled) setManualMode(true);
    }
  }, [musicData]);

  // Stop audio when widget collapses
  useEffect(() => {
    if (!isOpen) audio.stop();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drops any pending or in-flight search so it cannot repopulate the results list
  const cancelSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    latestQueryRef.current = '';
    setIsSearching(false);
  }, []);

  useEffect(() => cancelSearch, [cancelSearch]);

  // Debounced Spotify search
  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
      latestQueryRef.current = value;
      setSelectedTrack(null);
      audio.stop();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim() || value.length < 2) {
        setSearchResults([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const result = await musicService.searchSpotify(value);
          // Ignore responses for an older query that finished after a newer one
          if (latestQueryRef.current !== value) return;
          setSpotifyEnabled(result.spotifyEnabled);
          setSearchSource(result.source);
          setSearchResults(result.data);
          if (!result.spotifyEnabled) {
            // Keep what the guest typed as the song title so they can just add the artist
            setManualMode(true);
            setManualTitle((current) => current || value.trim());
            toast(result.message || 'Busca no Spotify indisponível. Digite a música manualmente.', { icon: '✏️' });
          }
        } catch {
          if (latestQueryRef.current === value) setSearchResults([]);
        } finally {
          if (latestQueryRef.current === value) setIsSearching(false);
        }
      }, 450);
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (payload: Parameters<typeof musicService.requestSong>[1]) =>
      musicService.requestSong(eventUuid, payload),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: ['music', eventUuid] });
      audio.stop();
      cancelSearch();
      setQuery('');
      setSearchResults([]);
      setSelectedTrack(null);
      setManualTitle('');
      setManualArtist('');
      if (guestName) {
        try {
          localStorage.setItem('fotoqr_guest_name', guestName);
        } catch {
          // Remembering the name is only a convenience
        }
      }
    },
    onError: (err: unknown) => {
      // The api interceptor already turns the server's `error` field into `message`
      toast.error((err as ApiError)?.message || 'Erro ao adicionar música.');
    },
  });

  const handleSelectSpotifyTrack = (track: SpotifyTrack) => {
    cancelSearch();
    setSelectedTrack(track);
    setSearchResults([]);
    setQuery(`${track.title} — ${track.artist}`);
    if (audio.playingUrl !== track.previewUrl) audio.stop();
  };

  const handleSubmit = () => {
    if (submitMutation.isPending) return;

    if (isFull) {
      toast.error(`A lista está cheia (máximo ${MAX_SONGS} músicas).`);
      return;
    }

    if (selectedTrack) {
      submitMutation.mutate({
        title: selectedTrack.title,
        artist: selectedTrack.artist,
        albumName: selectedTrack.albumName,
        albumArtUrl: selectedTrack.albumArtUrl ?? undefined,
        spotifyTrackId: selectedTrack.id,
        spotifyPreviewUrl: selectedTrack.previewUrl ?? undefined,
        guestName: guestName.trim() || undefined,
      });
    } else if (manualMode) {
      if (!manualTitle.trim() || !manualArtist.trim()) {
        toast.error('Informe o título e o artista da música.');
        return;
      }
      submitMutation.mutate({
        title: manualTitle.trim(),
        artist: manualArtist.trim(),
        guestName: guestName.trim() || undefined,
      });
    } else {
      toast.error('Selecione uma música da lista ou use o modo manual.');
    }
  };

  const canSubmit = selectedTrack || (manualMode && manualTitle.trim() && manualArtist.trim());

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header — click to expand/collapse */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-sm">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">Pedir Música ao DJ</div>
            <div className="text-xs text-slate-500">
              {isLoading ? '...' : `${totalSongs}/${MAX_SONGS} músicas na lista`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isFull && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              <Plus className="w-3 h-3" /> Adicionar
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div className="border-t border-slate-100 p-5 space-y-5">
          {/* Guest name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-violet-500" />
              Seu nome (opcional)
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Ex: Maria"
              maxLength={50}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-colors"
            />
          </div>

          {/* Search / Manual toggle */}
          {spotifyEnabled && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  !manualMode
                    ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                🎵 Buscar música
              </button>
              <button
                type="button"
                onClick={() => { setManualMode(true); setSearchResults([]); setSelectedTrack(null); }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  manualMode
                    ? 'bg-violet-600 text-white border-violet-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                ✏️ Digitar manualmente
              </button>
            </div>
          )}

          {/* Spotify search */}
          {!manualMode && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Buscar música
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Nome da música ou artista..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-colors"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 animate-spin" />
                )}
                {selectedTrack && !isSearching && (
                  <button
                    type="button"
                    onClick={() => { cancelSearch(); setSelectedTrack(null); setQuery(''); setSearchResults([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                  </button>
                )}
              </div>

              {searchResults.length > 0 && !selectedTrack && searchSource && (
                <p className="text-[10px] text-slate-400">
                  Resultados do {searchSource === 'spotify' ? 'Spotify' : 'catálogo Deezer (Spotify indisponível no momento)'}
                </p>
              )}

              {/* Search results dropdown */}
              {searchResults.length > 0 && !selectedTrack && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-lg divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {searchResults.map((track) => {
                    const isPlaying = audio.isPlaying(track.previewUrl);
                    const hasPreview = !!track.previewUrl;
                    return (
                      <div key={track.id} className="flex items-center gap-3 px-4 py-3 hover:bg-violet-50 transition-colors">
                        {/* Album art with play overlay */}
                        <div className="relative shrink-0">
                          {track.albumArtUrl ? (
                            <img src={track.albumArtUrl} alt={track.albumName} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Disc3 className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          {hasPreview && (
                            <button type="button" onClick={(e) => { e.stopPropagation(); audio.play(track.previewUrl!); }}
                              title={isPlaying ? 'Pausar prévia' : 'Ouvir prévia'}
                              className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                              {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                            </button>
                          )}
                        </div>

                        {/* Track info — click to SELECT */}
                        <button type="button" onClick={() => handleSelectSpotifyTrack(track)} className="flex-1 min-w-0 text-left">
                          <div className="font-semibold text-sm text-slate-900 truncate">{track.title}</div>
                          <div className="text-xs text-slate-500 truncate">{track.artist}</div>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasPreview && (
                            <button type="button" onClick={() => audio.play(track.previewUrl!)}
                              title={isPlaying ? 'Pausar prévia' : 'Ouvir prévia'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isPlaying ? 'bg-violet-100 text-violet-700' : 'text-slate-400 hover:text-violet-600 hover:bg-violet-50'
                              }`}>
                              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <span className="text-[10px] text-slate-400 w-8 text-right tabular-nums">{formatDuration(track.durationMs)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mini player — shown when something plays from search results */}
              {audio.playingUrl && !selectedTrack && searchResults.some((t) => t.previewUrl === audio.playingUrl) && (() => {
                const t = searchResults.find((t) => t.previewUrl === audio.playingUrl)!;
                return (
                  <MiniPlayer track={t} progress={audio.progress} currentTime={audio.currentTime}
                    duration={audio.duration} isMuted={audio.isMuted} isPlaying={audio.isPlaying(audio.playingUrl)}
                    onPlayPause={() => audio.play(audio.playingUrl!)} onStop={audio.stop}
                    onSeek={audio.seek} onToggleMute={audio.toggleMute} />
                );
              })()}

              {/* Selected track card */}
              {selectedTrack && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-2xl border border-violet-200">
                    <div className="relative shrink-0">
                      {selectedTrack.albumArtUrl ? (
                        <img src={selectedTrack.albumArtUrl} alt={selectedTrack.albumName} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                          <Disc3 className="w-6 h-6 text-violet-500" />
                        </div>
                      )}
                      {selectedTrack.previewUrl && (
                        <button type="button" onClick={() => audio.play(selectedTrack.previewUrl!)}
                          title={audio.isPlaying(selectedTrack.previewUrl) ? 'Pausar' : 'Ouvir prévia'}
                          className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                          {audio.isPlaying(selectedTrack.previewUrl) ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-violet-900 truncate">{selectedTrack.title}</div>
                      <div className="text-xs text-violet-600 truncate">{selectedTrack.artist}</div>
                      {selectedTrack.albumName && (
                        <div className="text-[10px] text-violet-500 truncate">{selectedTrack.albumName}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {selectedTrack.previewUrl && (
                        <button type="button" onClick={() => audio.play(selectedTrack.previewUrl!)}
                          title={audio.isPlaying(selectedTrack.previewUrl) ? 'Pausar' : 'Ouvir prévia'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            audio.isPlaying(selectedTrack.previewUrl) ? 'bg-violet-200 text-violet-800' : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                          }`}>
                          {audio.isPlaying(selectedTrack.previewUrl) ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      )}
                      <Check className="w-5 h-5 text-violet-600" />
                    </div>
                  </div>

                  {/* Mini player for selected track */}
                  {selectedTrack.previewUrl && audio.playingUrl === selectedTrack.previewUrl && (
                    <MiniPlayer track={selectedTrack} progress={audio.progress} currentTime={audio.currentTime}
                      duration={audio.duration} isMuted={audio.isMuted} isPlaying={audio.isPlaying(selectedTrack.previewUrl)}
                      onPlayPause={() => audio.play(selectedTrack.previewUrl!)} onStop={audio.stop}
                      onSeek={audio.seek} onToggleMute={audio.toggleMute} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Manual mode inputs */}
          {manualMode && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome da música *</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Ex: Evidências"
                  maxLength={255}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Artista *</label>
                <input
                  type="text"
                  value={manualArtist}
                  onChange={(e) => setManualArtist(e.target.value)}
                  placeholder="Ex: Chitãozinho & Xororó"
                  maxLength={255}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Playlist full warning */}
          {isFull && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 font-medium">
                A lista está cheia! O DJ já tem {MAX_SONGS} músicas na fila.
              </p>
            </div>
          )}

          {/* Submit button */}
          {!isFull && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitMutation.isPending}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm transition-all ${
                canSubmit && !submitMutation.isPending
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Music2 className="w-4 h-4" />
                  Pedir esta Música ao DJ
                </>
              )}
            </button>
          )}

          {/* Current playlist */}
          {songs.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                <Disc3 className="w-3.5 h-3.5 text-violet-500" />
                Lista do DJ ({totalSongs}/{MAX_SONGS})
              </div>
              <div className="space-y-2">
                {songs.map((song, idx) => (
                  <div key={song.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                      song.status === 'played' ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-black text-slate-400 w-5 text-center shrink-0">{idx + 1}</span>

                    {/* Album art with preview overlay */}
                    <div className="relative shrink-0">
                      {song.albumArtUrl ? (
                        <img src={song.albumArtUrl} alt={song.albumName || song.title} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                          <Music2 className="w-4 h-4 text-violet-400" />
                        </div>
                      )}
                      {song.spotifyPreviewUrl && (
                        <button type="button" onClick={() => audio.play(song.spotifyPreviewUrl!)}
                          title={audio.isPlaying(song.spotifyPreviewUrl) ? 'Pausar' : 'Prévia'}
                          className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                          {audio.isPlaying(song.spotifyPreviewUrl) ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white" />}
                        </button>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-slate-900 truncate">{song.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{song.artist}</div>
                    </div>

                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      {statusBadge(song.status)}
                      {song.guestName && (
                        <span className="text-[9px] text-slate-400">{song.guestName}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini player for queue previews */}
              {audio.playingUrl && !selectedTrack && searchResults.length === 0 &&
                songs.some((s) => s.spotifyPreviewUrl === audio.playingUrl) && (() => {
                  const s = songs.find((s) => s.spotifyPreviewUrl === audio.playingUrl)!;
                  const fakeTrack: SpotifyTrack = {
                    id: s.spotifyTrackId ?? s.id, title: s.title, artist: s.artist,
                    albumName: s.albumName ?? '', albumArtUrl: s.albumArtUrl,
                    previewUrl: s.spotifyPreviewUrl, durationMs: 30000, spotifyUrl: '',
                  };
                  return (
                    <div className="mt-3">
                      <MiniPlayer track={fakeTrack} progress={audio.progress} currentTime={audio.currentTime}
                        duration={audio.duration} isMuted={audio.isMuted} isPlaying={audio.isPlaying(audio.playingUrl)}
                        onPlayPause={() => audio.play(audio.playingUrl!)} onStop={audio.stop}
                        onSeek={audio.seek} onToggleMute={audio.toggleMute} />
                    </div>
                  );
                })()
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DJMusicRequestWidget;
