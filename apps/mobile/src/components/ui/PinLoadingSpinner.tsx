import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const SIZE = 64;
const STROKE = 3;
const R = 30;
const CIRCUMFERENCE = 2 * Math.PI * R; // ~188.5
const ARC = CIRCUMFERENCE * 0.75;      // ~141 — 270° arc, 90° gap

interface Props { color: string }

export default function PinLoadingSpinner({ color }: Props) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Svg width={SIZE} height={SIZE}>
        {/* Track */}
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          stroke={color} strokeWidth={STROKE} strokeOpacity={0.2} fill="none"
        />
        {/* Arc */}
        <Circle
          cx={SIZE / 2} cy={SIZE / 2} r={R}
          stroke={color} strokeWidth={STROKE}
          strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
          strokeLinecap="round" fill="none"
        />
      </Svg>
    </Animated.View>
  );
}
