import { api } from './api';
import { MusicRequest, MusicListResponse, SpotifyTrack } from '../types';

export const musicService = {
  /** List all song requests for an event (public) */
  async getEventMusic(uuid: string): Promise<MusicListResponse> {
    const res = await api.get(`/api/events/${uuid}/music`);
    return res.data;
  },

  /** Submit a song request as a guest (public) */
  async requestSong(
    uuid: string,
    payload: {
      title: string;
      artist: string;
      albumName?: string;
      albumArtUrl?: string;
      spotifyTrackId?: string;
      spotifyPreviewUrl?: string;
      guestName?: string;
    }
  ): Promise<{ success: boolean; message: string; data: MusicRequest }> {
    const res = await api.post(`/api/events/${uuid}/music`, payload);
    return res.data;
  },

  /** Delete a song from the playlist (event owner) */
  async deleteSong(uuid: string, songId: string): Promise<void> {
    await api.delete(`/api/events/${uuid}/music/${songId}`);
  },

  /** Update a song status (event owner) */
  async updateStatus(
    uuid: string,
    songId: string,
    status: 'pending' | 'approved' | 'rejected' | 'played'
  ): Promise<MusicRequest> {
    const res = await api.patch(`/api/events/${uuid}/music/${songId}/status`, { status });
    return res.data.data;
  },

  /** Search Spotify tracks via backend proxy */
  async searchSpotify(query: string): Promise<{
    data: SpotifyTrack[];
    spotifyEnabled: boolean;
    source?: 'spotify' | 'deezer';
    message?: string;
  }> {
    const res = await api.get('/api/spotify/search', { params: { q: query } });
    return res.data;
  },
};
