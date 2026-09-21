import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Dark mode first by default
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('theme_mode');
    return saved ? saved : 'dark';
  });

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

  const toggleColorMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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
      setMode,
    }),
    [mode]
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