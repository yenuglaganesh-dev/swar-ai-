const fs=require('fs');
const p='src/i18n/translations.ts';
let s=fs.readFileSync(p,'utf8');
const teStart=s.indexOf("'te-IN': {");
const teEnd=s.indexOf("  },\n} as const;", teStart);
if(teStart<0||teEnd<0){console.log('nf'); process.exit(1);}
const before=s.slice(0,teStart);
const after=s.slice(teEnd);
// Keep everything in te-IN before dataDeleted and replace rest
const te=s.slice(teStart,teEnd);
const dd=te.indexOf('    dataDeleted:');
if(dd<0){console.log('nf2'); process.exit(1);}
const head=te.slice(0,dd);
const tail=`    dataDeleted: "డేటా తొలగించబడింది.",
    weather: "వాతావరణం",
    news: "వార్తలు",
    weatherNews: "వాతావరణం & వార్తలు",
    location: "స్థానం",
    getWeather: "వాతావరణం పొందండి",
    getNews: "వార్తలు పొందండి",
    externalApiNotConfigured: "ఈ లైవ్ సేవ కాన్ఫిగర్ కాలేదు. .env లో అవసరమైన API key జోడించండి.",
    weatherLoading: "లైవ్ వాతావరణం తెస్తోంది...",
    newsLoading: "తాజా వార్తలు తెస్తోంది...",
    weatherError: "వాతావరణాన్ని పొందలేకపోయింది.",
    newsError: "వార్తలను పొందలేకపోయింది.",
    temperature: "ఉష్ణోగ్రత",
    conditions: "పరిస్థితులు",
    humidity: "తేమ",
    windSpeed: "గాలి వేగం",
    feelsLike: "అనుభూతి ఉష్ణోగ్రత",
    source: "మూలం",
    publishedAt: "ప్రచురణ",
    openArticle: "కథనం తెరవండి",
    noNewsFound: "ఈ అభ్యర్థనకు వార్తా కథనాలు కనిపించలేదు.",
    newsApiPlanNote: "NewsAPI ఫ్రీ/డెవలపర్ ప్లాన్ localhost/dev వినియోగం మరియు అభ్యర్థన పరిమితులను కలిగి ఉండవచ్చు.",
    weatherApiPlanNote: "OpenWeatherMap ఫ్రీ ప్లాన్‌కు అభ్యర్థన పరిమితులు ఉన్నాయి; రేట్ లిమిట్ అయితే మళ్లీ ప్రయత్నించండి.",
    emergency: "అత్యవసర సమాచారం",
    emergencyTitle: "ధృవీకరించిన అత్యవసర సమాచారం",
    emergencyDesc: "అత్యవసర పరిస్థితిలో దయచేసి వెంటనే స్థానిక అత్యవసర సేవలను సంప్రదించండి. నేను సాధారణ భద్రతా మార్గదర్శకాలను మాత్రమే ఇవ్వగలను.",
    emergencyIndia: "భారత అత్యవసర నంబర్లు: 112 (అత్యవసరం), 108/102 (వైద్యం), 100 (పోలీసు), 101 (అగ్నిమాపక).",
    stopSpeaking: "మాట్లాడటం ఆపు",
    interrupt: "అడ్డుకో",
    listeningContinuous: "నిరంతరంగా వింటోంది... మాట్లాడటం ఆపండి",
    consentRequired: "సమ్మతి అవసరం",
    consentAccept: "నేను అంగీకరిస్తున్నాను",
    consentDecline: "ఇప్పుడు కాదు",
    supabaseNotConfigured: "Supabase కాన్ఫిగర్ కాలేదు. క్లౌడ్ ప్రొఫైల్‌లు మరియు చరిత్ర కోసం VITE_SUPABASE_URL మరియు VITE_SUPABASE_ANON_KEY జోడించండి.",
    authProvider: "ప్రామాణీకరణ ప్రొవైడర్",
    supabase: "Supabase",
    dashboardIntro: "మీ సెట్టింగ్‌లు, చరిత్ర మరియు గోప్యత నియంత్రణలు.",
    openDashboard: "డాష్‌బోర్డ్ తెరవండి",
    themeDesc: "డార్క్ మరియు లైట్ మోడ్ మధ్య మార్చండి.",
    assistantIntro: 'ప్రశ్నలు, నేర్చుకోవడం, రోజువారీ పనులు, టెక్నాలజీ మరియు మరెన్నో విషయాల్లో నేను మీకు సహాయం చేయగలను.',
`;
fs.writeFileSync(p,before+head+tail+after);
console.log('ok');