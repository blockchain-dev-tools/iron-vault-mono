'use client';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { WalletAccounts, WalletStorage } from '@iron-vault/wallet';
import { addAccount as serviceAddAccount, removeAccount as serviceRemoveAccount } from '@iron-vault/wallet';
import type { Bip39Language } from '@iron-vault/wallet';

export type ThemeMode = 'system' | 'light' | 'dark';
export type BleState = 'idle' | 'broadcasting' | 'connected' | 'error';

export interface PendingTx {
  chain: 'eth' | 'sol';
  network?: string;
  type: string;
  from: string;
  to: string;
  amount: string;
  gas: string;
  rawHex: string;
  sign: () => string;
  resolve: (sig: string) => void;
  reject: () => void;
}

const EMPTY_ACCOUNTS: WalletAccounts = { eth: [], sol: [] };

interface AppCtx {
  storage: WalletStorage;
  accounts: WalletAccounts;
  setAccounts: (a: WalletAccounts) => void;
  currentChain: 'eth' | 'sol';
  currentAcctIdx: number;
  setCurrentAccount: (chain: 'eth' | 'sol', idx: number) => void;
  addAccount: (chain: 'eth' | 'sol', path: string, custom: boolean) => Promise<void>;
  removeAccount: (chain: 'eth' | 'sol', path: string) => Promise<void>;
  generatedWords: string[];
  setGeneratedWords: (w: string[]) => void;
  mnemonicEntropy: Uint8Array | null;
  setMnemonicEntropy: (e: Uint8Array | null) => void;
  mnemonicLang: Bip39Language;
  setMnemonicLang: (l: Bip39Language) => void;
  passphrase: string;
  setPassphrase: (p: string) => void;
  bleState: BleState;
  setBleState: (s: BleState) => void;
  pendingTx: PendingTx | null;
  setPendingTx: (tx: PendingTx | null) => void;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  localeMode: string;
  setLocaleMode: (m: string) => void;
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
  const [accounts, setAccounts] = useState<WalletAccounts>(EMPTY_ACCOUNTS);
  const [currentChain, setCurrentChain] = useState<'eth' | 'sol'>('eth');
  const [currentAcctIdx, setCurrentAcctIdx] = useState(0);
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [mnemonicEntropy, setMnemonicEntropy] = useState<Uint8Array | null>(null);
  const [mnemonicLang, setMnemonicLang] = useState<Bip39Language>('en');
  const [passphrase, setPassphrase] = useState('');
  const [bleState, setBleState] = useState<BleState>('idle');
  const [pendingTx, setPendingTx] = useState<PendingTx | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [localeMode, setLocaleMode] = useState('system');
  const [appLight, setAppLight] = useState(initialLightTheme);

  const setCurrentAccount = useCallback((chain: 'eth' | 'sol', idx: number) => {
    setCurrentChain(chain);
    setCurrentAcctIdx(idx);
  }, []);

  const addAccount = useCallback(async (chain: 'eth' | 'sol', path: string, custom: boolean) => {
    const updated = await serviceAddAccount(storage, chain, path, custom);
    if (updated) setAccounts(updated);
  }, [storage]);

  const removeAccount = useCallback(async (chain: 'eth' | 'sol', path: string) => {
    const updated = await serviceRemoveAccount(storage, chain, path);
    if (updated) setAccounts(updated);
  }, [storage]);

  const value = useMemo<AppCtx>(
    () => ({
      storage,
      accounts, setAccounts,
      currentChain, currentAcctIdx, setCurrentAccount,
      addAccount, removeAccount,
      generatedWords, setGeneratedWords,
      mnemonicEntropy, setMnemonicEntropy,
      mnemonicLang, setMnemonicLang,
      passphrase, setPassphrase,
      bleState, setBleState,
      pendingTx, setPendingTx,
      themeMode, setThemeMode,
      localeMode, setLocaleMode,
      appLight, setAppLight,
    }),
    [storage, accounts, currentChain, currentAcctIdx, generatedWords, mnemonicEntropy, mnemonicLang,
     passphrase, bleState, pendingTx, themeMode, localeMode, appLight,
     addAccount, removeAccount, setCurrentAccount],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside <AppProvider>');
  return c;
}
