import { PasteActionScreen } from '@/components/paste-action-screen';
import { useAppState } from '@/context/app-state';
import { DEFAULT_SETTINGS } from '@/types/app';

export default function SmoothScreen() {
  const { settings } = useAppState();

  return (
    <PasteActionScreen
      prompt={settings.smoothPrompt || DEFAULT_SETTINGS.smoothPrompt}
      emptyText="Paste your text to smoothen it and fix the grammar."
    />
  );
}
