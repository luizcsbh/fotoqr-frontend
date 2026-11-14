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

  /** List DJs authorized for an event (event owner) */
  async listDJs(eventId: string | number): Promise<{ id: number; userId: number; name: string; email: string; active: boolean; accessLink?: string }[]> {
    const res = await api.get(`/api/events/${eventId}/djs`);
    return res.data.data || [];
  },

  /** Authorize a DJ by email (event owner); the server e-mails them their exclusive link */
  async addDJ(
    eventId: string | number,
    email: string
  ): Promise<{ userId: number; accessLink: string; emailSent: boolean; emailError?: string }> {
    const res = await api.post(`/api/events/${eventId}/djs`, { email });
    return res.data.data;
  },

  /** Revoke a DJ's permission (event owner) */
  async removeDJ(eventId: string | number, userId: number): Promise<void> {
    await api.delete(`/api/events/${eventId}/djs/${userId}`);
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
