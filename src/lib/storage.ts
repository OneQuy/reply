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
    return parsed.filter((item) => item && typeof item.id === 'string' && typeof item.text === 'string');
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
    return {
      model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model : DEFAULT_SETTINGS.model,
      prompt: typeof parsed.prompt === 'string' && parsed.prompt.trim() ? parsed.prompt : DEFAULT_SETTINGS.prompt,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
