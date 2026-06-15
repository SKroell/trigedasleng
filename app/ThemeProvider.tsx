import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme, type ColorMode } from './theme';
import { ColorModeContext } from './contexts/ColorModeContext';

const THEME_COLORS: Record<ColorMode, string> = {
  light: '#f6f6f7',
  dark: '#121212',
};

function persistMode(mode: ColorMode) {
  if (typeof document === 'undefined') return;
  // 1 year, root path — read back server-side in root.tsx loader to avoid FOUC.
  document.cookie = `color-mode=${mode}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeProvider({
  children,
  initialMode = 'light',
  explicit = false,
}: {
  children: React.ReactNode;
  initialMode?: ColorMode;
  explicit?: boolean;
}) {
  const [mode, setMode] = useState<ColorMode>(initialMode);

  // Keep the browser chrome (PWA address bar / status bar) colour in sync with
  // the active mode — including on reload, where the SSR meta is a static default.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[mode]);
  }, [mode]);

  // No explicit choice yet → follow the OS preference and remember it,
  // so subsequent server renders match (avoids a repeated flash).
  useEffect(() => {
    if (explicit || typeof window === 'undefined') return;
    const systemMode: ColorMode = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches
      ? 'dark'
      : 'light';
    setMode(systemMode);
    persistMode(systemMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleColorMode = useCallback(() => {
    setMode((prev) => {
      const next: ColorMode = prev === 'light' ? 'dark' : 'light';
      persistMode(next);
      return next;
    });
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);
  const contextValue = useMemo(() => ({ mode, toggleColorMode }), [mode, toggleColorMode]);

  return (
    <ColorModeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </MUIThemeProvider>
    </ColorModeContext.Provider>
  );
}
