import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { Text, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/store/AppContext';
import Navigator from './src/navigation/Navigator';
import { hasWallet } from '@iron-vault/wallet';
import { walletStorage } from './src/lib/storage';

// Global default font — applies to all <Text> unless overridden by fontFamily
if (!Text.defaultProps) (Text as any).defaultProps = {};
(Text as any).defaultProps.style = { fontFamily: 'SpaceGrotesk_400Regular' };

function AppRoot() {
  const { reset } = useApp();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hasWallet(walletStorage).then(has => {
      reset(has ? 'Unlock' : 'Welcome');
      setReady(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;
  return <Navigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppRoot />
      </AppProvider>
    </SafeAreaProvider>
  );
}