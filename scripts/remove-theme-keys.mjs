import fs from 'fs';
const p = 'src/i18n/translations.ts';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(/\r?\n\s*theme: "Theme",\s*\r?\n\s*dark: "Dark",\s*\r?\n\s*light: "Light",/, '');
s = s.replace(/\r?\n\s*theme: "[^"]+",\s*\r?\n\s*dark: "[^"]+",\s*\r?\n\s*light: "[^"]+",/, '');
s = s.replace(/\r?\n\s*theme: "[^"]+",\s*\r?\n\s*dark: "[^"]+",\s*\r?\n\s*light: "[^"]+",/, '');
fs.writeFileSync(p, s);
console.log('ok');