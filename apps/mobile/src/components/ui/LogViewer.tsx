import React, { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { R } from '@iron-vault/theme';
import type { ColorTokens } from '@iron-vault/theme';
import { useTheme } from '../../store/AppContext';

interface LogEntry { time: string; msg: string }

export default function LogViewer({
  logs,
  emptyText,
  height,
  maxHeight = 140,
}: {
  logs: LogEntry[];
  emptyText?: string;
  height?: number;
  maxHeight?: number;
}) {
  const C = useTheme();
  const s = useMemo(() => makeStyles(C), [C]);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={[s.box, height !== undefined ? { height } : { maxHeight }]}>
      <ScrollView
        ref={scrollRef}
        onContentSizeChange={height !== undefined ? () => scrollRef.current?.scrollToEnd({ animated: true }) : undefined}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {logs.length === 0 && emptyText ? (
          <Text style={s.empty}>{emptyText}</Text>
        ) : (
          logs.map((l, i) => (
            <Text key={i} style={s.line}>
              <Text style={s.time}>{l.time} </Text>{l.msg}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: ColorTokens) => StyleSheet.create({
  box: { backgroundColor: C.surfaceContainer, borderRadius: R.lg, padding: 12 },
  line: { color: C.text2, fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
  time: { color: C.textDisabled },
  empty: { color: C.textDisabled, fontSize: 12, textAlign: 'center', marginTop: 16 },
});
