// يرسم غلاف فيسبوك وصورة الملف من facebook.html.
// الاستخدام: node render-facebook.mjs <toolsDir> <outDir>
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const [toolsDir, outDir] = process.argv.slice(2);
const require = createRequire(path.resolve(toolsDir, 'package.json'));
const puppeteer = require('puppeteer-core');
const here = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport({ width: 1800, height: 1900, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(here, 'facebook.html')).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 400));
for (const [id, name] of [['cover', 'facebook-غلاف.png'], ['avatar', 'facebook-صورة-الملف.png']]) {
  await (await page.$('#' + id)).screenshot({ path: path.join(outDir, name) });
  console.log(name);
}
await browser.close();
