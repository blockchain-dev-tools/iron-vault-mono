import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Line, Rect } from 'react-native-svg';

export default function BgLines({ color }: { color: string }) {
  return (
    <Svg style={StyleSheet.absoluteFill} opacity={0.025}>
      <Defs>
        <Pattern id="diag" x="0" y="0" width="57" height="57" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Line x1="0" y1="0" x2="0" y2="57" stroke={color} strokeWidth="1" />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#diag)" />
    </Svg>
  );
}
