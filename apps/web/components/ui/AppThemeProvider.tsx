'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme } from '@mui/material/styles';

// ── Build a theme dynamically from a primary color ────────────────────────
function buildTheme(primaryColor: string) {
  return createTheme({
    palette: {
      primary: {
        main: primaryColor,
        dark: primaryColor,
        light: primaryColor,
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#1a1f36',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f0f2f9',
        paper: '#ffffff',
      },
      success: { main: '#4caf50', contrastText: '#ffffff' },
      error: { main: '#f44336', contrastText: '#ffffff' },
      warning: { main: '#ff9800', contrastText: '#ffffff' },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
      h4: { fontWeight: 800 },
      h5: { fontWeight: 800 },
      h6: { fontWeight: 700 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: '1px solid #f0f2f9' },
        },
      },
    },
  });
}

// Default theme (main platform)
const defaultTheme = buildTheme('#4f6ef7');

interface AppThemeProviderProps {
  children: React.ReactNode;
  primaryColor?: string; // Passed from root layout server component
}

export default function AppThemeProvider({
  children,
  primaryColor,
}: AppThemeProviderProps) {
  // Build theme once per render — primaryColor comes from server (stable)
  const theme = React.useMemo(
    () => (primaryColor && primaryColor !== '#111827' ? buildTheme(primaryColor) : defaultTheme),
    [primaryColor],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export { defaultTheme as theme };