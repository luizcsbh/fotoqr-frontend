export type StorageMode = 'local' | 'fallback';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Event {
  id: string;
  uuid: string;
  user_id?: string;
  title: string;
  description?: string;
  event_date?: string;
  start_date?: string;
  end_date?: string;
  storage_mode: StorageMode;
  is_active: boolean;
  enable_dj_playlist: boolean;
  qr_code_url?: string;
  photo_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface Photo {
  id: string;
  event_id: string;
  filename: string;
  original_name?: string;
  url: string;
  thumbnail_url?: string;
  size: number;
  mime_type?: string;
  storage_provider?: string;
  uploaded_at: string;
}

export interface EventStats {
  total_photos: number;
  total_size_bytes?: number;
  last_upload_at?: string | null;
  active_events_count?: number;
}

export interface CreateEventData {
  title: string;
  description?: string;
  event_date?: string;
  start_date?: string;
  end_date?: string;
  storage_mode: StorageMode;
}

export interface UploadResult {
  success: boolean;
  message?: string;
  photos?: Photo[];
  uploaded_count?: number;
  failed_count?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadProgressItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

// ── DJ Music Request ───────────────────────────────────────────────────────

export type MusicRequestStatus = 'pending' | 'approved' | 'rejected' | 'played';

export interface MusicRequest {
  id: string;
  eventId: string;
  spotifyTrackId: string | null;
  title: string;
  artist: string;
  albumName: string | null;
  albumArtUrl: string | null;
  spotifyPreviewUrl: string | null;
  guestName: string | null;
  status: MusicRequestStatus;
  position: number;
  requestedAt: string;
}

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  albumName: string;
  albumArtUrl: string | null;
  previewUrl: string | null;
  durationMs: number;
  spotifyUrl: string;
}

export interface MusicListResponse {
  data: MusicRequest[];
  total: number;
  max: number;
  enabled: boolean;
  spotifyEnabled: boolean;
}
