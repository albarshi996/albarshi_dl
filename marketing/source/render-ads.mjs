// يلتقط شاشات الموقع الحي على مقاس جوال، ثم يرسم كل تصميم في ads.html إلى PNG.
// الاستخدام: node render-ads.mjs <toolsDir> <outDir>
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const [toolsDir, outDir] = process.argv.slice(2);
const require = createRequire(path.resolve(toolsDir, 'package.json'));
const puppeteer = require('puppeteer-core');
const here = path.dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(here, 'shots'), { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--force-color-profile=srgb'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── لقطات الموقع الحي (جوال) ──
async function shot(url, file, { scrollTo, height = 844 } = {}) {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  if (scrollTo) {
    await p.evaluate(sel => { const el = document.querySelector(sel); if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70); }, scrollTo);
  }
  // أظهر كل عناصر الحركة فوراً، وأخفِ زر الواتساب العائم من اللقطة
  await p.addStyleTag({ content: '.reveal{opacity:1!important;visibility:visible!important;transform:none!important}.floating-whatsapp{display:none!important}' });
  await sleep(1200);
  await p.screenshot({ path: path.join(here, 'shots', file) });
  await p.close();
  console.log('shot', file);
}
await shot('https://dawerli.org.ly/', 'home.png', { height: 900 });
await shot('https://dawerli.org.ly/request/', 'request.png', { scrollTo: '#orderForm', height: 900 });
await shot('https://dawerli.org.ly/services/', 'services.png', { height: 900 });

// ── التصاميم ──
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 2100, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(here, 'ads.html')).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await sleep(500);
const ids = await page.$$eval('section.canvas', els => els.map(e => e.id));
const names = { hero: '01-دورلي-الرئيسية', how: '02-شن-الطريقة', services: '03-خدماتنا', track: '04-وين-طلبي', trust: '05-ليش-دورلي',
  pricing: '06-الباقات', delegates: '07-مطلوب-مندوبين', 'story-hero': '08-ستوري-دورلي', 'story-del': '09-ستوري-المندوبين' };
for (const id of ids) {
  const el = await page.$('#' + id);
  const file = path.join(outDir, (names[id] || id) + '.png');
  await el.screenshot({ path: file });
  console.log('ad', path.basename(file));
}
await browser.close();
