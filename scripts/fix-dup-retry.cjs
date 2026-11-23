const fs=require('fs');
const p='src/i18n/translations.ts';
let s=fs.readFileSync(p,'utf8');
// remove duplicate retry lines added after externalApiNotConfigured blocks
s=s.replace(/\n    retry: "Retry",(?=\n    temperature: "Temperature",)/,'');
s=s.replace(/\n    retry: "फिर प्रयास करें",(?=\n    temperature: "तापमान",)/,'');
s=s.replace(/\n    retry: "మళ్లీ ప్రయత్నించండి",(?=\n    temperature: "ఉష్ణోగ్రత",)/,'');
fs.writeFileSync(p,s);
console.log('ok');