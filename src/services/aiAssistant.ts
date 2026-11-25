import { ChatMessage, ChatResponse, LanguageCode } from '@/types';
import { getSupabase } from './supabase';

export type ConnectionState =
  | 'Not Configured'
  | 'Testing Connection'
  | 'Connected'
  | 'Invalid API Key'
  | 'Insufficient Credits'
  | 'Rate Limited'
  | 'Connection Failed';

export interface ApiKeyStatus {
  ok: boolean;
  configured: boolean;
  provider?: string;
  model?: string;
  keySuffix?: string;
  connectionState: ConnectionState;
  updatedAt?: string;
  error?: string;
  message?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.auth.getSession();
      const token = data?.session?.access_token;
      if (token) headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* ignore */
  }
  return headers;
}

interface SendMessageArgs {
  messages: ChatMessage[];
  language: LanguageCode;
  autoDetect: boolean;
  mode?: 'default' | 'tutor' | 'simple' | 'translate' | 'emergency';
  memories?: string[];
  documentText?: string;
  imageDataUrl?: string;
  locationHint?: string;
  thinkHarder?: boolean;
}

export async function sendChatMessage({ messages, language, autoDetect, mode = 'default', memories = [], documentText, imageDataUrl, locationHint, thinkHarder = false }: SendMessageArgs): Promise<ChatResponse & { memoryCandidate?: string }> {
  const payload = {
    language,
    autoDetect,
    mode,
    memories,
    documentText,
    imageDataUrl,
    locationHint,
    thinkHarder,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45000);
  let res: Response;
  try {
    const headers = await getAuthHeaders();
    res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      reply: typeof data?.reply === 'string' ? data.reply : '',
      detectedLanguage: data?.detectedLanguage || language,
      suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
      error: data?.error || `HTTP_${res.status}`,
    };
  }
  return {
    reply: data.reply || '',
    detectedLanguage: data.detectedLanguage || language,
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    error: data.error,
    memoryCandidate: data.memoryCandidate,
    ...(data.providerStatus ? { providerStatus: data.providerStatus } : {}),
    ...(data.providerCode ? { providerCode: data.providerCode } : {}),
    ...(data.providerMessage ? { providerMessage: data.providerMessage } : {}),
  } as any;
}

export interface WeatherData {
  source: string; location?: string; country?: string; tempC?: number; feelsLikeC?: number; humidity?: number; windSpeedMps?: number; conditions?: string; icon?: string; observedAt?: string;
}
export interface NewsArticle { title: string; source: string; url: string; publishedAt?: string | null; description?: string; }
export interface ApiResult<T> { ok: boolean; configured: boolean; data?: T; error?: string; message?: string; retryAfterSec?: number; }

async function postJson<T>(url: string, body: unknown, timeoutMs = 15000): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, configured: data?.configured ?? true, error: data?.error || `HTTP_${res.status}`, message: data?.message || 'Request failed', retryAfterSec: data?.retryAfterSec };
    return { ok: Boolean(data?.ok ?? true), configured: Boolean(data?.configured ?? true), data: data?.data, error: data?.error, message: data?.message, retryAfterSec: data?.retryAfterSec };
  } catch (e) {
    return { ok: false, configured: true, error: e instanceof Error && e.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR', message: e instanceof Error ? e.message : 'Request failed' };
  } finally { window.clearTimeout(timer); }
}

export async function fetchApiKeyStatus(): Promise<ApiKeyStatus> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/key', { method: 'GET', headers, credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok && Boolean(data?.ok ?? true),
      configured: Boolean(data?.configured),
      provider: data?.provider,
      model: data?.model,
      keySuffix: data?.keySuffix,
      connectionState: data?.connectionState || (data?.configured ? 'Connected' : 'Not Configured'),
      updatedAt: data?.updatedAt,
      error: data?.error,
      message: data?.message,
    };
  } catch {
    return { ok: false, configured: false, connectionState: 'Connection Failed', message: 'Could not reach server.' };
  }
}

export async function activateApiKey(apiKey: string): Promise<ApiKeyStatus> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/key/activate', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ apiKey: apiKey.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok && Boolean(data?.ok),
      configured: Boolean(data?.configured),
      provider: data?.provider,
      model: data?.model,
      keySuffix: data?.keySuffix,
      connectionState: data?.connectionState || (res.ok ? 'Connected' : 'Connection Failed'),
      updatedAt: data?.updatedAt,
      error: data?.error,
      message: data?.message || (res.ok ? 'API Key Activated Successfully' : 'Failed to activate API key.'),
    };
  } catch {
    return { ok: false, configured: false, connectionState: 'Connection Failed', message: 'Network error while verifying API key.' };
  }
}

export async function testApiKeyConnection(): Promise<ApiKeyStatus> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/key/test', { method: 'POST', headers, credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok && Boolean(data?.ok),
      configured: Boolean(data?.configured),
      provider: data?.provider,
      model: data?.model,
      keySuffix: data?.keySuffix,
      connectionState: data?.connectionState || (res.ok ? 'Connected' : 'Connection Failed'),
      error: data?.error,
      message: data?.message,
    };
  } catch {
    return { ok: false, configured: false, connectionState: 'Connection Failed', message: 'Network error while testing connection.' };
  }
}

export async function removeApiKey(): Promise<ApiKeyStatus> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/key', { method: 'DELETE', headers, credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok && Boolean(data?.ok),
      configured: false,
      connectionState: 'Not Configured',
      message: data?.message || 'API key removed.',
    };
  } catch {
    return { ok: false, configured: false, connectionState: 'Connection Failed', message: 'Failed to remove API key.' };
  }
}

export async function extractDocumentText(file: File): Promise<{ ok: boolean; text: string; isScanned?: boolean; message?: string }> {
  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const dataBase64 = btoa(binary);
    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, dataBase64 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, text: '', message: data?.message || 'Failed to extract document text.' };
    return { ok: true, text: String(data?.text || ''), isScanned: Boolean(data?.isScanned), message: data?.message };
  } catch {
    return { ok: false, text: '', message: 'Network error while extracting document text.' };
  }
}

export async function fetchWeather(location: string): Promise<ApiResult<WeatherData>> {
  return postJson<WeatherData>('/api/weather', { location });
}

export async function fetchNews(query: string): Promise<ApiResult<{ source: string; query: string; articles: NewsArticle[] }>> {
  return postJson('/api/news', { query });
}
