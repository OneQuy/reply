import { useScrollToTop } from 'expo-router';
import { type ComponentRef, useRef } from 'react';
import { ScrollView } from 'react-native';

export function useTabScrollToTop() {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(ref);
  return ref;
}
