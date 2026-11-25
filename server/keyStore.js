import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LOCAL_STORE_PATH = path.join(os.tmpdir(), 'swar-ai-keys.enc.json');
const memoryStore = new Map();

const PLACEHOLDER_KEYS = new Set([
  'your_opencode_api_key_here',
  'your_api_key_here',
  'your_gemini_api_key_here',
]);

export function isPlaceholderKey(key) {
  const k = String(key || '').trim();
  return !k || PLACEHOLDER_KEYS.has(k);
}

function getEncryptionKey() {
  const secret =
    process.env.KEY_ENCRYPTION_SECRET ||
    process.env.AI_KEY_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    `swar-dev-${process.env.VITE_SUPABASE_URL || 'local'}`;
  return crypto.scryptSync(secret, 'swar-ai-key-salt-v1', 32);
}

export function encryptApiKey(plainKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const suffix = plainKey.length > 4 ? `••••${plainKey.slice(-4)}` : '••••';
  return {
    encrypted_key: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    auth_tag: authTag.toString('base64'),
    key_suffix: suffix,
  };
}

export function decryptApiKey(record) {
  if (!record?.encrypted_key || !record?.iv || !record?.auth_tag) return '';
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      Buffer.from(record.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(record.auth_tag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(record.encrypted_key, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

function readLocalStore() {
  try {
    if (!fs.existsSync(LOCAL_STORE_PATH)) return {};
    return JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, 'utf8')) || {};
  } catch {
    return {};
  }
}

function writeLocalStore(data) {
  try {
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(data), { mode: 0o600 });
  } catch {
    /* ignore in read-only serverless fs; memoryStore still holds active keys */
  }
}

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey || url.includes('your-project-ref')) return null;
  return { url, anonKey };
}

export async function verifySupabaseAuth(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const token = match[1].trim();
  if (!token) return null;

  const sb = getSupabaseConfig();
  if (!sb) return null;

  try {
    const res = await fetch(`${sb.url}/auth/v1/user`, {
      headers: {
        apikey: sb.anonKey,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const user = await res.json();
    if (!user?.id) return null;
    return { userId: user.id, email: user.email, token };
  } catch {
    return null;
  }
}

export function resolveProviderConfig(apiKey) {
  const trimmed = String(apiKey || '').trim();
  const isGeminiKey = trimmed.startsWith('AIza');
  const provider = isGeminiKey ? 'gemini' : 'opencode';
  const model = isGeminiKey
    ? (process.env.GEMINI_MODEL || 'gemini-2.5-flash')
    : (process.env.AI_MODEL || 'big-pickle');
  const apiUrl = isGeminiKey
    ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
    : (process.env.AI_API_URL || 'https://opencode.ai/inference/openai/v1/chat/completions');
  return { isGeminiKey, provider, model, apiUrl };
}

export async function verifyProviderKey(apiKey) {
  const trimmed = String(apiKey || '').trim();
  if (isPlaceholderKey(trimmed)) {
    return {
      ok: false,
      httpStatus: 400,
      connectionState: 'Invalid API Key',
      errorCode: 'EMPTY_OR_PLACEHOLDER_KEY',
      message: 'Please enter a valid API key.',
    };
  }

  const { isGeminiKey, provider, model, apiUrl } = resolveProviderConfig(trimmed);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    let response;
    if (isGeminiKey) {
      const callGemini = (targetModel) => fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(targetModel)}:generateContent?key=${encodeURIComponent(trimmed)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Reply with OK' }] }],
            generationConfig: { maxOutputTokens: 5, temperature: 0 },
          }),
          signal: controller.signal,
        },
      );
      response = await callGemini(model);
      if (response.status === 404 && model !== 'gemini-2.0-flash') {
        response = await callGemini('gemini-2.0-flash');
      }
    } else {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${trimmed}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 5,
          temperature: 0,
          messages: [{ role: 'user', content: 'Reply with OK' }],
        }),
        signal: controller.signal,
      });
    }

    if (response.ok) {
      return {
        ok: true,
        httpStatus: 200,
        connectionState: 'Connected',
        provider,
        model,
        message: 'API key verified and connected.',
      };
    }

    const errText = await response.text().catch(() => '');
    let errObj = {};
    try { errObj = JSON.parse(errText)?.error || {}; } catch { /* ignore */ }
    const rawMsg = typeof errObj.message === 'string' ? errObj.message.slice(0, 240) : `Provider returned HTTP ${response.status}`;
    const lower = rawMsg.toLowerCase();

    if (response.status === 401) {
      return {
        ok: false,
        httpStatus: 401,
        connectionState: 'Invalid API Key',
        provider,
        model,
        errorCode: 'AI_AUTH_ERROR',
        message: 'Invalid or unauthorized API key.',
      };
    }
    if (response.status === 403) {
      return {
        ok: false,
        httpStatus: 403,
        connectionState: 'Invalid API Key',
        provider,
        model,
        errorCode: 'AI_FORBIDDEN',
        message: 'Provider access forbidden for this API key.',
      };
    }
    if (response.status === 402 || (response.status === 429 && /(credit|quota|balance|billing|limit reached|exhausted)/i.test(lower))) {
      return {
        ok: false,
        httpStatus: response.status,
        connectionState: 'Insufficient Credits',
        provider,
        model,
        errorCode: 'AI_INSUFFICIENT_CREDITS',
        message: 'Insufficient credits or quota exhausted on this API key.',
      };
    }
    if (response.status === 429) {
      return {
        ok: false,
        httpStatus: 429,
        connectionState: 'Rate Limited',
        provider,
        model,
        errorCode: 'AI_RATE_LIMITED',
        message: 'Rate limit exceeded. Please wait or switch keys.',
      };
    }
    if (response.status === 404) {
      return {
        ok: false,
        httpStatus: 404,
        connectionState: 'Connection Failed',
        provider,
        model,
        errorCode: 'AI_MODEL_OR_ENDPOINT_ERROR',
        message: 'Incorrect endpoint or unavailable model.',
      };
    }
    return {
      ok: false,
      httpStatus: response.status >= 500 ? 502 : response.status,
      connectionState: 'Connection Failed',
      provider,
      model,
      errorCode: 'AI_UPSTREAM_ERROR',
      message: rawMsg || 'Provider or upstream server issue.',
    };
  } catch (err) {
    const timedOut = err?.name === 'AbortError';
    return {
      ok: false,
      httpStatus: 504,
      connectionState: 'Connection Failed',
      provider,
      model,
      errorCode: timedOut ? 'AI_TIMEOUT' : 'AI_NETWORK_ERROR',
      message: timedOut ? 'Connection to AI provider timed out.' : 'Failed to reach AI provider.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function getUserKeyRecord(auth) {
  if (!auth?.userId) return null;

  const sb = getSupabaseConfig();
  if (sb && auth.token) {
    try {
      const res = await fetch(
        `${sb.url}/rest/v1/user_api_keys?user_id=eq.${encodeURIComponent(auth.userId)}&select=user_id,encrypted_key,iv,auth_tag,key_suffix,provider,model,status,updated_at&limit=1`,
        {
          headers: {
            apikey: sb.anonKey,
            Authorization: `Bearer ${auth.token}`,
          },
        },
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) return rows[0];
        return null;
      }
    } catch {
      /* fallback to local encrypted store if table is not yet migrated */
    }
  }

  if (memoryStore.has(auth.userId)) return memoryStore.get(auth.userId);
  const disk = readLocalStore();
  if (disk[auth.userId]) {
    memoryStore.set(auth.userId, disk[auth.userId]);
    return disk[auth.userId];
  }
  return null;
}

export async function saveUserKeyRecord(auth, plainKey, verification) {
  if (!auth?.userId) throw new Error('AUTH_REQUIRED');
  const enc = encryptApiKey(plainKey);
  const record = {
    user_id: auth.userId,
    ...enc,
    provider: verification.provider,
    model: verification.model,
    status: verification.connectionState || 'Connected',
    updated_at: new Date().toISOString(),
  };

  memoryStore.set(auth.userId, record);
  const disk = readLocalStore();
  disk[auth.userId] = record;
  writeLocalStore(disk);

  const sb = getSupabaseConfig();
  if (sb && auth.token) {
    try {
      await fetch(`${sb.url}/rest/v1/user_api_keys?on_conflict=user_id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: sb.anonKey,
          Authorization: `Bearer ${auth.token}`,
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(record),
      });
    } catch {
      /* local encrypted store already persisted */
    }
  }
  return {
    configured: true,
    provider: record.provider,
    model: record.model,
    keySuffix: record.key_suffix,
    connectionState: record.status,
    updatedAt: record.updated_at,
  };
}

export async function deleteUserKeyRecord(auth) {
  if (!auth?.userId) throw new Error('AUTH_REQUIRED');
  memoryStore.delete(auth.userId);
  const disk = readLocalStore();
  delete disk[auth.userId];
  writeLocalStore(disk);

  const sb = getSupabaseConfig();
  if (sb && auth.token) {
    try {
      await fetch(`${sb.url}/rest/v1/user_api_keys?user_id=eq.${encodeURIComponent(auth.userId)}`, {
        method: 'DELETE',
        headers: {
          apikey: sb.anonKey,
          Authorization: `Bearer ${auth.token}`,
        },
      });
    } catch {
      /* ignore */
    }
  }
}
