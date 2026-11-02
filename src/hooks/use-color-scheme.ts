import { useColorScheme as useRNColorScheme } from 'react-native';

import { useResolvedColorScheme } from '@/hooks/use-resolved-color-scheme';

export function useColorScheme(): 'light' | 'dark' {
  return useResolvedColorScheme(useRNColorScheme());
}
