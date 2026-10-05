// Usage:
//   node render.mjs stills 1.4 3.2 4.3 9.3 15     -> preview/still-*.png
//   node render.mjs audio                         -> out/music.wav (raw, pre-master)
//   node render.mjs video                         -> out/frames.mp4 (silent, 1920x1080@60)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }

const here = fileURLToPath(new URL('.', import.meta.url));
const FPS = 60, DUR = 15;
const [mode, ...rest] = process.argv.slice(2);

const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(`file://${here}jackson-luria-open.html?render=1`);
await page.evaluate(() => window.ready);
const shot = () => page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } });

if (mode === 'stills') {
  mkdirSync(`${here}preview`, { recursive: true });
  for (const [i, s] of rest.entries()) {
    const f = Math.min(Math.round(parseFloat(s) * FPS), DUR * FPS - 1);   // snap to a real frame
    await page.evaluate(t => window.render(t), f / FPS);
    writeFileSync(`${here}preview/still-${i + 1}-${(f / FPS).toFixed(2)}s.png`, await shot());
    console.log('still', f / FPS);
  }
} else if (mode === 'audio') {
  mkdirSync(`${here}out`, { recursive: true });
  const b64 = await page.evaluate(() => window.composeWav());
  writeFileSync(`${here}out/music.wav`, Buffer.from(b64, 'base64'));
  console.log('wrote out/music.wav');
} else if (mode === 'video') {
  mkdirSync(`${here}out`, { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-tune', 'animation', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', `${here}out/frames.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = DUR * FPS;
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    const buf = await shot();
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 60 === 0) console.log(`frame ${f}/${total}`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  console.log('wrote out/frames.mp4');
}
await browser.close();
