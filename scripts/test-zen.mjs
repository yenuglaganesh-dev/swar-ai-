import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const key = process.env.AI_API_KEY || '';
const base = 'https://opencode.ai/zen/v1';
const model = 'mimo-v2.5-free';

const m = await fetch(base + '/models', { headers: { Authorization: `Bearer ${key}` } });
const mText = await m.text();
console.log('MODELS_STATUS', m.status);
try {
  const j = JSON.parse(mText);
  const ids = (j.data || []).map(x => x.id);
  console.log('HAS_MODEL', ids.includes(model));
  console.log('SAMPLE', ids.slice(0, 20));
  console.log('MATCHES', ids.filter(id => id.includes('mimo')));
} catch {
  console.log('MODELS_BODY', mText.slice(0, 500));
}

const r = await fetch(base + '/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
  body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Reply with OK only.' }], max_tokens: 10 }),
});
const text = await r.text();
console.log('CHAT_STATUS', r.status);
console.log('CHAT_BODY', text.slice(0, 800));