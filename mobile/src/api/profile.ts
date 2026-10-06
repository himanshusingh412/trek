import { apiClient } from './client';
import { User } from '../types/api';

export const ProfileApi = {
  async getProfile(): Promise<User> {
    return apiClient<User>('/api/v1/account/me');
  },

  async updateProfile(data: {
    full_name?: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    marketing_email?: boolean;
    marketing_whatsapp?: boolean;
  }): Promise<User> {
    return apiClient<User>('/api/v1/account/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async registerPushToken(token: string, platform: 'ANDROID' | 'IOS'): Promise<void> {
    await apiClient('/api/v1/account/push-tokens', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  },
};
