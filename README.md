<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║   داورلي · Dawerli — Developer Reference (auto-updated per task) ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

<div align="center">

# 🚚 Dawerli · دورلي

### منصة التوصيل واللوجستيات الليبية
**Libya's B2B/B2C Delivery & Procurement Platform**

[![Live Site](https://img.shields.io/badge/Live-dawerli.org.ly-4f46e5?style=for-the-badge&logo=astro)](https://dawerli.org.ly)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-222?style=for-the-badge&logo=github)](https://github.com/albarshi996/albarshi_dl/actions)
[![Astro](https://img.shields.io/badge/Astro-4.5-FF5D01?style=for-the-badge&logo=astro)](https://astro.build)
[![Firebase](https://img.shields.io/badge/Firebase-Spark-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Task](https://img.shields.io/badge/Current_Task-14b-06b6d4?style=for-the-badge)](#-tasks-history)

</div>

---

## 📌 Project Overview

**دورلي (Dawerli)** هي منصة ليبية لخدمات التوصيل والوساطة التجارية تعمل على مدار الساعة.
تربط المنصة العملاء الأفراد (B2C) وأصحاب الأعمال (B2B) بالمنتجات والخدمات في أي مدينة ليبية،
مع دعم 6 فئات خدمية: قطع الغيار، العقارات، البضائع بالجملة، المستندات، "ندورلك"، والتسوق والصحة والتجميل.

**الرسالة:** نبحث، نشتري، ونوصل لبابك — من أي مدينة في ليبيا.

| المعلومة | القيمة |
|---------|--------|
| الموقع الحي | https://dawerli.org.ly |
| المستودع | `albarshi996/albarshi_dl` |
| الفرع الرئيسي | `main` → GitHub Pages |
| البريد | dawerly3@gmail.com |
| واتساب | +218 946 507 954 |
| فيسبوك | https://www.facebook.com/share/1G2eg1mgpZ/ |
| حقوق النشر | Dawerli albarshi 2018 |

---

## 🛠 Tech Stack

| الطبقة | التقنية | الإصدار | الاستخدام |
|--------|---------|---------|-----------|
| **Framework** | [Astro](https://astro.build) | 4.5 | SSG — Static Site Generation |
| **UI Components** | @astrojs/react | 3.6 | React islands داخل Astro |
| **Styling** | CSS Custom Properties | — | Glassmorphism + CSS Variables |
| **Fonts** | Tajawal + Inter | Google Fonts | AR (Tajawal) / EN (Inter) |
| **Icons** | Font Awesome | 6.4 | CDN — جميع الأيقونات |
| **i18n** | Custom `dawerliDict` | v5.3 | AR/EN مدمج في Layout.astro |
| **Backend / DB** | Firebase | 10.12 (Spark) | Auth + Firestore + Storage |
| **Payment** | Moamalat Sandbox | v2.0 | SHA-512 SecureHash — بيئة تجريبية |
| **Deploy** | GitHub Actions | — | Push to `main` → Pages auto-deploy |
| **Domain** | CNAME | — | `dawerli.org.ly` → GitHub Pages |

---

## 📁 Project Tree

```
albarshi_dl/                          ← مستودع الويب الرئيسي
│
├── 📄 astro.config.mjs               ← إعدادات Astro (output: static, integrations)
├── 📄 package.json                   ← npm dependencies
├── 📄 CNAME                          ← النطاق المخصص: dawerli.org.ly
├── 📄 robots.txt                     ← SEO: disallow /checkout + crawl rules
├── 📄 style.css                      ← CSS عالمي (CSS vars, glassmorphism, z-index)
├── 📄 mobile-nav.js          [v5.3]  ← Mobile nav: body.appendChild + JS scroll lock
├── 📄 script.js                      ← Reveal animations + WA link handlers
│
├── 🔐 .env                   [⚠️]   ← متغيرات بيئة Moamalat Sandbox (sandbox only)
│   │                                    ❌ لا تضع مفاتيح حقيقية هنا — استخدم GitHub Secrets
├── 📄 .env.example                   ← قالب متغيرات البيئة (آمن للمشاركة)
├── 📄 .gitignore
│
├── 📂 .github/
│   └── 📂 workflows/
│       └── 📄 deploy.yml             ← CI/CD: build Astro → deploy to GitHub Pages
│                                         ⚠️ يتطلب commit بدون [skip ci] للتشغيل
├── 📂 .vscode/
│   └── 📄 launch.json
│
├── 📂 js/
│   └── 📄 i18n.js                    ← Language switcher runtime (AR/EN toggle)
│
├── 📂 lang/
│   ├── 📄 ar.js                      ← Arabic strings (legacy standalone)
│   └── 📄 en.js                      ← English strings (legacy standalone)
│
├── 🖼️ favicon*.{png,svg,ico}         ← Favicons: 16/32/128/256/512px + SVG + ICO
├── 🖼️ og-image.png                   ← OpenGraph social preview (1200×630)
├── 📄 googlede9223e6a9e9cea9.html    ← Google Search Console verification
│
└── 📂 src/                           ← ✅ كود Astro الرئيسي (اقرأ هنا أولاً)
    │
    ├── 📄 env.d.ts                   ← Astro TypeScript env types
    │
    ├── 📂 components/
    │   ├── 🔵 Header.astro           ← Sticky header (backdrop-filter stacking fix)
    │   │                                 DOMContentLoaded i18n re-apply
    │   └── 🔵 Footer.astro           ← Footer: links, copyright, social
    │
    ├── 📂 firebase/
    │   └── 🔴 config.js              ← Firebase SDK init
    │                                     ⚠️ مفاتيح API في .env — لا تُعدّل مباشرة
    │
    ├── 📂 layouts/
    │   └── 🟣 Layout.astro   [CORE] ← Master layout — كل صفحة ترثه
    │                                     • <head>: SEO, OG, fonts, theme
    │                                     • dawerliDict: AR+EN i18n (inline)
    │                                     • Props: title, description, noindex?
    │                                     ⚠️ أي تغيير هنا يؤثر على كل الصفحات
    │
    └── 📂 pages/                     ← Astro file-based routing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[REPLIT MONOREPO — Task 11+]
artifacts/dawerli-mobile/          ← 📱 React Native (Expo) App
    ├── app/
    │   ├── _layout.tsx            ← Root: SafeAreaProvider, ErrorBoundary, Stack
    │   └── index.tsx              ← 🌐 WebView Smart Shell v1.1
    │                                  • javaScriptEnabled + domStorageEnabled
    │                                  • Deep link: wa.me → Linking.openURL()
    │                                  • ActivityIndicator + progress bar
    │                                  • Bottom Toolbar: ← → ↺ ⌂ (SafeArea)
    │                                  • KeyboardAvoidingView (toolbar ثابت)
    │                                  • Custom User-Agent: DawerliApp/1.1
    ├── constants/
    │   ├── colors.ts              ← Dawerli dark theme (#050505 bg, #4f46e5 primary, #06b6d4 accent)
    │   └── i18n.ts               ← AR/EN strings + WhatsApp/Facebook/Email constants
    ├── context/
    │   └── LangContext.tsx        ← AR/EN state (AsyncStorage persistent)
    ├── lib/
    │   └── firebase.ts            ← Firebase config (EXPO_PUBLIC_FIREBASE_* env vars)
    └── app.json                   ← name: دورلي, dark theme, splash: #050505
        ├── 🟢 index.astro            ← الرئيسية: hero + 4-chip strip + how-it-works
        ├── 🟢 services.astro         ← 6 بطاقات B2B/B2C (auto-fit grid)
        ├── 🟢 request.astro          ← نموذج الطلب + 3 خيارات دفع (WA/تحويل/إلكتروني)
        ├── 🟡 checkout.astro [⚠️]   ← بوابة Moamalat Sandbox
        │                                 • noindex={true} → لا أرشفة
        │                                 • SHA-512 via WebCrypto API
        │                                 • بيانات بيئة التجريب فقط
        ├── 🟢 pricing.astro          ← باقات الأسعار + زر اختبار Sandbox
        ├── 🟢 how-it-works.astro     ← كيف يعمل دورلي (3 خطوات، لغة شاملة م/أ)
        ├── 🟢 features.astro         ← مميزات المنصة
        ├── 🟢 contact.astro          ← صفحة التواصل
        ├── 🟢 track.astro            ← تتبع الطلبات
        ├── 🟢 privacy.astro          ← سياسة الخصوصية
        └── 🟢 terms.astro            ← الشروط والأحكام
```

**ألوان الترميز:** 🟣 Core/Master · 🔴 Sensitive · 🟡 noindex/Sandbox · 🟢 Regular pages · 🔵 Components

---

## ⚙️ Critical Architecture Notes

### 🔧 Stacking Context (z-index Hierarchy)
```
overlay (modals)  → z-index: 999
header            → z-index: 1000  ← backdrop-filter creates stacking context!
mobile-nav        → z-index: 1001  ← must be appended to document.body
result overlays   → z-index: 9999
```
**الحل (v5.4 — Task 11.7):** `placeNav()` ذكي — nav في `<header>` على desktop (≥992px)، nav في `document.body` على mobile (<992px). `resize` listener بـ debounce 200ms.

### 🔒 Scroll Lock Pattern
```javascript
// ✅ الصحيح — JS-based
lockScroll()   → body { position: fixed; top: -scrollY; width: 100% }
unlockScroll() → body { position: static } + window.scrollTo(0, savedY)
// ❌ الخاطئ — touch-action: none على body يُعطّل scroll على iOS
```

### 🌐 i18n Architecture
```
Layout.astro → window.dawerliDict = { ar: { strings: {...} }, en: { strings: {...} } }
Header.astro → applyLang(lang) → querySelectorAll('[data-i18n]') → textContent swap
deploy rule  → commit WITHOUT [skip ci] → GitHub Actions build → Pages deploy
```

### 📱 Mobile App Architecture (Task 11.5 — WebView Strategy)
```
React Native (Expo) Shell
        ↓
react-native-webview → https://dawerli.org.ly/
        ↓
onShouldStartLoadWithRequest interceptor
        ↓
   wa.me link?  ──YES──► Linking.openURL() → WhatsApp App
       │
      NO
       ↓
  داخل WebView (navigation continues normally)
```
**الفلسفة:** التطبيق "حاوية ذكية" تعرض الموقع المتجاوب — تحديث الموقع = تحديث التطبيق فوراً.

### 💳 Payment Flow
```
request.astro (3 payment cards)
    │
    ├── 💵 نقدي      → WhatsApp message (طريقة الدفع: نقدي عند الاستلام)
    ├── 🏦 تحويل     → WhatsApp message (طريقة الدفع: تحويل مصرفي)
    └── 💳 إلكتروني  → redirect: /checkout?ref=DW-...&cat=...&city=...&fee=...
                              ↓
                       checkout.astro (noindex, Sandbox banner)
                              ↓
                       SHA-512(MID+TID+Amount+CCY+DateTime+OrderRef+SK)
                       via window.crypto.subtle.digest('SHA-512')
                              ↓
                       Moamalat Sandbox simulation modal (✅ or ❌)
```

### 🔐 Environment Variables
| المتغير | الملف | الاستخدام |
|---------|-------|-----------|
| `MOAMALAT_MERCHANT_ID` | `.env` | رقم التاجر في Moamalat |
| `MOAMALAT_TERMINAL_ID` | `.env` | رقم الطرفية |
| `MOAMALAT_SECRET_KEY` | `.env` | مفتاح SHA-512 |
| `MOAMALAT_ENV` | `.env` | `sandbox` أو `production` |
| `MOAMALAT_CURRENCY` | `.env` | `434` = LYD |

> ⚠️ **مهم:** مفاتيح الإنتاج يجب إضافتها كـ GitHub Repository Secrets وليس في `.env` المُودَع.

---

## ✅ Tasks History

| # | المهمة | الوصف | الحالة | Commit |
|---|--------|-------|--------|--------|
| **1** | **Project Init** | إعداد Astro 4.5 + GitHub Pages + CNAME | ✅ مكتملة | — |
| **2** | **Core Pages** | index, services, request, pricing, contact | ✅ مكتملة | — |
| **3** | **i18n System** | `dawerliDict` AR/EN مدمج في Layout.astro | ✅ مكتملة | — |
| **4** | **Firebase Integration** | Firebase 10.12 Spark — config + init | ✅ مكتملة | — |
| **5** | **Mobile/Desktop Navigation** | Hamburger drawer + overlay + scroll lock + stacking context fix | ✅ مكتملة | `0d8dd219e0` |
| **6** | **SEO & Schema** | robots.txt + JSON-LD + OG tags + Google Verification | ✅ مكتملة | — |
| **7** | **B2B/B2C Services** | 6 بطاقات خدمات + image upload + `capture="environment"` | ✅ مكتملة | `e0b8b257c3` |
| **8** | **Legal Pages** | privacy.astro + terms.astro + track.astro | ✅ مكتملة | — |
| **9** | **Female Audience** | بطاقة التسوق والصحة + لغة شاملة م/أ + 4-chip strip | ✅ مكتملة | `defb7f847e` |
| **10** | **Moamalat Sandbox** | checkout.astro + SHA-512 WebCrypto + 3 payment cards | ✅ مكتملة | `7bb529aeb3` |
| **11** | **Mobile App (WebView)** | React Native (Expo) — WebView Smart Shell → dawerli.org.ly | ✅ مكتملة | `bcdce957220d` |
| **12** | **Native Navigation** | شريط تحكم سفلي: رجوع / تقدم / تحديث / الرئيسية — SafeArea + KeyboardAvoiding | ✅ مكتملة | `62102a1df5e6` |
| **13** | **Offline UX** | README overhaul + توثيق شامل للمشروع | ✅ مكتملة | — |
| **14-أ** | **Interactive Order Timeline** | خط زمني رأسي تفاعلي في track.astro — 5 مراحل، حالات بصرية، spine animation | ✅ مكتملة | `feat(task14a)` |
| **14-ب** | **Spare Parts Engine** | نموذج قطع الغيار الشرطي — موديل السيارة + حالة جديدة/رابش + صورة + رسالة WA منسقة | ✅ مكتملة | `feat(task14b)` |
| **11.6–11.8** | **Nav Smart Placement** | placeNav() ذكي: header على desktop، body على mobile + resize debounce 200ms | ✅ مكتملة | `4e4651b3abc8` |

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

> **ملاحظة:** لا تُشغّل `npm run dev` مباشرةً على GitHub Actions — التشغيل يتم فقط عبر `deploy.yml`.

---

## 🚢 Deployment Rules

```
✅ commit WITHOUT [skip ci]  →  GitHub Actions build + deploy to Pages
❌ commit WITH    [skip ci]  →  GitHub Actions skipped (code update only)
❌ NEVER modify deploy.yml   →  Token lacks workflow scope
```

**Pattern:** الـ deploy يُشغَّل دائماً عبر آخر commit في الدفعة (بدون `[skip ci]`).
كل الـ commits الوسيطة تحمل `[skip ci]` لتجنب deploys متعددة.

---

## 🗺️ Roadmap — المرحلة القادمة

| المهمة | الوصف | الأولوية |
|--------|-------|---------|
| **Task 14 (أ)** | **نظام تتبع الطلبات المتقدم (Live Tracking):** خط زمني رأسي تفاعلي في track.astro مع 5 مراحل وحالات بصرية — جاهز للربط مع Firebase | ✅ مكتملة |
| **Task 14 (ب)** | **محرك قطع الغيار الذكي (Spare Parts Engine):** نموذج متخصص لقطع الغيار لتقليل الخطأ في الطلبات اللوجستية | 🟡 تحددها الإدارة |
| **Task 14 (ج)** | **توضيح آلية التسعير:** إضافة توضيح بأن المنصة خدمة تدوير — سعر المنتج عند العثور عليه، الشحن وفق تسعيرة المكاتب، ربح المنصة في الباقات | 🟡 تحددها الإدارة |

---

## 📋 Update Policy (بداية من Task 11)

> مع كل مهمة جديدة يجب تحديث هذا الملف ليعكس:
> 1. ✅ إضافة المهمة لجدول **Tasks History** مع رقم الـ commit
> 2. 🌳 تحديث **Project Tree** إذا تمت إضافة ملفات/مجلدات جديدة
> 3. ⚙️ تحديث **Architecture Notes** إذا تغيرت بنية النظام

---

<div align="center">

**دورلي — حلقة الوصل بينك وبين ما تحتاج في ليبيا**

© Dawerli albarshi 2018 · [dawerli.org.ly](https://dawerli.org.ly)

</div>
