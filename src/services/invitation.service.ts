import { api } from './api';
import {
  Guest,
  CreateGuestPayload,
  ImportResult,
  Invitation,
  PublicInvitation,
  ReaderUser,
  CheckinValidationResult,
  DashboardMetrics,
} from '../types';

export const invitationService = {
  // ── Event Details & Cover ───────────────────────────────────────────────

  async updateEventDetails(eventId: string | number, data: Record<string, any>) {
    const response = await api.put(`/api/events/${eventId}`, data);
    return response.data.data;
  },

  async updateEventCover(eventId: string | number, coverData: { coverImage?: string; backgroundImage?: string }) {
    const response = await api.post(`/api/events/${eventId}/cover`, coverData);
    return response.data.data;
  },

  // ── Guests ─────────────────────────────────────────────────────────────

  async listGuests(eventId: string | number, params?: { search?: string; category?: string; page?: number; limit?: number }) {
    const response = await api.get(`/api/events/${eventId}/guests`, { params });
    return response.data;
  },

  async createGuest(eventId: string | number, payload: CreateGuestPayload): Promise<Guest> {
    const response = await api.post(`/api/events/${eventId}/guests`, payload);
    return response.data.data;
  },

  async updateGuest(guestId: string | number, payload: Partial<CreateGuestPayload>): Promise<Guest> {
    const response = await api.put(`/api/guests/${guestId}`, payload);
    return response.data.data;
  },

  async deleteGuest(eventId: string | number, guestId: string | number): Promise<void> {
    await api.delete(`/api/events/${eventId}/guests/${guestId}`);
  },

  async importGuests(eventId: string | number, file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/events/${eventId}/guests/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  // ── Invitations ────────────────────────────────────────────────────────

  async listInvitations(eventId: string | number): Promise<Invitation[]> {
    const response = await api.get(`/api/events/${eventId}/invitations`);
    return response.data.data;
  },

  async generateInvitation(eventId: string | number, guestId: number, options?: { maxEntries?: number }) {
    const response = await api.post(`/api/events/${eventId}/invitations`, { guestId, ...options });
    return response.data.data;
  },

  async generateBulkInvitations(eventId: string | number): Promise<{ generated: number; totalGuests: number }> {
    const response = await api.post(`/api/events/${eventId}/invitations`, { bulk: true });
    return response.data.data;
  },

  async revokeInvitation(invitationId: number): Promise<void> {
    await api.post(`/api/invitations/${invitationId}/revoke`);
  },

  async resendInvitation(invitationId: number) {
    const response = await api.post(`/api/invitations/${invitationId}/resend`);
    return response.data.data;
  },

  async getPublicInvitation(tokenOrHash: string): Promise<PublicInvitation> {
    const response = await api.get(`/api/invitations/public/${tokenOrHash}`);
    return response.data.data;
  },

  async downloadPdf(invitationId: number, filename = 'convite.pdf') {
    const response = await api.get(`/api/invitations/${invitationId}/pdf`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // ── Deliveries ─────────────────────────────────────────────────────────

  async sendEmailBatch(eventId: string | number, invitationIds?: number[], attachPdf = false) {
    const response = await api.post(`/api/events/${eventId}/deliveries/email`, { invitationIds, attachPdf });
    return response.data.data;
  },

  async sendWhatsAppBatch(eventId: string | number, invitationIds?: number[]) {
    const response = await api.post(`/api/events/${eventId}/deliveries/whatsapp`, { invitationIds });
    return response.data.data;
  },

  // ── Readers ────────────────────────────────────────────────────────────

  async listReaders(eventId: string | number): Promise<ReaderUser[]> {
    const response = await api.get(`/api/events/${eventId}/readers`);
    return response.data.data;
  },

  async addReader(eventId: string | number, userEmailOrId: string | number): Promise<ReaderUser> {
    const response = await api.post(`/api/events/${eventId}/readers`, { userEmail: userEmailOrId });
    return response.data.data;
  },

  async removeReader(eventId: string | number, userId: number): Promise<void> {
    await api.delete(`/api/events/${eventId}/readers/${userId}`);
  },

  // ── Checkin & Scanner ──────────────────────────────────────────────────

  async validateCheckin(eventId: string | number, tokenOrQr: string, deviceIdentifier?: string): Promise<CheckinValidationResult> {
    const response = await api.post('/api/checkin/validate', {
      eventId,
      token: tokenOrQr,
      deviceIdentifier,
    });
    return response.data;
  },

  async listCheckins(eventId: string | number) {
    const response = await api.get(`/api/events/${eventId}/checkins`);
    return response.data.data;
  },

  // ── Dashboard Metrics & Reports ────────────────────────────────────────

  async getDashboardMetrics(eventId: string | number): Promise<DashboardMetrics> {
    const response = await api.get(`/api/events/${eventId}/dashboard`);
    return response.data.data;
  },

  async exportReport(eventId: string | number, type: 'guests' | 'checkins' | 'absent' | 'deliveries', format: 'xlsx' | 'csv' = 'xlsx') {
    const response = await api.get(`/api/events/${eventId}/reports`, {
      params: { type, format },
      responseType: 'blob',
    });
    const mime = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const blob = new Blob([response.data], { type: mime });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-${type}-${eventId}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export default invitationService;

