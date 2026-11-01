import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/screen';
import { TextEditorModal } from '@/components/text-editor-modal';
import { ThemedText } from '@/components/themed-text';
import { WordingCard } from '@/components/wording-card';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useTheme } from '@/hooks/use-theme';

const COLUMNS = 2;
const GRID_PADDING = Spacing.three;
const GRID_GAP = Spacing.two;

type EditorState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; id: string; text: string };

export default function WordingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { ready, items, settings, addItem, updateItem, deleteItem, pinItem } = useAppState();
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' });
  const [flashReset, setFlashReset] = useState(0);
  const addBarPaddingBottom = Spacing.three + BottomTabInset + insets.bottom;

  const clearFlashes = useCallback(() => {
    setFlashReset((value) => value + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => clearFlashes();
    }, [clearFlashes]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        clearFlashes();
      }
    });
    return () => sub.remove();
  }, [clearFlashes]);

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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!ready ? (
          <ThemedText themeColor="textSecondary">Loading…</ThemedText>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText themeColor="textSecondary" style={styles.emptyText}>
              No wording items yet. Add one to start.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.grid}>
            {items.map((item) => (
              <WordingCard
                key={item.id}
                item={item}
                width={cardWidth}
                settings={settings}
                flashReset={flashReset}
                onEdit={() => setEditor({ mode: 'edit', id: item.id, text: item.text })}
                onPin={() => pinItem(item.id)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.addBar, { paddingBottom: addBarPaddingBottom }]}>
        <Pressable
          onPress={() => setEditor({ mode: 'add' })}
          style={({ pressed }) => [styles.addButton, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
          <Ionicons name="add" size={20} color={theme.text} />
        </Pressable>
      </View>

      <TextEditorModal
        visible={editor.mode !== 'closed'}
        title={editor.mode === 'edit' ? 'Edit text' : 'Add wording'}
        initialValue={editor.mode === 'edit' ? editor.text : ''}
        onClose={() => setEditor({ mode: 'closed' })}
        onSave={handleSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: GRID_PADDING,
    paddingTop: GRID_PADDING,
    paddingBottom: Spacing.three,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  addBar: {
    alignItems: 'flex-end',
    paddingHorizontal: GRID_PADDING,
    paddingTop: Spacing.two,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
