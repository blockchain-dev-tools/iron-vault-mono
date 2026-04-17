'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

export type ScreenId =
  | 'Welcome' | 'Entropy' | 'GenerateMnemonic' | 'VerifyMnemonic' | 'SetPin' | 'ImportMnemonic'
  | 'Vault' | 'Settings' | 'Unlock' | 'AccountDetail' | 'Transaction' | 'BackupSeed';
export type NavDirection = 'forward' | 'back' | 'reset';

interface NavCtx {
  current: ScreenId;
  direction: NavDirection;
  go: (id: ScreenId) => void;
  goBack: () => void;
  reset: (id: ScreenId) => void;
  canGoBack: boolean;
}

const Ctx = createContext<NavCtx>(null!);

export function NavProvider({ children, initialScreen = 'Welcome' }: { children: React.ReactNode; initialScreen?: ScreenId }) {
  const [history, setHistory] = useState<ScreenId[]>([]);
  const [current, setCurrent] = useState<ScreenId>(initialScreen);
  const [direction, setDirection] = useState<NavDirection>('reset');

  const go = useCallback((id: ScreenId) => {
    setDirection('forward');
    setCurrent(prev => {
      setHistory(h => [...h, prev]);
      return id;
    });
  }, []);

  const goBack = useCallback(() => {
    setDirection('back');
    setHistory(h => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setCurrent(prev);
      return h.slice(0, -1);
    });
  }, []);

  const reset = useCallback((id: ScreenId) => {
    setDirection('reset');
    setHistory([]);
    setCurrent(id);
  }, []);

  return (
    <Ctx.Provider value={{ current, direction, go, goBack, reset, canGoBack: history.length > 0 }}>
      {children}
    </Ctx.Provider>
  );
}

export const useNav = () => useContext(Ctx);
