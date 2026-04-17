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
  const [active, setActive] = React.useState(current);
  const [outgoing, setOutgoing] = React.useState<ScreenId | null>(null);
  const [transitioning, setTransitioning] = React.useState(false);
  const dirRef = React.useRef(direction);

  React.useEffect(() => {
    if (current === active) return;
    dirRef.current = direction;
    setOutgoing(active);
    setActive(current);
    setTransitioning(true);
    const t = setTimeout(() => {
      setOutgoing(null);
      setTransitioning(false);
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const dir = dirRef.current;
  const enterClass =
    dir === 'forward' ? 'screen-enter-forward' :
    dir === 'back'    ? 'screen-enter-back'    :
    'screen-enter-reset';
  const exitClass =
    dir === 'forward' ? 'screen-exit-forward' :
    dir === 'back'    ? 'screen-exit-back'    :
    '';

  const ActiveScreen = SCREENS[active];
  const OutgoingScreen = outgoing ? SCREENS[outgoing] : null;

  return (
    <div className="h-full max-w-md mx-auto relative overflow-hidden" style={{ background: 'var(--c-background)' }}>
      {OutgoingScreen && transitioning && (
        <div key={outgoing + '-exit'} className={exitClass + ' absolute inset-0 h-full'}>
          <OutgoingScreen />
        </div>
      )}
      <div key={active} className={(outgoing ? enterClass : '') + ' absolute inset-0 h-full'}>
        <ActiveScreen />
      </div>
    </div>
  );
}

interface WalletSimulatorProps {
  storage: WalletStorage;
  initialScreen?: ScreenId;
  initialTheme?: ThemeMode;
  lightTheme?: boolean;
  showChrome?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function WalletSimulator({
  storage,
  initialScreen = 'Welcome',
  initialTheme = 'system',
  lightTheme,
  showChrome = true,
  style,
  className,
}: WalletSimulatorProps) {
  const resolvedTheme: ThemeMode =
    lightTheme === true  ? 'light' :
    lightTheme === false ? 'dark'  :
    initialTheme;

  return (
    <AppProvider storage={storage} initialScreen={initialScreen} initialTheme={resolvedTheme}>
      <PhoneFrame style={style} className={className} showChrome={showChrome}>
        <PhoneContent />
      </PhoneFrame>
    </AppProvider>
  );
}
