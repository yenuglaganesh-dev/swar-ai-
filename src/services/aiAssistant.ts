import { ChatMessage, ChatResponse, LanguageCode } from '@/types';

interface SendMessageArgs {
  messages: ChatMessage[];
  language: LanguageCode;
  autoDetect: boolean;
  mode?: 'default' | 'tutor' | 'simple' | 'translate' | 'emergency';
  memories?: string[];
  documentText?: string;
  imageDataUrl?: string;
  locationHint?: string;
  customApiKey?: string;
  thinkHarder?: boolean;
}

export async function sendChatMessage({ messages, language, autoDetect, mode = 'default', memories = [], documentText, imageDataUrl, locationHint, customApiKey, thinkHarder = false }: SendMessageArgs): Promise<ChatResponse & { memoryCandidate?: string }> {
  const payload = {
    language,
    autoDetect,
    mode,
    memories,
    documentText,
    imageDataUrl,
    locationHint,
    thinkHarder,
    ...(customApiKey?.trim() ? { customApiKey: customApiKey.trim() } : {}),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45000);
  let res: Response;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

export async function fetchWeather(location: string): Promise<ApiResult<WeatherData>> {
  return postJson<WeatherData>('/api/weather', { location });
}

export async function fetchNews(query: string): Promise<ApiResult<{ source: string; query: string; articles: NewsArticle[] }>> {
  return postJson('/api/news', { query });
}
