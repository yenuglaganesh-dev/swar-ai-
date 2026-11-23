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
  if(!m) { console.log('no anchor', section, key); return; }
  const insertAt=m.index + m[0].length;
  block=block.slice(0,insertAt) + `\n    ${key}: ${JSON.stringify(value)},` + block.slice(insertAt);
  s=s.slice(0,secIdx)+block+s.slice(end);
}

ensureInSection("'en-IN': {",'loginSuccess','Signed in successfully.',/    passwordResetSent: [^\n]+,/);
ensureInSection("'hi-IN': {",'loginSuccess','सफलतापूर्वक साइन इन हुआ।',/    passwordResetSent: [^\n]+,/);
ensureInSection("'te-IN': {",'loginHeroTitle','మీ స్వరం. మీ భాష. మీ తెలివి.',/    tagline: [^\n]+,/);
ensureInSection("'te-IN': {",'loginHeroSubtitle','ప్రతి ఒక్కరూ వినబడటానికి అర్హులు.',/    mission: [^\n]+,/);
ensureInSection("'te-IN': {",'signingIn','సైన్ ఇన్ అవుతోంది...',/    signIn: [^\n]+,/);
ensureInSection("'te-IN': {",'showPassword','పాస్‌వర్డ్ చూపించు',/    password: [^\n]+,/);
ensureInSection("'te-IN': {",'hidePassword','పాస్‌వర్డ్ దాచు',/    showPassword: [^\n]+,/);
ensureInSection("'te-IN': {",'creatingAccount','ఖాతా సృష్టించబడుతోంది...',/    createAccount: [^\n]+,/);
ensureInSection("'te-IN': {",'googleNotConfigured','Supabase లో Google సైన్-ఇన్ కాన్ఫిగర్ కాలేదు. Supabase Authentication సెట్టింగ్‌లలో Google provider ను ప్రారంభించండి.',/    googleError: [^\n]+,/);
ensureInSection("'te-IN': {",'loginSuccess','విజయవంతంగా సైన్ ఇన్ అయ్యారు.',/    passwordResetSent: [^\n]+,/);

fs.writeFileSync(p,s);
console.log('ok');