import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { wordingText } from '@/lib/openrouter';
import { type AppSettings, type WordingItem } from '@/types/app';

type FlashState = 'idle' | 'success' | 'error';

type WordingCardProps = {
  item: WordingItem;
  width: number;
  settings: AppSettings;
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
};

export function WordingCard({ item, width, settings, onEdit, onPin, onDelete }: WordingCardProps) {
  const theme = useTheme();
  const [flash, setFlash] = useState<FlashState>('idle');
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const flashFor = (state: FlashState, duration: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setFlash(state);
    timeoutRef.current = setTimeout(() => {
      setFlash('idle');
      timeoutRef.current = null;
    }, duration);
  };

  const handleWording = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await wordingText(item.text, settings.model, settings.prompt);
      await Clipboard.setStringAsync(result);
      flashFor('success', 5000);
    } catch {
      flashFor('error', 1600);
    } finally {
      setLoading(false);
    }
  };

  const backgroundColor =
    flash === 'success' ? '#22C55E' : flash === 'error' ? '#F87171' : theme.backgroundElement;
  const textColor = flash === 'idle' ? theme.text : '#0B1B0E';

  return (
    <View style={[styles.card, { width, backgroundColor }]}>
      <ThemedText numberOfLines={4} style={[styles.text, { color: textColor }]}>
        {item.text}
      </ThemedText>
      <View style={styles.actions}>
        <IconButton name="color-wand-outline" onPress={() => void handleWording()} loading={loading} />
        <IconButton name="pencil-outline" onPress={onEdit} disabled={loading} />
        <IconButton name="pin-outline" onPress={onPin} disabled={loading} />
        <IconButton name="trash-outline" onPress={onDelete} disabled={loading} danger />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 132,
    borderRadius: 14,
    padding: Spacing.two,
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 500,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
