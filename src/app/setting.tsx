import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
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
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';
import { useTheme } from '@/hooks/use-theme';
import { parseFlashSeconds } from '@/lib/storage';
import { DEFAULT_SETTINGS } from '@/types/app';

export default function SettingScreen() {
  const theme = useTheme();
  const scrollRef = useTabScrollToTop();
  const { settings, updateSettings } = useAppState();
  const [model, setModel] = useState(settings.model);
  const [models, setModels] = useState(settings.models ?? [settings.model]);
  const [newModel, setNewModel] = useState('');
  const [prompt, setPrompt] = useState(settings.prompt);
  const [replyPrompt, setReplyPrompt] = useState(settings.replyPrompt ?? DEFAULT_SETTINGS.replyPrompt);
  const [smoothPrompt, setSmoothPrompt] = useState(settings.smoothPrompt ?? DEFAULT_SETTINGS.smoothPrompt);
  const [flashSeconds, setFlashSeconds] = useState(String(settings.flashSeconds));
  const [saved, setSaved] = useState(false);
  const [editingPrompts, setEditingPrompts] = useState({
    wording: false,
    reply: false,
    smooth: false,
  });

  const lockPrompts = () => setEditingPrompts({ wording: false, reply: false, smooth: false });

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
    lockPrompts();
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
    lockPrompts();
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <Screen
      title="Setting"
      action={
        <ThemedText type="small" themeColor="textSecondary">
          {Constants.expoConfig?.version ?? ''}
        </ThemedText>
      }>
      <KeyboardAvoidingView collapsable={false} style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

          <PromptField
            label="Wording prompt"
            value={prompt}
            onChangeText={setPrompt}
            placeholder={DEFAULT_SETTINGS.prompt}
            editing={editingPrompts.wording}
            onToggleEdit={() => setEditingPrompts((current) => ({ ...current, wording: !current.wording }))}
          />

          <PromptField
            label="Reply prompt"
            value={replyPrompt}
            onChangeText={setReplyPrompt}
            placeholder={DEFAULT_SETTINGS.replyPrompt}
            editing={editingPrompts.reply}
            onToggleEdit={() => setEditingPrompts((current) => ({ ...current, reply: !current.reply }))}
          />

          <PromptField
            label="Smooth prompt"
            value={smoothPrompt}
            onChangeText={setSmoothPrompt}
            placeholder={DEFAULT_SETTINGS.smoothPrompt}
            editing={editingPrompts.smooth}
            onToggleEdit={() => setEditingPrompts((current) => ({ ...current, smooth: !current.smooth }))}
          />

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
      </KeyboardAvoidingView>
    </Screen>
  );
}

type PromptFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  editing: boolean;
  onToggleEdit: () => void;
};

function PromptField({ label, value, onChangeText, placeholder, editing, onToggleEdit }: PromptFieldProps) {
  const theme = useTheme();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      return;
    }
    inputRef.current?.blur();
  }, [editing]);

  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <Pressable onPress={onToggleEdit} hitSlop={6} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
          <Ionicons name={editing ? 'checkmark' : 'pencil-outline'} size={14} color={theme.text} />
          <ThemedText type="small">{editing ? 'Done' : 'Edit'}</ThemedText>
        </Pressable>
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        multiline
        editable={editing}
        textAlignVertical="top"
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          styles.prompt,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            opacity: editing ? 1 : 0.7,
          },
        ]}
      />
    </View>
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
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
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
});
