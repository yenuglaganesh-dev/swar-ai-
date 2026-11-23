const fs=require('fs');
const p='src/pages/DashboardPage.tsx';
let s=fs.readFileSync(p,'utf8');
if(!s.includes("safeStorage")) s=s.replace("import { isSupabaseConfigured } from '@/services/supabase';","import { isSupabaseConfigured } from '@/services/supabase';\nimport { safeStorage } from '@/services/safeStorage';");
s=s.replace("localStorage.removeItem('swar_history');","safeStorage.removeItem('swar_history');");
s=s.replace("localStorage.removeItem('swar_settings');","safeStorage.removeItem('swar_settings');");
s=s.replace("localStorage.removeItem('swar_usage_local');","safeStorage.removeItem('swar_usage_local');");
s=s.replace("localStorage.removeItem(`swar_memories_${user.uid}`);","safeStorage.removeItem(`swar_memories_${user.uid}`);");
fs.writeFileSync(p,s); console.log('ok');