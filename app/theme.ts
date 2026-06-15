import { createTheme, alpha, type Theme } from '@mui/material/styles';

export type ColorMode = 'light' | 'dark';

const fontStack = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(',');

/**
 * Refined monochrome design system with full light + dark support.
 * Build a theme for the requested mode; the chrome and routes read tokens
 * (primary / background / divider / text) so they adapt automatically.
 */
export function createAppTheme(mode: ColorMode): Theme {
  const isDark = mode === 'dark';

  const palette = isDark
    ? {
        mode: 'dark' as const,
        primary: {
          main: '#ededed',
          dark: '#ffffff',
          light: '#bdbdbd',
          contrastText: '#161616',
        },
        secondary: {
          main: '#9aa0a6',
          contrastText: '#161616',
        },
        background: {
          default: '#121212',
          paper: '#1c1c1e',
        },
        text: {
          primary: '#f2f2f2',
          secondary: 'rgba(255,255,255,0.62)',
        },
        divider: 'rgba(255,255,255,0.12)',
      }
    : {
        mode: 'light' as const,
        primary: {
          main: '#1a1a1a',
          dark: '#000000',
          light: '#4a4a4a',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#5f6368',
          contrastText: '#ffffff',
        },
        background: {
          default: '#f6f6f7',
          paper: '#ffffff',
        },
        text: {
          primary: '#1a1a1a',
          secondary: 'rgba(0,0,0,0.6)',
        },
        divider: 'rgba(0,0,0,0.1)',
      };

  return createTheme({
    palette,
    typography: {
      fontFamily: fontStack,
      h1: {
        fontSize: '2rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        '@media (min-width:600px)': { fontSize: '2.5rem' },
      },
      h2: {
        fontSize: '1.75rem',
        fontWeight: 700,
        letterSpacing: '-0.015em',
        '@media (min-width:600px)': { fontSize: '2rem' },
      },
      h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontSize: '1.25rem', fontWeight: 600 },
      h5: { fontSize: '1.125rem', fontWeight: 600 },
      h6: { fontSize: '1rem', fontWeight: 600 },
      button: { fontWeight: 600 },
      body1: { fontSize: '1rem', lineHeight: 1.6 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiAppBar: {
        defaultProps: { color: 'default', elevation: 0 },
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            width: 280,
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
          }),
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 8, padding: '8px 16px' },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            border: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
            boxShadow: isDark
              ? '0 1px 2px rgba(0,0,0,0.4)'
              : '0 1px 3px rgba(0,0,0,0.06)',
          }),
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiLink: {
        defaultProps: { underline: 'hover' },
      },
    },
    breakpoints: {
      values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
    },
  });
}

// Backwards-compatible default export (light theme) for any direct importers.
export const theme = createAppTheme('light');
