import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { loadItems, loadSettings, normalizeTags, saveItems, saveSettings } from '@/lib/storage';
import { DEFAULT_SETTINGS, type AppSettings, type WordingItem } from '@/types/app';

export type LastRequest = {
  cost: number | null;
};

type AppStateContextValue = {
  ready: boolean;
  items: WordingItem[];
  settings: AppSettings;
  lastRequest: LastRequest | null;
  successFlashId: string | null;
  addItem: (text: string, tags?: string[]) => void;
  updateItem: (id: string, text: string) => void;
  updateItemTags: (id: string, tags: string[]) => void;
  setItemFolded: (id: string, folded: boolean) => void;
  deleteItem: (id: string) => void;
  pinItem: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  recordRequest: (request: LastRequest) => void;
  startSuccessFlash: (id: string, durationMs: number) => void;
  clearSuccessFlash: () => void;
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
  const [successFlashId, setSuccessFlashId] = useState<string | null>(null);
  const successFlashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const recordRequest = useCallback((request: LastRequest) => {
    setLastRequest(request);
  }, []);

  const clearSuccessFlash = useCallback(() => {
    if (successFlashTimeout.current) {
      clearTimeout(successFlashTimeout.current);
      successFlashTimeout.current = null;
    }
    setSuccessFlashId(null);
  }, []);

  const startSuccessFlash = useCallback(
    (id: string, durationMs: number) => {
      if (successFlashTimeout.current) {
        clearTimeout(successFlashTimeout.current);
      }
      setSuccessFlashId(id);
      successFlashTimeout.current = setTimeout(() => {
        setSuccessFlashId(null);
        successFlashTimeout.current = null;
      }, durationMs);
    },
    [],
  );

  const value = useMemo(
    () => ({
      ready,
      items,
      settings,
      lastRequest,
      successFlashId,
      addItem,
      updateItem,
      updateItemTags,
      setItemFolded,
      deleteItem,
      pinItem,
      updateSettings,
      recordRequest,
      startSuccessFlash,
      clearSuccessFlash,
    }),
    [
      ready,
      items,
      settings,
      lastRequest,
      successFlashId,
      addItem,
      updateItem,
      updateItemTags,
      setItemFolded,
      deleteItem,
      pinItem,
      updateSettings,
      recordRequest,
      startSuccessFlash,
      clearSuccessFlash,
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
