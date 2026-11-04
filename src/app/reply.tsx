import { PasteActionScreen } from '@/components/paste-action-screen';
import { useAppState } from '@/context/app-state';
import { DEFAULT_SETTINGS } from '@/types/app';

export default function ReplyScreen() {
  const { settings } = useAppState();

  return (
    <PasteActionScreen
      prompt={settings.replyPrompt || DEFAULT_SETTINGS.replyPrompt}
      emptyText="Paste a post or comment to generate a reply."
      showAgain
      showInput
      showTags
    />
  );
}
