import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../store/AppContext';

interface SectionLabelProps {
  children: React.ReactNode;
  error?: boolean;
}

export default function SectionLabel({ children, error }: SectionLabelProps) {
  const C = useTheme();
  return (
    <Text style={{
      color: error ? C.error : C.text2,
      fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 10,
    }}>
      {String(children).toUpperCase()}
    </Text>
  );
}
