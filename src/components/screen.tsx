import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type ScreenProps = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Screen({ title, action, children }: ScreenProps) {
  const showHeader = Boolean(title || action);

  return (
    <ThemedView collapsable={false} style={styles.root}>
      <SafeAreaView collapsable={false} style={styles.safe} edges={['top', 'left', 'right']}>
        {showHeader ? (
          <View style={styles.header}>
            {title ? <ThemedText style={styles.title}>{title}</ThemedText> : null}
            {action}
          </View>
        ) : null}
        <View collapsable={false} style={styles.body}>
          {children}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
  },
  body: {
    flex: 1,
  },
});
