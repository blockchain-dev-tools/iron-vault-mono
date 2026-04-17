'use client';
import React from 'react';
import { AppProvider, useApp, type ScreenId, type ThemeMode } from '../lib/app-context';
import PhoneFrame from './PhoneFrame';
import WelcomeScreen from './screens/WelcomeScreen';
import EntropyScreen from './screens/EntropyScreen';
import GenerateMnemonicScreen from './screens/GenerateMnemonicScreen';
import VerifyMnemonicScreen from './screens/VerifyMnemonicScreen';
import SetPinScreen from './screens/SetPinScreen';
import ImportMnemonicScreen from './screens/ImportMnemonicScreen';
import WalletManagerScreen from './screens/WalletManagerScreen';
import SettingsScreen from './screens/SettingsScreen';
import PinUnlockScreen from './screens/PinUnlockScreen';
import AccountDetailScreen from './screens/AccountDetailScreen';
import TransactionScreen from './screens/TransactionScreen';
import BackupSeedScreen from './screens/BackupSeedScreen';
import type { WalletStorage } from '@iron-vault/wallet';

const SCREENS: Record<ScreenId, React.ComponentType> = {
  Welcome: WelcomeScreen,
  Entropy: EntropyScreen,
  GenerateMnemonic: GenerateMnemonicScreen,
  VerifyMnemonic: VerifyMnemonicScreen,
  SetPin: SetPinScreen,
  ImportMnemonic: ImportMnemonicScreen,
  Vault: WalletManagerScreen,
  Settings: SettingsScreen,
  Unlock: PinUnlockScreen,
  AccountDetail: AccountDetailScreen,
  Transaction: TransactionScreen,
  BackupSeed: BackupSeedScreen,
};

function PhoneContent() {
  const { current, direction } = useApp();
  const Screen = SCREENS[current];
  const animClass =
    direction === 'forward' ? 'screen-enter-forward' :
    direction === 'back'    ? 'screen-enter-back'    :
    direction === 'reset'   ? 'screen-enter-reset'   : '';

  return (
    <div className="h-full max-w-md mx-auto relative bg-background overflow-hidden">
      <div key={current} className={animClass + ' h-full'}>
        <Screen />
      </div>
    </div>
  );
}

interface WalletSimulatorProps {
  storage: WalletStorage;
  initialScreen?: ScreenId;
  /** 'system' | 'light' | 'dark' — defaults to 'system' */
  initialTheme?: ThemeMode;
  style?: React.CSSProperties;
  className?: string;
}

export default function WalletSimulator({
  storage,
  initialScreen = 'Welcome',
  initialTheme = 'system',
  style,
  className,
}: WalletSimulatorProps) {
  return (
    <AppProvider storage={storage} initialScreen={initialScreen} initialTheme={initialTheme}>
      <PhoneFrame style={style} className={className}>
        <PhoneContent />
      </PhoneFrame>
    </AppProvider>
  );
}
