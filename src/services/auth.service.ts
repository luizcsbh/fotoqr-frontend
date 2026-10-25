import { api } from './api';
import { User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const authService = {
  getGoogleLoginUrl(): string {
    return `${API_BASE}/api/auth/google`;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/api/auth/me');
    const raw = response.data?.user || response.data;
    if (!raw || !raw.id) {
      throw new Error('Usuário não autenticado.');
    }
    return {
      id: String(raw.id),
      name: raw.name || raw.email || 'Usuário',
      email: raw.email || '',
      avatar_url: raw.avatarUrl || raw.avatar_url || '',
      created_at: raw.createdAt || raw.created_at || '',
    };
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },
};
