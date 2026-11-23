const fs=require('fs');
const p='src/pages/AssistantPage.tsx';
let s=fs.readFileSync(p,'utf8');
s=s.replace(
  "import { sendChatMessage, fetchWeather, fetchNews } from '@/services/aiAssistant';",
  "import { sendChatMessage, fetchWeather, fetchNews, type WeatherData, type NewsArticle, type ApiResult } from '@/services/aiAssistant';"
);
s=s.replace(
  /  const \[weatherInfo, setWeatherInfo\] = useState<string>\(''\);\r?\n  const \[newsInfo, setNewsInfo\] = useState<string>\(''\);/,
  "  const [weatherResult, setWeatherResult] = useState<ApiResult<WeatherData> | null>(null);\n  const [newsResult, setNewsResult] = useState<ApiResult<{ source: string; query: string; articles: NewsArticle[] }> | null>(null);\n  const [weatherLoading, setWeatherLoading] = useState(false);\n  const [newsLoading, setNewsLoading] = useState(false);"
);
s=s.replace(
  /  const doWeather = async \(\) => \{[\s\S]*?setError\(t\('externalApiNotConfigured'\)\); \};\r?\n  const doNews = async \(\) => \{[\s\S]*?setError\(t\('externalApiNotConfigured'\)\); \};/,
`  const doWeather = async (askAssistant = true) => {
    setWeatherLoading(true); setError(null);
    const r = await fetchWeather(locationHint || 'Hyderabad');
    setWeatherResult(r); setWeatherLoading(false);
    if (askAssistant) {
      if (r.ok && r.data) handleSend(\`\${t('weather')} in \${locationHint || 'Hyderabad'}\`);
      else setError(r.message || t('weatherError'));
    }
    return r;
  };

  const doNews = async (query?: string, askAssistant = true) => {
    const q = (query || locationHint || 'technology').trim();
    setNewsLoading(true); setError(null);
    const r = await fetchNews(q);
    setNewsResult(r); setNewsLoading(false);
    if (askAssistant) {
      if (r.ok && r.data?.articles?.length) handleSend(\`\${t('news')} about \${q}\`);
      else setError(r.message || t('newsError'));
    }
    return r;
  };`
);
s=s.replace(
  `                <button className="btn btn-secondary btn-sm" onClick={doWeather}><CloudSun size={16} />{t('weather')}</button>\n                <button className="btn btn-secondary btn-sm" onClick={doNews}><Newspaper size={16} />{t('news')}</button>`,
  `                <button className="btn btn-secondary btn-sm" onClick={() => doWeather(true)} disabled={weatherLoading}><CloudSun size={16} />{weatherLoading ? t('loading') : t('weather')}</button>\n                <button className="btn btn-secondary btn-sm" onClick={() => doNews(undefined, true)} disabled={newsLoading}><Newspaper size={16} />{newsLoading ? t('loading') : t('news')}</button>`
);
s=s.replace(
  /            <div className="quick-actions">[\s\S]*?<button className=\{\`chip \${mode === 'emergency' \? 'active-chip' : ''\}\`} onClick=\{\(\) => setMode\(mode === 'emergency' \? 'default' : 'emergency'\)\}><ShieldAlert size=\{14\} \/>\{t\('emergency'\)\}<\/button>\r?\n            <\/div>/,
`            <div className="quick-actions">
              <button className={\`chip \${mode === 'tutor' ? 'active-chip' : ''}\`} onClick={() => setMode(mode === 'tutor' ? 'default' : 'tutor')}><GraduationCap size={14} />{t('tutorMode')}</button>
              <button className={\`chip \${mode === 'translate' ? 'active-chip' : ''}\`} onClick={() => setMode(mode === 'translate' ? 'default' : 'translate')}><Languages size={14} />{t('translateMode')}</button>
              <button className={\`chip \${mode === 'emergency' ? 'active-chip' : ''}\`} onClick={() => setMode(mode === 'emergency' ? 'default' : 'emergency')}><ShieldAlert size={14} />{t('emergency')}</button>
            </div>
            {(weatherLoading || weatherResult || newsLoading || newsResult) && (
              <div className="live-data-grid" aria-live="polite">
                <div className="live-card">
                  <div className="live-card-head"><CloudSun size={16} /> <strong>{t('weather')}</strong></div>
                  {weatherLoading && <p className="muted">{t('weatherLoading')}</p>}
                  {!weatherLoading && weatherResult?.ok && weatherResult.data && (
                    <div className="live-body">
                      <div><strong>{weatherResult.data.location}{weatherResult.data.country ? \`, \${weatherResult.data.country}\` : ''}</strong></div>
                      <div>{t('temperature')}: {weatherResult.data.tempC != null ? \`\${Math.round(weatherResult.data.tempC)}°C\` : '—'} {weatherResult.data.feelsLikeC != null ? \`(\${t('feelsLike')} \${Math.round(weatherResult.data.feelsLikeC)}°C)\` : ''}</div>
                      <div>{t('conditions')}: {weatherResult.data.conditions || '—'}</div>
                      <div>{t('humidity')}: {weatherResult.data.humidity != null ? \`\${weatherResult.data.humidity}%\` : '—'} | {t('windSpeed')}: {weatherResult.data.windSpeedMps != null ? \`\${weatherResult.data.windSpeedMps} m/s\` : '—'}</div>
                      <div className="muted small">{t('source')}: {weatherResult.data.source}. {t('weatherApiPlanNote')}</div>
                    </div>
                  )}
                  {!weatherLoading && weatherResult && !weatherResult.ok && (
                    <div className="live-body"><div className="live-error">{weatherResult.message || t('weatherError')}</div><button className="btn btn-secondary btn-sm" onClick={() => doWeather(false)}>{t('retry')}</button></div>
                  )}
                </div>
                <div className="live-card">
                  <div className="live-card-head"><Newspaper size={16} /> <strong>{t('news')}</strong></div>
                  {newsLoading && <p className="muted">{t('newsLoading')}</p>}
                  {!newsLoading && newsResult?.ok && newsResult.data && (
                    <div className="live-body">
                      {newsResult.data.articles.length ? newsResult.data.articles.map((a, i) => (
                        <article key={a.url + i} className="news-item">
                          <a href={a.url} target="_blank" rel="noreferrer" className="news-title">{a.title}</a>
                          <div className="muted small">{a.source}{a.publishedAt ? \` • \${new Date(a.publishedAt).toLocaleString()}\` : ''}</div>
                        </article>
                      )) : <div className="muted">{t('noNewsFound')}</div>}
                      <div className="muted small">{t('source')}: {newsResult.data.source}. {t('newsApiPlanNote')}</div>
                    </div>
                  )}
                  {!newsLoading && newsResult && !newsResult.ok && (
                    <div className="live-body"><div className="live-error">{newsResult.message || t('newsError')}</div><button className="btn btn-secondary btn-sm" onClick={() => doNews(undefined, false)}>{t('retry')}</button></div>
                  )}
                </div>
              </div>
            )}`
);
s=s.replace(
  ".notice{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:rgba(255,154,90,0.1);color:#ffd2c2;font-size:.88rem;flex-wrap:wrap}",
  `.notice{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:rgba(255,154,90,0.1);color:#ffd2c2;font-size:.88rem;flex-wrap:wrap}
        .live-data-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;width:100%;max-width:920px}
        .live-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px;text-align:left}
        .live-card-head{display:flex;gap:8px;align-items:center;margin-bottom:8px;color:#fff}
        .live-body{display:flex;flex-direction:column;gap:8px;font-size:.92rem;color:#ddd}
        .news-item{padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)} .news-item:last-child{border-bottom:none}
        .news-title{color:#ffd2c2;text-decoration:none;line-height:1.4} .news-title:hover{text-decoration:underline}
        .muted{color:var(--text-muted)} .small{font-size:.78rem} .live-error{color:#ffb3b3}`
);
fs.writeFileSync(p,s);
console.log('ok');