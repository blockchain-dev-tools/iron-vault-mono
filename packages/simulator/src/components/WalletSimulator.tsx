'use client';
import React from 'react';
import { NavProvider, type ScreenId } from '../lib/nav';
import { AppProvider } from '../lib/app-context';
import PhoneFrame from './PhoneFrame';
import P01 from './screens/P01';
import P02 from './screens/P02';
import P03 from './screens/P03';
import P04 from './screens/P04';
import P05 from './screens/P05';
import P06 from './screens/P06';
import P08 from './screens/P08';
import P09 from './screens/P09';
import P10 from './screens/P10';
import P11 from './screens/P11';
import { useNav } from '../lib/nav';
import type { WalletStorage } from '@iron-vault/wallet';

const SCREENS = {
  Welcome: P01, GenerateMnemonic: P02, VerifyMnemonic: P03, SetPin: P04, ImportMnemonic: P05,
  Vault: P06, Settings: P08, Unlock: P09, AccountDetail: P10, Transaction: P11,
};

function PhoneContent() {
  const { current, direction } = useNav();
  const Screen = SCREENS[current];
  const animClass =
    direction === 'forward' ? 'screen-enter-forward' :
    direction === 'back'    ? 'screen-enter-back' : '';

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
