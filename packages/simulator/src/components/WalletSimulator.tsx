'use client';
import React from 'react';
import { NavProvider, type ScreenId } from '../lib/nav';
import { AppProvider } from '../lib/app-context';
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
import { useNav } from '../lib/nav';
import type { WalletStorage } from '@iron-vault/wallet';

const SCREENS = {
  Welcome: WelcomeScreen, Entropy: EntropyScreen,
  GenerateMnemonic: GenerateMnemonicScreen, VerifyMnemonic: VerifyMnemonicScreen,
  SetPin: SetPinScreen, ImportMnemonic: ImportMnemonicScreen,
  Vault: WalletManagerScreen, Settings: SettingsScreen, Unlock: PinUnlockScreen,
  AccountDetail: AccountDetailScreen, Transaction: TransactionScreen,
  BackupSeed: BackupSeedScreen,
};

function PhoneContent() {
  const { current, direction } = useNav();
  const Screen = SCREENS[current];
  const animClass =
    direction === 'forward' ? 'screen-enter-forward' :
    direction === 'back'    ? 'screen-enter-back'    :
    direction === 'reset'   ? 'screen-enter-reset'   : '';

  return (
    <div className="h-full max-w-md mx-auto relative bg-background overflow-hidden">
      <div key={current} className={animClass + " h-full"}>
        <Screen />
      </div>
    </div>
  );
}

interface WalletSimulatorProps {
  storage: WalletStorage;
  initialScreen?: ScreenId;
  lightTheme?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function WalletSimulator({
  storage,
  initialScreen = 'Welcome',
  lightTheme = false,
  style,
  className,
}: WalletSimulatorProps) {
  return (
    <AppProvider storage={storage} initialLightTheme={lightTheme}>
      <NavProvider initialScreen={initialScreen}>
        <PhoneFrame style={style} className={className}>
          <PhoneContent />
        </PhoneFrame>
      </NavProvider>
    </AppProvider>
  );
}
