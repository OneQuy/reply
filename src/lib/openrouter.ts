import Constants from 'expo-constants';

import { DEFAULT_SETTINGS } from '@/types/app';

function getOpenRouterApiKey(): string {
  const extraKey = Constants.expoConfig?.extra?.openRouterApiKey;
  if (typeof extraKey === 'string' && extraKey.trim()) {
    return extraKey.trim();
  }

  const publicKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY_onequy;
  if (typeof publicKey === 'string' && publicKey.trim()) {
    return publicKey.trim();
  }

  return '';
}

function cleanResult(text: string): string {
  return text
    .trim()
    .replace(/^```[\w]*\n?/, '')
    .replace(/\n?```$/, '')
    .replace(/^["']|["']$/g, '')
    .trim();
}

export type CompletionResult = {
  text: string;
  cost: number | null;
};

export async function wordingText(
  text: string,
  model: string,
  prompt: string,
  timeoutSeconds: number = DEFAULT_SETTINGS.requestTimeoutSeconds,
): Promise<CompletionResult> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error('Missing OpenRouter API key');
  }

  const seconds = Number.isFinite(timeoutSeconds) && timeoutSeconds >= 1 ? timeoutSeconds : DEFAULT_SETTINGS.requestTimeoutSeconds;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), seconds * 1000);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        usage: { include: true },
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\n${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed (${response.status})`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { cost?: number };
    };
    const result = data.choices?.[0]?.message?.content;
    if (!result?.trim()) {
      throw new Error('Empty wording result');
    }

    const cost = typeof data.usage?.cost === 'number' && Number.isFinite(data.usage.cost) ? data.usage.cost : null;
    return { text: cleanResult(result), cost };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(seconds)}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
