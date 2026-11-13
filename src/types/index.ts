export type StorageMode = 'local' | 'fallback';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Event {
  id: string;
  uuid: string;
  user_id?: string;
  title: string;
  description?: string;
  category?: string;
  start_at?: string;
  end_at?: string;
  location?: string;
  capacity?: number;
  cover_image?: string;
  background_image?: string;
  status?: string;
  max_entries_per_invitation?: number;
  event_date?: string;
  start_date?: string;
  end_date?: string;
  storage_mode: StorageMode;
  is_active: boolean;
  enable_dj_playlist: boolean;
  require_photo_approval: boolean;
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
  review_status?: 'approved' | 'pending';
  /** Why automatic moderation sent it to review (owner's pending list only) */
  review_reason?: string | null;
}

export interface EventStats {
  total_photos: number;
  pending_photos?: number;
  total_size_bytes?: number;
  last_upload_at?: string | null;
  active_events_count?: number;
}

export interface CreateEventData {
  title: string;
  description?: string;
  category?: string;
  start_at?: string;
  end_at?: string;
  location?: string;
  capacity?: number;
  max_entries_per_invitation?: number;
  event_date?: string;
  start_date?: string;
  end_date?: string;
  storage_mode?: StorageMode;
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

// ── Guests & Invitations Module ──────────────────────────────────────────

export type GuestCategory = 'VIP' | 'Convidado' | 'Equipe' | 'Imprensa' | 'Organizador' | 'Personalizado';

export interface Guest {
  id: number;
  eventId: number;
  name: string;
  email: string | null;
  phone: string | null;
  category: GuestCategory | string;
  notes: string | null;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGuestPayload {
  name: string;
  email?: string;
  phone?: string;
  category?: string;
  notes?: string;
  externalId?: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: Array<{ row: number; reason: string }>;
}

export interface Invitation {
  id: number;
  eventId: number;
  guestId: number;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  guestCategory: string;
  tokenHash: string;
  status: 'pending' | 'sent' | 'used' | 'cancelled' | 'expired';
  maxEntries: number;
  usedEntries: number;
  validFrom: string | null;
  validUntil: string | null;
  issuedAt: string | null;
  revokedAt: string | null;
}

export interface PublicInvitation {
  invitation: {
    id: number;
    status: string;
    maxEntries: number;
    usedEntries: number;
    validFrom: string | null;
    validUntil: string | null;
    issuedAt: string | null;
    qrCodeUrl: string;
  };
  guest: {
    id: number;
    name: string;
    category: string;
  };
  event: {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    category: string | null;
    startAt: string | null;
    endAt: string | null;
    location: string | null;
    coverImage: string | null;
    backgroundImage: string | null;
  };
}

export interface ReaderUser {
  id: number;
  userId: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface CheckinValidationResult {
  status: 'VALIDO' | 'JA_UTILIZADO' | 'CANCELADO' | 'EXPIRADO' | 'INVALIDO' | 'EVENTO_INCORRETO';
  allowed: boolean;
  color: 'verde' | 'vermelho' | 'laranja';
  message: string;
  guest?: {
    id: number;
    name: string;
    category: string;
  };
  event?: {
    id: number;
    title: string;
  };
  checkin?: {
    id: number;
    checkedInAt: string;
    deviceIdentifier?: string | null;
  };
  entriesCount?: {
    used: number;
    max: number;
  };
}

export interface DashboardMetrics {
  totalGuests: number;
  totalInvitations: number;
  sentEmail: number;
  sentWhatsApp: number;
  pendingDeliveries: number;
  failedDeliveries: number;
  totalCheckins: number;
  absentGuests: number;
  attendanceRate: number;
  recentCheckins: Array<{
    id: number;
    guestName: string;
    category: string;
    checkedInAt: string;
    readerName: string | null;
    result: string;
  }>;
  categoryBreakdown: Array<{ category: string; total: number; present: number }>;
}
