const fs = require('fs');
let s = fs.readFileSync('server/index.js', 'utf8');
s = s.replace(
  "return res.status(200).json(fallbackResponse(lastUser, language));",
  "return res.status(200).json(fallbackResponse(lastUser, language, 'AI_NOT_CONFIGURED'));"
);
s = s.replace(
  "return res.status(200).json(fallbackResponse('', language));",
  "return res.status(200).json(fallbackResponse('', language, 'AI_UPSTREAM_ERROR'));"
);
s = s.replace(
  "return res.status(200).json(fallbackResponse('', language));",
  "return res.status(200).json(fallbackResponse('', language, 'AI_SERVICE_UNAVAILABLE'));"
);
fs.writeFileSync('server/index.js', s);
console.log('ok');
