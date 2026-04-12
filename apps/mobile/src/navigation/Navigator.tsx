import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  StatusBar,
  StyleSheet,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { useApp, useTheme } from '../store/AppContext';
import type { ScreenEntry } from '../store/AppContext';
import type { ColorTokens } from '@iron-vault/theme';
import BottomNav from '../components/ui/BottomNav';

import WelcomeScreen          from '../screens/WelcomeScreen';
import GenerateMnemonicScreen from '../screens/GenerateMnemonicScreen';
import VerifyMnemonicScreen   from '../screens/VerifyMnemonicScreen';
import SetPinScreen           from '../screens/SetPinScreen';
import ImportMnemonicScreen   from '../screens/ImportMnemonicScreen';
import WalletManagerScreen    from '../screens/WalletManagerScreen';
import SettingsScreen         from '../screens/SettingsScreen';
import PinUnlockScreen        from '../screens/PinUnlockScreen';
import AccountDetailScreen    from '../screens/AccountDetailScreen';
import TransactionScreen      from '../screens/TransactionScreen';
import EntropyScreen         from '../screens/EntropyScreen';

const SCREENS = {
  Welcome:          WelcomeScreen,
  Entropy:          EntropyScreen,
  GenerateMnemonic: GenerateMnemonicScreen,
  VerifyMnemonic:   VerifyMnemonicScreen,
  SetPin:           SetPinScreen,
  ImportMnemonic:   ImportMnemonicScreen,
  Vault:            WalletManagerScreen,
  Settings:         SettingsScreen,
  Unlock:           PinUnlockScreen,
  AccountDetail:    AccountDetailScreen,
  Transaction:      TransactionScreen,
} as const;

// Screens that show the persistent bottom navigation bar
const BOTTOM_NAV_SCREENS = new Set(['Vault', 'Settings', 'AccountDetail']);

// Keep timing for fade-in on reset; spring for directional slides
const FADE_DURATION = 280;
const FADE_EASING = Easing.out(Easing.poly(4));

// Spring config for screen slide transitions
const SLIDE_IN_SPRING = { damping: 22, mass: 1, stiffness: 200, overshootClamping: true, useNativeDriver: true } as const;
const SLIDE_OUT_SPRING = { damping: 25, mass: 1, stiffness: 200, overshootClamping: true, useNativeDriver: true } as const;

export default function Navigator() {
  const { current: appCurrent, direction, goBack, canGoBack, themeMode } = useApp();
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const { width } = useWindowDimensions();
  const systemScheme = useColorScheme();

  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemScheme !== 'light');

  const [activeEntry, setActiveEntry] = useState<ScreenEntry>(appCurrent);
  const [outgoingEntry, setOutgoingEntry] = useState<ScreenEntry | null>(null);
  const dirRef = useRef(direction);

  const slideIn  = useRef(new Animated.Value(0)).current;
  const slideOut = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) { goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack, goBack]);

  useEffect(() => {
    if (appCurrent.name === activeEntry.name) return;

    const snap = activeEntry;
    const incoming = appCurrent;
    const dir = direction;
    dirRef.current = dir;

    const finish = () => {
      setOutgoingEntry(null);
      slideIn.setValue(0);
      slideOut.setValue(0);
      fadeAnim.setValue(1);
    };

    if (dir === 'reset') {
      // Fade-in for auth resets — spring not meaningful for opacity
      fadeAnim.setValue(0);
      setOutgoingEntry(snap);
      setActiveEntry(incoming);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_DURATION,
        easing: FADE_EASING,
        useNativeDriver: true,
      }).start(({ finished }) => { if (finished) finish(); });
    } else {
      // Spring slide for forward/back navigation
      const forward = dir === 'forward';
      slideIn.setValue(forward ? width : -width);
      slideOut.setValue(0);
      setOutgoingEntry(snap);
      setActiveEntry(incoming);
      Animated.parallel([
        Animated.spring(slideIn, {
          toValue: 0,
          ...SLIDE_IN_SPRING,
        }),
        Animated.spring(slideOut, {
          toValue: forward ? -width * 0.25 : width,
          ...SLIDE_OUT_SPRING,
        }),
      ]).start(({ finished }) => { if (finished) finish(); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appCurrent.name]);

  const ActiveScreen   = SCREENS[activeEntry.name];
  const OutgoingScreen = outgoingEntry ? SCREENS[outgoingEntry.name] : null;
  const showBottomNav  = BOTTOM_NAV_SCREENS.has(activeEntry.name);

  return (
    <View style={s.root}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={C.bg}
      />
      {/* Screen area — BottomNav lives outside so it never slides */}
      <View style={s.screenArea}>
        {OutgoingScreen && (
          <Animated.View style={[
            StyleSheet.absoluteFill,
            dirRef.current === 'reset'
              ? { opacity: 0 }
              : { transform: [{ translateX: slideOut }] },
          ]}>
            <OutgoingScreen />
          </Animated.View>
        )}
        <Animated.View style={[
          StyleSheet.absoluteFill,
          outgoingEntry
            ? dirRef.current === 'reset'
              ? { opacity: fadeAnim }
              : { transform: [{ translateX: slideIn }] }
            : undefined,
        ]}>
          <ActiveScreen />
        </Animated.View>
      </View>
      {showBottomNav && <BottomNav />}
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  screenArea: { flex: 1 },
});
