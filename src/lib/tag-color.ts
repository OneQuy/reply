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

export function getTagColor(tag: string, dark: boolean): TagColor {
  const palette = dark ? DARK_TAG_COLORS : LIGHT_TAG_COLORS;
  return palette[hashTag(tag) % palette.length];
}
