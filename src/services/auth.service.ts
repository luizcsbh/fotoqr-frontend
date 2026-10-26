import { api } from './api';
import { User } from '../types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<void> {
    const response = await api.post('/api/auth/register', { name, email, password });
    if (response.data?.success !== true || !response.data?.user?.id) {
      throw new Error('O servidor não confirmou a criação da conta.');
    }
  },

  async login(email: string, password: string): Promise<void> {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data?.success !== true || !response.data?.user?.id) {
      throw new Error('O servidor não confirmou o login. Tente novamente.');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const response = await api.get('/api/auth/me');
    if (!response.data || typeof response.data !== 'object' || !('user' in response.data)) {
      throw new Error('Resposta inválida do servidor de autenticação.');
    }
    const raw = response.data?.user;
    if (raw === null) return null;
    if (!raw?.id) {
      throw new Error('Resposta inválida do servidor de autenticação.');
    }

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
