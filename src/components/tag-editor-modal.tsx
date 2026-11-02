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

import { TagPill } from '@/components/tag-pill';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TagEditorModalProps = {
  visible: boolean;
  tags: string[];
  tone?: 'color' | 'neutral';
  onClose: () => void;
  onSave: (tags: string[]) => void;
};

export function TagEditorModal({ visible, tags, tone = 'color', onClose, onSave }: TagEditorModalProps) {
  const theme = useTheme();
  const [draft, setDraft] = useState(tags);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) {
      setDraft(tags);
      setValue('');
    }
  }, [tags, visible]);

  const handleAdd = () => {
    const next = value.trim();
    if (!next) return;
    const exists = draft.some((tag) => tag.toLowerCase() === next.toLowerCase());
    if (!exists) {
      setDraft((current) => [...current, next]);
    }
    setValue('');
  };

  const handleRemove = (index: number) => {
    setDraft((current) => current.filter((_, tagIndex) => tagIndex !== index));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.background }]}>
          <ThemedText style={styles.title}>Edit tags</ThemedText>
          <View style={styles.tags}>
            {draft.length === 0 ? (
              <ThemedText themeColor="textSecondary" type="small">
                No tags yet.
              </ThemedText>
            ) : (
              draft.map((tag, index) => (
                <TagPill key={`${tag}-${index}`} label={tag} tone={tone} onRemove={() => handleRemove(index)} />
              ))
            )}
          </View>
          <View style={styles.addRow}>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="Add tag"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
            <Pressable
              onPress={handleAdd}
              style={({ pressed }) => [styles.addButton, { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}>
              <ThemedText>Add</ThemedText>
            </Pressable>
          </View>
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <ThemedText themeColor="textSecondary">Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                onSave(draft);
                onClose();
              }}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <ThemedText style={styles.saveLabel}>Save</ThemedText>
            </Pressable>
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
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    minHeight: 28,
    alignItems: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    lineHeight: 22,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    minHeight: 42,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
});
