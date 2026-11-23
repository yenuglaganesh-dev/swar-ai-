const fs=require('fs');
const p='src/i18n/translations.ts';
let s=fs.readFileSync(p,'utf8');
const old=`    weather: "వాతావరణం",
    news: "వార్తలు",
    weatherNews: "వాతావరణం & వార్తలు",
    emergency: "అత్యవసర సమాచారం",
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
    weatherApiPlanNote: "OpenWeatherMap ఫ్రీ ప్లాన్‌కు అభ్యర్థన పరిమితులు ఉన్నాయి; రేట్ లిమిట్ అయితే మళ్లీ ప్రయత్నించండి.",`;
if(s.includes(old)){console.log('already ok')} else {
  // find the te section weather/news block and replace from weather: to weatherApiPlanNote line
  const re=/    weather: "వాతావరణం",[\s\S]*?weatherApiPlanNote: "OpenWeatherMap ఫ్రీ ప్లాన్‌కు అభ్యర్థన పరిమితులు ఉన్నాయి; రేట్ లిమిట్ అయితే మళ్లీ ప్రయత్నించండి\.",/;
  if(re.test(s)){ s=s.replace(re, old); fs.writeFileSync(p,s); console.log('fixed'); }
  else { console.log('not found'); }
}