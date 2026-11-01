import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getTagColor } from '@/lib/tag-color';

type TagPillProps = {
  label: string;
  selected?: boolean;
  compact?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
};

export function TagPill({ label, selected, compact, onPress, onRemove }: TagPillProps) {
  const scheme = useColorScheme();
  const colors = getTagColor(label, scheme === 'dark');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.pill,
        compact && styles.pillCompact,
        { backgroundColor: colors.backgroundColor },
        selected && { borderColor: colors.color },
        pressed && onPress && styles.pressed,
      ]}>
      <ThemedText style={[styles.label, compact && styles.labelCompact, { color: colors.color }]} numberOfLines={1}>
        {label}
      </ThemedText>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={4} style={({ pressed }) => pressed && styles.pressed}>
          <View style={compact ? styles.removeCompact : styles.remove}>
            <Ionicons name="close" size={compact ? 9 : 11} color={colors.color} />
          </View>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillCompact: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    gap: 1,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 600,
  },
  labelCompact: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: 600,
  },
  remove: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeCompact: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
