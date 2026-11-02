import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useResolvedColorScheme } from '@/hooks/use-resolved-color-scheme';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();
  return useResolvedColorScheme(hasHydrated ? colorScheme : 'light');
}
