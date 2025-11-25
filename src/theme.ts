export type ThemeMode = 'light' | 'dark';

export interface Theme {
  colors: {
    primary: string;
    onPrimary: string;
    secondary: string;
    brand: string;
    background: string;
    surface: string;
    surfaceSecondary: string;
    card: string;
    muted: string;
    text: string;
    subtext: string;
    border: string;
    success: string;
    successSurface: string;
    warning: string;
    warningSurface: string;
    danger: string;
    dangerSurface: string;
    info: string;
    infoSurface: string;
    overlay: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadow: {
    card: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

const base = {
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
  },
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
  },
};

export const lightTheme: Theme = {
  ...base,
  colors: {
    primary: '#5a48f5',
    onPrimary: '#ffffff',
    secondary: '#7c6cf7',
    brand: '#f5d800',
    background: '#f2f3f8',
    surface: '#ffffff',
    surfaceSecondary: '#eef2ff',
    card: '#f8fafc',
    muted: '#6b7280',
    text: '#0f172a',
    subtext: '#4b5563',
    border: '#e5e7eb',
    success: '#22c55e',
    successSurface: '#ecfdf3',
    warning: '#f59e0b',
    warningSurface: '#fef9c3',
    danger: '#ef4444',
    dangerSurface: '#fee2e2',
    info: '#0ea5e9',
    infoSurface: '#e0f2fe',
    overlay: 'rgba(0,0,0,0.04)',
  },
};

export const darkTheme: Theme = {
  ...base,
  colors: {
    primary: '#b3b9ff',
    onPrimary: '#0b1021',
    secondary: '#9ca7ff',
    brand: '#f5d800',
    background: '#0f172a',
    surface: '#111827',
    surfaceSecondary: '#1f2937',
    card: '#111827',
    muted: '#94a3b8',
    text: '#e2e8f0',
    subtext: '#cbd5e1',
    border: '#1f2937',
    success: '#34d399',
    successSurface: '#0f172a',
    warning: '#fbbf24',
    warningSurface: '#1f2937',
    danger: '#f87171',
    dangerSurface: '#1f1d2d',
    info: '#38bdf8',
    infoSurface: '#0b1628',
    overlay: 'rgba(255,255,255,0.04)',
  },
};

export const getThemeForMode = (mode: ThemeMode): Theme => (mode === 'dark' ? darkTheme : lightTheme);
