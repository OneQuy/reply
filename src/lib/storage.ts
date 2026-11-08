import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseTagColors } from '@/lib/tag-color';
import { DEFAULT_SETTINGS, RANDOM_MODEL, type AppSettings, type AppTheme, type WordingItem } from '@/types/app';

const ITEMS_KEY = 'wording_items';
const SETTINGS_KEY = 'app_settings';

export function parseItems(value: unknown): WordingItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is WordingItem => Boolean(item && typeof item.id === 'string' && typeof item.text === 'string'))
    .map((item) => ({
      id: item.id,
      text: item.text,
      tags: normalizeTags(item.tags),
      folded: item.folded === true,
    }));
}

export function parseSettings(value: unknown): AppSettings {
  const parsed = value && typeof value === 'object' && !Array.isArray(value) ? (value as Partial<AppSettings>) : {};
  const { model, models } = parseModels(parsed);
  return {
    model,
    models,
    prompt: typeof parsed.prompt === 'string' && parsed.prompt.trim() ? parsed.prompt : DEFAULT_SETTINGS.prompt,
    replyPrompt:
      typeof parsed.replyPrompt === 'string' && parsed.replyPrompt.trim()
        ? parsed.replyPrompt
        : DEFAULT_SETTINGS.replyPrompt,
    replyTags: normalizeTags(parsed.replyTags),
    replyTagPrompts: parseTagPrompts(parsed.replyTagPrompts),
    tagColors: parseTagColors(parsed.tagColors),
    flashSeconds: parseFlashSeconds(parsed.flashSeconds),
    costWarnAt: parseCostWarnAt(parsed.costWarnAt),
    requestTimeoutSeconds: parseRequestTimeoutSeconds(parsed.requestTimeoutSeconds),
    theme: parseTheme(parsed.theme),
  };
}

export function parseTheme(value: unknown): AppTheme {
  return value === 'light' || value === 'dark' || value === 'system' ? value : DEFAULT_SETTINGS.theme;
}

export async function loadItems(): Promise<WordingItem[]> {
  const raw = await AsyncStorage.getItem(ITEMS_KEY);
  if (!raw) return [];

  try {
    return parseItems(JSON.parse(raw));
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
    return parseSettings(JSON.parse(raw));
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

export function parseCostWarnAt(value: unknown): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_SETTINGS.costWarnAt;
  }
  return parsed;
}

export function parseRequestTimeoutSeconds(value: unknown): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_SETTINGS.requestTimeoutSeconds;
  }
  return Math.round(parsed);
}

export function parseTagPrompts(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const prompts: Record<string, string> = {};
  for (const [key, prompt] of Object.entries(value as Record<string, unknown>)) {
    if (typeof prompt !== 'string') continue;
    const tag = key.trim().toLowerCase();
    const text = prompt.trim();
    if (!tag || !text) continue;
    prompts[tag] = text;
  }
  return prompts;
}

export function getReplyPromptForTag(settings: AppSettings, tag: string | null | undefined, fallback: string): string {
  if (!tag) return fallback;
  const tagged = settings.replyTagPrompts?.[tag.toLowerCase()];
  return tagged?.trim() || fallback;
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
    ? value.models
        .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
        .map((item) => item.trim())
        .filter((item) => item !== RANDOM_MODEL)
    : [];
  const fallback = selected === RANDOM_MODEL ? DEFAULT_SETTINGS.model : selected;
  const models = [...new Set(listed.length ? listed : [fallback])];
  if (selected !== RANDOM_MODEL && !models.includes(selected)) {
    models.unshift(selected);
  }
  return { model: selected, models };
}

export function resolveOpenRouterModel(settings: Pick<AppSettings, 'model' | 'models'>): string {
  const models = settings.models?.filter((item) => item && item !== RANDOM_MODEL) ?? [];
  if (settings.model === RANDOM_MODEL) {
    if (models.length === 0) return DEFAULT_SETTINGS.model;
    return models[Math.floor(Math.random() * models.length)] ?? DEFAULT_SETTINGS.model;
  }
  if (typeof settings.model === 'string' && settings.model.trim()) {
    return settings.model.trim();
  }
  return models[0] ?? DEFAULT_SETTINGS.model;
}
