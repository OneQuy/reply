import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { TagEditorModal } from '@/components/tag-editor-modal';
import { TagPill } from '@/components/tag-pill';
import { ThemedText } from '@/components/themed-text';
import { WordingResultModal } from '@/components/wording-result-modal';
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
  const { recordRequest, updateItemTags, setItemFolded } = useAppState();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const showResultAfterRequest = useRef(true);

  const closeResult = useCallback(() => {
    showResultAfterRequest.current = false;
    setResult(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => closeResult();
    }, [closeResult]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        closeResult();
      }
    });
    return () => sub.remove();
  }, [closeResult]);

  const handleWording = async () => {
    if (loading) return;
    if (result === null) {
      showResultAfterRequest.current = true;
    }
    setLoading(true);
    try {
      const nextResult = await wordingText(item.text, settings.model, settings.prompt);
      await Clipboard.setStringAsync(nextResult.text);
      recordRequest({ cost: nextResult.cost });
      if (showResultAfterRequest.current) {
        setResult(nextResult.text);
      }
    } catch (error) {
      Alert.alert('', error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const tags = item.tags ?? [];
  const folded = item.folded === true;

  const handleTextSize = (height: number, nativeLines?: number) => {
    if (folded) return;
    const fromNative = nativeLines ?? 0;
    const fromHeight = height > 0 ? Math.ceil((height - 1) / TEXT_LINE_HEIGHT) : 0;
    const next = Math.max(fromNative, fromHeight);
    if (next > 0) setLineCount(next);
  };

  const handleToggleFold = () => {
    if (folded) {
      setItemFolded(item.id, false);
      return;
    }
    const overflow = lineCount > 2 || item.text.split('\n').length > 2;
    if (overflow) {
      setItemFolded(item.id, true);
    }
  };

  return (
    <View style={[styles.card, { width, backgroundColor: theme.backgroundElement }]}>
      <Pressable onPress={handleToggleFold}>
        <ThemedText
          style={styles.text}
          numberOfLines={folded ? 2 : undefined}
          ellipsizeMode="tail"
          onLayout={(event: LayoutChangeEvent) => {
            handleTextSize(event.nativeEvent.layout.height);
          }}
          onTextLayout={(event) => {
            handleTextSize(0, event.nativeEvent.lines.length);
          }}>
          {item.text}
        </ThemedText>
      </Pressable>
      <View style={styles.footer}>
        {tags.length > 0 ? (
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
          </View>
        ) : null}
        <View style={styles.actions}>
          <Pressable
            onPress={() => setTagEditorOpen(true)}
            hitSlop={4}
            style={({ pressed }) => [styles.addTag, { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}>
            <Ionicons name="add" size={10} color={theme.textSecondary} />
          </Pressable>
          <IconButton name="pencil-outline" onPress={onEdit} disabled={loading} />
          <IconButton name="pin-outline" onPress={onPin} disabled={loading} />
          <IconButton name="trash-outline" onPress={onDelete} disabled={loading} />
          <IconButton name="color-wand-outline" onPress={() => void handleWording()} loading={loading && result === null} />
        </View>
      </View>
      <TagEditorModal
        visible={tagEditorOpen}
        tags={tags}
        onClose={() => setTagEditorOpen(false)}
        onSave={(nextTags) => updateItemTags(item.id, nextTags)}
      />
      <WordingResultModal
        visible={result !== null}
        text={result ?? ''}
        loading={loading}
        onClose={closeResult}
        onRetry={() => void handleWording()}
      />
    </View>
  );
}

const TEXT_LINE_HEIGHT = 15;

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
    lineHeight: TEXT_LINE_HEIGHT,
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
