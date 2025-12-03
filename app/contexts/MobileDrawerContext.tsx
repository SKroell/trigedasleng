import React, { createContext, useContext, useState } from 'react';

interface MobileDrawerContextType {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const MobileDrawerContext = createContext<MobileDrawerContextType | undefined>(undefined);

export function MobileDrawerProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <MobileDrawerContext.Provider value={{ mobileOpen, setMobileOpen }}>
      {children}
    </MobileDrawerContext.Provider>
  );
}

export function useMobileDrawer() {
  const context = useContext(MobileDrawerContext);
  if (context === undefined) {
    throw new Error('useMobileDrawer must be used within a MobileDrawerProvider');
  }
  return context;
}

