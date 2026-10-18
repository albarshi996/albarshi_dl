// يرسم video.html إطاراً إطاراً ويحوّله إلى MP4 عبر ffmpeg.
// الاستخدام: node render-video.mjs <toolsDir> <out.mp4> [--preview t1,t2,...]
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const [toolsDir, out, flag, list] = process.argv.slice(2);
const require = createRequire(path.resolve(toolsDir, 'package.json'));
const puppeteer = require('puppeteer-core');
const ffmpeg = require('ffmpeg-static');
const here = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30;

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(here, 'video.html')).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 400));
const duration = await page.evaluate(() => window.DURATION);

if (flag === '--preview') {
  fs.mkdirSync(out, { recursive: true });
  for (const t of list.split(',').map(Number)) {
    await page.evaluate(t => window.renderAt(t), t);
    await page.screenshot({ path: path.join(out, `t${String(t).padStart(5, '0')}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const ff = spawn(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const total = Math.round(duration * FPS);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  await page.evaluate(t => window.renderAt(t), i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 150 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exit ' + c))));
await browser.close();
console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
