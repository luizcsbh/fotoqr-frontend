import { api } from './api';

/** A message left by a guest on the event wall. */
export interface WallMessage {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  /** WhatsApp (digits with country code) — only returned to the event owner. */
  phone?: string;
}

export const MESSAGE_MAX_LENGTH = 500;

const toMessage = (m: any): WallMessage => ({
  id: String(m.id),
  name: m.name,
  message: m.message,
  createdAt: m.createdAt ?? m.created_at,
  phone: m.phone,
});

/** "5531999998888" → "(31) 99999-8888" */
export const formatWhatsApp = (digits?: string): string => {
  if (!digits) return '';
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  const ddd = local.slice(0, 2);
  const number = local.slice(2);
  const split = number.length === 9 ? 5 : 4;
  return `(${ddd}) ${number.slice(0, split)}-${number.slice(split)}`;
};

/** Mask applied while the guest types the WhatsApp number. */
export const maskWhatsApp = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const messageWallService = {
  /** Guest: leaves a message (name, WhatsApp and message are required). */
  async send(eventUuid: string, data: { name: string; phone: string; message: string }): Promise<WallMessage> {
    const response = await api.post(`/api/events/${eventUuid}/messages`, data);
    return toMessage(response.data.data);
  },

  /** Owner: every message, with the guest's WhatsApp. */
  async list(eventId: string | number): Promise<WallMessage[]> {
    const response = await api.get(`/api/events/${eventId}/messages`);
    return (response.data.data ?? []).map(toMessage);
  },

  async remove(eventId: string | number, messageId: string): Promise<void> {
    await api.delete(`/api/events/${eventId}/messages/${messageId}`);
  },
};
