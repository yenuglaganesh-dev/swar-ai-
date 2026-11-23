const fs=require('fs');
let s=fs.readFileSync('server/index.js','utf8');
s=s.replace("return res.status(200).json(fallbackResponse(lastUser, language));","return res.status(200).json(fallbackResponse(lastUser, language, 'AI_NOT_CONFIGURED'));");
// replace first remaining '' fallback in API error branch
s=s.replace("console.error('AI API error', response.status, errText);\n      return res.status(200).json(fallbackResponse('', language));","console.error('AI API error', response.status, errText);\n      return res.status(200).json(fallbackResponse('', language, 'AI_UPSTREAM_ERROR'));");
// catch
s=s.replace("console.error('Chat error', error);\n    return res.status(200).json(fallbackResponse('', language));","console.error('Chat error', error);\n    return res.status(200).json(fallbackResponse('', language, 'AI_SERVICE_UNAVAILABLE'));");
fs.writeFileSync('server/index.js',s);
console.log('ok');