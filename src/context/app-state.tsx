import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { Colors } from '@/constants/theme';
import { loadItems, loadSettings, normalizeTags, saveItems, saveSettings } from '@/lib/storage';
import { DEFAULT_SETTINGS, type AppSettings, type WordingItem } from '@/types/app';

export type LastRequest = {
  cost: number | null;
  model: string;
};

type AppStateContextValue = {
  ready: boolean;
  items: WordingItem[];
  settings: AppSettings;
  lastRequest: LastRequest | null;
  addItem: (text: string, tags?: string[]) => void;
  updateItem: (id: string, text: string) => void;
  updateItemTags: (id: string, tags: string[]) => void;
  setItemFolded: (id: string, folded: boolean) => void;
  deleteItem: (id: string) => void;
  pinItem: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  replaceData: (items: WordingItem[], settings: AppSettings) => void;
  recordRequest: (request: LastRequest) => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<WordingItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [lastRequest, setLastRequest] = useState<LastRequest | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const [storedItems, storedSettings] = await Promise.all([loadItems(), loadSettings()]);
      if (cancelled) return;
      setItems(storedItems);
      setSettings(storedSettings);
      setReady(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(settings.theme === 'system' ? 'auto' : settings.theme);
    }
    const resolved =
      settings.theme === 'dark' || (settings.theme === 'system' && Appearance.getColorScheme() === 'dark')
        ? 'dark'
        : 'light';
    void SystemUI.setBackgroundColorAsync(Colors[resolved].background);
  }, [settings.theme]);

  const persistItems = useCallback((next: WordingItem[]) => {
    setItems(next);
    void saveItems(next);
  }, []);

  const addItem = useCallback(
    (text: string, tags: string[] = []) => {
      persistItems([...items, { id: createId(), text, tags: normalizeTags(tags), folded: false }]);
    },
    [items, persistItems],
  );

  const updateItem = useCallback(
    (id: string, text: string) => {
      persistItems(items.map((item) => (item.id === id ? { ...item, text } : item)));
    },
    [items, persistItems],
  );

  const updateItemTags = useCallback(
    (id: string, tags: string[]) => {
      persistItems(items.map((item) => (item.id === id ? { ...item, tags: normalizeTags(tags) } : item)));
    },
    [items, persistItems],
  );

  const setItemFolded = useCallback(
    (id: string, folded: boolean) => {
      persistItems(items.map((item) => (item.id === id ? { ...item, folded } : item)));
    },
    [items, persistItems],
  );

  const deleteItem = useCallback(
    (id: string) => {
      persistItems(items.filter((item) => item.id !== id));
    },
    [items, persistItems],
  );

  const pinItem = useCallback(
    (id: string) => {
      const target = items.find((item) => item.id === id);
      if (!target || items[0]?.id === id) return;
      persistItems([target, ...items.filter((item) => item.id !== id)]);
    },
    [items, persistItems],
  );

  const updateSettings = useCallback((next: Partial<AppSettings>) => {
    setSettings((current) => {
      const merged = { ...current, ...next };
      void saveSettings(merged);
      return merged;
    });
  }, []);

  const replaceData = useCallback(
    (nextItems: WordingItem[], nextSettings: AppSettings) => {
      persistItems(nextItems);
      setSettings(nextSettings);
      void saveSettings(nextSettings);
    },
    [persistItems],
  );

  const recordRequest = useCallback((request: LastRequest) => {
    setLastRequest(request);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      items,
      settings,
      lastRequest,
      addItem,
      updateItem,
      updateItemTags,
      setItemFolded,
      deleteItem,
      pinItem,
      updateSettings,
      replaceData,
      recordRequest,
    }),
    [
      ready,
      items,
      settings,
      lastRequest,
      addItem,
      updateItem,
      updateItemTags,
      setItemFolded,
      deleteItem,
      pinItem,
      updateSettings,
      replaceData,
      recordRequest,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

export function useAppStateOptional(): AppStateContextValue | null {
  return useContext(AppStateContext);
}
