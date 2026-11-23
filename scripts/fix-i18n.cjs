const fs = require('fs');
const p = 'src/i18n/translations.ts';
let s = fs.readFileSync(p, 'utf8');
s = s.replace("authNotConfigured: 'प्रमाणीकरण कॉन्फ़िगर नहीं है। इस साइन-इन विधि को सक्षम करने के लिए Firebase env वेरिएबल जोड़ें।',", "authNotConfigured: 'प्रमाणीकरण कॉन्फ़िगर नहीं है। साइन-इन सक्षम करने के लिए Supabase env वेरिएबल जोड़ें।',");
s = s.replace("authNotConfigured: 'ప్రామాణీకరణ అమర్చబడలేదు. ఈ సైన్-ఇన్ పద్ధతిని ప్రారంభించడానికి Firebase env వేరియబుల్స్ జోడించండి.',", "authNotConfigured: 'ప్రామాణీకరణ అమర్చబడలేదు. సైన్-ఇన్ ప్రారంభించడానికి Supabase env వేరియబుల్స్ జోడించండి.',");
s = s.replace(/    firebase: "Firebase",\r?\n/g, '');
fs.writeFileSync(p, s);
console.log('ok');