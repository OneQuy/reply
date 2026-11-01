import Constants from 'expo-constants';

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

export async function wordingText(text: string, model: string, prompt: string): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error('Missing OpenRouter API key');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
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
  };
  const result = data.choices?.[0]?.message?.content;
  if (!result?.trim()) {
    throw new Error('Empty wording result');
  }

  return cleanResult(result);
}
