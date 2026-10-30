import { api, resolveApiUrl } from './api';
import { Photo, PaginatedResponse, UploadResult } from '../types';

export const resolvePhotoUrls = (photos: Photo[]): Photo[] =>
  photos.map((photo) => ({
    ...photo,
    url: resolveApiUrl(photo.url),
    thumbnail_url: photo.thumbnail_url ? resolveApiUrl(photo.thumbnail_url) : undefined,
  }));

export const photoService = {
  async uploadPhotos(
    uuid: string,
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<UploadResult> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('photos', file);
    });

    const response = await api.post<UploadResult>(
      `/api/events/${uuid}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 5 * 60_000, // up to 10MB per photo on slow mobile connections
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(percent);
          }
        },
      }
    );

    return response.data;
  },

  async uploadSinglePhoto(
    uuid: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<any> {
    const formData = new FormData();
    formData.append('photos', file);

    const response = await api.post<any>(
      `/api/events/${uuid}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 5 * 60_000, // up to 10MB per photo on slow mobile connections
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress?.(percent);
          }
        },
      }
    );

    if (response.data?.results && response.data.results.length > 0) {
      const res = response.data.results[0];
      if (res.status === 'failed') {
        throw new Error(res.error || 'Erro no envio da foto');
      }
    }

    return response.data;
  },

  async getEventPhotos(
    identifier: string,
    page = 1,
    limit = 24,
    review: 'approved' | 'pending' = 'approved'
  ): Promise<PaginatedResponse<Photo>> {
    const response = await api.get<PaginatedResponse<Photo> | { photos: Photo[]; total: number; total_pages?: number }>(
      `/api/events/${identifier}/photos`,
      {
        // Pending photos are only listed for the event owner
        params: review === 'pending' ? { page, limit, review } : { page, limit },
      }
    );

    const data = response.data;
    if ('data' in data && Array.isArray(data.data)) {
      return { ...data, data: resolvePhotoUrls(data.data) };
    }

    const legacy = data as { photos: Photo[]; total: number; total_pages?: number };
    return {
      data: resolvePhotoUrls(legacy.photos || []),
      total: legacy.total || 0,
      page,
      limit,
      total_pages: legacy.total_pages || Math.ceil((legacy.total || 0) / limit) || 1,
    };
  },

  async downloadPhotos(eventId: string, title?: string, photoIds?: string[]): Promise<void> {
    const params: Record<string, string> = {};
    if (photoIds && photoIds.length > 0) {
      params.photoIds = photoIds.join(',');
    }

    const response = await api.get(`/api/events/${eventId}/download`, {
      params,
      responseType: 'blob',
      timeout: 0, // large ZIPs take longer than the default 45s timeout
    });

    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (title || 'evento').toLowerCase().replace(/[^a-z0-9]/gi, '_');
    const suffix = photoIds && photoIds.length > 0 ? `_selecionadas_${photoIds.length}` : '_todas';
    link.setAttribute('download', `${sanitizedTitle}${suffix}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revoking synchronously cancels the download in Safari/Firefox
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  },

  async deletePhoto(id: string): Promise<void> {
    await api.delete(`/api/photos/${id}`);
  },

  async approvePhoto(id: string): Promise<void> {
    await api.post(`/api/photos/${id}/approve`);
  },

  /** Approves every pending photo of the event, returning how many were published */
  async approveAllPhotos(eventId: string): Promise<number> {
    const response = await api.post(`/api/events/${eventId}/photos/approve`);
    return Number(response.data?.approved ?? 0);
  },
};
