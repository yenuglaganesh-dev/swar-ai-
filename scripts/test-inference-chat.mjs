import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const key = process.env.AI_API_KEY || '';
const chatUrl = 'https://opencode.ai/inference/openai/v1/chat/completions';
const model = process.argv[2] || 'big-pickle';
const r = await fetch(chatUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(key ? { Authorization: `Bearer ${key}` } : {}) },
  body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Reply with the word OK only.' }], max_tokens: 10, temperature: 0 }),
});
const text = await r.text();
console.log('MODEL', model);
console.log('STATUS', r.status);
console.log('BODY', text.slice(0, 1200));