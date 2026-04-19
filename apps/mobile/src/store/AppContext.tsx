import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WalletAccounts } from '@iron-vault/wallet';
import { addAccount as serviceAddAccount, removeAccount as serviceRemoveAccount } from '@iron-vault/wallet';
import type { Bip39Language } from '@iron-vault/wallet';
import { DARK, LIGHT } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { resolveTranslations } from '../i18n';
import type { LocaleMode, Translations } from '../i18n';
import { walletStorage } from '../lib/storage';

export type ThemeMode = 'system' | 'light' | 'dark';
export type { LocaleMode };
const THEME_KEY = 'app.theme';
const LOCALE_KEY = 'app.locale';

export type ScreenName =
  | 'Welcome' | 'Entropy' | 'GenerateMnemonic' | 'VerifyMnemonic' | 'SetPin' | 'ImportMnemonic'
  | 'Enigma' | 'EnigmaMnemonic'
  | 'Vault' | 'Settings' | 'Unlock' | 'AccountDetail' | 'Transaction' | 'BackupSeed';

export interface ScreenEntry {
  name: ScreenName;
  params?: Record<string, unknown>;
}

export type NavDirection = 'forward' | 'back' | 'reset';
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

interface AppCtx {
  current: ScreenEntry;
  direction: NavDirection;
  go: (name: ScreenName, dir?: NavDirection, params?: Record<string, unknown>) => void;
  goBack: () => void;
  reset: (name: ScreenName) => void;
  canGoBack: boolean;
  previous: ScreenEntry | null;
  accounts: WalletAccounts;
  setAccounts: (a: WalletAccounts) => void;
  generatedWords: string[];
  setGeneratedWords: (w: string[]) => void;
  mnemonicEntropy: Uint8Array | null;
  setMnemonicEntropy: (e: Uint8Array | null) => void;
  mnemonicLang: Bip39Language;
  setMnemonicLang: (l: Bip39Language) => void;
  passphrase: string;
  setPassphrase: (p: string) => void;
  currentChain: 'eth' | 'sol';
  currentAcctIdx: number;
  setCurrentAccount: (chain: 'eth' | 'sol', idx: number) => void;
  addAccount: (chain: 'eth' | 'sol', path: string, custom: boolean) => Promise<void>;
  removeAccount: (chain: 'eth' | 'sol', path: string) => Promise<void>;
  bleState: BleState;
  setBleState: (s: BleState) => void;
  pendingTx: PendingTx | null;
  setPendingTx: (tx: PendingTx | null) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  localeMode: LocaleMode;
  setLocaleMode: (mode: LocaleMode) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be inside AppProvider');
  return c;
}

export function useTheme(): ColorTokens {
  const { themeMode } = useApp();
  const systemScheme = useColorScheme();
  if (themeMode === 'light') return LIGHT;
  if (themeMode === 'dark') return DARK;
  return systemScheme === 'light' ? LIGHT : DARK;
}

export function useLocale(): Translations {
  const { localeMode } = useApp();
  return useMemo(() => resolveTranslations(localeMode), [localeMode]);
}

const EMPTY_ACCOUNTS: WalletAccounts = { eth: [], sol: [] };
const AUTO_LOCK_MS = 5 * 60 * 1000; // 5 minutes

// Screens that require wallet lock when resuming after timeout
const PROTECTED_SCREENS: ScreenName[] = ['Vault', 'Settings', 'AccountDetail', 'Transaction', 'GenerateMnemonic', 'VerifyMnemonic', 'SetPin', 'Enigma'];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<ScreenEntry[]>([{ name: 'Welcome' }]);
  const [direction, setDirection] = useState<NavDirection>('reset');
  const [accounts, setAccounts] = useState<WalletAccounts>(EMPTY_ACCOUNTS);
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  const [mnemonicEntropy, setMnemonicEntropy] = useState<Uint8Array | null>(null);
  const [mnemonicLang, setMnemonicLang] = useState<Bip39Language>('en');
  const [passphrase, setPassphrase] = useState('');
  const [currentChain, setCurrentChain] = useState<'eth' | 'sol'>('eth');
  const [currentAcctIdx, setCurrentAcctIdx] = useState(0);
  const [bleState, setBleState] = useState<BleState>('idle');
  const [pendingTx, setPendingTx] = useState<PendingTx | null>(null);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [localeMode, setLocaleModeState] = useState<LocaleMode>('system');

  // Refs for accessing latest values inside stable effects
  const stackRef = useRef(stack);
  const accountsRef = useRef(accounts);
  useEffect(() => { stackRef.current = stack; }, [stack]);
  useEffect(() => { accountsRef.current = accounts; }, [accounts]);

  // ── Auto-lock: lock wallet after 5 min in background ──────────────────────
  const backgroundedAt = useRef<number | null>(null);
  useEffect(() => {
    const sub = AppState.addEventListener('change', appState => {
      if (appState === 'background' || appState === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (appState === 'active') {
        if (backgroundedAt.current !== null) {
          const elapsed = Date.now() - backgroundedAt.current;
          backgroundedAt.current = null;
          if (elapsed >= AUTO_LOCK_MS) {
            const currentScreen = stackRef.current[stackRef.current.length - 1].name;
            const hasWalletData =
              accountsRef.current.eth.length > 0 || accountsRef.current.sol.length > 0;
            if (hasWalletData && (PROTECTED_SCREENS as string[]).includes(currentScreen)) {
              setAccounts(EMPTY_ACCOUNTS);
              setDirection('reset');
              setStack([{ name: 'Unlock' }]);
            }
          }
        }
      }
    });
    return () => sub.remove();
  }, []); // stable: setters are from useState (never change) + refs

  useEffect(() => {
    AsyncStorage.multiGet([THEME_KEY, LOCALE_KEY]).then(pairs => {
      const saved = Object.fromEntries(pairs);
      const t = saved[THEME_KEY];
      if (t === 'light' || t === 'dark' || t === 'system') setThemeModeState(t);
      const l = saved[LOCALE_KEY];
      if (l === 'en' || l === 'zh' || l === 'ja' || l === 'ko' || l === 'system') setLocaleModeState(l);
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_KEY, mode);
  }, []);

  const setLocaleMode = useCallback((mode: LocaleMode) => {
    setLocaleModeState(mode);
    AsyncStorage.setItem(LOCALE_KEY, mode);
  }, []);

  const current = stack[stack.length - 1];
  const canGoBack = stack.length > 1;
  const previous = stack.length > 1 ? stack[stack.length - 2] : null;

  const go = useCallback((name: ScreenName, dir: NavDirection = 'forward', params?: Record<string, unknown>) => {
    setDirection(dir);
    setStack(prev => [...prev, { name, params }]);
  }, []);

  const goBack = useCallback(() => {
    setDirection('back');
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback((name: ScreenName) => {
    setDirection('reset');
    setStack([{ name }]);
  }, []);

  const setCurrentAccount = useCallback((chain: 'eth' | 'sol', idx: number) => {
    setCurrentChain(chain);
    setCurrentAcctIdx(idx);
  }, []);

  const addAccount = useCallback(async (chain: 'eth' | 'sol', path: string, custom: boolean) => {
    const updated = await serviceAddAccount(walletStorage, chain, path, custom);
    if (updated) setAccounts(updated);
  }, []);

  const removeAccount = useCallback(async (chain: 'eth' | 'sol', path: string) => {
    const updated = await serviceRemoveAccount(walletStorage, chain, path);
    if (updated) setAccounts(updated);
  }, []);

  const value = useMemo<AppCtx>(
    () => ({
      current, direction, go, goBack, reset, canGoBack, previous,
      accounts, setAccounts,
      generatedWords, setGeneratedWords,
      mnemonicEntropy, setMnemonicEntropy,
      mnemonicLang, setMnemonicLang,
      passphrase, setPassphrase,
      currentChain, currentAcctIdx, setCurrentAccount,
      addAccount,
      removeAccount,
      bleState, setBleState,
      pendingTx, setPendingTx,
      themeMode, setThemeMode,
      localeMode, setLocaleMode,
    }),
    [current, direction, canGoBack, previous, accounts, generatedWords, mnemonicEntropy, mnemonicLang, passphrase,
     currentChain, currentAcctIdx, bleState, pendingTx, themeMode, localeMode,
     addAccount, removeAccount],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
