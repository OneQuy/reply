import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

export default function ReplyScreen() {
  return (
    <Screen title="Reply">
      <View style={styles.body}>
        <ThemedText themeColor="textSecondary">Reply tab is ready for the next feature.</ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
