import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme, useLocale } from '../../store/AppContext';
import { Fonts } from '../../lib/fonts';

type BleState = 'idle' | 'broadcasting' | 'connected' | 'error';

const CONFIG: Record<BleState, { title: string; sub: string; icon: string }> = {
  idle:         { title: 'BLE Standby',      sub: 'Tap button below to start',  icon: '📵' },
  broadcasting: { title: 'Broadcasting...',  sub: 'Waiting for OKX to connect', icon: '📡' },
  connected:    { title: 'Connected',         sub: 'OKX Device Active',          icon: '🔗' },
  error:        { title: 'Connection Failed', sub: 'Tap Retry to try again',     icon: '⚠️' },
};

const TROUBLESHOOT_TIPS = [
  '① Enable Bluetooth in system Settings',
  '② Allow Bluetooth permissions for this app',
  '③ Make sure Bluetooth is not used by another app',
  '④ Restart the app if the issue persists',
];

// BleStatus dispatches to the right variant — no hooks here, avoids conditional hook violations.
export default function BleStatus({ state, variant = 'card' }: { state: BleState; variant?: 'card' | 'row' }) {
  return variant === 'row' ? <BleStatusRow state={state} /> : <BleStatusCard state={state} />;
}

function BleStatusCard({ state }: { state: BleState }) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);

  const [displayState, setDisplayState] = useState<BleState>(state);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulse    = useRef(new Animated.Value(1)).current;
  const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (displayState === 'broadcasting') {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.6, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
        ]),
      );
      pulseAnimRef.current = anim;
      anim.start();
      return () => { anim.stop(); pulse.setValue(1); };
    } else {
      pulseAnimRef.current?.stop();
      pulse.setValue(1);
    }
  }, [displayState, pulse]);

  useEffect(() => {
    if (state === displayState) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true })
      .start(({ finished }) => {
        if (!finished) return;
        setDisplayState(state);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const c = CONFIG[displayState];
  const isActive = displayState === 'broadcasting' || displayState === 'connected';
  const isError  = displayState === 'error';

  return (
    <View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={[s.card, isActive && s.cardActive, isError && s.cardError]}>
          <View style={s.dotWrap}>
            {displayState === 'broadcasting' && (
              <Animated.View style={[s.dotPulse, { transform: [{ scale: pulse }] }]} />
            )}
            <View style={[s.dot, isActive && s.dotActive, isError && s.dotError]} />
          </View>
          <View style={s.textWrap}>
            <Text style={[s.title, isError && s.titleError]}>{c.title}</Text>
            <Text style={s.sub}>{c.sub}</Text>
          </View>
          <Text style={s.icon}>{c.icon}</Text>
        </View>

        {isError && (
          <View style={s.tipsCard}>
            <Text style={s.tipsTitle}>Troubleshooting</Text>
            {TROUBLESHOOT_TIPS.map((tip, i) => (
              <Text key={i} style={s.tipLine}>{tip}</Text>
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

function BleStatusRow({ state }: { state: BleState }) {
  const C = useTheme();
  const t = useLocale();
  const s = useMemo(() => makeRowStyles(C), [C]);
  const isConnected = state === 'connected';
  const isBroadcasting = state === 'broadcasting';
  const title = isConnected ? t.vault.bleConnected : isBroadcasting ? t.vault.bleBroadcasting : t.vault.bleStarting;
  const sub   = isConnected ? t.vault.bleConnectedSub : isBroadcasting ? t.vault.bleBroadcastingSub : t.vault.bleStartingSub;
  return (
    <View style={s.row}>
      {state === 'idle'
        ? <ActivityIndicator size="small" color={C.primary} />
        : <View style={[s.dot, isConnected && s.dotConnected]} />}
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.sub}>{sub}</Text>
      </View>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: R.xl,
    backgroundColor: C.surfaceContainer,
  },
  cardActive: {
    backgroundColor: C.primary8,
    borderWidth: 1, borderColor: C.primary25,
  },
  cardError: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.25)',
  },
  dotWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.text2 },
  dotActive: { backgroundColor: C.primary },
  dotError: { backgroundColor: '#DC2626' },
  dotPulse: {
    position: 'absolute', width: 10, height: 10,
    borderRadius: 5, backgroundColor: C.primary, opacity: 0.5,
  },
  textWrap: { flex: 1 },
  title: { color: C.text, fontSize: 13, fontFamily: Fonts.spaceGrotesk.bold, letterSpacing: 0.3 },
  titleError: { color: '#DC2626' },
  sub: { color: C.text2, fontSize: 11, marginTop: 2 },
  icon: { fontSize: 18 },
  tipsCard: {
    marginTop: 8, padding: 14, borderRadius: R.xl,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1, borderColor: C.borderVariant,
  },
  tipsTitle: { color: C.text, fontSize: 12, fontFamily: Fonts.spaceGrotesk.bold, marginBottom: 8, letterSpacing: 0.5 },
  tipLine: { color: C.text2, fontSize: 12, lineHeight: 20 },
});

const makeRowStyles = (C: ColorTokens) => StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.primary8, borderRadius: R.xl,
    padding: 14, borderWidth: 1, borderColor: C.primary25, marginBottom: 14,
  },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.primary, flexShrink: 0 },
  dotConnected: { backgroundColor: '#4caf50' },
  title: { color: C.text, fontSize: 14, fontFamily: Fonts.spaceGrotesk.bold },
  sub: { color: C.text2, fontSize: 12, marginTop: 2 },
});
