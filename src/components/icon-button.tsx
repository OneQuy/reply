import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
};

export function IconButton({ name, onPress, disabled, loading, danger }: IconButtonProps) {
  const theme = useTheme();
  const color = danger ? '#E5484D' : theme.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, (disabled || loading) && styles.disabled]}>
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons name={name} size={16} color={color} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  disabled: {
    opacity: 0.4,
  },
});
