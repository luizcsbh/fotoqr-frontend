import { api } from './api';
import { AuditLogPage, ManagedUser, ManagedUserPage, ManagedUserRole } from '../types';

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  action?: string;
  search?: string;
  /** ISO date-times */
  from?: string;
  to?: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
}

/** Drops empty filters so they are not sent as `?search=` */
const compact = (params: object) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));

/** Super admin console (audit trail and user management). */
export const adminService = {
  async getAuditLogs(query: AuditLogQuery): Promise<AuditLogPage> {
    const response = await api.get('/api/admin/audit-logs', { params: compact(query) });
    return response.data.data;
  },

  async getUsers(query: UserQuery): Promise<ManagedUserPage> {
    const response = await api.get('/api/admin/users', { params: compact(query) });
    return response.data.data;
  },

  async updateUser(id: number, changes: { role?: ManagedUserRole; isActive?: boolean }): Promise<ManagedUser> {
    const response = await api.patch(`/api/admin/users/${id}`, changes);
    return response.data.data;
  },

  async deleteUser(id: number): Promise<{ eventsDeleted: number; photosDeleted: number; message: string }> {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  },
};
