import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LastRequestCost } from '@/components/last-request-cost';
import { Screen } from '@/components/screen';
import { TagPill } from '@/components/tag-pill';
import { TextEditorModal } from '@/components/text-editor-modal';
import { ThemedText } from '@/components/themed-text';
import { WordingCard } from '@/components/wording-card';
import { FloatingTabInset, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useContentWidth } from '@/hooks/use-content-width';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';

const COLUMNS = 2;
const GRID_PADDING = Spacing.three;
const GRID_GAP = Spacing.two;

type EditorState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; id: string; text: string };

export default function WordingScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useTabScrollToTop();
  const width = useContentWidth();
  const { ready, items, settings, addItem, updateItem, deleteItem, pinItem } = useAppState();
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' });
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const addBarPaddingBottom = Spacing.two + FloatingTabInset + insets.bottom;
  const overlayClearance = 36 + Spacing.two + addBarPaddingBottom;

  const allTags = useMemo(() => {
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const item of items) {
      for (const tag of item.tags ?? []) {
        const key = tag.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        tags.push(tag);
      }
    }
    return tags.sort((a, b) => a.localeCompare(b));
  }, [items]);

  useEffect(() => {
    if (selectedTag && !allTags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())) {
      setSelectedTag(null);
    }
  }, [allTags, selectedTag]);

  const visibleItems = useMemo(() => {
    if (!selectedTag) return items;
    return items.filter((item) => (item.tags ?? []).some((tag) => tag.toLowerCase() === selectedTag.toLowerCase()));
  }, [items, selectedTag]);

  const columns = useMemo(() => {
    const next: (typeof visibleItems)[] = Array.from({ length: COLUMNS }, () => []);
    visibleItems.forEach((item, index) => {
      next[index % COLUMNS].push(item);
    });
    return next;
  }, [visibleItems]);

  const cardWidth = useMemo(() => {
    const available = width - GRID_PADDING * 2 - GRID_GAP * (COLUMNS - 1);
    return Math.floor(available / COLUMNS);
  }, [width]);

  const handleSave = (text: string) => {
    if (editor.mode === 'add') {
      addItem(text);
    } else if (editor.mode === 'edit') {
      updateItem(editor.id, text);
    }
    setEditor({ mode: 'closed' });
  };

  return (
    <Screen>
      {allTags.length > 0 ? (
        <View style={styles.filterBar}>
          {allTags.map((tag) => (
            <TagPill
              key={tag}
              label={tag}
              selected={selectedTag?.toLowerCase() === tag.toLowerCase()}
              onPress={() => setSelectedTag((current) => (current?.toLowerCase() === tag.toLowerCase() ? null : tag))}
            />
          ))}
        </View>
      ) : null}
      <View collapsable={false} style={styles.gridArea}>
        <ScrollView
          ref={scrollRef}
          style={styles.gridScroll}
          contentContainerStyle={[styles.content, { paddingBottom: overlayClearance }]}
          keyboardShouldPersistTaps="handled">
          {!ready ? (
            <ThemedText themeColor="textSecondary">Loading…</ThemedText>
          ) : items.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                No wording items yet. Add one to start.
              </ThemedText>
            </View>
          ) : visibleItems.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                No items with this tag.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.grid}>
              {columns.map((column, columnIndex) => (
                <View key={columnIndex} style={[styles.column, { width: cardWidth }]}>
                  {column.map((item) => (
                    <WordingCard
                      key={item.id}
                      item={item}
                      width={cardWidth}
                      settings={settings}
                      selectedTag={selectedTag}
                      onTagPress={(tag) => setSelectedTag((current) => (current?.toLowerCase() === tag.toLowerCase() ? null : tag))}
                      onEdit={() => setEditor({ mode: 'edit', id: item.id, text: item.text })}
                      onPin={() => pinItem(item.id)}
                      onDelete={() => deleteItem(item.id)}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View pointerEvents="box-none" style={[styles.addBar, { paddingBottom: addBarPaddingBottom }]}>
          <View style={styles.costSlot} pointerEvents="box-none">
            <LastRequestCost />
          </View>
          <Pressable
            onPress={() => setEditor({ mode: 'add' })}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Ionicons name="add" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      <TextEditorModal
        visible={editor.mode !== 'closed'}
        title={editor.mode === 'edit' ? 'Edit text' : 'Add wording'}
        initialValue={editor.mode === 'edit' ? editor.text : ''}
        showPaste={editor.mode === 'add'}
        onClose={() => setEditor({ mode: 'closed' })}
        onSave={handleSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    paddingHorizontal: GRID_PADDING,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  gridArea: {
    flex: 1,
  },
  gridScroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: GRID_PADDING,
    paddingTop: GRID_PADDING,
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: GRID_GAP,
  },
  column: {
    gap: GRID_GAP,
  },
  addBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GRID_PADDING,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  costSlot: {
    flex: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  emptyText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
