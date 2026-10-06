import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthResponse, User } from '../types/api';
import { AuthApi } from '../api/auth';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notifications';
import { Platform } from 'react-native';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { full_name: string; email: string; phone: string; password?: string }) => Promise<void>;
  verifyPhoneOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  verifyPhoneOtp: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const restoreSession = async () => {
    setIsLoading(true);
    try {
      const token = await StorageService.getAccessToken();
      if (token) {
        const currentUser = await AuthApi.getMe();
        setUser(currentUser);
        // Try registering push token asynchronously if authenticated
        registerPushTokenQuietly();
      }
    } catch (error) {
      console.log('Session restoration failed:', error);
      await StorageService.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const registerPushTokenQuietly = async () => {
    try {
      const pushToken = await NotificationService.registerForPushNotificationsAsync();
      if (pushToken) {
        const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
        await AuthApi.login.toString(); // API endpoint test placeholder
      }
    } catch (e) {
      // Quiet fail
    }
  };

  const handleAuthSuccess = async (authResponse: AuthResponse) => {
    await StorageService.setAccessToken(authResponse.access_token);
    setUser(authResponse.user);
    registerPushTokenQuietly();
  };

  const login = async (email: string, password: string) => {
    const res = await AuthApi.login(email, password);
    await handleAuthSuccess(res);
  };

  const signup = async (data: { full_name: string; email: string; phone: string; password?: string }) => {
    const res = await AuthApi.signup(data);
    await handleAuthSuccess(res);
  };

  const verifyPhoneOtp = async (phone: string, code: string) => {
    const res = await AuthApi.verifyPhoneOtp(phone, code);
    await handleAuthSuccess(res);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthApi.logout();
    } catch (e) {
      // ignore
    } finally {
      await StorageService.clearTokens();
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await AuthApi.getMe();
      setUser(currentUser);
    } catch (e) {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        verifyPhoneOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
