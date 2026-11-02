import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
// @ts-expect-error react-dom ships without types in this project
import { createPortal } from 'react-dom';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { registerAlert } from '@/lib/alert';

export function AppAlert() {
  const theme = useTheme();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    registerAlert(setMessage);
    return () => registerAlert(null);
  }, []);

  if (message === null || typeof document === 'undefined') return null;

  const close = () => setMessage(null);

  return createPortal(
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      <View style={[styles.card, { backgroundColor: theme.background }]}>
        <ThemedText style={styles.message}>{message}</ThemedText>
        <Pressable
          onPress={close}
          style={({ pressed }) => [styles.ok, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
          <ThemedText style={styles.okLabel}>OK</ThemedText>
        </Pressable>
      </View>
    </View>,
    document.body,
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100000,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 500,
  },
  ok: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
