import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const key = process.env.AI_API_KEY || '';
const apiUrl = process.env.AI_API_URL || '';
const model = process.env.AI_MODEL || '';
const keyMeta = {
  hasKey: Boolean(key),
  keyLength: key.length,
  looksPlaceholder: /your_|replace|example|placeholder/i.test(key) || key === '' || key.length < 20,
  prefixSafe: key ? key.slice(0, 4) + '...' : '',
};
console.log('CONFIG', JSON.stringify({ apiUrl, model, keyMeta }));

async function safeFetch(name, url, opts = {}) {
  try {
    const r = await fetch(url, opts);
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch {}
    console.log(`\n== ${name} ==`);
    console.log('STATUS', r.status);
    console.log('BODY', text.slice(0, 1000));
    return { status: r.status, text, json };
  } catch (e) {
    console.log(`\n== ${name} ==`);
    console.log('ERROR', e instanceof Error ? e.message : String(e));
    return { error: String(e) };
  }
}

const base = 'https://opencode.ai/zen/v1';
const modelsRes = await safeFetch('MODELS_NO_AUTH', `${base}/models`);
const modelsAuthRes = key ? await safeFetch('MODELS_WITH_AUTH', `${base}/models`, { headers: { Authorization: `Bearer ${key}` } }) : null;

let listed = false;
let modelInfo = null;
let freeChatModels = [];
if (modelsRes.json?.data) {
  const ids = modelsRes.json.data.map(m => m.id);
  listed = ids.includes(model);
  modelInfo = modelsRes.json.data.find(m => m.id === model) || null;
  freeChatModels = modelsRes.json.data.filter(m => m.id.includes('free') || m.id === 'big-pickle').map(m => ({ id: m.id, type: m.type, endpoint: m.endpoint, modalities: m.modalities, capabilities: m.capabilities, open_weights: m.open_weights }));
  console.log('\nMODEL_LISTED', listed);
  console.log('MODEL_INFO', JSON.stringify(modelInfo));
  console.log('FREE_OR_PICKLE', JSON.stringify(freeChatModels));
}

const body = { model, messages: [{ role: 'user', content: 'Reply with the word OK only.' }], max_tokens: 10 };
await safeFetch('CHAT_CONFIGURED_KEY', `${base}/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
  body: JSON.stringify(body),
});
await safeFetch('CHAT_NO_AUTH', `${base}/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const altModel = 'big-pickle';
await safeFetch(`CHAT_ALT_${altModel}_WITH_KEY`, `${base}/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
  body: JSON.stringify({ ...body, model: altModel }),
});
await safeFetch(`CHAT_ALT_${altModel}_NO_AUTH`, `${base}/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...body, model: altModel }),
});
