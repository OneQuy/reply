import { TabList, TabSlot, Tabs, TabTrigger, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <ThemedView style={styles.root}>
      <View style={styles.shell}>
        <Tabs style={styles.tabs}>
          <TabSlot style={styles.slot} />
          <TabList asChild>
            <CustomTabList>
              <TabTrigger name="wording" href="/" asChild>
                <TabButton>Wording</TabButton>
              </TabTrigger>
              <TabTrigger name="reply" href="/reply" asChild>
                <TabButton>Reply</TabButton>
              </TabTrigger>
              <TabTrigger name="smooth" href="/smooth" asChild>
                <TabButton>Smooth</TabButton>
              </TabTrigger>
              <TabTrigger name="setting" href="/setting" asChild>
                <TabButton>Setting</TabButton>
              </TabTrigger>
            </CustomTabList>
          </TabList>
        </Tabs>
      </View>
    </ThemedView>
  );
}

function TabButton({ children, isFocused, ref: _ref, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type={isFocused ? 'backgroundSelected' : 'backgroundElement'} style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  tabs: {
    flex: 1,
  },
  slot: {
    height: '100%',
  },
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
