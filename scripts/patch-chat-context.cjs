const fs=require('fs');
const p='server/index.js';
let s=fs.readFileSync(p,'utf8');
const old=`  let liveContext = '';
  const lower = lastUser.toLowerCase();
  if (/\\bweather|temperature|rain|వాతావరణం|मौसम\\b/.test(lower)) {
    const w = await fetchWeather(locationHint || process.env.DEFAULT_WEATHER_LOCATION || 'Hyderabad');
    if (w) liveContext += \`\\nLive weather data: \${JSON.stringify(w)}\`;
    else liveContext += '\\nLive weather data unavailable: WEATHER_API_KEY or location missing.';
  }
  if (/\\bnews|headlines|వార్తలు|समाचार\\b/.test(lower)) {
    const n = await fetchNews(locationHint || 'India');
    if (n) liveContext += \`\\nLive news data: \${JSON.stringify(n)}\`;
    else liveContext += '\\nLive news data unavailable: NEWS_API_KEY missing.';
  }`;
const neu=`  let liveContext = '';
  const lower = lastUser.toLowerCase();
  const wantsWeather = /\\b(weather|temperature|forecast|rain|humidity|wind|hot|cold|sunny|cloudy|मौसम|तापमान|बारिश|वातावरणం|ఉష్ణోగ్రత|వర్షం)\\b/.test(lower);
  const wantsNews = /\\b(news|headlines|latest|happening|breaking|article|समाचार|खबर|వార్తలు|తాజా)\\b/.test(lower);
  if (wantsWeather) {
    const weatherLoc = (typeof locationHint === 'string' && locationHint.trim()) ? locationHint : DEFAULT_WEATHER_LOCATION;
    const w = await fetchWeather(weatherLoc);
    liveContext += \`\\nLive weather result: \${JSON.stringify({ ok: w.ok, configured: w.configured, error: w.error, message: w.message, data: w.data, retryAfterSec: w.retryAfterSec })}\`;
  }
  if (wantsNews) {
    const m = lower.match(/\\b(?:news|headlines|happening)\\b(?:\\s+(?:about|on|in|for))?\\s+(.+)/i);
    const topic = (m?.[1] || locationHint || 'technology OR India').replace(/[?.!]+$/, '').slice(0, 80);
    const n = await fetchNews(topic);
    liveContext += \`\\nLive news result: \${JSON.stringify({ ok: n.ok, configured: n.configured, error: n.error, message: n.message, data: n.data, retryAfterSec: n.retryAfterSec })}\`;
  }`;
if(!s.includes(old)){console.error('not found'); process.exit(1);}
fs.writeFileSync(p,s.replace(old,neu)); console.log('ok');