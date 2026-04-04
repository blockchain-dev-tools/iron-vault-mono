'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

export type ScreenId = 'Welcome'|'GenerateMnemonic'|'VerifyMnemonic'|'SetPin'|'ImportMnemonic'|'Vault'|'Settings'|'Unlock'|'AccountDetail'|'Transaction';
export type NavDirection = 'forward' | 'back' | 'initial';

interface NavCtx {
  current: ScreenId;
  direction: NavDirection;
  go: (id: ScreenId) => void;
  goBack: () => void;
}

const Ctx = createContext<NavCtx>(null!);

export function NavProvider({ children, initialScreen = 'Welcome' }: { children: React.ReactNode; initialScreen?: ScreenId }) {
  const [history, setHistory] = useState<ScreenId[]>([]);
  const [current, setCurrent] = useState<ScreenId>(initialScreen);
  const [direction, setDirection] = useState<NavDirection>('initial');

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

  return (
    <Ctx.Provider value={{ current, direction, go, goBack }}>
      {children}
    </Ctx.Provider>
  );
}

export const useNav = () => useContext(Ctx);
