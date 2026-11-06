import * as Clipboard from 'expo-clipboard';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type ClipboardPasteControlProps = {
  onPaste: (text: string) => void;
  onEmpty?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** When true the control is drawn by us (e.g. success flash) instead of the native UIPasteControl. */
  highlighted?: boolean;
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

/**
 * How long to wait for the native UIPasteControl to deliver its paste event after a tap before
 * falling back to reading the clipboard directly. UIKit silently disables the control (dimmed,
 * ignores taps) when it decides the pasteboard content does not match, or that the control was
 * obscured/too small; the tap then still reaches the wrapping Pressable and we paste manually.
 */
const NATIVE_PASTE_GRACE_MS = 400;

export function ClipboardPasteControl({
  onPaste,
  onEmpty,
  disabled = false,
  loading = false,
  highlighted = false,
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
  // Mount a fresh native instance every time the app becomes active: a UIPasteControl that was
  // created or re-evaluated while the app was not active can come back blank/disabled.
  const [nativeInstance, setNativeInstance] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNativeInstance((current) => current + 1);
      }
    });
    return () => sub.remove();
  }, []);

  const interactive = !disabled && !loading;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const lastNativePasteAtRef = useRef(0);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  const emitPaste = (text: string) => {
    const source = text.trim();
    if (!source) {
      onEmpty?.();
      return;
    }
    onPaste(source);
  };

  const readClipboard = async () => {
    if (!interactiveRef.current) return;
    emitPaste(await Clipboard.getStringAsync());
  };

  const handleNativePaste = (data: Clipboard.PasteEventPayload) => {
    lastNativePasteAtRef.current = Date.now();
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (!interactiveRef.current) return;
    if (data.type !== 'text') {
      onEmpty?.();
      return;
    }
    emitPaste(data.text);
  };

  // Taps on the native control bubble up to this wrapper too. If the native control does not
  // report a paste shortly after, it was disabled by UIKit: read the clipboard ourselves.
  const handleWrapperPress = () => {
    if (!interactive) return;
    const pressedAt = Date.now();
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
    }
    fallbackTimerRef.current = setTimeout(() => {
      fallbackTimerRef.current = null;
      if (lastNativePasteAtRef.current >= pressedAt - NATIVE_PASTE_GRACE_MS) return;
      void readClipboard();
    }, NATIVE_PASTE_GRACE_MS);
  };

  const useNative = Clipboard.isPasteButtonAvailable && width > 0 && height > 0 && !loading && !highlighted;

  if (useNative) {
    // Nothing is ever drawn on top of the native control (UIKit disables an obscured UIPasteControl),
    // and its props never change while mounted (every prop change rebuilds the UIPasteControl).
    return (
      <Pressable
        onPress={handleWrapperPress}
        disabled={!interactive}
        accessibilityRole="button"
        accessibilityLabel={fallbackLabel}
        style={{ width, height }}>
        <Clipboard.ClipboardPasteButton
          key={nativeInstance}
          displayMode={displayMode}
          cornerStyle={cornerStyle}
          backgroundColor={backgroundColor}
          foregroundColor={foregroundColor}
          acceptedContentTypes={['plain-text', 'url']}
          onPress={handleNativePaste}
          style={{ width, height }}
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => void readClipboard()}
      disabled={!interactive}
      style={({ pressed }) => [
        filledFallback ? styles.filled : styles.text,
        filledFallback ? { width, height, backgroundColor } : undefined,
        pressed && interactive && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={foregroundColor} />
      ) : (
        <>
          {fallbackIcon}
          <ThemedText style={[filledFallback ? styles.filledLabel : styles.textLabel, { color: foregroundColor }]}>
            {fallbackLabel}
          </ThemedText>
        </>
      )}
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
