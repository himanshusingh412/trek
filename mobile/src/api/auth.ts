import { apiClient } from './client';
import { AuthResponse, OtpRequestResponse, User } from '../types/api';

export const AuthApi = {
  async login(email: string, password_hash: string): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password_hash }),
    });
  },

  async signup(data: {
    full_name: string;
    email: string;
    phone: string;
    password?: string;
  }): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async requestPhoneOtp(phone: string): Promise<OtpRequestResponse> {
    return apiClient<OtpRequestResponse>('/api/v1/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  async verifyPhoneOtp(phone: string, code: string): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>('/api/v1/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async confirmPasswordReset(token: string, new_password: string): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>('/api/v1/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    });
  },

  async logout(): Promise<void> {
    try {
      await apiClient('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore logout API failures
    }
  },

  async getMe(): Promise<User> {
    return apiClient<User>('/api/v1/account/me');
  },
};
