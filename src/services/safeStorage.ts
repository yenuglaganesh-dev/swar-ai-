export interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  isPersistent(): boolean;
}

const memoryStore = new Map<string, string>();
let cachedStorage: SafeStorage | null = null;

function canUseBrowserStorage(): boolean {
  return typeof window !== 'undefined';
}

function probeLocalStorage(): Storage | null {
  if (!canUseBrowserStorage()) return null;
  try {
    const ls = window.localStorage;
    const testKey = '__swar_storage_test__';
    ls.setItem(testKey, '1');
    ls.removeItem(testKey);
    return ls;
  } catch {
    return null;
  }
}

function createMemoryStorage(): SafeStorage {
  return {
    getItem(key) {
      return memoryStore.has(key) ? memoryStore.get(key)! : null;
    },
    setItem(key, value) {
      try { memoryStore.set(key, String(value)); } catch { /* ignore */ }
    },
    removeItem(key) {
      memoryStore.delete(key);
    },
    isPersistent() {
      return false;
    },
  };
}

function createLocalStorageAdapter(ls: Storage): SafeStorage {
  return {
    getItem(key) {
      try { return ls.getItem(key); } catch { return memoryStore.has(key) ? memoryStore.get(key)! : null; }
    },
    setItem(key, value) {
      try { ls.setItem(key, value); memoryStore.set(key, String(value)); }
      catch { memoryStore.set(key, String(value)); }
    },
    removeItem(key) {
      try { ls.removeItem(key); } catch { /* ignore */ }
      memoryStore.delete(key);
    },
    isPersistent() {
      return true;
    },
  };
}

export function getSafeStorage(): SafeStorage {
  if (cachedStorage) return cachedStorage;
  const ls = probeLocalStorage();
  cachedStorage = ls ? createLocalStorageAdapter(ls) : createMemoryStorage();
  return cachedStorage;
}

export const safeStorage: SafeStorage = {
  getItem: (key) => getSafeStorage().getItem(key),
  setItem: (key, value) => getSafeStorage().setItem(key, value),
  removeItem: (key) => getSafeStorage().removeItem(key),
  isPersistent: () => getSafeStorage().isPersistent(),
};

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}