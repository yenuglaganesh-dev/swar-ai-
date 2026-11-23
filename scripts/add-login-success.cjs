const fs=require('fs');
const p='src/i18n/translations.ts';
let s=fs.readFileSync(p,'utf8');
const pairs=[
  ["    passwordResetSent: 'Password reset email sent. Please check your inbox.',","loginSuccess","Signed in successfully."],
  ["    passwordResetSent: 'पासवर्ड रीसेट ईमेल भेजा गया। कृपया अपना इनबॉक्स जांचें।',","loginSuccess","सफलतापूर्वक साइन इन हुआ।"],
  ["    passwordResetSent: 'పాస్‌వర్డ్ రీసెట్ ఇమెయిల్ పంపబడింది. దయచేసి మీ ఇన్‌బాక్స్ తనిఖీ చేయండి.',","loginSuccess","విజయవంతంగా సైన్ ఇన్ అయ్యారు."]
];
for(const [after,k,v] of pairs){ if(!s.includes(`    ${k}: ${JSON.stringify(v)}`) && !s.includes(`    ${k}: '${v}'`)) s=s.replace(after, after+`\n    ${k}: ${JSON.stringify(v)},`); }
fs.writeFileSync(p,s); console.log('ok');