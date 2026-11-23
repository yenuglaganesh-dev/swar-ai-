import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { UserProfile } from '@/types';
import { getSupabase, isSupabaseConfigured } from '@/services/supabase';
import { mapSupabaseUser, supabaseSignOut } from '@/services/supabaseAuth';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    let mounted = true;
    sb.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.warn('Supabase getSession error:', error.message);
      setUser(data.session?.user ? mapSupabaseUser(data.session.user) : null);
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabaseSignOut().catch((e) => console.warn('Sign out error:', e?.message || e));
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, configured, signOut }), [user, loading, configured]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
