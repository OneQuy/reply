import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useTheme } from '@/hooks/use-theme';
import { showAlert } from '@/lib/alert';
import { parseBackup, serializeBackup } from '@/lib/backup';
import { fetchLatestBackup, setLatestBackup } from '@/lib/jsonbin';
import { parseCostWarnAt, parseFlashSeconds, parseRequestTimeoutSeconds } from '@/lib/storage';
import { DEFAULT_SETTINGS, RANDOM_MODEL, type AppTheme } from '@/types/app';

const HANDLE_ELEBEAN = '@elebean_app';
const HANDLE_MUSIC = '@elebeanmusicapp';

function replaceHandleInText(text: string, from: string, to: string) {
  return text.split(from).join(to);
}

export default function SettingScreen() {
  const theme = useTheme();
  const scrollRef = useTabScrollToTop();
  const { items, settings, updateSettings, replaceData } = useAppState();
  const models = settings.models?.length ? settings.models : [settings.model];
  const [newModel, setNewModel] = useState('');
  const [prompt, setPrompt] = useState(settings.prompt);
  const [replyPrompt, setReplyPrompt] = useState(settings.replyPrompt ?? DEFAULT_SETTINGS.replyPrompt);
  const [flashSeconds, setFlashSeconds] = useState(String(settings.flashSeconds));
  const [flashSaved, setFlashSaved] = useState(false);
  const [costWarnAt, setCostWarnAt] = useState(String(settings.costWarnAt ?? DEFAULT_SETTINGS.costWarnAt));
  const [costWarnSaved, setCostWarnSaved] = useState(false);
  const [requestTimeoutSeconds, setRequestTimeoutSeconds] = useState(
    String(settings.requestTimeoutSeconds ?? DEFAULT_SETTINGS.requestTimeoutSeconds),
  );
  const [requestTimeoutSaved, setRequestTimeoutSaved] = useState(false);
  const [editingPrompts, setEditingPrompts] = useState({
    wording: false,
    reply: false,
  });
  const [editingTagKey, setEditingTagKey] = useState<string | null>(null);
  const [tagPromptDraft, setTagPromptDraft] = useState('');
  const [tab, setTab] = useState<'general' | 'reply'>('general');
  const [exportCopied, setExportCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [syncBusy, setSyncBusy] = useState<'set' | 'sync' | null>(null);
  const [setLatestDone, setSetLatestDone] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const replyTags = settings.replyTags ?? [];
  const defaultReplyPrompt = settings.replyPrompt ?? DEFAULT_SETTINGS.replyPrompt;
  const themeOptions: { value: AppTheme; label: string }[] = [
    { value: 'system', label: 'Auto' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  useEffect(() => {
    setFlashSeconds(String(settings.flashSeconds));
  }, [settings.flashSeconds]);

  useEffect(() => {
    setCostWarnAt(String(settings.costWarnAt ?? DEFAULT_SETTINGS.costWarnAt));
  }, [settings.costWarnAt]);

  useEffect(() => {
    setRequestTimeoutSeconds(String(settings.requestTimeoutSeconds ?? DEFAULT_SETTINGS.requestTimeoutSeconds));
  }, [settings.requestTimeoutSeconds]);

  const handleSelectModel = (name: string) => {
    if (name === settings.model) return;
    updateSettings({ model: name });
  };

  const handleAddModel = () => {
    const next = newModel.trim();
    if (!next || next === RANDOM_MODEL) return;
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
    setEditingPrompts((current) => ({ ...current, [key]: true }));
  };

  const handleSavePrompt = (key: keyof typeof editingPrompts) => {
    if (key === 'wording') {
      const next = prompt.trim() || DEFAULT_SETTINGS.prompt;
      setPrompt(next);
      updateSettings({ prompt: next });
    } else {
      const next = replyPrompt.trim() || DEFAULT_SETTINGS.replyPrompt;
      setReplyPrompt(next);
      updateSettings({ replyPrompt: next });
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

  const handleSaveCostWarn = () => {
    const next = parseCostWarnAt(costWarnAt);
    setCostWarnAt(String(next));
    updateSettings({ costWarnAt: next });
    setCostWarnSaved(true);
    setTimeout(() => setCostWarnSaved(false), 1600);
  };

  const handleSaveRequestTimeout = () => {
    const next = parseRequestTimeoutSeconds(requestTimeoutSeconds);
    setRequestTimeoutSeconds(String(next));
    updateSettings({ requestTimeoutSeconds: next });
    setRequestTimeoutSaved(true);
    setTimeout(() => setRequestTimeoutSaved(false), 1600);
  };

  const applyImportedState = (
    nextPrompt: string,
    nextReplyPrompt: string,
    nextFlash: number,
    nextCostWarnAt: number,
    nextRequestTimeoutSeconds: number,
  ) => {
    setNewModel('');
    setPrompt(nextPrompt);
    setReplyPrompt(nextReplyPrompt);
    setFlashSeconds(String(nextFlash));
    setCostWarnAt(String(nextCostWarnAt));
    setRequestTimeoutSeconds(String(nextRequestTimeoutSeconds));
    setEditingPrompts({ wording: false, reply: false });
    setEditingTagKey(null);
    setTagPromptDraft('');
  };

  const handleReset = () => {
    applyImportedState(
      DEFAULT_SETTINGS.prompt,
      DEFAULT_SETTINGS.replyPrompt,
      DEFAULT_SETTINGS.flashSeconds,
      DEFAULT_SETTINGS.costWarnAt,
      DEFAULT_SETTINGS.requestTimeoutSeconds,
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
        backup.settings.flashSeconds,
        backup.settings.costWarnAt ?? DEFAULT_SETTINGS.costWarnAt,
        backup.settings.requestTimeoutSeconds ?? DEFAULT_SETTINGS.requestTimeoutSeconds,
      );
      setImportOpen(false);
    } catch {
      showAlert('Invalid JSON');
    }
  };

  const handleSetLatest = async () => {
    if (syncBusy) return;
    setSyncBusy('set');
    try {
      await setLatestBackup(items, settings);
      setSetLatestDone(true);
      setTimeout(() => setSetLatestDone(false), 1600);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to set latest');
    } finally {
      setSyncBusy(null);
    }
  };

  const handleSync = async () => {
    if (syncBusy) return;
    setSyncBusy('sync');
    try {
      const backup = await fetchLatestBackup();
      replaceData(backup.items, backup.settings);
      applyImportedState(
        backup.settings.prompt,
        backup.settings.replyPrompt,
        backup.settings.flashSeconds,
        backup.settings.costWarnAt ?? DEFAULT_SETTINGS.costWarnAt,
        backup.settings.requestTimeoutSeconds ?? DEFAULT_SETTINGS.requestTimeoutSeconds,
      );
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 1600);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to sync');
    } finally {
      setSyncBusy(null);
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

  const handleSelectAppHandle = (target: typeof HANDLE_ELEBEAN | typeof HANDLE_MUSIC) => {
    const from = target === HANDLE_MUSIC ? HANDLE_ELEBEAN : HANDLE_MUSIC;
    const nextPrompt = replaceHandleInText(settings.prompt, from, target);
    const nextReplyPrompt = replaceHandleInText(
      settings.replyPrompt ?? DEFAULT_SETTINGS.replyPrompt,
      from,
      target,
    );
    const nextTagPrompts: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings.replyTagPrompts ?? {})) {
      nextTagPrompts[key] = replaceHandleInText(value, from, target);
    }
    const nextItems = items.map((item) => ({
      ...item,
      text: replaceHandleInText(item.text, from, target),
    }));

    setPrompt(nextPrompt);
    setReplyPrompt(nextReplyPrompt);
    if (editingTagKey) {
      setTagPromptDraft(replaceHandleInText(tagPromptDraft, from, target));
    }
    replaceData(nextItems, {
      ...settings,
      prompt: nextPrompt,
      replyPrompt: nextReplyPrompt,
      replyTagPrompts: nextTagPrompts,
    });
  };

  const activeAppHandle = [
    settings.prompt,
    settings.replyPrompt,
    ...Object.values(settings.replyTagPrompts ?? {}),
    ...items.map((item) => item.text),
  ].some((text) => text.includes(HANDLE_MUSIC))
    ? HANDLE_MUSIC
    : HANDLE_ELEBEAN;

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
                  {themeOptions.map((option) => {
                    const selected = (settings.theme ?? DEFAULT_SETTINGS.theme) === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityLabel={option.label}
                        onPress={() => updateSettings({ theme: option.value })}
                        style={({ pressed }) => [
                          styles.tab,
                          selected && styles.tabSelected,
                          pressed && !selected && styles.pressed,
                        ]}>
                        <ThemedText
                          themeColor={selected ? 'text' : 'textSecondary'}
                          style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
                          {option.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold">Model</ThemedText>
                <View style={styles.modelList}>
                  <Pressable
                    onPress={() => handleSelectModel(RANDOM_MODEL)}
                    style={({ pressed }) => [
                      styles.modelRow,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons
                      name={settings.model === RANDOM_MODEL ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={settings.model === RANDOM_MODEL ? theme.text : theme.textSecondary}
                    />
                    <ThemedText style={styles.modelName}>Random</ThemedText>
                  </Pressable>
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
                          size={16}
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

              <View style={styles.field}>
                <ThemedText type="smallBold">App mention</ThemedText>
                <View style={[styles.appearance, { backgroundColor: theme.backgroundElement }]}>
                  {([HANDLE_ELEBEAN, HANDLE_MUSIC] as const).map((handle) => {
                    const selected = activeAppHandle === handle;
                    return (
                      <Pressable
                        key={handle}
                        accessibilityRole="button"
                        accessibilityLabel={handle}
                        onPress={() => handleSelectAppHandle(handle)}
                        style={({ pressed }) => [
                          styles.tab,
                          selected && styles.tabSelected,
                          pressed && !selected && styles.pressed,
                        ]}>
                        <ThemedText
                          themeColor={selected ? 'text' : 'textSecondary'}
                          style={[styles.tabLabel, selected && styles.tabLabelSelected]}
                          numberOfLines={1}>
                          {handle}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

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
                <View style={styles.fieldHeader}>
                  <ThemedText type="smallBold">Cost warn at ($)</ThemedText>
                  <Pressable
                    onPress={handleSaveCostWarn}
                    hitSlop={6}
                    style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
                    <ThemedText type="small" style={costWarnSaved ? styles.savedLabel : undefined}>
                      {costWarnSaved ? 'Saved' : 'Save'}
                    </ThemedText>
                  </Pressable>
                </View>
                <TextInput
                  value={costWarnAt}
                  onChangeText={setCostWarnAt}
                  keyboardType="decimal-pad"
                  placeholder={String(DEFAULT_SETTINGS.costWarnAt)}
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />
              </View>

              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <ThemedText type="smallBold">Request timeout (seconds)</ThemedText>
                  <Pressable
                    onPress={handleSaveRequestTimeout}
                    hitSlop={6}
                    style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
                    <ThemedText type="small" style={requestTimeoutSaved ? styles.savedLabel : undefined}>
                      {requestTimeoutSaved ? 'Saved' : 'Save'}
                    </ThemedText>
                  </Pressable>
                </View>
                <TextInput
                  value={requestTimeoutSeconds}
                  onChangeText={setRequestTimeoutSeconds}
                  keyboardType="number-pad"
                  placeholder={String(DEFAULT_SETTINGS.requestTimeoutSeconds)}
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
                <View style={styles.addRow}>
                  <Pressable
                    onPress={() => void handleSetLatest()}
                    disabled={syncBusy !== null}
                    style={({ pressed }) => [
                      styles.dataButton,
                      { backgroundColor: theme.backgroundElement },
                      pressed && !syncBusy && styles.pressed,
                      syncBusy !== null && styles.disabled,
                    ]}>
                    {syncBusy === 'set' ? (
                      <ActivityIndicator color={theme.text} />
                    ) : (
                      <ThemedText style={setLatestDone ? styles.savedLabel : undefined}>
                        {setLatestDone ? 'Saved' : 'Set latest'}
                      </ThemedText>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => void handleSync()}
                    disabled={syncBusy !== null}
                    style={({ pressed }) => [
                      styles.dataButton,
                      { backgroundColor: theme.backgroundElement },
                      pressed && !syncBusy && styles.pressed,
                      syncBusy !== null && styles.disabled,
                    ]}>
                    {syncBusy === 'sync' ? (
                      <ActivityIndicator color={theme.text} />
                    ) : (
                      <ThemedText style={syncDone ? styles.savedLabel : undefined}>
                        {syncDone ? 'Synced' : 'Sync'}
                      </ThemedText>
                    )}
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
    paddingBottom: Spacing.six + Spacing.five + BottomTabInset,
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
    gap: 4,
  },
  modelRow: {
    minHeight: 32,
    borderRadius: 10,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  modelName: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
  disabled: {
    opacity: 0.5,
  },
});
