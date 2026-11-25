import test from 'node:test';
import assert from 'node:assert/strict';

process.env.VERCEL = '1';
const { default: app, detectLanguageFromText, detectIntentKeywords } = await import('../server/index.js');
const {
  encryptApiKey,
  decryptApiKey,
  isPlaceholderKey,
  saveUserKeyRecord,
  getUserKeyRecord,
  deleteUserKeyRecord,
  verifyProviderKey,
} = await import('../server/keyStore.js');

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

    // Key management endpoints must reject unauthenticated requests with 401
    for (const [method, path] of [['GET', '/api/key'], ['POST', '/api/key/activate'], ['POST', '/api/key/test'], ['DELETE', '/api/key']]) {
      const r = await fetch(`${baseUrl}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? '{}' : undefined });
      assert.equal(r.status, 401, `${method} ${path} should require auth`);
    }

    // Upload extraction validation
    const badExtractRes = await fetch(`${baseUrl}/api/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'test.exe', dataBase64: Buffer.from('abc').toString('base64') }),
    });
    assert.equal(badExtractRes.status, 400);

    // Unsupported image format validation in /api/chat
    const badImgRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'describe' }],
        imageDataUrl: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
      }),
    });
    assert.equal(badImgRes.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Encrypted keyStore isolates users, masks suffixes, and rejects placeholders', async () => {
  assert.equal(isPlaceholderKey('your_opencode_api_key_here'), true);
  assert.equal(isPlaceholderKey(''), true);
  assert.equal(isPlaceholderKey('AIzaSyTestKey123456'), false);

  const enc = encryptApiKey('AIzaSyTestKey9876');
  assert.equal(enc.key_suffix, '••••9876');
  assert.notEqual(enc.encrypted_key, 'AIzaSyTestKey9876');
  assert.equal(decryptApiKey(enc), 'AIzaSyTestKey9876');

  const userA = { userId: 'test-user-a' };
  const userB = { userId: 'test-user-b' };
  await saveUserKeyRecord(userA, 'AIzaSyUserAKey1111', { provider: 'gemini', model: 'gemini-2.5-flash', connectionState: 'Connected' });
  await saveUserKeyRecord(userB, 'AIzaSyUserBKey2222', { provider: 'gemini', model: 'gemini-2.5-flash', connectionState: 'Connected' });

  const recA = await getUserKeyRecord(userA);
  const recB = await getUserKeyRecord(userB);
  assert.equal(decryptApiKey(recA), 'AIzaSyUserAKey1111');
  assert.equal(decryptApiKey(recB), 'AIzaSyUserBKey2222');

  await deleteUserKeyRecord(userA);
  assert.equal(await getUserKeyRecord(userA), null);
  assert.equal(decryptApiKey(await getUserKeyRecord(userB)), 'AIzaSyUserBKey2222');
  await deleteUserKeyRecord(userB);

  const emptyVerify = await verifyProviderKey('   ');
  assert.equal(emptyVerify.ok, false);
  assert.equal(emptyVerify.connectionState, 'Invalid API Key');
});
