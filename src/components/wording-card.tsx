import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { TagEditorModal } from '@/components/tag-editor-modal';
import { TagPill } from '@/components/tag-pill';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useTheme } from '@/hooks/use-theme';
import { wordingText } from '@/lib/openrouter';
import { type AppSettings, type WordingItem } from '@/types/app';

type WordingCardProps = {
  item: WordingItem;
  width: number;
  settings: AppSettings;
  selectedTag?: string | null;
  onTagPress: (tag: string) => void;
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
};

export function WordingCard({ item, width, settings, selectedTag, onTagPress, onEdit, onPin, onDelete }: WordingCardProps) {
  const theme = useTheme();
  const { recordRequest, updateItemTags, setItemFolded, successFlashId, startSuccessFlash, clearSuccessFlash } = useAppState();
  const [loading, setLoading] = useState(false);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [lineCount, setLineCount] = useState(0);

  const handleWording = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await wordingText(item.text, settings.model, settings.prompt);
      await Clipboard.setStringAsync(result.text);
      recordRequest({ cost: result.cost });
      startSuccessFlash(item.id, settings.flashSeconds * 1000);
    } catch (error) {
      if (successFlashId === item.id) {
        clearSuccessFlash();
      }
      Alert.alert('', error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFold = () => {
    if (item.folded) {
      setItemFolded(item.id, false);
      return;
    }
    if (lineCount > 2) {
      setItemFolded(item.id, true);
    }
  };

  const tags = item.tags ?? [];
  const isSuccess = successFlashId === item.id;
  const backgroundColor = isSuccess ? '#22C55E' : theme.backgroundElement;
  const textColor = isSuccess ? '#0B1B0E' : theme.text;
  const folded = item.folded === true;

  return (
    <View style={[styles.card, { width, backgroundColor }]}>
      <Pressable onPress={handleToggleFold}>
        <ThemedText
          style={[styles.text, { color: textColor }]}
          numberOfLines={folded ? 2 : 0}
          ellipsizeMode="tail"
          onTextLayout={(event) => {
            if (!folded) {
              setLineCount(event.nativeEvent.lines.length);
            }
          }}>
          {item.text}
        </ThemedText>
      </Pressable>
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
