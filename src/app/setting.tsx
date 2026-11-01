import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_SETTINGS } from '@/types/app';

export default function SettingScreen() {
  const theme = useTheme();
  const { settings, updateSettings } = useAppState();
  const [model, setModel] = useState(settings.model);
  const [prompt, setPrompt] = useState(settings.prompt);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setModel(settings.model);
    setPrompt(settings.prompt);
  }, [settings]);

  const handleSave = () => {
    const nextModel = model.trim() || DEFAULT_SETTINGS.model;
    const nextPrompt = prompt.trim() || DEFAULT_SETTINGS.prompt;
    updateSettings({ model: nextModel, prompt: nextPrompt });
    setModel(nextModel);
    setPrompt(nextPrompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const handleReset = () => {
    setModel(DEFAULT_SETTINGS.model);
    setPrompt(DEFAULT_SETTINGS.prompt);
    updateSettings(DEFAULT_SETTINGS);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <Screen title="Setting">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <ThemedText type="smallBold">Model</ThemedText>
            <TextInput
              value={model}
              onChangeText={setModel}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={DEFAULT_SETTINGS.model}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Wording prompt</ThemedText>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              multiline
              textAlignVertical="top"
              placeholder={DEFAULT_SETTINGS.prompt}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, styles.prompt, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: saved ? '#22C55E' : theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <ThemedText style={saved ? styles.savedLabel : undefined}>{saved ? 'Saved' : 'Save'}</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [styles.button, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
              <ThemedText themeColor="textSecondary">Reset defaults</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five + BottomTabInset,
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    lineHeight: 22,
  },
  prompt: {
    minHeight: 160,
  },
  actions: {
    gap: Spacing.two,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  savedLabel: {
    color: '#0B1B0E',
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
