import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppState } from '@/context/app-state';

export function formatRequestCost(cost: number | null): string {
  if (cost == null || !Number.isFinite(cost)) {
    return 'cost unavailable';
  }
  if (cost === 0) {
    return '$0';
  }
  const digits = cost < 0.0001 ? 6 : cost < 0.01 ? 5 : 4;
  return `$${cost.toFixed(digits)}`.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

export function LastRequestCost() {
  const { lastRequest } = useAppState();
  if (!lastRequest) {
    return null;
  }

  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
      Last request {formatRequestCost(lastRequest.cost)}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 400,
  },
});
