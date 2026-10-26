import { api } from './api';
import { User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<void> {
    await api.post('/api/auth/register', { name, email, password });
  },

  async login(email: string, password: string): Promise<void> {
    await api.post('/api/auth/login', { email, password });
  },

  async getCurrentUser(): Promise<User | null> {
    const response = await api.get('/api/auth/me');
    const raw = response.data?.user;
    if (!raw?.id) return null;

    return {
      id: String(raw.id),
      name: raw.name || raw.email || 'Usuário',
      email: raw.email || '',
      avatar_url: raw.avatarUrl || raw.avatar_url || '',
      created_at: raw.createdAt || raw.created_at || '',
    };
  },

  async updateProfile(name: string): Promise<void> {
    await api.patch('/api/auth/profile', { name });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/api/auth/profile/password', { currentPassword, newPassword });
  },

  async updateAvatar(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('avatar', file);
    await api.post('/api/auth/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },
};
