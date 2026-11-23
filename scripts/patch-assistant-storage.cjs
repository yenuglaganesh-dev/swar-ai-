const fs=require('fs');
const p='src/pages/AssistantPage.tsx';
let s=fs.readFileSync(p,'utf8');
if(!s.includes("from '@/services/safeStorage'")){
  s=s.replace("import { sendChatMessage, fetchWeather, fetchNews, type WeatherData, type NewsArticle, type ApiResult } from '@/services/aiAssistant';", "import { sendChatMessage, fetchWeather, fetchNews, type WeatherData, type NewsArticle, type ApiResult } from '@/services/aiAssistant';\nimport { safeStorage, safeJsonParse } from '@/services/safeStorage';");
}
s=s.replace(
  "const loadHistory = (): ChatMessage[] => { try { const r = localStorage.getItem(HISTORY_KEY); return r ? JSON.parse(r) : []; } catch { return []; } };",
  "const loadHistory = (): ChatMessage[] => safeJsonParse<ChatMessage[]>(safeStorage.getItem(HISTORY_KEY), []);"
);
s=s.replace("  const [locationHint, setLocationHint] = useState(localStorage.getItem('swar_location') || 'Hyderabad');", "  const [locationHint, setLocationHint] = useState(safeStorage.getItem('swar_location') || 'Hyderabad');");
s=s.replace("  useEffect(() => { if (settings.saveHistory) try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages)); } catch {} }, [messages, settings.saveHistory]);", "  useEffect(() => { if (settings.saveHistory) safeStorage.setItem(HISTORY_KEY, JSON.stringify(messages)); }, [messages, settings.saveHistory]);");
s=s.replace("  useEffect(() => { if (!settings.saveHistory) try { localStorage.removeItem(HISTORY_KEY); } catch {} }, [settings.saveHistory]);", "  useEffect(() => { if (!settings.saveHistory) safeStorage.removeItem(HISTORY_KEY); }, [settings.saveHistory]);");
s=s.replace("const clearHistory = () => { stopSpeaking(); setMessages([]); try { localStorage.removeItem(HISTORY_KEY); } catch {} setStatus('idle'); convoIdRef.current = null; greetedRef.current = false; setTimeout(() => { greetedRef.current = true; setMessages([{ id: uid(), role: 'assistant', content: t('assistantGreeting'), language, timestamp: Date.now() }]); }, 0); };", "const clearHistory = () => { stopSpeaking(); setMessages([]); safeStorage.removeItem(HISTORY_KEY); setStatus('idle'); convoIdRef.current = null; greetedRef.current = false; setTimeout(() => { greetedRef.current = true; setMessages([{ id: uid(), role: 'assistant', content: t('assistantGreeting'), language, timestamp: Date.now() }]); }, 0); };");
s=s.replace("onChange={(e) => { setLocationHint(e.target.value); localStorage.setItem('swar_location', e.target.value); }}", "onChange={(e) => { setLocationHint(e.target.value); safeStorage.setItem('swar_location', e.target.value); }}");
fs.writeFileSync(p,s);
console.log('ok');