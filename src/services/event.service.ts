import { api } from './api';
import { Event, CreateEventData, EventStats } from '../types';
import type { StoredQRCustomization } from '../utils/qrThemes';

// Helper to normalize event properties to support both camelCase and snake_case
export const normalizeEvent = (ev: any): Event => {
  if (!ev) return ev;
  return {
    ...ev,
    id: String(ev.id),
    uuid: ev.uuid,
    user_id: ev.user_id !== undefined ? String(ev.user_id) : (ev.userId !== undefined ? String(ev.userId) : undefined),
    owner_name: ev.owner_name || ev.ownerName || undefined,
    owner_email: ev.owner_email || ev.ownerEmail || undefined,
    title: ev.title || 'Sem título',
    description: ev.description || '',
    event_date: ev.event_date || (ev.eventDate ? String(ev.eventDate).split('T')[0] : undefined),
    start_date: ev.start_date || ev.startDate || ev.event_date || ev.eventDate,
    end_date: ev.end_date || ev.endDate,
    is_active: ev.is_active !== undefined ? Boolean(ev.is_active) : (ev.isActive !== undefined ? Boolean(ev.isActive) : true),
    enable_dj_playlist: Boolean(ev.enable_dj_playlist ?? ev.enableDjPlaylist ?? false),
    require_photo_approval: Boolean(ev.require_photo_approval ?? ev.requirePhotoApproval ?? false),
    enable_message_wall: Boolean(ev.enable_message_wall ?? ev.enableMessageWall ?? false),
    photo_count: ev.photo_count !== undefined ? Number(ev.photo_count) : (ev.photoCount !== undefined ? Number(ev.photoCount) : 0),
    storage_mode: ev.storage_mode || ev.storageMode || 'fallback',
    category: ev.category ?? undefined,
    location: ev.location ?? undefined,
    start_at: ev.start_at || ev.startAt || undefined,
    end_at: ev.end_at || ev.endAt || undefined,
    cover_image: ev.cover_image || ev.coverImage || undefined,
    background_image: ev.background_image || ev.backgroundImage || undefined,
    invitation_template: ev.invitation_template || ev.invitationTemplate || undefined,
    capacity: ev.capacity ?? undefined,
    max_entries_per_invitation: ev.max_entries_per_invitation ?? ev.maxEntriesPerInvitation ?? undefined,
    qr_code_url: ev.qr_code_url || ev.qrCodeUrl,
    created_at: ev.created_at || ev.createdAt,
    updated_at: ev.updated_at || ev.updatedAt,
  };
};

export const eventService = {
  async createEvent(data: CreateEventData): Promise<Event> {
    const payload = {
      title: data.title,
      description: data.description,
      startDate: data.start_date || data.event_date,
      endDate: data.end_date,
      eventDate: data.start_date || data.event_date,
      storageMode: data.storage_mode || 'fallback',
      enableDjPlaylist: data.enable_dj_playlist ?? false,
      requirePhotoApproval: data.require_photo_approval ?? false,
    };
    const response = await api.post('/api/events', payload);
    const raw = response.data?.data || response.data?.event || response.data;
    return normalizeEvent(raw);
  },

  async updateEvent(id: string, data: Partial<CreateEventData> & { id?: string; [key: string]: any }): Promise<Event> {
    const payload = {
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      capacity: data.capacity,
      maxEntriesPerInvitation: (data as any).maxEntriesPerInvitation ?? (data as any).max_entries_per_invitation,
      startDate: data.start_date || data.startDate || data.event_date || data.eventDate,
      endDate: data.end_date || data.endDate,
      startAt: data.start_at || data.startAt || data.start_date || data.startDate,
      endAt: data.end_at || data.endAt || data.end_date || data.endDate,
      eventDate: data.event_date || data.eventDate || data.start_date || data.startDate,
      enableDjPlaylist: data.enable_dj_playlist ?? (data as any).enableDjPlaylist,
      requirePhotoApproval: data.require_photo_approval ?? (data as any).requirePhotoApproval,
      enableMessageWall: data.enable_message_wall ?? (data as any).enableMessageWall,
      isActive: data.is_active ?? (data as any).isActive,
      status: (data as any).status,
    };
    const response = await api.put(`/api/events/${id}`, payload);
    const raw = response.data?.data || response.data?.event || response.data;
    return normalizeEvent(raw);
  },

  async getUserEvents(): Promise<Event[]> {
    const response = await api.get('/api/events');
    const rawList = response.data?.data || response.data?.events || response.data;
    if (!Array.isArray(rawList)) {
      return [];
    }
    return rawList.map(normalizeEvent);
  },

  async getEventById(id: string): Promise<Event> {
    const response = await api.get(`/api/events/${id}`);
    const raw = response.data?.data || response.data?.event || response.data;
    return normalizeEvent(raw);
  },

  async getEventByUuid(uuid: string): Promise<Event> {
    const response = await api.get(`/api/events/${uuid}`);
    const raw = response.data?.data || response.data?.event || response.data;
    return normalizeEvent(raw);
  },

  async toggleEvent(id: string, _isActive?: boolean): Promise<Event> {
    const response = await api.patch(`/api/events/${id}/toggle`);
    const raw = response.data?.data || response.data?.event || response.data;
    return normalizeEvent(raw);
  },

  async setDjPlaylist(id: string, enabled: boolean): Promise<Event> {
    const response = await api.patch(`/api/events/${id}/dj-playlist`, { enabled });
    const raw = response.data?.data || response.data?.event || response.data;
    return normalizeEvent(raw);
  },

  async setMessageWall(id: string, enabled: boolean): Promise<Event> {
    const response = await api.patch(`/api/events/${id}/message-wall`, { enabled });
    const raw = response.data?.data || response.data?.event || response.data;
    return normalizeEvent(raw);
  },

  async setPhotoApproval(id: string, enabled: boolean): Promise<Event> {
    const response = await api.patch(`/api/events/${id}/photo-approval`, { enabled });
    const raw = response.data?.data || response.data?.event || response.data;
    return normalizeEvent(raw);
  },

  /** The owner's saved QR code design, shared across devices (null when never saved) */
  async getQRCustomization(id: string): Promise<StoredQRCustomization | null> {
    const response = await api.get(`/api/events/${id}/qr-customization`);
    return response.data?.data ?? null;
  },

  async saveQRCustomization(id: string, config: StoredQRCustomization): Promise<StoredQRCustomization> {
    const response = await api.put(`/api/events/${id}/qr-customization`, config);
    return response.data?.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/api/events/${id}`);
  },

  async getEventStats(id: string): Promise<EventStats> {
    const response = await api.get(`/api/events/${id}/stats`);
    const raw = response.data?.data || response.data?.stats || response.data;
    return {
      total_photos: raw.totalPhotos ?? raw.total_photos ?? 0,
      pending_photos: raw.pendingPhotos ?? raw.pending_photos ?? 0,
      total_size_bytes: raw.totalStorageBytes ?? raw.total_size_bytes ?? 0,
      last_upload_at: raw.latestUpload ?? raw.last_upload_at ?? null,
      active_events_count: raw.active_events_count ?? 1,
    };
  },
};
