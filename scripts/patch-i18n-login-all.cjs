const fs=require('fs');
const p='src/i18n/translations.ts';
let s=fs.readFileSync(p,'utf8');
function ins(after,key,val){
  const needle=`    ${key}:`;
  if(s.includes(needle) && s.indexOf(needle, s.indexOf(after)) > -1) {
    // rough: but easier to check per section by splitting; we'll do section-based
  }
}
function addToSection(sectionMarker, entries){
  const idx=s.indexOf(sectionMarker);
  if(idx<0) return;
  const nextSection=s.indexOf("\n  '", idx+1);
  const end=nextSection>idx?nextSection:s.indexOf('} as const', idx);
  let block=s.slice(idx,end);
  for(const [after,key,val] of entries){
    if(block.includes(`    ${key}:`)) continue;
    if(block.includes(after)) block=block.replace(after, after+`\n    ${key}: ${JSON.stringify(val)},`);
  }
  s=s.slice(0,idx)+block+s.slice(end);
}
addToSection("'en-IN': {", [
  ["    tagline: 'Your Voice. Your Language. Your AI.',","loginHeroTitle","Your Voice. Your Language. Your Intelligence."],
  ["    mission: 'Making AI accessible to everyone.',","loginHeroSubtitle","Everyone Deserves to Be Heard."],
  ["    signIn: 'Sign in',","signingIn","Signing in..."],
  ["    password: 'Password',","showPassword","Show password"],
  ["    showPassword: \"Show password\",","hidePassword","Hide password"],
  ["    createAccount: 'Create account',","creatingAccount","Creating account..."],
  ["    googleError: 'Google sign-in failed. Please try again.',","googleNotConfigured","Google sign-in is not configured in Supabase. Enable the Google provider in Supabase Authentication settings."],
  ["    passwordResetSent: 'Password reset email sent. Please check your inbox.',","loginSuccess","Signed in successfully."],
]);
addToSection("'hi-IN': {", [
  ["    tagline: 'आपकी आवाज़। आपकी भाषा। आपकी AI।',","loginHeroTitle","आपकी आवाज़। आपकी भाषा। आपकी बुद्धिमत्ता।"],
  ["    mission: 'AI को हर किसी के लिए सुलभ बनाना।',","loginHeroSubtitle","हर कोई सुने जाने का हकदार है।"],
  ["    signIn: 'साइन इन करें',","signingIn","साइन इन हो रहा है..."],
  ["    password: 'पासवर्ड',","showPassword","पासवर्ड दिखाएं"],
  ["    showPassword: \"पासवर्ड दिखाएं\",","hidePassword","पासवर्ड छिपाएं"],
  ["    createAccount: 'खाता बनाएं',","creatingAccount","खाता बनाया जा रहा है..."],
  ["    googleError: 'Google साइन-इन विफल रहा। कृपया फिर प्रयास करें।',","googleNotConfigured","Supabase में Google साइन-इन कॉन्फ़िगर नहीं है। Supabase Authentication सेटिंग में Google provider सक्षम करें।"],
  ["    passwordResetSent: 'पासवर्ड रीसेट ईमेल भेजा गया। कृपया अपना इनबॉक्स जांचें।',","loginSuccess","सफलतापूर्वक साइन इन हुआ।"],
]);
addToSection("'te-IN': {", [
  ["    tagline: 'మీ స్వరం. మీ భాష. మీ AI.',","loginHeroTitle","మీ స్వరం. మీ భాష. మీ తెలివి."],
  ["    mission: 'AIని అందరికీ అందుబాటులోకి తీసుకురావడం.',","loginHeroSubtitle","ప్రతి ఒక్కరూ వినబడటానికి అర్హులు."],
  ["    signIn: 'సైన్ ఇన్',","signingIn","సైన్ ఇన్ అవుతోంది..."],
  ["    password: 'పాస్‌వర్డ్',","showPassword","పాస్‌వర్డ్ చూపించు"],
  ["    showPassword: \"పాస్‌వర్డ్ చూపించు\",","hidePassword","పాస్‌వర్డ్ దాచు"],
  ["    createAccount: 'ఖాతా సృష్టించండి',","creatingAccount","ఖాతా సృష్టించబడుతోంది..."],
  ["    googleError: 'Google సైన్-ఇన్ విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',","googleNotConfigured","Supabase లో Google సైన్-ఇన్ కాన్ఫిగర్ కాలేదు. Supabase Authentication సెట్టింగ్‌లలో Google provider ను ప్రారంభించండి."],
  ["    passwordResetSent: 'పాస్‌వర్డ్ రీసెట్ ఇమెయిల్ పంపబడింది. దయచేసి మీ ఇన్‌బాక్స్ తనిఖీ చేయండి.',","loginSuccess","విజయవంతంగా సైన్ ఇన్ అయ్యారు."],
]);
fs.writeFileSync(p,s);
console.log('ok');