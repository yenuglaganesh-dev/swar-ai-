import dotenv from 'dotenv';
dotenv.config({path:'.env'});
const key=process.env.AI_API_KEY||'';
const model=process.env.AI_MODEL||'mimo-v2.5-free';
const r=await fetch('https://opencode.ai/zen/v1/models',{headers:key?{Authorization:`Bearer ${key}`}:{}}); 
const t=await r.text();
console.log('STATUS',r.status);
try{
  const j=JSON.parse(t);
  const ids=(j.data||[]).map(x=>x.id);
  console.log('HAS', ids.includes(model));
  console.log('MIMO', ids.filter(i=>i.includes('mimo')));
  console.log('FREE', ids.filter(i=>i.includes('free')).slice(0,30));
}catch{ console.log(t.slice(0,400)); }