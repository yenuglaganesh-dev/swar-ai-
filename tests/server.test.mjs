import test from 'node:test';
import assert from 'node:assert/strict';

process.env.VERCEL = '1';
const { default: app, detectLanguageFromText, detectIntentKeywords } = await import('../server/index.js');

test('detectLanguageFromText handles English, Telugu, Hindi, and mixed scripts', () => {
  assert.equal(detectLanguageFromText('Hello, how are you today?'), 'en-IN');
  assert.equal(detectLanguageFromText('నమస్కారం, మీరు ఎలా ఉన్నారు?'), 'te-IN');
  assert.equal(detectLanguageFromText('नमस्ते, आप कैसे हैं?'), 'hi-IN');
  assert.equal(detectLanguageFromText('నేను Hyderabad కి వెళ్తున్నాను'), 'te-IN');
  assert.equal(detectLanguageFromText('आज weather कैसा है?'), 'hi-IN');
});

test('detectIntentKeywords respects word boundaries and regional keywords', () => {
  assert.deepEqual(detectIntentKeywords('What is the weather in Hyderabad?'), { wantsWeather: true, wantsNews: false });
  assert.deepEqual(detectIntentKeywords('Tell me whether this works'), { wantsWeather: false, wantsNews: false });
  assert.deepEqual(detectIntentKeywords('Show me breaking news headlines'), { wantsWeather: false, wantsNews: true });
  assert.deepEqual(detectIntentKeywords('A newly created file'), { wantsWeather: false, wantsNews: false });
  assert.deepEqual(detectIntentKeywords('आज मौसम कैसा है?'), { wantsWeather: true, wantsNews: false });
  assert.deepEqual(detectIntentKeywords('తాజా వార్తలు చెప్పండి'), { wantsWeather: false, wantsNews: true });
});

test('Express /api/health and /api/chat validation & safe error responses', async () => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const health = await healthRes.json();
    assert.equal(health.ok, true);
    assert.equal(health.name, 'SWAR AI');

    const badArrayRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: 'invalid' }),
    });
    assert.equal(badArrayRes.status, 400);

    const emptyMsgRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: '   ' }], language: 'en-IN' }),
    });
    assert.equal(emptyMsgRes.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
