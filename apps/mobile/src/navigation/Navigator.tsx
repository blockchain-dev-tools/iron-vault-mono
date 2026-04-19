import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  PanResponder,
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
import BackupSeedScreen      from '../screens/BackupSeedScreen';
import EnigmaScreen          from '../screens/EnigmaScreen';
import EnigmaMnemonicScreen  from '../screens/EnigmaMnemonicScreen';

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
  BackupSeed:       BackupSeedScreen,
  Enigma:           EnigmaScreen,
  EnigmaMnemonic:   EnigmaMnemonicScreen,
} as const;

// Screens that show the persistent bottom navigation bar
const BOTTOM_NAV_SCREENS = new Set(['Vault', 'Settings']);

const EDGE_WIDTH = 40;
const SWIPE_VELOCITY_THRESHOLD = 0.5;

// Keep timing for fade-in on reset; spring for directional slides
const FADE_DURATION = 280;
const FADE_EASING = Easing.out(Easing.poly(4));

// Spring config for screen slide transitions
const SLIDE_IN_SPRING = { damping: 22, mass: 1, stiffness: 200, overshootClamping: true, useNativeDriver: true } as const;
const SLIDE_OUT_SPRING = { damping: 25, mass: 1, stiffness: 200, overshootClamping: true, useNativeDriver: true } as const;

export default function Navigator() {
  const { current: appCurrent, direction, goBack, canGoBack, previous, themeMode } = useApp();
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

  // Refs for PanResponder stale-closure safety
  const canGoBackRef = useRef(canGoBack);
  const previousRef  = useRef(previous);
  const widthRef     = useRef(width);
  useEffect(() => { canGoBackRef.current = canGoBack; }, [canGoBack]);
  useEffect(() => { previousRef.current = previous; },  [previous]);
  useEffect(() => { widthRef.current = width; },        [width]);

  // Gesture state
  const [gestureOutgoingEntry, setGestureOutgoingEntry] = useState<ScreenEntry | null>(null);
  const gestureActive      = useRef(false);
  const skipNextTransition = useRef(false);
  const transitionActive   = useRef(false);

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

    if (skipNextTransition.current) {
      skipNextTransition.current = false;
      setActiveEntry(incoming);
      setOutgoingEntry(null);
      setGestureOutgoingEntry(null);
      // Do NOT reset slideIn/slideOut here — that would snap the outgoing screen
      // back to center for one native frame before React unmounts it.
      // The next transition sets slideIn/slideOut to the correct start values.
      return;
    }

    transitionActive.current = true;

    const finish = () => {
      transitionActive.current = false;
      setOutgoingEntry(null);
      fadeAnim.setValue(1);
      // slideIn/slideOut are NOT reset here — resetting while outgoingEntry is
      // still set would snap the outgoing screen back to center for one native
      // frame before React unmounts it (visible flash). Each new transition
      // explicitly sets slideIn/slideOut to the correct start values instead.
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
      }).start(() => { finish(); });
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
      ]).start(() => { finish(); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appCurrent.name]);

  const panResponder = useRef(PanResponder.create({
    // Use onMoveShouldSetPanResponder only (no capture variant) so button taps
    // in the edge area are NOT intercepted — gesture activates only after
    // horizontal movement, letting TouchableOpacity etc. fire normally.
    onMoveShouldSetPanResponder: (_, g) =>
      !transitionActive.current && !gestureActive.current && canGoBackRef.current && !!previousRef.current && g.x0 < EDGE_WIDTH && g.dx > 8 && Math.abs(g.dy) < Math.abs(g.dx),

    onPanResponderGrant: () => {
      gestureActive.current = true;
      const w = widthRef.current;
      slideIn.setValue(0);
      slideOut.setValue(-w * 0.25);
      setGestureOutgoingEntry(previousRef.current);
    },

    onPanResponderMove: (_, g) => {
      const dx = Math.max(0, g.dx);
      const w = widthRef.current;
      slideIn.setValue(dx);
      slideOut.setValue(dx * 0.25 - w * 0.25);
    },

    onPanResponderRelease: (_, g) => {
      const dx = Math.max(0, g.dx);
      const w = widthRef.current;
      if (dx > w * 0.5 || g.vx > SWIPE_VELOCITY_THRESHOLD) {
        Animated.parallel([
          Animated.spring(slideIn,  { toValue: w, ...SLIDE_IN_SPRING }),
          Animated.spring(slideOut, { toValue: 0, ...SLIDE_OUT_SPRING }),
        ]).start(({ finished }) => {
          if (finished) {
            gestureActive.current = false;
            skipNextTransition.current = true;
            goBack();
          }
        });
      } else {
        Animated.parallel([
          Animated.spring(slideIn,  { toValue: 0,         ...SLIDE_IN_SPRING }),
          Animated.spring(slideOut, { toValue: -w * 0.25, ...SLIDE_OUT_SPRING }),
        ]).start(({ finished }) => {
          if (finished) {
            gestureActive.current = false;
            setGestureOutgoingEntry(null);
            slideOut.setValue(0);
          }
        });
      }
    },

    onPanResponderTerminate: () => {
      // System stole the gesture — reset immediately without animation
      gestureActive.current = false;
      setGestureOutgoingEntry(null);
      slideIn.setValue(0);
      slideOut.setValue(0);
    },
  })).current;

  const ActiveScreen = SCREENS[activeEntry.name];
  const showBottomNav = BOTTOM_NAV_SCREENS.has(activeEntry.name);

  const BehindEntry  = outgoingEntry || gestureOutgoingEntry;
  const BehindScreen = BehindEntry ? SCREENS[BehindEntry.name] : null;
  const isResetTransition = dirRef.current === 'reset' && outgoingEntry !== null;

  return (
    <View style={s.root}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={C.bg}
      />
      {/* Screen area — BottomNav lives outside so it never slides */}
      <View style={s.screenArea} {...panResponder.panHandlers}>
        {BehindScreen && (
          <Animated.View style={[
            StyleSheet.absoluteFill,
            isResetTransition
              ? { opacity: 0 }
              : { transform: [{ translateX: slideOut }] },
          ]}>
            <BehindScreen />
          </Animated.View>
        )}
        <Animated.View style={[
          StyleSheet.absoluteFill,
          BehindEntry
            ? isResetTransition
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
