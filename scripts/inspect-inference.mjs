import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const key = process.env.AI_API_KEY || '';
const keyMeta = { hasKey: !!key, looksPlaceholder: /your_|replace|example|placeholder/i.test(key) || key.length < 20 };
console.log('KEY_META', JSON.stringify(keyMeta));

const catalogUrl = 'https://opencode.ai/inference/v1/models';
const chatUrl = 'https://opencode.ai/inference/openai/v1/chat/completions';

async function probe(name, url, opts = {}) {
  try {
    const r = await fetch(url, opts);
    const text = await r.text();
    let json; try { json = JSON.parse(text); } catch {}
    console.log(`\n== ${name} ==`);
    console.log('STATUS', r.status);
    console.log('BODY', text.slice(0, 1500));
    return { status: r.status, text, json };
  } catch (e) {
    console.log(`\n== ${name} ==`);
    console.log('ERR', String(e));
    return { error: String(e) };
  }
}

const cat = await probe('CATALOG_NO_AUTH', catalogUrl);
const catAuth = key ? await probe('CATALOG_AUTH', catalogUrl, { headers: { Authorization: `Bearer ${key}` } }) : null;

function pickChatModels(json) {
  const data = json?.data || json?.models || [];
  return data.filter(m => {
    const id = m.id || m.model_id || '';
    const endpoint = m.endpoint || m.api?.endpoint || m.endpoints?.['chat-completions']?.base_url || '';
    const api = JSON.stringify(m.api || m.endpoints || m.capabilities || '').toLowerCase();
    const sdk = JSON.stringify(m).toLowerCase();
    return api.includes('chat/completions') || api.includes('openai-compatible') || sdk.includes('chat/completions') || endpoint.includes('chat/completions');
  }).map(m => ({ id: m.id, name: m.name, type: m.type, status: m.status, cost: m.cost, api: m.api, endpoint: m.endpoint, modalities: m.modalities, capabilities: m.capabilities }));
}

const source = cat.json?.data ? cat.json : catAuth?.json;
if (source) {
  const picks = pickChatModels(source);
  console.log('\nCHAT_COMPLETIONS_CANDIDATES', JSON.stringify(picks.slice(0, 30)));
  const free = picks.filter(p => /free|big-pickle/i.test(p.id));
  console.log('\nFREE_CANDIDATES', JSON.stringify(free));
}

// Try a small real completion with a likely candidate after we see catalog; placeholder for now
