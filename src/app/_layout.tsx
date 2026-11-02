import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AppAlert } from '@/components/app-alert';
import AppTabs from '@/components/app-tabs';
import { AppStateProvider } from '@/context/app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <AppStateProvider>
      <ThemedApp />
    </AppStateProvider>
  );
}

function ThemedApp() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <AppTabs />
      <AppAlert />
    </ThemeProvider>
  );
}
