import type { TagRgb } from '@/types/app';

type TagColor = {
  backgroundColor: string;
  color: string;
};

const LIGHT_TAG_COLORS: TagColor[] = [
  { backgroundColor: '#FF4D4F', color: '#FFFFFF' },
  { backgroundColor: '#FF7A45', color: '#FFFFFF' },
  { backgroundColor: '#FA8C16', color: '#FFFFFF' },
  { backgroundColor: '#FFC53D', color: '#5C3B00' },
  { backgroundColor: '#FADB14', color: '#5C4B00' },
  { backgroundColor: '#A0D911', color: '#254000' },
  { backgroundColor: '#52C41A', color: '#FFFFFF' },
  { backgroundColor: '#13C2C2', color: '#FFFFFF' },
  { backgroundColor: '#1890FF', color: '#FFFFFF' },
  { backgroundColor: '#2F54EB', color: '#FFFFFF' },
  { backgroundColor: '#722ED1', color: '#FFFFFF' },
  { backgroundColor: '#EB2F96', color: '#FFFFFF' },
  { backgroundColor: '#F759AB', color: '#FFFFFF' },
  { backgroundColor: '#FF85C0', color: '#5C1030' },
  { backgroundColor: '#FF4D6D', color: '#FFFFFF' },
  { backgroundColor: '#C41D7F', color: '#FFFFFF' },
];

const DARK_TAG_COLORS: TagColor[] = [
  { backgroundColor: '#FF4D4F', color: '#FFFFFF' },
  { backgroundColor: '#FF7A45', color: '#FFFFFF' },
  { backgroundColor: '#FA8C16', color: '#FFFFFF' },
  { backgroundColor: '#FFC53D', color: '#3D2800' },
  { backgroundColor: '#FADB14', color: '#3D3200' },
  { backgroundColor: '#A0D911', color: '#1A2E00' },
  { backgroundColor: '#52C41A', color: '#FFFFFF' },
  { backgroundColor: '#13C2C2', color: '#FFFFFF' },
  { backgroundColor: '#1890FF', color: '#FFFFFF' },
  { backgroundColor: '#2F54EB', color: '#FFFFFF' },
  { backgroundColor: '#722ED1', color: '#FFFFFF' },
  { backgroundColor: '#EB2F96', color: '#FFFFFF' },
  { backgroundColor: '#F759AB', color: '#FFFFFF' },
  { backgroundColor: '#FF85C0', color: '#3D0A20' },
  { backgroundColor: '#FF4D6D', color: '#FFFFFF' },
  { backgroundColor: '#C41D7F', color: '#FFFFFF' },
];

function hashTag(tag: string): number {
  let hash = 2166136261;
  for (const char of tag.toLowerCase()) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function clampRgbChannel(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(255, Math.max(1, Math.round(value)));
}

export function randomTagRgb(): TagRgb {
  return {
    r: Math.floor(Math.random() * 255) + 1,
    g: Math.floor(Math.random() * 255) + 1,
    b: Math.floor(Math.random() * 255) + 1,
  };
}

export function normalizeTagRgb(value: unknown): TagRgb | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  const r = typeof data.r === 'number' ? data.r : typeof data.r === 'string' ? Number(data.r) : NaN;
  const g = typeof data.g === 'number' ? data.g : typeof data.g === 'string' ? Number(data.g) : NaN;
  const b = typeof data.b === 'number' ? data.b : typeof data.b === 'string' ? Number(data.b) : NaN;
  if (![r, g, b].every((channel) => Number.isFinite(channel))) return null;
  return {
    r: clampRgbChannel(r),
    g: clampRgbChannel(g),
    b: clampRgbChannel(b),
  };
}

export function parseTagColors(value: unknown): Record<string, TagRgb> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const colors: Record<string, TagRgb> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const tag = key.trim().toLowerCase();
    const rgb = normalizeTagRgb(entry);
    if (!tag || !rgb) continue;
    colors[tag] = rgb;
  }
  return colors;
}

export function rgbToCss({ r, g, b }: TagRgb): string {
  return `rgb(${clampRgbChannel(r)}, ${clampRgbChannel(g)}, ${clampRgbChannel(b)})`;
}

export function contrastTextForRgb({ r, g, b }: TagRgb): string {
  const luminance = (0.299 * clampRgbChannel(r) + 0.587 * clampRgbChannel(g) + 0.114 * clampRgbChannel(b)) / 255;
  return luminance > 0.6 ? '#1A1A1A' : '#FFFFFF';
}

export function colorFromRgb(rgb: TagRgb): TagColor {
  return {
    backgroundColor: rgbToCss(rgb),
    color: contrastTextForRgb(rgb),
  };
}

export function getTagColor(tag: string, dark: boolean, custom?: TagRgb | null): TagColor {
  if (custom) return colorFromRgb(custom);
  const palette = dark ? DARK_TAG_COLORS : LIGHT_TAG_COLORS;
  return palette[hashTag(tag) % palette.length];
}
