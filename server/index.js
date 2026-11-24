import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const DEFAULT_WEATHER_LOCATION = process.env.DEFAULT_WEATHER_LOCATION || 'Hyderabad';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Simple in-memory rate limiter for external API endpoints (free-plan protection)
const rateBuckets = new Map();
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = rateBuckets.get(key) || [];
  const fresh = bucket.filter((t) => now - t < windowMs);
  if (fresh.length >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - fresh[0])) / 1000));
    return { ok: false, retryAfterSec };
  }
  fresh.push(now);
  rateBuckets.set(key, fresh);
  return { ok: true };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LANG_NAMES = {
  'te-IN': 'Telugu',
  'hi-IN': 'Hindi',
  'en-IN': 'English',
};

function buildSystemPrompt(language, autoDetect, context = {}) {
  const langName = LANG_NAMES[language] || 'English';
  const { mode, memories = [], documentText = '', imageAttached = false, location = '' } = context;
  const modeHint = mode === 'tutor' ? 'Act as a patient educational tutor. Explain concepts step by step, check understanding, and give simple examples.'
    : mode === 'simple' ? 'Explain in very simple words, short sentences, and small steps. Avoid jargon.'
    : mode === 'translate' ? 'Focus on accurate translation between Telugu, Hindi, and English. Provide the translation clearly and briefly explain meaning if helpful.'
    : mode === 'emergency' ? 'Provide verified general emergency guidance only. For emergencies, clearly advise contacting local emergency services immediately. Do not guess medical/legal instructions. Share only widely accepted safety guidance.'
    : 'Be a helpful general assistant.';
  return [
    'You are SWAR AI, a friendly, natural-sounding female AI voice assistant.',
    'Your mission is to make AI accessible to everyone, including people who cannot comfortably read, write, or type.',
    'Supported languages: Telugu (te-IN), Hindi (hi-IN), English (en-IN).',
    autoDetect
      ? `Detect the language of the latest user message. If it is Telugu, answer in natural Telugu script; if Hindi, answer in natural Devanagari Hindi; if English, answer in English. For mixed Telugu-English or Hindi-English, mirror the user's mix naturally. If unclear, use ${langName}. The latest message language takes priority over earlier conversation turns.`
      : `Use ${langName} (${language}) for the entire answer. Telugu must be written in Telugu script, Hindi in Devanagari, and English in Latin script. If the user explicitly requests another of these three languages, follow that request. The latest message language/request takes priority.`
    modeHint,
    memories.length ? `User memory (only use if relevant, user consented): ${memories.slice(0, 8).map((m) => `- ${m}`).join(' ')}` : 'No personal memory is available.',
    documentText ? `Document context provided by user (use it to answer/explain):\n${documentText.slice(0, 12000)}` : '',
    imageAttached ? 'The user attached an image. If image content is provided, describe/answer based on it; if not, ask them to describe it.' : '',
    location ? `User location hint: ${location}` : '',
    'Keep answers clear, simple, warm, and respectful. Avoid unnecessarily complicated vocabulary.',
    'You can help with general questions, education, everyday assistance, technology, language translation/explanation, recommendations, and step-by-step guidance.',
    'For weather/news: only use provided external data from tools/context. If no live data is provided, say you need live weather/news API configuration and offer general help.',
    'Be honest when you do not know something or cannot access live information/integrations. Do not claim capabilities you do not have.',
    'For health questions, provide general information only, do not diagnose, and suggest consulting a qualified healthcare professional for personal medical advice.',
    'For emergencies, encourage contacting local emergency services immediately (India: 112; medical 108/102 where applicable; police 100; fire 101) and give only verified general safety guidance.',
    'When useful, include short actionable next steps.',
    'Return ONLY valid JSON with this shape:',
    '{"reply":"string","detectedLanguage":"te-IN|hi-IN|en-IN","suggestions":["short suggestion", "..."],"memoryCandidate":"optional short personal fact to remember only if user explicitly asked to remember"}',
    'Provide 2-4 contextually relevant suggestions. Suggestions should be in the same language as the reply.',
    'The reply should be conversational and suitable for text-to-speech.',
  ].filter(Boolean).join(' ');
}

function extractJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function fallbackResponse(_message, language, reason = 'AI_SERVICE_UNAVAILABLE') {
  const lang = LANG_NAMES[language] ? language : 'en-IN';
  const details = {
    AI_NOT_CONFIGURED: {
      'en-IN': 'The AI service is not configured on the server. Add AI_API_KEY in the server .env file and restart the backend.',
      'hi-IN': 'सर्वर पर AI सेवा कॉन्फ़िगर नहीं है। सर्वर .env में AI_API_KEY जोड़ें और बैकएंड रीस्टार्ट करें।',
      'te-IN': 'సర్వర్‌లో AI సర్వీస్ కాన్ఫిగర్ చేయలేదు. సర్వర్ .env లో AI_API_KEY జోడించి బ్యాకెండ్‌ను రీస్టార్ట్ చేయండి.',
    },
    AI_UPSTREAM_ERROR: {
      'en-IN': 'The AI provider returned an error. Check AI_API_KEY, AI_API_URL, model access, and server logs.',
      'hi-IN': 'AI प्रदाता ने त्रुटि लौटाई। AI_API_KEY, AI_API_URL, मॉडल एक्सेस और सर्वर लॉग जांचें।',
      'te-IN': 'AI ప్రొవైడర్ లోపాన్ని తిరిగి ఇచ్చింది. AI_API_KEY, AI_API_URL, మోడల్ యాక్సెస్ మరియు సర్వర్ లాగ్‌లను తనిఖీ చేయండి.',
    },
    AI_SERVICE_UNAVAILABLE: {
      'en-IN': "I'm having trouble reaching the AI service right now. Please check the server configuration and try again.",
      'hi-IN': 'अभी AI सेवा तक पहुंचने में समस्या हो रही है। कृपया सर्वर कॉन्फ़िगरेशन जांचें और फिर प्रयास करें।',
      'te-IN': 'ఇప్పుడు AI సర్వీస్‌ను చేరుకోవడంలో సమస్య ఉంది. దయచేసి సర్వర్ కాన్ఫిగరేషన్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
    },
  };
  const detail = (details[reason] || details.AI_SERVICE_UNAVAILABLE)[lang];
  const suggestions = {
    'en-IN': ['Try again', 'Check server config', 'What can you do?'],
    'hi-IN': ['फिर प्रयास करें', 'सर्वर कॉन्फ़िग जांचें', 'आप क्या कर सकते हैं?'],
    'te-IN': ['మళ్లీ ప్రయత్నించండి', 'సర్వర్ కాన్ఫిగ్ తనిఖీ చేయండి', 'మీరు ఏమి చేయగలరు?'],
  };
  return { reply: detail, detectedLanguage: lang, suggestions: suggestions[lang], error: reason };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'SWAR AI',
    aiConfigured: Boolean(process.env.AI_API_KEY),
    weatherConfigured: Boolean(process.env.WEATHER_API_KEY),
    newsConfigured: Boolean(process.env.NEWS_API_KEY),
    visionModel: process.env.AI_VISION_MODEL || process.env.AI_MODEL || 'gpt-4o-mini',
    time: new Date().toISOString(),
  });
});

function parseJsonSafe(text) { try { return JSON.parse(text); } catch { return null; } }

async function fetchWeather(location) {
  const key = process.env.WEATHER_API_KEY;
  const loc = String(location || DEFAULT_WEATHER_LOCATION).trim().slice(0, 120);
  if (!key) return { ok: false, configured: false, error: 'WEATHER_NOT_CONFIGURED', message: 'WEATHER_API_KEY is not configured on the server.' };
  if (!loc) return { ok: false, configured: true, error: 'WEATHER_LOCATION_REQUIRED', message: 'Location is required.' };
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(loc)}&appid=${key}&units=metric`;
    const r = await fetch(url);
    const raw = await r.text().catch(() => '');
    const d = parseJsonSafe(raw) || {};
    if (r.status === 429) return { ok: false, configured: true, error: 'WEATHER_RATE_LIMITED', message: 'OpenWeatherMap rate limit reached. Please retry shortly.', retryAfterSec: Number(r.headers.get('retry-after')) || 60 };
    if (!r.ok) {
      const msg = typeof d.message === 'string' ? d.message : `OpenWeatherMap request failed (${r.status})`;
      return { ok: false, configured: true, error: r.status === 404 ? 'WEATHER_LOCATION_NOT_FOUND' : 'WEATHER_UPSTREAM_ERROR', message: msg };
    }
    return {
      ok: true,
      configured: true,
      data: {
        source: 'OpenWeatherMap',
        location: d.name,
        country: d.sys?.country,
        tempC: d.main?.temp,
        feelsLikeC: d.main?.feels_like,
        humidity: d.main?.humidity,
        windSpeedMps: d.wind?.speed,
        conditions: d.weather?.[0]?.description,
        icon: d.weather?.[0]?.icon,
        observedAt: d.dt ? new Date(d.dt * 1000).toISOString() : undefined,
      },
    };
  } catch (e) {
    return { ok: false, configured: true, error: 'WEATHER_NETWORK_ERROR', message: e instanceof Error ? e.message : 'Weather request failed' };
  }
}

async function fetchNews(query) {
  const key = process.env.NEWS_API_KEY;
  if (!key) return { ok: false, configured: false, error: 'NEWS_NOT_CONFIGURED', message: 'NEWS_API_KEY is not configured on the server.' };
  const q = String(query || 'India').trim().slice(0, 120) || 'India';
  try {
    // Free NewsAPI plan: top-headlines works; development often restricted to localhost and limited requests.
    const url = `https://newsapi.org/v2/top-headlines?q=${encodeURIComponent(q)}&pageSize=5&language=en&apiKey=${key}`;
    let r = await fetch(url);
    let raw = await r.text().catch(() => '');
    let d = parseJsonSafe(raw) || {};
    // Fallback to everything endpoint for broader queries if top-headlines returns empty.
    if (r.ok && Array.isArray(d.articles) && d.articles.length === 0) {
      const url2 = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=5&sortBy=publishedAt&language=en&apiKey=${key}`;
      r = await fetch(url2);
      raw = await r.text().catch(() => '');
      d = parseJsonSafe(raw) || {};
    }
    if (r.status === 429) return { ok: false, configured: true, error: 'NEWS_RATE_LIMITED', message: 'NewsAPI rate limit reached. Please retry later.', retryAfterSec: Number(r.headers.get('retry-after')) || 3600 };
    if (!r.ok || d.status === 'error') {
      const msg = typeof d.message === 'string' ? d.message : `NewsAPI request failed (${r.status})`;
      return { ok: false, configured: true, error: r.status === 426 ? 'NEWS_PLAN_LIMITATION' : 'NEWS_UPSTREAM_ERROR', message: msg };
    }
    const articles = (Array.isArray(d.articles) ? d.articles : []).slice(0, 5).map((a) => ({
      title: a?.title || 'Untitled',
      source: a?.source?.name || 'Unknown source',
      url: a?.url || '',
      publishedAt: a?.publishedAt || null,
      description: a?.description || '',
    })).filter((a) => a.url);
    return { ok: true, configured: true, data: { source: 'NewsAPI', query: q, articles } };
  } catch (e) {
    return { ok: false, configured: true, error: 'NEWS_NETWORK_ERROR', message: e instanceof Error ? e.message : 'News request failed' };
  }
}

app.post('/api/weather', async (req, res) => {
  const rl = rateLimit(`weather:${req.ip}`, 30, 60_000);
  if (!rl.ok) return res.status(429).json({ ok: false, configured: true, error: 'RATE_LIMITED', message: 'Too many weather requests. Please retry shortly.', retryAfterSec: rl.retryAfterSec });
  const location = String(req.body?.location || DEFAULT_WEATHER_LOCATION).slice(0, 120);
  const result = await fetchWeather(location);
  if (!result.ok) return res.status(result.error === 'WEATHER_RATE_LIMITED' ? 429 : 200).json(result);
  res.json(result);
});

app.post('/api/news', async (req, res) => {
  const rl = rateLimit(`news:${req.ip}`, 20, 60_000);
  if (!rl.ok) return res.status(429).json({ ok: false, configured: true, error: 'RATE_LIMITED', message: 'Too many news requests. Please retry shortly.', retryAfterSec: rl.retryAfterSec });
  const query = String(req.body?.query || 'India').slice(0, 120);
  const result = await fetchNews(query);
  if (!result.ok) return res.status(result.error === 'NEWS_RATE_LIMITED' ? 429 : 200).json(result);
  res.json(result);
});

app.post('/api/chat', async (req, res) => {
  const body = req.body || {};
  const messages = body.messages ?? [];
  const language = ['te-IN', 'hi-IN', 'en-IN'].includes(body.language) ? body.language : 'en-IN';
  const autoDetect = body.autoDetect === true;
  const mode = body.mode || 'default';
  const memories = Array.isArray(body.memories) ? body.memories : [];
  const documentText = typeof body.documentText === 'string' ? body.documentText : '';
  const imageDataUrl = typeof body.imageDataUrl === 'string' ? body.imageDataUrl : '';
  const locationHint = typeof body.locationHint === 'string' ? body.locationHint : '';

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages must be an array' });
  }

  const safeMessages = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  const lastUser = [...safeMessages].reverse().find((m) => m.role === 'user')?.content || '';
  if (!lastUser) {
    return res.status(400).json({ reply: 'Please enter a message and try again.', detectedLanguage: language, suggestions: [] });
  }

  // Unicode-script detection is reliable for Telugu and Hindi; English is the fallback.
  const detectedFromText = /[\\u0C00-\\u0C7F]/u.test(lastUser) ? 'te-IN'
    : /[\\u0900-\\u097F]/u.test(lastUser) ? 'hi-IN' : 'en-IN';
  const responseLanguage = autoDetect ? detectedFromText : language;
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || 'https://opencode.ai/inference/openai/v1/chat/completions';
  const model = process.env.AI_MODEL || 'big-pickle';
  const visionModel = process.env.AI_VISION_MODEL || model;

  let liveContext = '';
  const lower = lastUser.toLowerCase();
  const wantsWeather = /\\b(weather|temperature|forecast|rain|humidity|wind|hot|cold|sunny|cloudy)\\b|मौसम|तापमान|बारिश|వాతావరణం|ఉష్ణోగ్రత|వర్షం/u.test(lower);
  const wantsNews = /\\b(news|headlines|latest|happening|breaking|article)\\b|समाचार|खबर|వార్తలు|తాజా/u.test(lower);
  if (wantsWeather) {
    const weatherLoc = locationHint.trim() || DEFAULT_WEATHER_LOCATION;
    const w = await fetchWeather(weatherLoc);
    liveContext += `\\nLive weather result: ${JSON.stringify({ ok: w.ok, configured: w.configured, error: w.error, message: w.message, data: w.data, retryAfterSec: w.retryAfterSec })}`;
  }
  if (wantsNews) {
    const topic = locationHint.trim() || 'technology OR India';
    const n = await fetchNews(topic);
    liveContext += `\\nLive news result: ${JSON.stringify({ ok: n.ok, configured: n.configured, error: n.error, message: n.message, data: n.data, retryAfterSec: n.retryAfterSec })}`;
  }

  if (!apiKey) {
    return res.status(503).json(fallbackResponse(lastUser, responseLanguage, 'AI_NOT_CONFIGURED'));
  }

  try {
    const hasImage = imageDataUrl.startsWith('data:image/');
    const system = buildSystemPrompt(responseLanguage, autoDetect, {
      mode,
      memories: memories.filter((m) => typeof m === 'string').slice(0, 8),
      documentText: documentText.slice(0, 12000),
      imageAttached: hasImage,
      location: locationHint.slice(0, 120),
    }) + (liveContext ? `\\n${liveContext}` : '');

    const chatMessages = [{ role: 'system', content: system }, ...safeMessages.slice(0, -1)];
    if (hasImage) {
      chatMessages.push({ role: 'user', content: [
        { type: 'text', text: lastUser },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ] });
    } else {
      chatMessages.push({ role: 'user', content: lastUser });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: hasImage ? visionModel : model, temperature: 0.7, messages: chatMessages }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      let providerError = {};
      try { providerError = JSON.parse(errText)?.error || {}; } catch { /* ignore */ }
      const safeProviderMessage = typeof providerError.message === 'string' ? providerError.message.slice(0, 300) : `Upstream status ${response.status}`;
      const safeCode = typeof providerError.code === 'string' ? providerError.code : (typeof providerError.type === 'string' ? providerError.type : undefined);
      const reason = response.status === 401 || response.status === 403 ? 'AI_AUTH_ERROR'
        : response.status === 429 ? 'AI_RATE_LIMITED'
        : response.status === 404 ? 'AI_MODEL_OR_ENDPOINT_ERROR'
        : response.status === 400 ? 'AI_BAD_REQUEST' : 'AI_UPSTREAM_ERROR';
      console.error('AI API error', { status: response.status, code: safeCode, message: safeProviderMessage });
      return res.status(502).json({
        ...fallbackResponse('', responseLanguage, reason),
        providerStatus: response.status,
        providerCode: safeCode,
        providerMessage: safeProviderMessage,
      });
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content ?? data?.output_text ?? data?.reply ?? '';
    const content = Array.isArray(rawContent)
      ? rawContent.map((part) => typeof part === 'string' ? part : (part?.text || '')).join('\\n').trim()
      : typeof rawContent === 'string' ? rawContent.trim() : '';
    if (!content) {
      console.error('AI provider returned an empty completion', { model, responseId: data?.id });
      return res.status(502).json(fallbackResponse('', responseLanguage, 'AI_SERVICE_UNAVAILABLE'));
    }

    const parsed = extractJson(content);
    const reply = parsed && typeof parsed.reply === 'string' ? parsed.reply.trim() : content;
    const detectedLanguage = parsed && ['te-IN', 'hi-IN', 'en-IN'].includes(parsed.detectedLanguage)
      ? parsed.detectedLanguage : responseLanguage;
    const suggestions = parsed && Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s) => typeof s === 'string').slice(0, 4) : [];
    return res.json({
      reply,
      detectedLanguage,
      suggestions,
      memoryCandidate: parsed && typeof parsed.memoryCandidate === 'string' ? parsed.memoryCandidate.slice(0, 240) : undefined,
    });
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    console.error('Chat request failed:', timedOut ? 'AI provider timeout' : error);
    return res.status(502).json(fallbackResponse('', responseLanguage, 'AI_SERVICE_UNAVAILABLE'));
  }
});

const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

const server = app.listen(PORT, () => {
  console.log(`SWAR AI server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing process using that port, or set PORT in .env to a free port.`);
    process.exit(1);
  }
  console.error('Server listen error:', err);
  process.exit(1);
});
