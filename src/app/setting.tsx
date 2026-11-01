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
  const models = settings.models?.length ? settings.models : [settings.model];
  const [newModel, setNewModel] = useState('');
  const [prompt, setPrompt] = useState(settings.prompt);
  const [replyPrompt, setReplyPrompt] = useState(settings.replyPrompt ?? DEFAULT_SETTINGS.replyPrompt);
  const [smoothPrompt, setSmoothPrompt] = useState(settings.smoothPrompt ?? DEFAULT_SETTINGS.smoothPrompt);
  const [flashSeconds, setFlashSeconds] = useState(String(settings.flashSeconds));
  const [flashSaved, setFlashSaved] = useState(false);
  const [editingPrompts, setEditingPrompts] = useState({
    wording: false,
    reply: false,
    smooth: false,
  });

  useEffect(() => {
    setFlashSeconds(String(settings.flashSeconds));
  }, [settings.flashSeconds]);

  const handleSelectModel = (name: string) => {
    if (name === settings.model) return;
    updateSettings({ model: name });
  };

  const handleAddModel = () => {
    const next = newModel.trim();
    if (!next) return;
    const nextModels = models.includes(next) ? models : [...models, next];
    updateSettings({ models: nextModels, model: next });
    setNewModel('');
  };

  const handleRemoveModel = (name: string) => {
    if (models.length <= 1) return;
    const nextModels = models.filter((item) => item !== name);
    updateSettings({
      models: nextModels,
      model: settings.model === name ? nextModels[0] : settings.model,
    });
  };

  const handleEditPrompt = (key: keyof typeof editingPrompts) => {
    if (key === 'wording') setPrompt(settings.prompt);
    if (key === 'reply') setReplyPrompt(settings.replyPrompt ?? DEFAULT_SETTINGS.replyPrompt);
    if (key === 'smooth') setSmoothPrompt(settings.smoothPrompt ?? DEFAULT_SETTINGS.smoothPrompt);
    setEditingPrompts((current) => ({ ...current, [key]: true }));
  };

  const handleSavePrompt = (key: keyof typeof editingPrompts) => {
    if (key === 'wording') {
      const next = prompt.trim() || DEFAULT_SETTINGS.prompt;
      setPrompt(next);
      updateSettings({ prompt: next });
    } else if (key === 'reply') {
      const next = replyPrompt.trim() || DEFAULT_SETTINGS.replyPrompt;
      setReplyPrompt(next);
      updateSettings({ replyPrompt: next });
    } else {
      const next = smoothPrompt.trim() || DEFAULT_SETTINGS.smoothPrompt;
      setSmoothPrompt(next);
      updateSettings({ smoothPrompt: next });
    }
    setEditingPrompts((current) => ({ ...current, [key]: false }));
  };

  const handleSaveFlash = () => {
    const next = parseFlashSeconds(flashSeconds);
    setFlashSeconds(String(next));
    updateSettings({ flashSeconds: next });
    setFlashSaved(true);
    setTimeout(() => setFlashSaved(false), 1600);
  };

  const handleReset = () => {
    setNewModel('');
    setPrompt(DEFAULT_SETTINGS.prompt);
    setReplyPrompt(DEFAULT_SETTINGS.replyPrompt);
    setSmoothPrompt(DEFAULT_SETTINGS.smoothPrompt);
    setFlashSeconds(String(DEFAULT_SETTINGS.flashSeconds));
    setEditingPrompts({ wording: false, reply: false, smooth: false });
    updateSettings(DEFAULT_SETTINGS);
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
                const selected = name === settings.model;
                return (
                  <Pressable
                    key={name}
                    onPress={() => handleSelectModel(name)}
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
            value={editingPrompts.wording ? prompt : settings.prompt}
            onChangeText={setPrompt}
            placeholder={DEFAULT_SETTINGS.prompt}
            editing={editingPrompts.wording}
            onEdit={() => handleEditPrompt('wording')}
            onSave={() => handleSavePrompt('wording')}
          />

          <PromptField
            label="Reply prompt"
            value={editingPrompts.reply ? replyPrompt : (settings.replyPrompt ?? DEFAULT_SETTINGS.replyPrompt)}
            onChangeText={setReplyPrompt}
            placeholder={DEFAULT_SETTINGS.replyPrompt}
            editing={editingPrompts.reply}
            onEdit={() => handleEditPrompt('reply')}
            onSave={() => handleSavePrompt('reply')}
          />

          <PromptField
            label="Smooth prompt"
            value={editingPrompts.smooth ? smoothPrompt : (settings.smoothPrompt ?? DEFAULT_SETTINGS.smoothPrompt)}
            onChangeText={setSmoothPrompt}
            placeholder={DEFAULT_SETTINGS.smoothPrompt}
            editing={editingPrompts.smooth}
            onEdit={() => handleEditPrompt('smooth')}
            onSave={() => handleSavePrompt('smooth')}
          />

          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <ThemedText type="smallBold">Flash time (seconds)</ThemedText>
              <Pressable
                onPress={handleSaveFlash}
                hitSlop={6}
                style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
                <ThemedText type="small" style={flashSaved ? styles.savedLabel : undefined}>
                  {flashSaved ? 'Saved' : 'Save'}
                </ThemedText>
              </Pressable>
            </View>
            <TextInput
              value={flashSeconds}
              onChangeText={setFlashSeconds}
              keyboardType="number-pad"
              placeholder={String(DEFAULT_SETTINGS.flashSeconds)}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [styles.button, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
            <ThemedText themeColor="textSecondary">Reset defaults</ThemedText>
          </Pressable>
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
  onEdit: () => void;
  onSave: () => void;
};

function PromptField({ label, value, onChangeText, placeholder, editing, onEdit, onSave }: PromptFieldProps) {
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
        <Pressable
          onPress={editing ? onSave : onEdit}
          hitSlop={6}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
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
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  savedLabel: {
    color: '#16A34A',
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
