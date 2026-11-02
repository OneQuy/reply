import { parseItems, parseSettings } from '@/lib/storage';
import type { AppSettings, WordingItem } from '@/types/app';

export type AppBackup = {
  items: WordingItem[];
  settings: AppSettings;
};

export function serializeBackup(items: WordingItem[], settings: AppSettings): string {
  return JSON.stringify({ items, settings });
}

export function parseBackup(raw: string): AppBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid JSON');
  }

  const data = parsed as Record<string, unknown>;
  if (!('items' in data) || !('settings' in data)) {
    throw new Error('Invalid JSON');
  }
  if (!Array.isArray(data.items) || !data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) {
    throw new Error('Invalid JSON');
  }

  return {
    items: parseItems(data.items),
    settings: parseSettings(data.settings),
  };
}
