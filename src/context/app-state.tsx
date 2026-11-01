import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { loadItems, loadSettings, saveItems, saveSettings } from '@/lib/storage';
import { DEFAULT_SETTINGS, type AppSettings, type WordingItem } from '@/types/app';

export type LastRequest = {
  cost: number | null;
};

type AppStateContextValue = {
  ready: boolean;
  items: WordingItem[];
  settings: AppSettings;
  lastRequest: LastRequest | null;
  addItem: (text: string) => void;
  updateItem: (id: string, text: string) => void;
  deleteItem: (id: string) => void;
  pinItem: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;
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

  const persistItems = useCallback((next: WordingItem[]) => {
    setItems(next);
    void saveItems(next);
  }, []);

  const addItem = useCallback(
    (text: string) => {
      persistItems([...items, { id: createId(), text }]);
    },
    [items, persistItems],
  );

  const updateItem = useCallback(
    (id: string, text: string) => {
      persistItems(items.map((item) => (item.id === id ? { ...item, text } : item)));
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

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    void saveSettings(next);
  }, []);

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
      deleteItem,
      pinItem,
      updateSettings,
      recordRequest,
    }),
    [ready, items, settings, lastRequest, addItem, updateItem, deleteItem, pinItem, updateSettings, recordRequest],
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
