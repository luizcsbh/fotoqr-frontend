import { api } from './api';
import { User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<void> {
    await api.post('/api/auth/register', { name, email, password });
  },

  async login(email: string, password: string): Promise<void> {
    await api.post('/api/auth/login', { email, password });
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
