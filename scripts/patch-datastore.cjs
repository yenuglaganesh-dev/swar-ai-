const fs=require('fs');
const p='src/services/dataStore.ts';
let s=fs.readFileSync(p,'utf8');
if(!s.includes("safeStorage")){
  s=s.replace("import { ChatMessage, LanguageCode } from '@/types';", "import { ChatMessage, LanguageCode } from '@/types';\nimport { safeStorage, safeJsonParse } from './safeStorage';");
}
s=s.replaceAll("JSON.parse(localStorage.getItem(key) || '[]')", "safeJsonParse<any[]>(safeStorage.getItem(key), [])");
s=s.replaceAll("localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)))", "safeStorage.setItem(key, JSON.stringify(existing.slice(0, 50)))");
s=s.replaceAll("localStorage.setItem(key, JSON.stringify(existing))", "safeStorage.setItem(key, JSON.stringify(existing))");
s=s.replaceAll("localStorage.removeItem(`swar_memories_${userId}`)", "safeStorage.removeItem(`swar_memories_${userId}`)");
s=s.replace("try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }", "return safeJsonParse<MemoryItem[]>(safeStorage.getItem(key), []);");
s=s.replaceAll("JSON.parse(localStorage.getItem(key) || '[]')", "safeJsonParse<any[]>(safeStorage.getItem(key), [])");
s=s.replaceAll("localStorage.setItem(key, JSON.stringify(existing.slice(0, 200)))", "safeStorage.setItem(key, JSON.stringify(existing.slice(0, 200)))");
s=s.replace("try { events = JSON.parse(localStorage.getItem('swar_usage_local') || '[]'); } catch { events = []; }", "events = safeJsonParse<any[]>(safeStorage.getItem('swar_usage_local'), []);");
fs.writeFileSync(p,s);
console.log('ok');