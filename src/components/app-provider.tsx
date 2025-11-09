'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface AppContextType {
  appName: string;
  setAppName: (name: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [appName, setAppName] = useState('CampusConnect');
  const { theme } = useTheme();

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  const value = {
    appName,
    setAppName,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
