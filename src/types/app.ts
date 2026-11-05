export type WordingItem = {
  id: string;
  text: string;
  tags: string[];
  folded?: boolean;
};

export type AppTheme = 'light' | 'dark' | 'system';

export const RANDOM_MODEL = 'random';

export type AppSettings = {
  model: string;
  models: string[];
  prompt: string;
  replyPrompt: string;
  replyTags: string[];
  replyTagPrompts: Record<string, string>;
  flashSeconds: number;
  costWarnAt: number;
  requestTimeoutSeconds: number;
  theme: AppTheme;
};

export const DEFAULT_SETTINGS: AppSettings = {
  model: 'google/gemini-2.5-flash-lite',
  models: ['google/gemini-2.5-flash-lite', 'openai/gpt-4o-mini', 'openai/gpt-5.6-luna'],
  prompt:
    'wording the text, use difference words, keep the exact meaning. only return the text result, not anything else',
  replyPrompt:
    'This is a post/comment on social. Reply it as a comment. The reply should be helpful if they need help, or fun if there is place for joke etc depend on the situation of that text. And add @elebean_app as a music stats app as smooth as possible. Only return the text reply. Not anything else. Shortly. Prefer less than 20 words. But never over 500 chars',
  replyTags: [],
  replyTagPrompts: {},
  flashSeconds: 10,
  costWarnAt: 0.0001,
  requestTimeoutSeconds: 7,
  theme: 'system',
};
