import { getSupabase, isSupabaseConfigured } from './supabase';
import { ChatMessage, LanguageCode } from '@/types';
import { safeStorage, safeJsonParse } from './safeStorage';

export interface MemoryItem { id: string; content: string; created_at: string; }
export interface ConversationRecord { id: string; title: string; language: LanguageCode; created_at: string; updated_at: string; }

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export async function upsertProfile(userId: string, profile: Record<string, unknown>) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('profiles').upsert({ id: userId, ...profile, updated_at: new Date().toISOString() });
}

export async function getProfile(userId: string) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data;
}

export async function createConversation(userId: string, language: LanguageCode, title?: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('conversations').insert({ user_id: userId, language, title: title || 'New conversation' }).select('id').single();
  if (error) { console.warn('createConversation', error.message); return null; }
  return data?.id ?? null;
}

export async function saveMessage(userId: string, conversationId: string, msg: ChatMessage) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('messages').insert({
    conversation_id: conversationId,
    user_id: userId,
    role: msg.role,
    content: msg.content,
    language: msg.language,
    suggestions: msg.suggestions || [],
  });
}

export async function listConversations(userId: string): Promise<ConversationRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from('conversations').select('id,title,language,created_at,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(30);
  return (data || []) as ConversationRecord[];
}

export async function getConversationMessages(userId: string, conversationId: string): Promise<ChatMessage[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb.from('messages').select('id,role,content,language,suggestions,created_at').eq('user_id', userId).eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(200);
  return (data || []).map((m: any) => ({
    id: m.id, role: m.role, content: m.content, language: m.language || 'en-IN', timestamp: new Date(m.created_at).getTime(), suggestions: m.suggestions || [],
  }));
}

export async function deleteConversation(userId: string, conversationId: string) {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('conversations').delete().eq('id', conversationId).eq('user_id', userId);
}

export async function addMemory(userId: string, content: string) {
  const sb = getSupabase();
  if (!sb) {
    const key = `swar_memories_${userId}`;
    const existing = safeJsonParse<any[]>(safeStorage.getItem(key), []);
    existing.unshift({ id: uid(), content, created_at: new Date().toISOString() });
    safeStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
    return;
  }
  await sb.from('memories').insert({ user_id: userId, content: content.slice(0, 500) });
}

export async function listMemories(userId: string): Promise<MemoryItem[]> {
  const sb = getSupabase();
  if (!sb) {
    const key = `swar_memories_${userId}`;
    try { return safeJsonParse<any[]>(safeStorage.getItem(key), []); } catch { return []; }
  }
  const { data } = await sb.from('memories').select('id,content,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
  return (data || []) as MemoryItem[];
}

export async function deleteMemory(userId: string, id: string) {
  const sb = getSupabase();
  if (!sb) {
    const key = `swar_memories_${userId}`;
    const existing = safeJsonParse<any[]>(safeStorage.getItem(key), []).filter((m: any) => m.id !== id);
    safeStorage.setItem(key, JSON.stringify(existing));
    return;
  }
  await sb.from('memories').delete().eq('id', id).eq('user_id', userId);
}

export async function clearMemories(userId: string) {
  const sb = getSupabase();
  if (!sb) { safeStorage.removeItem(`swar_memories_${userId}`); return; }
  await sb.from('memories').delete().eq('user_id', userId);
}

export async function logUsage(userId: string | null, eventType: string, metadata: Record<string, unknown> = {}) {
  const sb = getSupabase();
  if (!sb) {
    const key = 'swar_usage_local';
    const existing = safeJsonParse<any[]>(safeStorage.getItem(key), []);
    existing.unshift({ id: uid(), user_id: userId, event_type: eventType, metadata, created_at: new Date().toISOString() });
    safeStorage.setItem(key, JSON.stringify(existing.slice(0, 200)));
    return;
  }
  await sb.from('usage_events').insert({ user_id: userId, event_type: eventType, metadata });
}

export async function getUsageStats(userId: string | null) {
  const sb = getSupabase();
  let events: any[] = [];
  if (!sb) {
    events = safeJsonParse<any[]>(safeStorage.getItem('swar_usage_local'), []);
  } else if (userId) {
    const { data } = await sb.from('usage_events').select('event_type,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(500);
    events = data || [];
  }
  const stats: Record<string, number> = {};
  for (const e of events) stats[e.event_type] = (stats[e.event_type] || 0) + 1;
  return { total: events.length, byType: stats, recent: events.slice(0, 20) };
}
