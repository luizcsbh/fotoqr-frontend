import { api } from './api';

/** Event staff who get an exclusive access link: DJs (playlist console) and readers (portaria). */
export type StaffKind = 'dj' | 'reader';

export interface StaffAccessResult {
  kind: StaffKind;
  eventId: number;
  eventUuid: string;
  eventTitle: string;
}

/** Where a staff-link session lands: its own console (never the dashboard). */
export function staffConsolePath(scope: { kind: StaffKind; eventId: number; eventUuid: string }): string {
  return scope.kind === 'dj' ? `/dj/${scope.eventUuid}` : `/leitor/${scope.eventId}`;
}

export const staffService = {
  /** Opens an exclusive link: the server starts a session restricted to that console. */
  async openAccess(token: string): Promise<StaffAccessResult> {
    const response = await api.post('/api/staff-access', { token });
    return response.data.data;
  },

  /** E-mails the exclusive link to the DJ or reader. */
  async sendLink(eventId: string | number, kind: StaffKind, userId: number): Promise<void> {
    await api.post(`/api/events/${eventId}/staff/${kind}/${userId}/send-link`);
  },

  /** Issues a new exclusive link; the previous one stops working. */
  async regenerateLink(eventId: string | number, kind: StaffKind, userId: number): Promise<string> {
    const response = await api.post(`/api/events/${eventId}/staff/${kind}/${userId}/regenerate-link`);
    return response.data.data.link;
  },
};
