import { api } from './api';
import { Event, CreateEventData, EventStats } from '../types';

// Helper to normalize event properties to support both camelCase and snake_case
export const normalizeEvent = (ev: any): Event => {
  if (!ev) return ev;
  return {
    ...ev,
    id: String(ev.id),
    uuid: ev.uuid,
    title: ev.title || 'Sem título',
    description: ev.description || '',
    event_date: ev.event_date || (ev.eventDate ? String(ev.eventDate).split('T')[0] : undefined),
    start_date: ev.start_date || ev.startDate || ev.event_date || ev.eventDate,
    end_date: ev.end_date || ev.endDate,
    is_active: ev.is_active !== undefined ? Boolean(ev.is_active) : (ev.isActive !== undefined ? Boolean(ev.isActive) : true),
    photo_count: ev.photo_count !== undefined ? Number(ev.photo_count) : (ev.photoCount !== undefined ? Number(ev.photoCount) : 0),
    storage_mode: ev.storage_mode || ev.storageMode || 'fallback',
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
    };
    const response = await api.post('/api/events', payload);
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

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/api/events/${id}`);
  },

  async getEventStats(id: string): Promise<EventStats> {
    const response = await api.get(`/api/events/${id}/stats`);
    const raw = response.data?.data || response.data?.stats || response.data;
    return {
      total_photos: raw.totalPhotos ?? raw.total_photos ?? 0,
      total_size_bytes: raw.totalStorageBytes ?? raw.total_size_bytes ?? 0,
      last_upload_at: raw.latestUpload ?? raw.last_upload_at ?? null,
      active_events_count: raw.active_events_count ?? 1,
    };
  },
};
