import Constants from 'expo-constants';

import { parseBackup, type AppBackup } from '@/lib/backup';
import type { AppSettings, WordingItem } from '@/types/app';

const API_ROOT = 'https://api.jsonbin.io/v3';

type JsonBinConfig = {
  apiKey: string;
  binId: string;
};

function readExtraString(key: string): string {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const value = extra?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readPublicEnv(name: 'EXPO_PUBLIC_JSONBIN_API_KEY' | 'EXPO_PUBLIC_JSONBIN_BIN_ID'): string {
  // Metro inlines EXPO_PUBLIC_* at export time. Prefer app.config `extra` when present —
  // Expo dotenv can expand `$` inside JSONBin keys that look like `$2a$...`.
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function getJsonBinConfig(): JsonBinConfig {
  const apiKey = readExtraString('jsonbinApiKey') || readPublicEnv('EXPO_PUBLIC_JSONBIN_API_KEY');
  const binId = readExtraString('jsonbinBinId') || readPublicEnv('EXPO_PUBLIC_JSONBIN_BIN_ID');

  return { apiKey, binId };
}

export function isJsonBinConfigured(): boolean {
  const { apiKey, binId } = getJsonBinConfig();
  return Boolean(apiKey && binId);
}

function authHeaders(apiKey: string): Record<string, string> {
  // JSONBin Access Keys (common for scoped sync) must use X-Access-Key.
  // Master Keys also work with this header name on current API routes when the key is valid.
  return { 'X-Access-Key': apiKey };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: unknown };
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }
  } catch {
    // ignore parse errors
  }
  return `JSONBin request failed (${response.status})`;
}

export async function setLatestBackup(items: WordingItem[], settings: AppSettings): Promise<void> {
  const { apiKey, binId } = getJsonBinConfig();
  if (!apiKey || !binId) {
    throw new Error(
      'JSONBin is not configured for this build. Set EXPO_PUBLIC_JSONBIN_API_KEY and EXPO_PUBLIC_JSONBIN_BIN_ID, then re-export/deploy.',
    );
  }

  const response = await fetch(`${API_ROOT}/b/${encodeURIComponent(binId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(apiKey),
      'X-Bin-Versioning': 'false',
    },
    body: JSON.stringify({ items, settings }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

export async function fetchLatestBackup(): Promise<AppBackup> {
  const { apiKey, binId } = getJsonBinConfig();
  if (!apiKey || !binId) {
    throw new Error(
      'JSONBin is not configured for this build. Set EXPO_PUBLIC_JSONBIN_API_KEY and EXPO_PUBLIC_JSONBIN_BIN_ID, then re-export/deploy.',
    );
  }

  const response = await fetch(`${API_ROOT}/b/${encodeURIComponent(binId)}/latest`, {
    method: 'GET',
    headers: {
      ...authHeaders(apiKey),
      'X-Bin-Meta': 'false',
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = await response.json();
  return parseBackup(JSON.stringify(data));
}
