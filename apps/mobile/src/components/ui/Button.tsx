import React, { useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';
import Icon from './Icon';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline-danger';

interface ButtonProps {
  variant?: Variant;
  icon?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

function getVariants(C: ColorTokens): Record<Variant, { bg: string; text: string; border?: string }> {
  return {
    primary:          { bg: C.primary,         text: C.onPrimary },
    secondary:        { bg: C.surfaceContainer, text: C.text, border: C.border },
    danger:           { bg: '#D32F2F',            text: '#FFFFFF' },
    ghost:            { bg: 'transparent',      text: C.text2, border: C.border },
    'outline-danger': { bg: 'transparent',      text: C.error, border: C.error },
  };
}

// Spring config for button press/release
const PRESS_SPRING   = { damping: 12, mass: 0.3, stiffness: 400, useNativeDriver: true } as const;
const RELEASE_SPRING = { damping: 10, mass: 0.3, stiffness: 350, useNativeDriver: true } as const;

export default function Button({ variant = 'primary', icon, onPress, disabled, loading, children, style }: ButtonProps) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const v = getVariants(C)[variant];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, { toValue: 0.95, ...PRESS_SPRING }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, ...RELEASE_SPRING }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], width: '100%' }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[
          s.btn,
          { backgroundColor: v.bg, borderColor: v.border ?? 'transparent', borderWidth: v.border ? 1.5 : 0 },
          (disabled || loading) && s.btnDisabled,
        ]}>
        {loading ? (
          <ActivityIndicator color={v.text} />
        ) : (
          <>
            {icon && <Icon name={icon} size={18} color={v.text} />}
            <Text style={[s.text, { color: v.text }]}>{children}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, paddingHorizontal: 24,
    borderRadius: R.xl, width: '100%',
  },
  btnDisabled: { opacity: 0.4 },
  text: { fontSize: 16, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
});