import { createContext, useContext } from 'react';
import type { ColorMode } from '../theme';

interface ColorModeContextType {
  mode: ColorMode;
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType | undefined>(
  undefined,
);

export function useColorMode() {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error('useColorMode must be used within a ThemeProvider');
  }
  return context;
}
