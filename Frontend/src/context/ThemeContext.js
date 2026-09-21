import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import {
  getUserPreferences,
  saveUserPreferences,
  syncUserPreferencesFromBackend,
} from '../services/userPreferences';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Read per-user preference if present, fallback to general theme_mode, default to dark
  const [mode, setMode] = useState(() => {
    const prefs = getUserPreferences();
    if (prefs?.theme_mode) return prefs.theme_mode;
    const saved = localStorage.getItem('theme_mode');
    return saved ? saved : 'dark';
  });

  // Sync user preferences on mount and on cross-component updates
  useEffect(() => {
    syncUserPreferencesFromBackend().then((prefs) => {
      if (prefs?.theme_mode) {
        setMode(prefs.theme_mode);
      }
    });

    const handlePrefUpdate = (e) => {
      if (e.detail?.preferences?.theme_mode) {
        setMode(e.detail.preferences.theme_mode);
      }
    };

    window.addEventListener('user-preferences-updated', handlePrefUpdate);
    return () => window.removeEventListener('user-preferences-updated', handlePrefUpdate);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme_mode', mode);
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [mode]);

  const toggleColorMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      saveUserPreferences({ theme_mode: next });
      return next;
    });
  }, []);

  const updateMode = useCallback((newMode) => {
    setMode(newMode);
    saveUserPreferences({ theme_mode: newMode });
  }, []);

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                primary: {
                  main: '#2563eb',
                  light: '#60a5fa',
                  dark: '#1d4ed8',
                },
                background: {
                  default: '#f8fafc',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#0f172a',
                  secondary: '#64748b',
                },
              }
            : {
                primary: {
                  main: '#3b82f6',
                  light: '#93c5fd',
                  dark: '#1d4ed8',
                },
                background: {
                  default: '#090d16',
                  paper: '#0f172a',
                },
                text: {
                  primary: '#f8fafc',
                  secondary: '#94a3b8',
                },
              }),
        },
        typography: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
        },
      }),
    [mode]
  );

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      toggleColorMode,
      setMode: updateMode,
    }),
    [mode, toggleColorMode, updateMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};