'use client';
import React, { createContext, useContext, useState } from 'react';

interface AppCtx {
  appLight: boolean;
  setAppLight: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [appLight, setAppLight] = useState(false);
  return (
    <Ctx.Provider value={{ appLight, setAppLight }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside <AppProvider>');
  return c;
}
