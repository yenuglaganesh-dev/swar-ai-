const fs = require('fs');
const p = 'server/index.js';
let s = fs.readFileSync(p, 'utf8');
const start = s.indexOf('function fallbackResponse(message, language) {');
const end = s.indexOf("\n}\n\napp.get('/api/health'");
if (start < 0 || end < 0) { console.error('not found', start, end); process.exit(1); }
const repl = `function fallbackResponse(_message, language, reason = 'AI_SERVICE_UNAVAILABLE') {
  const lang = LANG_NAMES[language] ? language : 'en-IN';
  const details = {
    AI_NOT_CONFIGURED: {
      'en-IN': 'The AI service is not configured on the server. Add AI_API_KEY in the server .env file and restart the backend.',
      'hi-IN': 'सर्वर पर AI सेवा कॉन्फ़िगर नहीं है। सर्वर .env में AI_API_KEY जोड़ें और बैकएंड रीस्टार्ट करें।',
      'te-IN': 'సర్వర్‌లో AI సర్వీస్ కాన్ఫిగర్ చేయలేదు. సర్వర్ .env లో AI_API_KEY జోడించి బ్యాకెండ్‌ను రీస్టార్ట్ చేయండి.',
    },
    AI_UPSTREAM_ERROR: {
      'en-IN': 'The AI provider returned an error. Check AI_API_KEY, AI_API_URL, model access, and server logs.',
      'hi-IN': 'AI प्रदाता ने त्रुटि लौटाई। AI_API_KEY, AI_API_URL, मॉडल एक्सेस और सर्वर लॉग जांचें।',
      'te-IN': 'AI ప్రొవైడర్ లోపాన్ని తిరిగి ఇచ్చింది. AI_API_KEY, AI_API_URL, మోడల్ యాక్సెస్ మరియు సర్వర్ లాగ్‌లను తనిఖీ చేయండి.',
    },
    AI_SERVICE_UNAVAILABLE: {
      'en-IN': "I'm having trouble reaching the AI service right now. Please check the server configuration and try again.",
      'hi-IN': 'अभी AI सेवा तक पहुंचने में समस्या हो रही है। कृपया सर्वर कॉन्फ़िगरेशन जांचें और फिर प्रयास करें।',
      'te-IN': 'ఇప్పుడు AI సర్వీస్‌ను చేరుకోవడంలో సమస్య ఉంది. దయచేసి సర్వర్ కాన్ఫిగరేషన్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
    },
  };
  const detail = (details[reason] || details.AI_SERVICE_UNAVAILABLE)[lang];
  const suggestions = {
    'en-IN': ['Try again', 'Check server config', 'What can you do?'],
    'hi-IN': ['फिर प्रयास करें', 'सर्वर कॉन्फ़िग जांचें', 'आप क्या कर सकते हैं?'],
    'te-IN': ['మళ్లీ ప్రయత్నించండి', 'సర్వర్ కాన్ఫిగ్ తనిఖీ చేయండి', 'మీరు ఏమి చేయగలరు?'],
  };
  return { reply: detail, detectedLanguage: lang, suggestions: suggestions[lang], error: reason };
}`;
s = s.slice(0, start) + repl + s.slice(end + 2);
fs.writeFileSync(p, s);
console.log('ok');
