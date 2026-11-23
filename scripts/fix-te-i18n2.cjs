const fs=require('fs');
const p='src/i18n/translations.ts';
let s=fs.readFileSync(p,'utf8');
const block=`    weather: "వాతావరణం",
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
    emergency: "అత్యవసర సమాచారం",`;
// replace from weather: to emergency: in TE section (last occurrence area)
const start=s.indexOf('    weather: "����_����_����������,",');
const end=s.indexOf('    emergency: "��.����?��_����,�����,",', start);
if(start>0 && end>start){
  s=s.slice(0,start)+block+s.slice(end+('    emergency: "��.����?��_����,�����,",'.length));
  fs.writeFileSync(p,s); console.log('ok');
} else { console.log('not found', start, end); }