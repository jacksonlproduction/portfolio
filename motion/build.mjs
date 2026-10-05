// Inlines the fonts so the deliverable is a single self-contained HTML file.
import { readFileSync, writeFileSync } from 'node:fs';
const here = new URL('.', import.meta.url);
const b64 = f => readFileSync(new URL(`fonts/${f}`, here)).toString('base64');
const html = readFileSync(new URL('src/open.template.html', here), 'utf8')
  .replace('__FONT_ROMAN__', b64('EBGaramond-VF.ttf'))
  .replace('__FONT_ITALIC__', b64('EBGaramond-Italic-VF.ttf'));
writeFileSync(new URL('jackson-luria-open.html', here), html);
console.log('built jackson-luria-open.html', (html.length / 1e6).toFixed(2), 'MB');
