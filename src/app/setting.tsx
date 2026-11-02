import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
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
import { TextEditorModal } from '@/components/text-editor-modal';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAppState } from '@/context/app-state';
import { useTabScrollToTop } from '@/hooks/use-tab-scroll-to-top';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import { parseBackup, serializeBackup } from '@/lib/backup';
import { parseFlashSeconds } from '@/lib/storage';
import { DEFAULT_SETTINGS } from '@/types/app';

export default function SettingScreen() {
  const theme = useTheme();
  const scrollRef = useTabScrollToTop();
  const { items, settings, updateSettings, replaceData } = useAppState();
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
  const [editingTagKey, setEditingTagKey] = useState<string | null>(null);
  const [tagPromptDraft, setTagPromptDraft] = useState('');
  const [tab, setTab] = useState<'general' | 'reply'>('general');
  const [exportCopied, setExportCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const selectedTheme = useColorScheme();
  const replyTags = settings.replyTags ?? [];
  const defaultReplyPrompt = settings.replyPrompt ?? DEFAULT_SETTINGS.replyPrompt;

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

  const applyImportedState = (nextPrompt: string, nextReplyPrompt: string, nextSmoothPrompt: string, nextFlash: number) => {
    setNewModel('');
    setPrompt(nextPrompt);
    setReplyPrompt(nextReplyPrompt);
    setSmoothPrompt(nextSmoothPrompt);
    setFlashSeconds(String(nextFlash));
    setEditingPrompts({ wording: false, reply: false, smooth: false });
    setEditingTagKey(null);
    setTagPromptDraft('');
  };

  const handleReset = () => {
    applyImportedState(
      DEFAULT_SETTINGS.prompt,
      DEFAULT_SETTINGS.replyPrompt,
      DEFAULT_SETTINGS.smoothPrompt,
      DEFAULT_SETTINGS.flashSeconds,
    );
    updateSettings(DEFAULT_SETTINGS);
  };

  const handleExport = async () => {
    await Clipboard.setStringAsync(serializeBackup(items, settings));
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 1600);
  };

  const handleImport = (raw: string) => {
    try {
      const backup = parseBackup(raw);
      replaceData(backup.items, backup.settings);
      applyImportedState(
        backup.settings.prompt,
        backup.settings.replyPrompt,
        backup.settings.smoothPrompt,
        backup.settings.flashSeconds,
      );
      setImportOpen(false);
    } catch {
      showAlert('Invalid JSON');
    }
  };

  const handleEditTagPrompt = (tag: string) => {
    setTagPromptDraft(settings.replyTagPrompts?.[tag.toLowerCase()] ?? '');
    setEditingTagKey(tag.toLowerCase());
  };

  const handleSaveTagPrompt = () => {
    if (!editingTagKey) return;
    const next = tagPromptDraft.trim();
    const prompts = { ...settings.replyTagPrompts };
    if (next) {
      prompts[editingTagKey] = next;
    } else {
      delete prompts[editingTagKey];
    }
    updateSettings({ replyTagPrompts: prompts });
    setEditingTagKey(null);
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
        <View style={[styles.tabs, { backgroundColor: theme.backgroundElement }]}>
          {(['general', 'reply'] as const).map((name) => {
            const selected = tab === name;
            return (
              <Pressable
                key={name}
                onPress={() => setTab(name)}
                style={({ pressed }) => [
                  styles.tab,
                  selected && styles.tabSelected,
                  pressed && !selected && styles.pressed,
                ]}>
                <ThemedText
                  themeColor={selected ? 'text' : 'textSecondary'}
                  style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
                  {name === 'general' ? 'General' : 'Reply'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {tab === 'general' ? (
            <>
              <View style={styles.field}>
                <ThemedText type="smallBold">Theme</ThemedText>
                <View style={[styles.appearance, { backgroundColor: theme.backgroundElement }]}>
                  {(['light', 'dark'] as const).map((name) => {
                    const selected = selectedTheme === name;
                    return (
                      <Pressable
                        key={name}
                        accessibilityRole="button"
                        accessibilityLabel={name === 'light' ? 'Light' : 'Dark'}
                        onPress={() => updateSettings({ theme: name })}
                        style={({ pressed }) => [
                          styles.tab,
                          selected && styles.tabSelected,
                          pressed && !selected && styles.pressed,
                        ]}>
                        <ThemedText
                          themeColor={selected ? 'text' : 'textSecondary'}
                          style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
                          {name === 'light' ? 'Light' : 'Dark'}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

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

              <View style={styles.field}>
                <ThemedText type="smallBold">Data</ThemedText>
                <View style={styles.addRow}>
                  <Pressable
                    onPress={() => void handleExport()}
                    style={({ pressed }) => [styles.dataButton, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
                    <ThemedText style={exportCopied ? styles.savedLabel : undefined}>
                      {exportCopied ? 'Copied' : 'Export'}
                    </ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={() => setImportOpen(true)}
                    style={({ pressed }) => [styles.dataButton, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
                    <ThemedText>Import</ThemedText>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleReset}
                style={({ pressed }) => [styles.button, { backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
                <ThemedText themeColor="textSecondary">Reset defaults</ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <PromptField
                label="Reply prompt"
                value={editingPrompts.reply ? replyPrompt : (settings.replyPrompt ?? DEFAULT_SETTINGS.replyPrompt)}
                onChangeText={setReplyPrompt}
                placeholder={DEFAULT_SETTINGS.replyPrompt}
                editing={editingPrompts.reply}
                onEdit={() => handleEditPrompt('reply')}
                onSave={() => handleSavePrompt('reply')}
              />

              {replyTags.length > 0 ? (
                <View style={styles.field}>
                  <ThemedText type="smallBold">Tag prompts</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Empty tag prompts use the default Reply prompt.
                  </ThemedText>
                  {replyTags.map((tag) => {
                    const key = tag.toLowerCase();
                    const editing = editingTagKey === key;
                    const stored = settings.replyTagPrompts?.[key] ?? '';
                    return (
                      <PromptField
                        key={key}
                        label={tag}
                        value={editing ? tagPromptDraft : stored}
                        onChangeText={setTagPromptDraft}
                        placeholder={defaultReplyPrompt}
                        editing={editing}
                        onEdit={() => handleEditTagPrompt(tag)}
                        onSave={handleSaveTagPrompt}
                      />
                    );
                  })}
                </View>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Add tags on the Reply tab to set per-tag prompts.
                </ThemedText>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <TextEditorModal
        visible={importOpen}
        title="Import JSON"
        initialValue=""
        placeholder="Paste JSON"
        saveLabel="Import"
        showPaste
        onClose={() => setImportOpen(false)}
        onSave={handleImport}
      />
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
  const [folded, setFolded] = useState(true);
  const [lineCount, setLineCount] = useState(0);
  const displayValue = value.trim() ? value : placeholder;

  useEffect(() => {
    if (editing) {
      setFolded(false);
      inputRef.current?.focus();
      return;
    }
    inputRef.current?.blur();
  }, [editing]);

  const handleToggleFold = () => {
    if (editing) return;
    if (folded) {
      setFolded(false);
      return;
    }
    if (lineCount > 2) {
      setFolded(true);
    }
  };

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
      {editing ? (
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          multiline
          textAlignVertical="top"
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, styles.prompt, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
      ) : (
        <Pressable
          onPress={handleToggleFold}
          style={[styles.input, styles.prompt, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText
            themeColor={value.trim() ? 'text' : 'textSecondary'}
            numberOfLines={folded ? 2 : undefined}
            ellipsizeMode="tail"
            onLayout={(event) => {
              if (folded) return;
              const height = event.nativeEvent.layout.height;
              if (height > 0) {
                setLineCount(Math.ceil((height - 1) / 22));
              }
            }}
            onTextLayout={(event) => {
              if (folded) return;
              const count = event.nativeEvent.lines?.length ?? 0;
              if (count > 0) setLineCount(count);
            }}
            style={styles.promptText}>
            {displayValue}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    padding: 3,
    borderRadius: 12,
    gap: 3,
  },
  appearance: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    gap: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabSelected: {
    backgroundColor: '#000000',
  },
  tabLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 600,
  },
  tabLabelSelected: {
    color: '#FFFFFF',
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
    minHeight: 52,
  },
  promptText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 400,
    opacity: 0.7,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  dataButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 42,
  },
  savedLabel: {
    color: '#16A34A',
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
