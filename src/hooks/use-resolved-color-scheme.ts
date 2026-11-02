import { useAppStateOptional } from '@/context/app-state';

export function useResolvedColorScheme(system: 'light' | 'dark' | null | undefined): 'light' | 'dark' {
  const app = useAppStateOptional();
  const preference = app?.settings.theme ?? 'system';
  if (preference === 'light' || preference === 'dark') return preference;
  return system === 'dark' ? 'dark' : 'light';
}
