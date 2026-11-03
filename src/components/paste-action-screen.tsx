import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClipboardPasteControl } from '@/components/clipboard-paste-control';
import { LastRequestCost } from '@/components/last-request-cost';
import { Screen } from '@/components/screen';
import { TagEditorModal } from '@/components/tag-editor-modal';
import { TagPill } from '@/components/tag-pill';
import { ThemedText } from '@/components/themed-text';
import { FloatingTabInset, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useContentWidth } from '@/hooks/use-content-width';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import { wordingText } from '@/lib/openrouter';
import { getReplyPromptForTag, resolveOpenRouterModel } from '@/lib/storage';

type FlashState = 'idle' | 'success';
type ActionKind = 'paste' | 'again';

type PasteActionScreenProps = {
  prompt: string;
  emptyText: string;
  showAgain?: boolean;
  showInput?: boolean;
  showTags?: boolean;
};

const INPUT_LINE_HEIGHT = 22;
const INPUT_HEIGHT = INPUT_LINE_HEIGHT * 3 + Spacing.two * 2;

function getResultTextStyle(text: string) {
  const length = text.trim().length;
  const lines = text.split('\n').length;
  if (length > 280 || lines > 8) {
    return styles.resultTextSmall;
  }
  if (length > 120 || lines > 4) {
    return styles.resultTextMedium;
  }
  return styles.resultText;
}

export function PasteActionScreen({
  prompt,
  emptyText,
  showAgain = false,
  showInput = false,
  showTags = false,
}: PasteActionScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const width = useContentWidth();
  const { settings, recordRequest, addItem, updateSettings } = useAppState();
  const [flash, setFlash] = useState<FlashState>('idle');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionKind | null>(null);
  const [flashedAction, setFlashedAction] = useState<ActionKind>('paste');
  const [sourceText, setSourceText] = useState('');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [added, setAdded] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [pasteControlKey, setPasteControlKey] = useState(0);
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
      setPasteControlKey((current) => current + 1);
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

  const replyTags = settings.replyTags ?? [];
  const activePrompt = showTags ? getReplyPromptForTag(settings, selectedTag, prompt) : prompt;

  useEffect(() => {
    if (selectedTag && !replyTags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())) {
      setSelectedTag(null);
    }
  }, [replyTags, selectedTag]);

  const requestFromSource = async (source: string, action: ActionKind) => {
    const model = resolveOpenRouterModel(settings);
    const nextResult = await wordingText(source, model, activePrompt);
    await Clipboard.setStringAsync(nextResult.text);
    recordRequest({ cost: nextResult.cost, model });
    setResult(nextResult.text);
    setAdded(false);
    flashFor('success', action, settings.flashSeconds * 1000);
  };

  const pasteSource = async (source: string) => {
    if (loading) return;
    Keyboard.dismiss();
    setLoading(true);
    setPendingAction('paste');
    try {
      setSourceText(source);
      await requestFromSource(source, 'paste');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Something went wrong');
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
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const actionStyle = (action: ActionKind) => {
    const isFlashed = flashedAction === action && flash === 'success';
    const idleBackground = action === 'again' ? theme.backgroundSelected : theme.backgroundElement;
    return {
      backgroundColor: isFlashed ? '#22C55E' : idleBackground,
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
  const inputSource = inputText.trim();
  const useInputSource = showInput && inputSource.length > 0;

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View collapsable={false} style={[styles.body, { paddingBottom: Spacing.three + FloatingTabInset + insets.bottom }]}>
        <ScrollView
          ref={scrollRef}
          style={styles.result}
          contentContainerStyle={styles.resultContent}
          keyboardShouldPersistTaps="handled">
          {result ? (
            <View style={styles.resultBlock}>
              <ThemedText style={getResultTextStyle(result)}>{result}</ThemedText>
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
          {showInput ? (
            <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement }]}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type text, or leave empty to use the clipboard."
                placeholderTextColor={theme.textSecondary}
                multiline
                textAlignVertical="top"
                editable={!loading}
                style={[
                  styles.input,
                  inputText.length > 0 && styles.inputWithClear,
                  { color: theme.text },
                ]}
              />
              {inputText.length > 0 ? (
                <Pressable
                  onPress={() => setInputText('')}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Clear"
                  style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {useInputSource ? (
            <Pressable
              onPress={() => void pasteSource(inputSource)}
              disabled={loading}
              style={({ pressed }) => [
                styles.actionButton,
                { height: buttonHeight, backgroundColor: pasteStyle.backgroundColor },
                pressed && !loading && styles.pressed,
              ]}>
              {pendingAction === 'paste' ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <>
                  <Ionicons name="clipboard-outline" size={22} color={pasteStyle.contentColor} />
                  <ThemedText style={[styles.actionLabel, { color: pasteStyle.contentColor }]}>Paste</ThemedText>
                </>
              )}
            </Pressable>
          ) : (
            <ClipboardPasteControl
              key={pasteControlKey}
              onPaste={(source) => void pasteSource(source)}
              onEmpty={() => showAlert('Clipboard is empty')}
              disabled={loading}
              loading={pendingAction === 'paste'}
              width={pasteButtonWidth}
              height={buttonHeight}
              backgroundColor={pasteStyle.backgroundColor}
              foregroundColor={pasteStyle.contentColor}
              fallbackIcon={<Ionicons name="clipboard-outline" size={22} color={pasteStyle.contentColor} />}
            />
          )}

          {showTags ? (
            <View style={styles.tagRow}>
              {replyTags.map((tag) => (
                <TagPill
                  key={tag}
                  label={tag}
                  tone="neutral"
                  selected={selectedTag?.toLowerCase() === tag.toLowerCase()}
                  onPress={() =>
                    setSelectedTag((current) => (current?.toLowerCase() === tag.toLowerCase() ? null : tag))
                  }
                />
              ))}
              <Pressable
                onPress={() => setTagEditorOpen(true)}
                hitSlop={4}
                style={({ pressed }) => [styles.addTag, { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}>
                <Ionicons name="add" size={14} color={theme.textSecondary} />
              </Pressable>
            </View>
          ) : null}

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
      </KeyboardAvoidingView>
      {showTags ? (
        <TagEditorModal
          visible={tagEditorOpen}
          tags={replyTags}
          tone="neutral"
          onClose={() => setTagEditorOpen(false)}
          onSave={(tags) => updateSettings({ replyTags: tags })}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  actions: {
    gap: Spacing.two,
  },
  inputWrap: {
    height: INPUT_HEIGHT,
    borderRadius: 16,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    lineHeight: INPUT_LINE_HEIGHT,
  },
  inputWithClear: {
    paddingRight: 36,
  },
  clearButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    alignItems: 'center',
    minHeight: 24,
  },
  addTag: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
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
  resultTextMedium: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: 500,
    alignSelf: 'stretch',
  },
  resultTextSmall: {
    fontSize: 15,
    lineHeight: 22,
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
