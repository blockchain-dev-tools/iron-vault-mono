'use client';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { WalletAccounts, WalletStorage } from '@iron-vault/wallet';
import { addAccount as serviceAddAccount, removeAccount as serviceRemoveAccount } from '@iron-vault/wallet';
import type { Bip39Language } from '@iron-vault/wallet';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemeMode = 'system' | 'light' | 'dark';
export type BleState = 'idle' | 'broadcasting' | 'connected' | 'error';
export type LocaleMode = 'system' | 'en' | 'zh' | 'ja' | 'ko';

export type ScreenId =
  | 'Welcome' | 'Entropy' | 'GenerateMnemonic' | 'VerifyMnemonic' | 'SetPin' | 'ImportMnemonic'
  | 'Vault' | 'Settings' | 'Unlock' | 'AccountDetail' | 'Transaction' | 'BackupSeed';

export type NavDirection = 'forward' | 'back' | 'reset';

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

const EMPTY_ACCOUNTS: WalletAccounts = { eth: [], sol: [], btc: [], tron: [], sui: [] };

// ─── Context interface ────────────────────────────────────────────────────────

interface AppCtx {
  current: ScreenId;
  direction: NavDirection;
  canGoBack: boolean;
  go: (id: ScreenId, dir?: NavDirection) => void;
  goBack: () => void;
  reset: (id: ScreenId) => void;

  // Wallet
  storage: WalletStorage;
  accounts: WalletAccounts;
  setAccounts: (a: WalletAccounts) => void;
  currentChain: 'eth' | 'sol';
  currentAcctIdx: number;
  setCurrentAccount: (chain: 'eth' | 'sol', idx: number) => void;
  addAccount: (chain: 'eth' | 'sol', path: string, custom: boolean) => Promise<void>;
  removeAccount: (chain: 'eth' | 'sol', path: string) => Promise<void>;

  // Mnemonic flow
  generatedWords: string[];
  setGeneratedWords: (w: string[]) => void;
  mnemonicEntropy: Uint8Array | null;
  setMnemonicEntropy: (e: Uint8Array | null) => void;
  mnemonicLang: Bip39Language;
  setMnemonicLang: (l: Bip39Language) => void;
  passphrase: string;
  setPassphrase: (p: string) => void;

  // BLE
  bleState: BleState;
  setBleState: (s: BleState) => void;
  pendingTx: PendingTx | null;
  setPendingTx: (tx: PendingTx | null) => void;

  // Appearance
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  localeMode: LocaleMode;
  setLocaleMode: (m: LocaleMode) => void;
}

const Ctx = createContext<AppCtx | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({
  children,
  storage,
  initialScreen = 'Welcome',
  initialTheme = 'system',
}: {
  children: React.ReactNode;
  storage: WalletStorage;
  initialScreen?: ScreenId;
  initialTheme?: ThemeMode;
}) {
  // Nav state
  const [history, setHistory] = useState<ScreenId[]>([]);
  const [current, setCurrent] = useState<ScreenId>(initialScreen);
  const [direction, setDirection] = useState<NavDirection>('reset');

  // Wallet state
  const [accounts, setAccounts] = useState<WalletAccounts>(EMPTY_ACCOUNTS);
  const [currentChain, setCurrentChain] = useState<'eth' | 'sol'>('eth');
  const [currentAcctIdx, setCurrentAcctIdx] = useState(0);
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [mnemonicEntropy, setMnemonicEntropy] = useState<Uint8Array | null>(null);
  const [mnemonicLang, setMnemonicLang] = useState<Bip39Language>('en');
  const [passphrase, setPassphrase] = useState('');

  // BLE state
  const [bleState, setBleState] = useState<BleState>('idle');
  const [pendingTx, setPendingTx] = useState<PendingTx | null>(null);

  // Appearance state
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme);
  const [localeMode, setLocaleMode] = useState<LocaleMode>('en');

  // ── Navigation ──────────────────────────────────────────────────────────────
  const go = useCallback((id: ScreenId, dir: NavDirection = 'forward') => {
    setDirection(dir);
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

  // ── Account helpers ──────────────────────────────────────────────────────────
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

  // ── Context value ────────────────────────────────────────────────────────────
  const value = useMemo<AppCtx>(
    () => ({
      current, direction, canGoBack: history.length > 0,
      go, goBack, reset,
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
    }),
    [
      current, direction, history,
      storage, accounts, currentChain, currentAcctIdx,
      generatedWords, mnemonicEntropy, mnemonicLang,
      passphrase, bleState, pendingTx, themeMode, localeMode,
      go, goBack, reset, addAccount, removeAccount, setCurrentAccount,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside <AppProvider>');
  return c;
}
