import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Theme, ThemeMode, getThemeForMode } from '../theme';
import { useApp } from './AppContext';

interface ThemeContextValue {
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, toggleDarkMode } = useApp();
  const mode = settings.darkMode ? 'dark' : 'light';

  const theme = useMemo(() => getThemeForMode(mode), [mode]);

  const setMode = (nextMode: ThemeMode) => {
    if ((nextMode === 'dark') !== settings.darkMode) {
      toggleDarkMode();
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggleMode: toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};

export const useThemedStyles = <T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (theme: Theme) => T
): T => {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
};
