import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClipboardPasteControl } from '@/components/clipboard-paste-control';
import { LastRequestCost } from '@/components/last-request-cost';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';
import { useTheme } from '@/hooks/use-theme';
import { wordingText } from '@/lib/openrouter';

type FlashState = 'idle' | 'success' | 'error';
type ActionKind = 'paste' | 'again';

type PasteActionScreenProps = {
  prompt: string;
  emptyText: string;
  showAgain?: boolean;
};

export function PasteActionScreen({ prompt, emptyText, showAgain = false }: PasteActionScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { settings, recordRequest, addItem } = useAppState();
  const [flash, setFlash] = useState<FlashState>('idle');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionKind | null>(null);
  const [flashedAction, setFlashedAction] = useState<ActionKind>('paste');
  const [sourceText, setSourceText] = useState('');
  const [result, setResult] = useState('');
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useTabScrollToTop();
  const buttonHeight = Math.max(64, Math.round(height * 0.1));
  const againButtonHeight = Math.max(52, Math.round(buttonHeight * 0.75));
  const pasteButtonWidth = Math.max(0, width - Spacing.three * 2);

  const clearFlash = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFlash('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => clearFlash();
    }, [clearFlash]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        clearFlash();
      }
    });
    return () => sub.remove();
  }, [clearFlash]);

  const flashFor = (state: FlashState, action: ActionKind, duration: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setFlashedAction(action);
    setFlash(state);
    timeoutRef.current = setTimeout(() => {
      setFlash('idle');
      timeoutRef.current = null;
    }, duration);
  };

  const requestFromSource = async (source: string, action: ActionKind) => {
    const nextResult = await wordingText(source, settings.model, prompt);
    await Clipboard.setStringAsync(nextResult.text);
    recordRequest({ cost: nextResult.cost });
    setResult(nextResult.text);
    setAdded(false);
    flashFor('success', action, settings.flashSeconds * 1000);
  };

  const pasteSource = async (source: string) => {
    if (loading) return;
    setLoading(true);
    setPendingAction('paste');
    try {
      setSourceText(source);
      await requestFromSource(source, 'paste');
    } catch {
      flashFor('error', 'paste', 1600);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const handleAgain = async () => {
    if (loading || !sourceText) return;
    setLoading(true);
    setPendingAction('again');
    try {
      await requestFromSource(sourceText, 'again');
    } catch {
      flashFor('error', 'again', 1600);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const actionStyle = (action: ActionKind) => {
    const isFlashed = flashedAction === action && flash !== 'idle';
    const idleBackground = action === 'again' ? theme.backgroundSelected : theme.backgroundElement;
    return {
      backgroundColor: isFlashed ? (flash === 'success' ? '#22C55E' : '#F87171') : idleBackground,
      contentColor: isFlashed ? '#0B1B0E' : theme.text,
    };
  };

  const handleAddToWording = () => {
    if (!result.trim() || added) return;
    addItem(result);
    setAdded(true);
  };

  const pasteStyle = actionStyle('paste');
  const againStyle = actionStyle('again');

  return (
    <Screen>
      <View collapsable={false} style={[styles.body, { paddingBottom: Spacing.three + insets.bottom }]}>
        <ScrollView
          ref={scrollRef}
          style={styles.result}
          contentContainerStyle={styles.resultContent}
          keyboardShouldPersistTaps="handled">
          {result ? (
            <View style={styles.resultBlock}>
              <ThemedText style={styles.resultText}>{result}</ThemedText>
              <Pressable
                onPress={handleAddToWording}
                style={({ pressed }) => [
                  styles.addWordingButton,
                  { backgroundColor: added ? '#22C55E' : theme.backgroundSelected },
                  pressed && !added && styles.pressed,
                ]}>
                <Ionicons name={added ? 'checkmark' : 'add'} size={14} color={added ? '#0B1B0E' : theme.text} />
                <ThemedText type="small" style={added ? styles.addedLabel : undefined}>
                  {added ? 'Added' : 'Add to Wording'}
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <ThemedText themeColor="textSecondary">{emptyText}</ThemedText>
          )}
        </ScrollView>

        <View style={styles.actions}>
          <ClipboardPasteControl
            onPaste={(source) => void pasteSource(source)}
            onEmpty={() => flashFor('error', 'paste', 1600)}
            disabled={loading}
            loading={pendingAction === 'paste'}
            width={pasteButtonWidth}
            height={buttonHeight}
            backgroundColor={pasteStyle.backgroundColor}
            foregroundColor={pasteStyle.contentColor}
            fallbackIcon={<Ionicons name="clipboard-outline" size={22} color={pasteStyle.contentColor} />}
          />

          {showAgain && sourceText ? (
            <Pressable
              onPress={() => void handleAgain()}
              disabled={loading}
              style={({ pressed }) => [
                styles.actionButton,
                { height: againButtonHeight, backgroundColor: againStyle.backgroundColor },
                pressed && !loading && styles.pressed,
              ]}>
              {pendingAction === 'again' ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={20} color={againStyle.contentColor} />
                  <ThemedText style={[styles.actionLabel, { color: againStyle.contentColor }]}>Again</ThemedText>
                </>
              )}
            </Pressable>
          ) : null}

          <View style={styles.costRow}>
            <LastRequestCost />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  actions: {
    gap: Spacing.two,
  },
  actionButton: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  actionLabel: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
  },
  result: {
    flex: 1,
  },
  resultContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  costRow: {
    minHeight: 16,
    justifyContent: 'flex-end',
  },
  resultBlock: {
    gap: Spacing.two,
    alignItems: 'flex-end',
  },
  resultText: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: 500,
    alignSelf: 'stretch',
  },
  addWordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  addedLabel: {
    color: '#0B1B0E',
  },
  pressed: {
    opacity: 0.7,
  },
});
