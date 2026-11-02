import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ClipboardPasteControl } from '@/components/clipboard-paste-control';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextEditorModalProps = {
  visible: boolean;
  title: string;
  initialValue: string;
  placeholder?: string;
  saveLabel?: string;
  showPaste?: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
};

export function TextEditorModal({
  visible,
  title,
  initialValue,
  placeholder = 'Enter text',
  saveLabel = 'Save',
  showPaste = false,
  onClose,
  onSave,
}: TextEditorModalProps) {
  const theme = useTheme();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [initialValue, visible]);

  const canSave = value.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            multiline
            autoFocus
            textAlignVertical="top"
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
              },
            ]}
          />
          <View style={styles.actions}>
            {showPaste ? (
              <ClipboardPasteControl
                onPaste={setValue}
                width={76}
                height={32}
                backgroundColor={theme.backgroundElement}
                foregroundColor={theme.text}
                displayMode="labelOnly"
                cornerStyle="capsule"
                filledFallback={false}
              />
            ) : (
              <View />
            )}
            <View style={styles.actionGroup}>
              <Pressable onPress={onClose} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
                <ThemedText themeColor="textSecondary">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => onSave(value.trim())}
                disabled={!canSave}
                style={({ pressed }) => [styles.action, pressed && styles.pressed, !canSave && styles.disabled]}>
                <ThemedText style={styles.saveLabel}>{saveLabel}</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
  },
  input: {
    minHeight: 120,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  action: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  saveLabel: {
    color: '#2B7FFF',
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.35,
  },
});
