import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Modal, StatusBar, StyleSheet,
  TouchableOpacity, View, useColorScheme,
} from 'react-native';
import { useApp, useTheme } from '../../store/AppContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after the close animation finishes — use for post-close cleanup */
  onClosed?: () => void;
  children: React.ReactNode;
  maxHeight?: string | number;
}

export default function BottomSheet({ visible, onClose, onClosed, children, maxHeight = '80%' }: Props) {
  const C = useTheme();
  const { themeMode } = useApp();
  const systemScheme = useColorScheme();
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme !== 'light');

  const [modalVisible, setModalVisible] = useState(false);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      overlayAnim.setValue(0);
      sheetAnim.setValue(300);
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(sheetAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetAnim, { toValue: 300, duration: 250, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) {
          setModalVisible(false);
          onClosed?.();
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose}>
      {!isDark && <StatusBar backgroundColor="rgba(0,0,0,0.01)" barStyle="light-content" />}
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: overlayAnim }]} />
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[
          { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', maxHeight },
          { transform: [{ translateY: sheetAnim }] },
        ]}>
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 10 },
});
