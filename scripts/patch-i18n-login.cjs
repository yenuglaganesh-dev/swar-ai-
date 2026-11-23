const fs=require('fs');
const p='src/i18n/translations.ts';
let s=fs.readFileSync(p,'utf8');
function ins(after, key, val){
  const needle = `    ${key}:`;
  if(s.includes(needle)) return;
  s=s.replace(after, `${after}\n    ${key}: ${JSON.stringify(val)},`);
}
ins("    tagline: 'Your Voice. Your Language. Your AI.',","loginHeroTitle","Your Voice. Your Language. Your Intelligence.");
ins("    mission: 'Making AI accessible to everyone.',","loginHeroSubtitle","Everyone Deserves to Be Heard.");
ins("    signIn: 'Sign in',","signingIn","Signing in...");
ins("    createAccount: 'Create account',","creatingAccount","Creating account...");
ins("    password: 'Password',","showPassword","Show password");
ins("    showPassword: \"Show password\",","hidePassword","Hide password");
ins("    googleError: 'Google sign-in failed. Please try again.',","googleNotConfigured","Google sign-in is not configured in Supabase. Enable Google provider in Supabase Authentication settings.");
ins("    passwordResetSent: 'Password reset email sent. Please check your inbox.',","loginSuccess","Signed in successfully.");

// Hindi
ins("    tagline: 'आपकी आवाज़। आपकी भाषा। आपकी AI।',","loginHeroTitle","आपकी आवाज़। आपकी भाषा। आपकी बुद्धिमत्ता।");
ins("    mission: 'AI को हर किसी के लिए सुलभ बनाना।',","loginHeroSubtitle","हर कोई सुने जाने का हकदार है।");
ins("    signIn: 'साइन इन करें',","signingIn","साइन इन हो रहा है...");
ins("    createAccount: 'खाता बनाएं',","creatingAccount","खाता बनाया जा रहा है...");
ins("    password: 'पासवर्ड',","showPassword","पासवर्ड दिखाएं");
ins("    showPassword: \"पासवर्ड दिखाएं\",","hidePassword","पासवर्ड छिपाएं");
ins("    googleError: 'Google साइन-इन विफल रहा। कृपया फिर प्रयास करें।',","googleNotConfigured","Supabase में Google साइन-इन कॉन्फ़िगर नहीं है। Supabase Authentication सेटिंग में Google provider सक्षम करें।");
ins("    passwordResetSent: 'पासवर्ड रीसेट ईमेल भेजा गया। कृपया अपना इनबॉक्स जांचें।',","loginSuccess","सफलतापूर्वक साइन इन हुआ।");

// Telugu
ins("    tagline: 'మీ స్వరం. మీ భాష. మీ AI.',","loginHeroTitle","మీ స్వరం. మీ భాష. మీ తెలివి.");
ins("    mission: 'AIని అందరికీ అందుబాటులోకి తీసుకురావడం.',","loginHeroSubtitle","ప్రతి ఒక్కరూ వినబడటానికి అర్హులు.");
ins("    signIn: 'సైన్ ఇన్',","signingIn","సైన్ ఇన్ అవుతోంది...");
ins("    createAccount: 'ఖాతా సృష్టించండి',","creatingAccount","ఖాతా సృష్టించబడుతోంది...");
ins("    password: 'పాస్‌వర్డ్',","showPassword","పాస్‌వర్డ్ చూపించు");
ins("    showPassword: \"పాస్‌వర్డ్ చూపించు\",","hidePassword","పాస్‌వర్డ్ దాచు");
ins("    googleError: 'Google సైన్-ఇన్ విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',","googleNotConfigured","Supabase లో Google సైన్-ఇన్ కాన్ఫిగర్ కాలేదు. Supabase Authentication సెట్టింగ్‌లలో Google provider ను ప్రారంభించండి.");
ins("    passwordResetSent: 'పాస్‌వర్డ్ రీసెట్ ఇమెయిల్ పంపబడింది. దయచేసి మీ ఇన్‌బాక్స్ తనిఖీ చేయండి.',","loginSuccess","విజయవంతంగా సైన్ ఇన్ అయ్యారు.");
fs.writeFileSync(p,s);
console.log('ok');