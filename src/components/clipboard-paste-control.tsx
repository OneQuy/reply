import * as Clipboard from 'expo-clipboard';
import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ClipboardPasteControlProps = {
  onPaste: (text: string) => void;
  onEmpty?: () => void;
  disabled?: boolean;
  loading?: boolean;
  width: number;
  height: number;
  backgroundColor: string;
  foregroundColor: string;
  displayMode?: Clipboard.DisplayModeType;
  cornerStyle?: Clipboard.CornerStyleType;
  fallbackIcon?: ReactNode;
  fallbackLabel?: string;
  filledFallback?: boolean;
};

export function ClipboardPasteControl({
  onPaste,
  onEmpty,
  disabled = false,
  loading = false,
  width,
  height,
  backgroundColor,
  foregroundColor,
  displayMode = 'iconAndLabel',
  cornerStyle = 'large',
  fallbackIcon,
  fallbackLabel = 'Paste',
  filledFallback = true,
}: ClipboardPasteControlProps) {
  const emitPaste = (text: string) => {
    const source = text.trim();
    if (!source) {
      onEmpty?.();
      return;
    }
    onPaste(source);
  };

  const handleFallbackPaste = async () => {
    if (disabled || loading) return;
    emitPaste(await Clipboard.getStringAsync());
  };

  const handleNativePaste = (data: Clipboard.PasteEventPayload) => {
    if (disabled || loading) return;
    if (data.type !== 'text') {
      onEmpty?.();
      return;
    }
    emitPaste(data.text);
  };

  if (loading) {
    return (
      <View style={[filledFallback ? styles.filled : styles.text, { width, height, backgroundColor: filledFallback ? backgroundColor : undefined }]}>
        <ActivityIndicator color={foregroundColor} />
      </View>
    );
  }

  if (Clipboard.isPasteButtonAvailable && width > 0 && height > 0) {
    return (
      <Clipboard.ClipboardPasteButton
        displayMode={displayMode}
        cornerStyle={cornerStyle}
        backgroundColor={backgroundColor}
        foregroundColor={foregroundColor}
        acceptedContentTypes={['plain-text', 'url']}
        onPress={handleNativePaste}
        pointerEvents={disabled ? 'none' : 'auto'}
        style={{ width, height }}
      />
    );
  }

  return (
    <Pressable
      onPress={() => void handleFallbackPaste()}
      disabled={disabled}
      style={({ pressed }) => [
        filledFallback ? styles.filled : styles.text,
        filledFallback ? { width, height, backgroundColor } : undefined,
        pressed && !disabled && styles.pressed,
      ]}>
      {fallbackIcon}
      <ThemedText style={[filledFallback ? styles.filledLabel : styles.textLabel, { color: foregroundColor }]}>{fallbackLabel}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filled: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  text: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledLabel: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
  },
  textLabel: {
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
