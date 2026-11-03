import { Platform, useWindowDimensions } from 'react-native';

import { MaxContentWidth } from '@/constants/theme';

export function useContentWidth(): number {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' ? Math.min(width, MaxContentWidth) : width;
}
