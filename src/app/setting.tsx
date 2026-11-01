import { Ionicons } from '@expo/vector-icons';
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

import { IconButton } from '@/components/icon-button';
import { LastRequestCost } from '@/components/last-request-cost';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useTheme } from '@/hooks/use-theme';
import { parseFlashSeconds } from '@/lib/storage';
import { DEFAULT_SETTINGS } from '@/types/app';

export default function SettingScreen() {
  const theme = useTheme();
  const { settings, updateSettings } = useAppState();
  const [model, setModel] = useState(settings.model);
  const [models, setModels] = useState(settings.models ?? [settings.model]);
  const [newModel, setNewModel] = useState('');
  const [prompt, setPrompt] = useState(settings.prompt);
  const [replyPrompt, setReplyPrompt] = useState(settings.replyPrompt ?? DEFAULT_SETTINGS.replyPrompt);
  const [smoothPrompt, setSmoothPrompt] = useState(settings.smoothPrompt ?? DEFAULT_SETTINGS.smoothPrompt);
  const [flashSeconds, setFlashSeconds] = useState(String(settings.flashSeconds));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setModel(settings.model);
    setModels(settings.models ?? [settings.model]);
    setPrompt(settings.prompt);
    setReplyPrompt(settings.replyPrompt ?? DEFAULT_SETTINGS.replyPrompt);
    setSmoothPrompt(settings.smoothPrompt ?? DEFAULT_SETTINGS.smoothPrompt);
    setFlashSeconds(String(settings.flashSeconds));
  }, [settings]);

  const handleAddModel = () => {
    const next = newModel.trim();
    if (!next) return;
    if (!models.includes(next)) {
      setModels((current) => [...current, next]);
    }
    setModel(next);
    setNewModel('');
  };

  const handleRemoveModel = (name: string) => {
    if (models.length <= 1) return;
    const nextModels = models.filter((item) => item !== name);
    setModels(nextModels);
    if (model === name) {
      setModel(nextModels[0]);
    }
  };

  const handleSave = () => {
    const nextModels = models.length ? models : DEFAULT_SETTINGS.models;
    const nextModel = nextModels.includes(model) ? model : nextModels[0];
    const nextPrompt = prompt.trim() || DEFAULT_SETTINGS.prompt;
    const nextReplyPrompt = replyPrompt.trim() || DEFAULT_SETTINGS.replyPrompt;
    const nextSmoothPrompt = smoothPrompt.trim() || DEFAULT_SETTINGS.smoothPrompt;
    const nextFlashSeconds = parseFlashSeconds(flashSeconds);
    updateSettings({
      model: nextModel,
      models: nextModels,
      prompt: nextPrompt,
      replyPrompt: nextReplyPrompt,
      smoothPrompt: nextSmoothPrompt,
      flashSeconds: nextFlashSeconds,
    });
    setModel(nextModel);
    setModels(nextModels);
    setPrompt(nextPrompt);
    setReplyPrompt(nextReplyPrompt);
    setSmoothPrompt(nextSmoothPrompt);
    setFlashSeconds(String(nextFlashSeconds));
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const handleReset = () => {
    setModel(DEFAULT_SETTINGS.model);
    setModels(DEFAULT_SETTINGS.models);
    setNewModel('');
    setPrompt(DEFAULT_SETTINGS.prompt);
    setReplyPrompt(DEFAULT_SETTINGS.replyPrompt);
    setSmoothPrompt(DEFAULT_SETTINGS.smoothPrompt);
    setFlashSeconds(String(DEFAULT_SETTINGS.flashSeconds));
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
            <View style={styles.modelList}>
              {models.map((name) => {
                const selected = name === model;
                return (
                  <Pressable
                    key={name}
                    onPress={() => setModel(name)}
                    style={({ pressed }) => [
                      styles.modelRow,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={selected ? theme.text : theme.textSecondary}
                    />
                    <ThemedText style={styles.modelName}>{name}</ThemedText>
                    {models.length > 1 ? (
                      <IconButton name="trash-outline" onPress={() => handleRemoveModel(name)} danger />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.addRow}>
              <TextInput
                value={newModel}
                onChangeText={setNewModel}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Add model (provider/model)"
                placeholderTextColor={theme.textSecondary}
                onSubmitEditing={handleAddModel}
                returnKeyType="done"
                style={[styles.input, styles.addInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
              <Pressable
                onPress={handleAddModel}
                style={({ pressed }) => [styles.addButton, { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}>
                <ThemedText>Add</ThemedText>
              </Pressable>
            </View>
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

          <View style={styles.field}>
            <ThemedText type="smallBold">Reply prompt</ThemedText>
            <TextInput
              value={replyPrompt}
              onChangeText={setReplyPrompt}
              multiline
              textAlignVertical="top"
              placeholder={DEFAULT_SETTINGS.replyPrompt}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, styles.prompt, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Smooth prompt</ThemedText>
            <TextInput
              value={smoothPrompt}
              onChangeText={setSmoothPrompt}
              multiline
              textAlignVertical="top"
              placeholder={DEFAULT_SETTINGS.smoothPrompt}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, styles.prompt, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Flash time (seconds)</ThemedText>
            <TextInput
              value={flashSeconds}
              onChangeText={setFlashSeconds}
              keyboardType="number-pad"
              placeholder={String(DEFAULT_SETTINGS.flashSeconds)}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
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
        <View style={styles.costBar}>
          <LastRequestCost />
        </View>
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
  modelList: {
    gap: Spacing.one,
  },
  modelRow: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  modelName: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  addInput: {
    flex: 1,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    minHeight: 42,
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
  costBar: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two + BottomTabInset,
  },
});
