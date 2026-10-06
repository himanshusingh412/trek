import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  border: string;
  borderSubtle: string;
  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  card: string;
  shadow: string;
}

export const lightColors: ColorPalette = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceVariant: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  primary: '#059669', // Emerald 600
  primaryHover: '#047857',
  primaryLight: '#d1fae5',
  secondary: '#0284c7', // Sky 600
  accent: '#f59e0b', // Amber 500
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  error: '#dc2626',
  errorLight: '#fee2e2',
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#d97706',
  warningLight: '#fef3c7',
  card: '#ffffff',
  shadow: 'rgba(15, 23, 42, 0.08)',
};

export const darkColors: ColorPalette = {
  background: '#090d16',
  surface: '#121827',
  surfaceVariant: '#1f2937',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  primary: '#10b981', // Emerald 500
  primaryHover: '#059669',
  primaryLight: '#064e3b',
  secondary: '#38bdf8',
  accent: '#fbbf24',
  border: '#1f2937',
  borderSubtle: '#111827',
  error: '#ef4444',
  errorLight: '#7f1d1d',
  success: '#22c55e',
  successLight: '#14532d',
  warning: '#f59e0b',
  warningLight: '#78350f',
  card: '#121827',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ColorPalette;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  colors: lightColors,
  toggleTheme: () => {},
  setMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceScheme = useDeviceColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(deviceScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    if (deviceScheme) {
      setModeState(deviceScheme === 'dark' ? 'dark' : 'light');
    }
  }, [deviceScheme]);

  const toggleTheme = () => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const colors = mode === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
