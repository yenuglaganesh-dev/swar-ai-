import { getSupabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export async function supabaseSignInWithEmail(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) throw new Error('SUPABASE_NOT_CONFIGURED');
  return sb.auth.signInWithPassword({ email, password });
}

export async function supabaseSignUpWithEmail(email: string, password: string, name?: string) {
  const sb = getSupabase();
  if (!sb) throw new Error('SUPABASE_NOT_CONFIGURED');
  return sb.auth.signUp({
    email,
    password,
    options: { data: name ? { name } : undefined },
  });
}

export async function supabaseSignInWithGoogle() {
  const sb = getSupabase();
  if (!sb) throw new Error('SUPABASE_NOT_CONFIGURED');
  return sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/assistant' } });
}

export async function supabaseSendOtp(phone: string) {
  const sb = getSupabase();
  if (!sb) throw new Error('SUPABASE_NOT_CONFIGURED');
  return sb.auth.signInWithOtp({ phone });
}

export async function supabaseVerifyOtp(phone: string, token: string) {
  const sb = getSupabase();
  if (!sb) throw new Error('SUPABASE_NOT_CONFIGURED');
  return sb.auth.verifyOtp({ phone, token, type: 'sms' });
}

export async function supabaseResetPassword(email: string) {
  const sb = getSupabase();
  if (!sb) throw new Error('SUPABASE_NOT_CONFIGURED');
  return sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth' });
}

export async function supabaseSignOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export function mapSupabaseUser(u: User) {
  const provider = (u.app_metadata?.provider as string) || 'email';
  return {
    uid: u.id,
    name: (u.user_metadata?.full_name as string) || (u.user_metadata?.name as string) || u.email || u.phone || 'User',
    email: u.email || undefined,
    phoneNumber: u.phone || undefined,
    photoURL: (u.user_metadata?.avatar_url as string) || (u.user_metadata?.picture as string) || undefined,
    provider: (provider === 'google' ? 'google' : provider === 'phone' ? 'phone' : 'email') as 'email' | 'google' | 'phone',
  };
}
