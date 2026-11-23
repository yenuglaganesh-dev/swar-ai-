const fs=require('fs');
const p='src/i18n/translations.ts';
let s=fs.readFileSync(p,'utf8');
function ensureInSection(section, key, value, afterRegex){
  const secIdx=s.indexOf(section);
  if(secIdx<0) return;
  const next=s.indexOf("\n  '", secIdx+1);
  const end=next>secIdx?next:s.indexOf('\n} as const', secIdx);
  let block=s.slice(secIdx,end);
  if(block.includes(`    ${key}:`)) return;
  const m=block.match(afterRegex);
  if(!m){ console.log('no anchor', section, key); return; }
  const insertAt=m.index+m[0].length;
  block=block.slice(0,insertAt)+`\n    ${key}: ${JSON.stringify(value)},`+block.slice(insertAt);
  s=s.slice(0,secIdx)+block+s.slice(end);
}
ensureInSection("'hi-IN': {",'loginHeroTitle','आपकी आवाज़। आपकी भाषा। आपकी बुद्धिमत्ता।',/    tagline: [^\n]+,/);
ensureInSection("'hi-IN': {",'loginHeroSubtitle','हर कोई सुने जाने का हकदार है।',/    mission: [^\n]+,/);
ensureInSection("'hi-IN': {",'signingIn','साइन इन हो रहा है...',/    signIn: [^\n]+,/);
ensureInSection("'hi-IN': {",'showPassword','पासवर्ड दिखाएं',/    password: [^\n]+,/);
ensureInSection("'hi-IN': {",'hidePassword','पासवर्ड छिपाएं',/    showPassword: [^\n]+,/);
ensureInSection("'hi-IN': {",'creatingAccount','खाता बनाया जा रहा है...',/    createAccount: [^\n]+,/);
ensureInSection("'hi-IN': {",'googleNotConfigured','Supabase में Google साइन-इन कॉन्फ़िगर नहीं है। Supabase Authentication सेटिंग में Google provider सक्षम करें।',/    googleError: [^\n]+,/);
fs.writeFileSync(p,s);
console.log('ok');