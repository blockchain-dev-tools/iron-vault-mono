'use client';
import React, { createContext, useContext, useState } from 'react';
import type { WalletAccounts, WalletStorage } from '@iron-vault/wallet';

interface AppCtx {
  storage: WalletStorage;
  currentAcct: { chain: 'eth' | 'sol'; idx: number };
  setCurrentAcct: (a: { chain: 'eth' | 'sol'; idx: number }) => void;
  accounts: WalletAccounts | null;
  setAccounts: (a: WalletAccounts | null) => void;
  generatedMnemonic: string[] | null;
  setGeneratedMnemonic: (m: string[] | null) => void;
  appLight: boolean;
  setAppLight: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({
  children,
  storage,
  initialLightTheme = false,
}: {
  children: React.ReactNode;
  storage: WalletStorage;
  initialLightTheme?: boolean;
}) {
  const [currentAcct, setCurrentAcct] = useState<{ chain: 'eth' | 'sol'; idx: number }>({
    chain: 'eth',
    idx: 0,
  });
  const [accounts, setAccounts] = useState<WalletAccounts | null>(null);
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string[] | null>(null);
  const [appLight, setAppLight] = useState(initialLightTheme);

  return (
    <Ctx.Provider
      value={{ storage, currentAcct, setCurrentAcct, accounts, setAccounts, generatedMnemonic, setGeneratedMnemonic, appLight, setAppLight }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside <AppProvider>');
  return c;
}
