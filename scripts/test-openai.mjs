import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const key = process.env.AI_API_KEY;
const url = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
const model = process.env.AI_MODEL || 'gpt-4o-mini';
const r = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
  body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Reply with the word OK only.' }], max_tokens: 5 }),
});
const text = await r.text();
console.log('STATUS', r.status);
console.log('BODY', text.slice(0, 800));