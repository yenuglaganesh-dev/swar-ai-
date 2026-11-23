const fs=require('fs');
const s=fs.readFileSync('src/i18n/translations.ts','utf8');
console.log('hi', s.indexOf("'hi-IN': {"));
console.log('te', s.indexOf("'te-IN': {"));
console.log('loginHeroTitle count', s.split('loginHeroTitle').length-1);
console.log('loginSuccess count', s.split('loginSuccess').length-1);