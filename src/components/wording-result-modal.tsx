import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type WordingResultModalProps = {
  visible: boolean;
  text: string;
  loading?: boolean;
  onClose: () => void;
  onRetry: () => void;
};

export function WordingResultModal({ visible, text, loading = false, onClose, onRetry }: WordingResultModalProps) {
  const theme = useTheme();
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background, maxHeight: height * 0.7 }]}>
          <ScrollView
            style={[styles.result, { maxHeight: height * 0.5 }]}
            contentContainerStyle={styles.resultContent}
            keyboardShouldPersistTaps="handled">
            <ThemedText selectable style={styles.resultText}>
              {text}
            </ThemedText>
          </ScrollView>
          <Pressable
            onPress={onRetry}
            disabled={loading}
            style={({ pressed }) => [
              styles.retry,
              { backgroundColor: theme.backgroundElement },
              pressed && !loading && styles.pressed,
            ]}>
            {loading ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <>
                <Ionicons name="color-wand-outline" size={18} color={theme.text} />
                <ThemedText style={styles.retryLabel}>Retry</ThemedText>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  result: {
    flexGrow: 0,
  },
  resultContent: {
    flexGrow: 1,
  },
  resultText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: 500,
  },
  retry: {
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  retryLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
