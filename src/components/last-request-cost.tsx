import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppState } from '@/context/app-state';
import { DEFAULT_SETTINGS } from '@/types/app';

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
  const { lastRequest, settings } = useAppState();
  if (!lastRequest) {
    return null;
  }

  const cost = formatRequestCost(lastRequest.cost);
  const label = lastRequest.model ? `${cost} - ${lastRequest.model}` : cost;
  const warnAt = settings.costWarnAt ?? DEFAULT_SETTINGS.costWarnAt;
  const hasCost = lastRequest.cost != null && Number.isFinite(lastRequest.cost);
  const expensive = hasCost && lastRequest.cost! >= warnAt;

  return (
    <ThemedText
      type="small"
      themeColor={hasCost ? undefined : 'textSecondary'}
      style={[styles.text, hasCost && (expensive ? styles.expensive : styles.cheap)]}>
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
  cheap: {
    color: '#16A34A',
    fontWeight: 400,
  },
  expensive: {
    color: '#DC2626',
    fontWeight: 700,
  },
});
