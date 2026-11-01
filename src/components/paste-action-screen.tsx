import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LastRequestCost } from '@/components/last-request-cost';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';
import { useTheme } from '@/hooks/use-theme';
import { wordingText } from '@/lib/openrouter';

type FlashState = 'idle' | 'success' | 'error';

type PasteActionScreenProps = {
  prompt: string;
  emptyText: string;
};

export function PasteActionScreen({ prompt, emptyText }: PasteActionScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { settings, recordRequest, addItem } = useAppState();
  const [flash, setFlash] = useState<FlashState>('idle');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useTabScrollToTop();
  const buttonHeight = Math.max(64, Math.round(height * 0.1));

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

  const flashFor = (state: FlashState, duration: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setFlash(state);
    timeoutRef.current = setTimeout(() => {
      setFlash('idle');
      timeoutRef.current = null;
    }, duration);
  };

  const handlePaste = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const source = (await Clipboard.getStringAsync()).trim();
      if (!source) {
        throw new Error('Clipboard is empty');
      }
      const nextResult = await wordingText(source, settings.model, prompt);
      await Clipboard.setStringAsync(nextResult.text);
      recordRequest({ cost: nextResult.cost });
      setResult(nextResult.text);
      setAdded(false);
      flashFor('success', settings.flashSeconds * 1000);
    } catch {
      flashFor('error', 1600);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWording = () => {
    if (!result.trim() || added) return;
    addItem(result);
    setAdded(true);
  };

  const backgroundColor =
    flash === 'success' ? '#22C55E' : flash === 'error' ? '#F87171' : theme.backgroundElement;
  const contentColor = flash === 'idle' ? theme.text : '#0B1B0E';

  return (
    <Screen>
      <View collapsable={false} style={[styles.body, { paddingBottom: Spacing.three + BottomTabInset + insets.bottom }]}>
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

        <Pressable
          onPress={() => void handlePaste()}
          disabled={loading}
          style={({ pressed }) => [
            styles.pasteButton,
            { height: buttonHeight, backgroundColor },
            pressed && !loading && styles.pressed,
          ]}>
          {loading ? (
            <ActivityIndicator color={theme.text} />
          ) : (
            <>
              <Ionicons name="clipboard-outline" size={22} color={contentColor} />
              <ThemedText style={[styles.pasteLabel, { color: contentColor }]}>Paste</ThemedText>
            </>
          )}
        </Pressable>

        <View style={styles.bottomSpacer}>
          <LastRequestCost />
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
  pasteButton: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pasteLabel: {
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
  bottomSpacer: {
    flex: 1,
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
