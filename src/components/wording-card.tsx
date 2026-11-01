import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { TagEditorModal } from '@/components/tag-editor-modal';
import { TagPill } from '@/components/tag-pill';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useTheme } from '@/hooks/use-theme';
import { wordingText } from '@/lib/openrouter';
import { type AppSettings, type WordingItem } from '@/types/app';

type FlashState = 'idle' | 'success' | 'error';

type WordingCardProps = {
  item: WordingItem;
  width: number;
  settings: AppSettings;
  flashReset: number;
  selectedTag?: string | null;
  onTagPress: (tag: string) => void;
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
};

export function WordingCard({ item, width, settings, flashReset, selectedTag, onTagPress, onEdit, onPin, onDelete }: WordingCardProps) {
  const theme = useTheme();
  const { recordRequest, updateItemTags, successFlashId, startSuccessFlash, clearSuccessFlash } = useAppState();
  const [errorFlash, setErrorFlash] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const initialReset = useRef(true);
  useEffect(() => {
    if (initialReset.current) {
      initialReset.current = false;
      return;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setErrorFlash(false);
  }, [flashReset]);

  const flashError = (duration: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setErrorFlash(true);
    timeoutRef.current = setTimeout(() => {
      setErrorFlash(false);
      timeoutRef.current = null;
    }, duration);
  };

  const handleWording = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await wordingText(item.text, settings.model, settings.prompt);
      await Clipboard.setStringAsync(result.text);
      recordRequest({ cost: result.cost });
      setErrorFlash(false);
      startSuccessFlash(item.id, settings.flashSeconds * 1000);
    } catch {
      if (successFlashId === item.id) {
        clearSuccessFlash();
      }
      flashError(1600);
    } finally {
      setLoading(false);
    }
  };

  const tags = item.tags ?? [];
  const flash: FlashState = errorFlash ? 'error' : successFlashId === item.id ? 'success' : 'idle';
  const backgroundColor =
    flash === 'success' ? '#22C55E' : flash === 'error' ? '#F87171' : theme.backgroundElement;
  const textColor = flash === 'idle' ? theme.text : '#0B1B0E';

  return (
    <View style={[styles.card, { width, backgroundColor }]}>
      <ThemedText style={[styles.text, { color: textColor }]}>{item.text}</ThemedText>
      <View style={styles.footer}>
        <View style={styles.tags}>
          {tags.map((tag, index) => (
            <TagPill
              key={`${tag}-${index}`}
              label={tag}
              compact
              selected={selectedTag?.toLowerCase() === tag.toLowerCase()}
              onPress={() => onTagPress(tag)}
            />
          ))}
          <Pressable
            onPress={() => setTagEditorOpen(true)}
            hitSlop={4}
            style={({ pressed }) => [styles.addTag, { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}>
            <Ionicons name="add" size={10} color={theme.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.actions}>
          <IconButton name="color-wand-outline" onPress={() => void handleWording()} loading={loading} />
          <IconButton name="pencil-outline" onPress={onEdit} disabled={loading} />
          <IconButton name="pin-outline" onPress={onPin} disabled={loading} />
          <IconButton name="trash-outline" onPress={onDelete} disabled={loading} danger />
        </View>
      </View>
      <TagEditorModal
        visible={tagEditorOpen}
        tags={tags}
        onClose={() => setTagEditorOpen(false)}
        onSave={(nextTags) => updateItemTags(item.id, nextTags)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    gap: Spacing.two,
  },
  text: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: 500,
  },
  footer: {
    gap: Spacing.one,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    alignItems: 'center',
  },
  addTag: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
