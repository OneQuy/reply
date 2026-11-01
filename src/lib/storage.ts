import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_SETTINGS, type AppSettings, type WordingItem } from '@/types/app';

const ITEMS_KEY = 'wording_items';
const SETTINGS_KEY = 'app_settings';

export async function loadItems(): Promise<WordingItem[]> {
  const raw = await AsyncStorage.getItem(ITEMS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as WordingItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.id === 'string' && typeof item.text === 'string')
      .map((item) => ({ id: item.id, text: item.text, tags: normalizeTags(item.tags) }));
  } catch {
    return [];
  }
}

export async function saveItems(items: WordingItem[]): Promise<void> {
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const { model, models } = parseModels(parsed);
    return {
      model,
      models,
      prompt: typeof parsed.prompt === 'string' && parsed.prompt.trim() ? parsed.prompt : DEFAULT_SETTINGS.prompt,
      replyPrompt:
        typeof parsed.replyPrompt === 'string' && parsed.replyPrompt.trim()
          ? parsed.replyPrompt
          : DEFAULT_SETTINGS.replyPrompt,
      smoothPrompt:
        typeof parsed.smoothPrompt === 'string' && parsed.smoothPrompt.trim()
          ? parsed.smoothPrompt
          : DEFAULT_SETTINGS.smoothPrompt,
      flashSeconds: parseFlashSeconds(parsed.flashSeconds),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function parseFlashSeconds(value: unknown): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_SETTINGS.flashSeconds;
  }
  return Math.round(parsed);
}

export function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const tag = entry.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

export function parseModels(value: Partial<Pick<AppSettings, 'model' | 'models'>>): { model: string; models: string[] } {
  const selected = typeof value.model === 'string' && value.model.trim() ? value.model.trim() : DEFAULT_SETTINGS.model;
  const listed = Array.isArray(value.models)
    ? value.models.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim())
    : [];
  const models = [...new Set(listed.length ? listed : [selected])];
  if (!models.includes(selected)) {
    models.unshift(selected);
  }
  return { model: selected, models };
}
