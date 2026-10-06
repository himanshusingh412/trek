import Constants from 'expo-constants';
import { StorageService } from '../services/storage';

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:8080';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const token = await StorageService.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, config);

    if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          return fetch(url, { ...config, headers }).then((res) => res.json());
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await StorageService.getRefreshToken();
        if (!refreshToken) {
          throw new ApiError('Session expired', 401);
        }

        const refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshResponse.ok) {
          await StorageService.clearTokens();
          throw new ApiError('Refresh token expired', 401);
        }

        const data = await refreshResponse.json();
        await StorageService.setAccessToken(data.access_token);
        if (data.refresh_token) {
          await StorageService.setRefreshToken(data.refresh_token);
        }

        processQueue(null, data.access_token);
        headers['Authorization'] = `Bearer ${data.access_token}`;
        response = await fetch(url, { ...config, headers });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await StorageService.clearTokens();
        throw new ApiError('Authentication failed', 401, refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: await response.text() };
      }

      const message =
        errorData.message || errorData.error || `HTTP error ${response.status}`;
      throw new ApiError(message, response.status, errorData);
    }

    if (response.status === 240 || response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError((error as Error).message || 'Network error occurred', 0);
  }
}
