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
import { clampRgbChannel, randomTagRgb, rgbToCss } from '@/lib/tag-color';
import type { TagRgb } from '@/types/app';

type TagEditorModalProps = {
  visible: boolean;
  tags: string[];
  tagColors?: Record<string, TagRgb>;
  tone?: 'color' | 'neutral';
  onClose: () => void;
  onSave: (tags: string[], tagColors: Record<string, TagRgb>) => void;
};

function channelToText(value: number): string {
  return String(clampRgbChannel(value));
}

function parseChannelInput(text: string): number {
  const parsed = Number(text.replace(/[^\d]/g, ''));
  if (!Number.isFinite(parsed)) return 1;
  return clampRgbChannel(parsed);
}

export function TagEditorModal({
  visible,
  tags,
  tagColors = {},
  tone = 'color',
  onClose,
  onSave,
}: TagEditorModalProps) {
  const theme = useTheme();
  const showColors = tone === 'color';
  const [draft, setDraft] = useState(tags);
  const [draftColors, setDraftColors] = useState<Record<string, TagRgb>>(tagColors);
  const [value, setValue] = useState('');
  const [activeTagKey, setActiveTagKey] = useState<string | null>(null);
  const [rgb, setRgb] = useState<TagRgb>(() => randomTagRgb());
  const [rText, setRText] = useState(() => channelToText(rgb.r));
  const [gText, setGText] = useState(() => channelToText(rgb.g));
  const [bText, setBText] = useState(() => channelToText(rgb.b));

  const syncRgbFields = (next: TagRgb) => {
    setRgb(next);
    setRText(channelToText(next.r));
    setGText(channelToText(next.g));
    setBText(channelToText(next.b));
  };

  const currentColor = (): TagRgb => ({
    r: parseChannelInput(rText),
    g: parseChannelInput(gText),
    b: parseChannelInput(bText),
  });

  const applyColorToTag = (key: string, color: TagRgb) => {
    setDraftColors((current) => ({ ...current, [key]: color }));
  };

  useEffect(() => {
    if (visible) {
      setDraft(tags);
      setDraftColors(tagColors);
      setValue('');
      setActiveTagKey(null);
      const next = randomTagRgb();
      syncRgbFields(next);
    }
  }, [tags, tagColors, visible]);

  const handleAdd = () => {
    const next = value.trim();
    if (!next) return;
    const key = next.toLowerCase();
    const exists = draft.some((tag) => tag.toLowerCase() === key);
    if (!exists) {
      setDraft((current) => [...current, next]);
    }
    if (showColors) {
      const color = currentColor();
      applyColorToTag(key, color);
      setActiveTagKey(key);
    }
    setValue('');
  };

  const handleRemove = (index: number) => {
    const removed = draft[index];
    setDraft((current) => current.filter((_, tagIndex) => tagIndex !== index));
    if (removed && activeTagKey === removed.toLowerCase()) {
      setActiveTagKey(null);
    }
  };

  const handleSelectTagColor = (tag: string) => {
    if (!showColors) return;
    const key = tag.toLowerCase();
    setActiveTagKey(key);
    const stored = draftColors[key];
    if (stored) {
      syncRgbFields(stored);
      return;
    }
    const next = randomTagRgb();
    syncRgbFields(next);
    applyColorToTag(key, next);
  };

  const handleRandomColor = () => {
    const next = randomTagRgb();
    syncRgbFields(next);
    if (activeTagKey) {
      applyColorToTag(activeTagKey, next);
    }
  };

  const commitChannel = (channel: 'r' | 'g' | 'b', text: string) => {
    const nextValue = parseChannelInput(text);
    const next = { ...currentColor(), [channel]: nextValue };
    setRgb(next);
    if (channel === 'r') setRText(channelToText(nextValue));
    if (channel === 'g') setGText(channelToText(nextValue));
    if (channel === 'b') setBText(channelToText(nextValue));
    if (activeTagKey) {
      applyColorToTag(activeTagKey, next);
    }
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
                <TagPill
                  key={`${tag}-${index}`}
                  label={tag}
                  tone={tone}
                  selected={showColors && activeTagKey === tag.toLowerCase()}
                  customColor={showColors ? (draftColors[tag.toLowerCase()] ?? null) : null}
                  onPress={showColors ? () => handleSelectTagColor(tag) : undefined}
                  onRemove={() => handleRemove(index)}
                />
              ))
            )}
          </View>

          {showColors ? (
            <ThemedText type="small" themeColor="textSecondary">
              Set RGB, then Add — or tap a tag to recolor it.
            </ThemedText>
          ) : null}

          {showColors ? (
            <View style={styles.colorRow}>
              <View style={[styles.swatch, { backgroundColor: rgbToCss(currentColor()) }]} />
              <View style={styles.channelField}>
                <ThemedText type="small" themeColor="textSecondary">
                  R
                </ThemedText>
                <TextInput
                  value={rText}
                  onChangeText={setRText}
                  onBlur={() => commitChannel('r', rText)}
                  keyboardType="number-pad"
                  maxLength={3}
                  style={[styles.channelInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />
              </View>
              <View style={styles.channelField}>
                <ThemedText type="small" themeColor="textSecondary">
                  G
                </ThemedText>
                <TextInput
                  value={gText}
                  onChangeText={setGText}
                  onBlur={() => commitChannel('g', gText)}
                  keyboardType="number-pad"
                  maxLength={3}
                  style={[styles.channelInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />
              </View>
              <View style={styles.channelField}>
                <ThemedText type="small" themeColor="textSecondary">
                  B
                </ThemedText>
                <TextInput
                  value={bText}
                  onChangeText={setBText}
                  onBlur={() => commitChannel('b', bText)}
                  keyboardType="number-pad"
                  maxLength={3}
                  style={[styles.channelInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />
              </View>
              <Pressable
                onPress={handleRandomColor}
                style={({ pressed }) => [
                  styles.randomButton,
                  { backgroundColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="small">Random</ThemedText>
              </Pressable>
            </View>
          ) : null}

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
                onSave(draft, draftColors);
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
  colorRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  swatch: {
    width: 28,
    height: 36,
    borderRadius: 8,
  },
  channelField: {
    flex: 1,
    gap: 2,
  },
  channelInput: {
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    minHeight: 36,
  },
  randomButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    borderRadius: 10,
    minHeight: 36,
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
