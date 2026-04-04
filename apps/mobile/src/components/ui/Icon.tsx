import React from 'react';
import { Text } from 'react-native';

// Glyph map from the installed package (font file is in android/app/src/main/assets/fonts/)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const glyphMap: Record<string, number> = require('react-native-vector-icons/glyphmaps/MaterialIcons.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mciGlyphMap: Record<string, number> = require('react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json');

// Maps Material Symbols names (prototype) → MaterialIcons names where they differ
const MAP: Record<string, string> = {
  shield: 'security',
  sensors: 'bluetooth',
  token: 'toll',
  bolt: 'flash-on',
  file_upload: 'upload',
  draw: 'edit',
};

interface Props {
  name: string;
  size?: number;
  color?: string;
}

export default function Icon({ name, size = 24, color = '#fff' }: Props) {
  // mci: prefix → MaterialCommunityIcons font
  if (name.startsWith('mci:')) {
    const codepoint = mciGlyphMap[name.slice(4)];
    if (!codepoint) return null;
    return (
      <Text style={{ fontFamily: 'MaterialCommunityIcons', fontSize: size, color, lineHeight: size * 1.25 }}>
        {String.fromCodePoint(codepoint)}
      </Text>
    );
  }
  // glyph map uses hyphens for multi-word names (e.g. arrow-back, check-circle)
  const normalized = (MAP[name] ?? name).replace(/_/g, '-');
  const codepoint = glyphMap[normalized];
  if (!codepoint) return null;
  return (
    <Text style={{ fontFamily: 'MaterialIcons', fontSize: size, color, lineHeight: size * 1.25 }}>
      {String.fromCodePoint(codepoint)}
    </Text>
  );
}
