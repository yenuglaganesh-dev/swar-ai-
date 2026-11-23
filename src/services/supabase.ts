import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { safeStorage } from './safeStorage';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anon);
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: typeof window !== 'undefined',
        storage: {
          getItem: (key) => safeStorage.getItem(key),
          setItem: (key, value) => safeStorage.setItem(key, value),
          removeItem: (key) => safeStorage.removeItem(key),
        },
      },
    });
  }
  return client;
}

export function isAuthStoragePersistent(): boolean {
  return safeStorage.isPersistent();
}
