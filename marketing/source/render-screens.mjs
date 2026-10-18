// يلتقط لوحات المنصة الثلاث من نسخة محلية ببيانات تجريبية (seed.sql) — بلا أي بيانات زبائن حقيقيين.
// المتطلبات: npx supabase start && npx supabase db reset، وخادم التطوير يعمل على BASE.
// الاستخدام: node render-screens.mjs <toolsDir> <outDir> [baseUrl]
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const [toolsDir, outDir, BASE = 'http://localhost:4321'] = process.argv.slice(2);
const require = createRequire(path.resolve(toolsDir, 'package.json'));
const puppeteer = require('puppeteer-core');
fs.mkdirSync(outDir, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
// خادم التطوير قد يعيد التحميل أول مرة (تحسين التبعيات) — نعيد المحاولة
async function go(page, url) {
  for (let i = 0; i < 4; i++) {
    try { await page.goto(BASE + url, { waitUntil: 'networkidle0', timeout: 60000 }); return; }
    catch (e) { console.log('retry', url, e.message.split('\n')[0]); await sleep(3000); }
  }
  throw new Error('cannot load ' + url);
}

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--force-color-profile=srgb'] });

async function login(page, url, emailSel, passSel, email, pass, landing) {
  await go(page, url);
  await page.waitForSelector(emailSel, { visible: true });
  await page.type(emailSel, email);
  await page.type(passSel, pass);
  await Promise.all([page.waitForFunction(l => location.pathname === l, { timeout: 20000 }, landing), page.keyboard.press('Enter')]);
  await page.waitForNetworkIdle({ idleTime: 800 });
  await sleep(1200);
}

// ١) لوحة التحكم — نظرة عامة (سطح المكتب)
{
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
  await login(p, '/admin/login/', '#email', '#password', 'admin@dawerli.local', 'admin12345', '/admin/');
  await p.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
  await p.screenshot({ path: path.join(outDir, '1-لوحة-التحكم.png') });
  console.log('admin');
  await ctx.close();
}

// ٢) صفحة الطلب (سطح المكتب، عند النموذج)
{
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
  await go(p, '/request/');
  await p.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}.reveal{opacity:1!important;visibility:visible!important;transform:none!important}' });
  await p.evaluate(() => { const f = document.querySelector('#orderForm'); if (f) window.scrollTo(0, f.getBoundingClientRect().top + scrollY - 200); });
  await sleep(1200);
  await p.screenshot({ path: path.join(outDir, '2-صفحة-الطلب.png') });
  console.log('request');
  await ctx.close();
}

// ٣) بوابة المندوبين — الطلبات المتاحة (جوال)
{
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport({ width: 400, height: 860, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await login(p, '/delegate/login/', '#loginEmail', '#loginPassword', 'delegate@dawerli.local', 'delegate12345', '/delegate/');
  await p.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
  await p.screenshot({ path: path.join(outDir, '3-بوابة-المندوبين.png') });
  console.log('delegate');
  await ctx.close();
}

await browser.close();
