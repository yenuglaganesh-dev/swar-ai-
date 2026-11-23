const fs=require('fs');
const p='src/i18n/translations.ts';
let s=fs.readFileSync(p,'utf8');
function add(after, block){
  if(s.includes(block.trim().slice(0,40))) return;
  s=s.replace(after, after+'\n'+block);
}
add('    externalApiNotConfigured: "This live service is not configured. Add the required API key in .env.",',`    weatherLoading: "Fetching live weather...",
    newsLoading: "Fetching latest news...",
    weatherError: "Could not fetch weather.",
    newsError: "Could not fetch news.",
    retry: "Retry",
    temperature: "Temperature",
    conditions: "Conditions",
    humidity: "Humidity",
    windSpeed: "Wind speed",
    feelsLike: "Feels like",
    source: "Source",
    publishedAt: "Published",
    openArticle: "Open article",
    noNewsFound: "No news articles found for this request.",
    newsApiPlanNote: "NewsAPI free/developer plans may be limited to localhost/dev use and have request limits.",
    weatherApiPlanNote: "OpenWeatherMap free plan has request limits; retry if rate-limited.",`);
add('    externalApiNotConfigured: "यह लाइव सेवा कॉन्फ़िगर नहीं है। .env में आवश्यक API key जोड़ें।",',`    weatherLoading: "लाइव मौसम लाया जा रहा है...",
    newsLoading: "ताज़ा समाचार लाए जा रहे हैं...",
    weatherError: "मौसम जानकारी नहीं मिल सकी।",
    newsError: "समाचार नहीं मिल सके।",
    retry: "फिर प्रयास करें",
    temperature: "तापमान",
    conditions: "स्थिति",
    humidity: "नमी",
    windSpeed: "हवा की गति",
    feelsLike: "महसूस तापमान",
    source: "स्रोत",
    publishedAt: "प्रकाशित",
    openArticle: "लेख खोलें",
    noNewsFound: "इस अनुरोध के लिए कोई समाचार नहीं मिला।",
    newsApiPlanNote: "NewsAPI का फ्री/डेवलपर प्लान localhost/dev उपयोग और अनुरोध सीमा तक सीमित हो सकता है।",
    weatherApiPlanNote: "OpenWeatherMap फ्री प्लान में अनुरोध सीमा है; रेट लिमिट पर फिर प्रयास करें।",`);
add('    externalApiNotConfigured: "ఈ లైవ్ సేవ కాన్ఫిగర్ కాలేదు. .env లో అవసరమైన API key జోడించండి.",',`    weatherLoading: "లైవ్ వాతావరణం తెస్తోంది...",
    newsLoading: "తాజా వార్తలు తెస్తోంది...",
    weatherError: "వాతావరణాన్ని పొందలేకపోయింది.",
    newsError: "వార్తలను పొందలేకపోయింది.",
    retry: "మళ్లీ ప్రయత్నించండి",
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
    weatherApiPlanNote: "OpenWeatherMap ఫ్రీ ప్లాన్‌కు అభ్యర్థన పరిమితులు ఉన్నాయి; రేట్ లిమిట్ అయితే మళ్లీ ప్రయత్నించండి.",`);
fs.writeFileSync(p,s);
console.log('ok');