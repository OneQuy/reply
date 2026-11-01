export type WordingItem = {
  id: string;
  text: string;
};

export type AppSettings = {
  model: string;
  prompt: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  model: 'google/gemini-2.5-flash-lite',
  prompt:
    'wording the text, use difference words, keep the exact meaning. only return the text result, not anything else',
};
