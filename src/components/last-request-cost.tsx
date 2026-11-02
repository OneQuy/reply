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

  const cost = formatRequestCost(lastRequest.cost);
  const label = lastRequest.model ? `${cost} - ${lastRequest.model}` : cost;

  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.text}>
      {label}
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
