<!-- ╔══════════════════════════════════════════════════════════════════╗ -->
<!-- ║   داورلي · Dawerli — Developer Reference (auto-updated per task) ║ -->
<!-- ╚══════════════════════════════════════════════════════════════════╝ -->

<div align="center">

# 🚚 Dawerli · دورلي

### منصة التوصيل واللوجستيات الليبية
**Libya's B2B/B2C Delivery & Procurement Platform**

[![STATUS](https://img.shields.io/badge/🟢_STATUS-LIVE_%26_ACTIVE_DEVELOPMENT-22c55e?style=for-the-badge)](https://dawerli.org.ly)
[![Data Layer](https://img.shields.io/badge/Data_Layer-Supabase_(Task_16)-3ECF8E?style=for-the-badge&logo=supabase)](#-data-layer-task-16)

[![Live Site](https://img.shields.io/badge/Live-dawerli.org.ly-4f46e5?style=for-the-badge&logo=astro)](https://dawerli.org.ly)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-222?style=for-the-badge&logo=github)](https://github.com/albarshi996/albarshi_dl/actions)
[![Astro](https://img.shields.io/badge/Astro-4.5-FF5D01?style=for-the-badge&logo=astro)](https://astro.build)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_%2B_Auth_%2B_Storage-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Tasks](https://img.shields.io/badge/Tasks_Completed-16-22c55e?style=for-the-badge)](#-tasks-history)

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

## 🟢 Project Status

> **الموقع حي · التطوير مستمر** — تجميد الكود السابق (2 مايو 2026) رُفع مع **Task 15** (الهوية الجديدة) و**Task 16** (طبقة البيانات Supabase).

الموقع العام مكتمل ومُختبر على الموقع الحي (Task 1 → 15). **Task 16** أضاف قاعدة بيانات حقيقية ولوحة تحكم وبوابة مندوبين؛ تشغيلها على الإنتاج يحتاج خطوات الإعداد في [`docs/SUPABASE-SETUP.md`](docs/SUPABASE-SETUP.md). حتى يتم الربط، يعمل الموقع كما كان (واتساب فقط).

| المؤشر | الحالة |
|--------|--------|
| الموقع الحي `dawerli.org.ly` | 🟢 يعمل |
| تطبيق الموبايل (Expo WebView) | 🟢 يعمل |
| نموذج الطلب + واتساب | 🟢 مكتمل |
| محرك قطع الغيار الشرطي | 🟢 مكتمل |
| خط زمني التتبع (5 مراحل) | 🟢 مكتمل — مربوط بحالة الطلب الحقيقية بعد ربط Supabase |
| شفافية التسعير (services + pricing) | 🟢 مكتمل |
| الباقات (عادي / سريع / VIP) | 🟢 مكتمل |
| SEO · Schema.org · robots.txt | 🟢 مكتمل |
| الملاحة (Desktop + Mobile v5.4) | 🟢 مكتمل |
| الهوية "غروب ليبي" + النصوص باللهجة (Task 15) | 🟢 مكتمل |
| طبقة البيانات Supabase — migration v2 + RLS (Task 16) | 🟢 مكتمل في الكود · 🟡 يحتاج ربط مشروع Supabase على الإنتاج |
| لوحة التحكم `/admin/` + بوابة المندوبين `/delegate/` | 🟢 مكتمل في الكود · تعرض "غير مهيأة" حتى الربط |

---

## 🛠 Tech Stack

| الطبقة | التقنية | الإصدار | الاستخدام |
|--------|---------|---------|-----------|
| **Framework** | [Astro](https://astro.build) | 4.5 | SSG — Static Site Generation (بدون React) |
| **Styling** | CSS Custom Properties | — | هوية "غروب ليبي" الدافئة (عنبري #F5A524 → طيني #D95B43) |
| **Fonts** | Tajawal + Inter | Google Fonts | AR (Tajawal) / EN (Inter) |
| **Icons** | Font Awesome | 6.4 | CDN — جميع الأيقونات |
| **i18n** | Custom `dawerliDict` | v5.3 | AR/EN مدمج في Layout.astro |
| **Backend / DB** | [Supabase](https://supabase.com) | supabase-js 2.x · Postgres 17 | Postgres + Auth + Storage + Realtime — الحماية بـ **RLS** ومشغّلات حارسة، الوصول من المتصفح مباشرة بـ anon key (لا خادم خاص) |
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
├── 📄 admin.css              [T16]   ← ستايل لوحة التحكم وبوابة المندوبين (public/)
├── 📄 mobile-nav.js          [v5.3]  ← Mobile nav: body.appendChild + JS scroll lock
├── 📄 script.js                      ← Reveal animations + WA link handlers
│
├── 🔐 .env                   [⚠️]   ← متغيرات بيئة محلية: Supabase المحلي + Moamalat Sandbox
│   │                                    ❌ لا تضع مفاتيح حقيقية هنا — GitHub Pages لا يقرأه أصلاً
├── 📄 .env.example                   ← قالب متغيرات البيئة (آمن للمشاركة)
├── 📄 .gitignore
│
├── 📂 .github/
│   └── 📂 workflows/
│       └── 📄 deploy.yml             ← CI/CD: build Astro → deploy to GitHub Pages
│                                         ⚠️ يتطلب commit بدون [skip ci] للتشغيل
│                                         ℹ️ لم يتغير في Task 16 — إعداد Supabase يُلصق في supabase-config.js
│
├── 📂 docs/                  [T16]
│   └── 📄 SUPABASE-SETUP.md          ← دليل الإعداد خطوة بخطوة لصاحب المشروع + مرجع المطورين
│
├── 📂 supabase/              [T16]   ← كل ما يخص قاعدة البيانات (Supabase CLI)
│   ├── 📄 config.toml                ← إعداد البيئة المحلية (npx supabase start)
│   ├── 📂 migrations/
│   │   └── 🔴 20261017000000_init.sql ← المخطط الكامل v2: جداول + دوال RPC + RLS + حرّاس + Storage
│   ├── 📂 tests/
│   │   └── 📄 rls_smoke.sql          ← اختبار دخاني لصلاحيات RLS والحرّاس (يُشغَّل محلياً عبر psql)
│   └── 📄 seed.sql                   ← بيانات تجريبية للبيئة المحلية فقط (حسابات + طلبات)
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
    ├── 📂 lib/                [T16]
    │   ├── 🔴 supabase-config.js     ← Project URL + anon key (يُلصقان هنا للنشر؛ .env يتقدّم محلياً)
    │   ├── 🟣 db.js                  ← طبقة الوصول: getClient/submitOrder/getOrderStatus/claimOrder/
    │   │                                 setOrderStatus/assignOrder/respondToQuote/stats + friendlyError/esc
    │   │                                 • تُرجع null عند عدم التهيئة — الموقع لا يتعطل
    │   └── 🔵 admin-ui.js            ← مكوّنات اللوحة: toast/confirm/modal/form/table/pager/statTile
    │
    ├── 📂 layouts/
    │   ├── 🟣 Layout.astro   [CORE] ← Master layout — كل صفحة ترثه
    │   │                                 • <head>: SEO, OG, fonts, theme
    │   │                                 • dawerliDict: AR+EN i18n (inline)
    │   │                                 • Props: title, description, noindex?
    │   │                                 • window.dawerliDB = db (للطلب والتتبع)
    │   │                                 ⚠️ أي تغيير هنا يؤثر على كل الصفحات
    │   └── 🟣 AdminLayout.astro [T16] ← تخطيط /admin/ و /delegate/ — noindex + حارس الجلسة والأدوار
    │                                     • Props: title, portal ('admin'|'delegate'), page
    │                                     • window.dawerliReady → { db, ui, sb, profile }
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
        ├── 🟢 track.astro            ← تتبع الطلبات (get_order_status + قبول/رفض العرض عبر respond_to_quote عند الربط، وإلا واتساب)
        ├── 🟢 privacy.astro          ← سياسة الخصوصية
        ├── 🟢 terms.astro            ← الشروط والأحكام
        │
        ├── 📂 admin/          [T16]  ← 🟡 لوحة التحكم (noindex + robots) — مدير فقط
        │   ├── login.astro           ← دخول الإدارة
        │   ├── index.astro           ← نظرة عامة: admin_stats + آخر الطلبات
        │   ├── orders.astro          ← الطلبات: فلترة، تفاصيل، set_order_status، assign_order، سجل الأحداث
        │   ├── customers.astro       ← العملاء
        │   ├── merchants.astro       ← التجار
        │   ├── suppliers.astro       ← الموردون
        │   ├── products.astro        ← المنتجات (+ صور في bucket product-images)
        │   └── delegates.astro       ← المندوبون: اعتماد / إيقاف / ترقية
        │
        └── 📂 delegate/       [T16]  ← 🟡 بوابة المندوبين (noindex + robots)
            ├── login.astro           ← دخول + تسجيل حساب جديد (يبدأ بدور pending)
            ├── index.astro           ← طلبات متاحة: delegate_open_orders + claim_order
            └── mine.astro            ← طلباتي: delegate_my_orders + set_order_status + ملاحظات
```

**ألوان الترميز:** 🟣 Core/Master · 🔴 Sensitive · 🟡 noindex/Sandbox · 🟢 Regular pages · 🔵 Components · [T16] أُضيف في Task 16

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

### 🗄️ Data Layer (Task 16)

```
المتصفح ──(anon key + RLS)──► Supabase  ·  لا خادم خاص، لا تغيير في deploy.yml
   │
   ├── الموقع العام (Layout.astro → window.dawerliDB)
   │     request.astro → submit_order(p)            → رقم تتبع DW-YYYY-NNNN + واتساب كالمعتاد
   │     track.astro   → get_order_status(code[,phone]) → status + stage_idx + events[] (الأسعار مع الهاتف المطابق فقط)
   │                   → respond_to_quote(code, phone, accept) عند حالة quoted (موافق / مش موافق)
   │     (متاح للزائر، غير مستعمل في الصفحات بعد) public_stats → { delivered_orders, customers, cities, avg_delivery_hours }
   │
   ├── /admin/*    (AdminLayout portal="admin")    ← دور admin فقط
   └── /delegate/* (AdminLayout portal="delegate") ← delegate (أو pending → شاشة "بانتظار الاعتماد")
```

**الأدوار** (`profiles.role`): `anon` زائر — RPC فقط، لا جداول · `pending` حساب جديد — لا شيء · `delegate` مندوب معتمد ونشط · `admin` كل شيء. الدور يُغيَّر من `/admin/delegates/` (أول مدير بالاستعلام في رأس الـ migration). لا حذف للملفات: إيقاف (`active=false`) بدل الحذف، وآخر مدير نشط محمي (`last_admin`).

**دورة الطلب ↔ الخط الزمني (5 مراحل في track.astro):**

| الحالة | received | searching | quoted | purchasing | shipping | delivered | cancelled |
|--------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `stage_idx` | 0 | 1 | 2 | 3 | 3 | 4 | −1 |

- المندوب يتقدّم للأمام فقط: `received→searching`، `searching→quoted|purchasing`، `quoted→purchasing`، `purchasing→shipping`، `shipping→delivered`؛ ويعدّل فقط `status, supplier_id, product_id, quoted_price, service_fee, total`. `delivered`/`cancelled` مجمّدتان له. الإدارة بلا قيود (بما فيه الإلغاء مع `cancel_reason`).
- **كل تغيير حالة عبر `set_order_status(...)`** (مدير ومندوب): حالة + أسعار + ملاحظة للزبون في عملية واحدة، حدث واحد في `order_events`، والطوابع (`status_changed_at`, `quoted_at`, `delivered_at/by`, `cancelled_at/by`) تُختم تلقائياً. **الإسناد عبر `assign_order(id, delegate|null)`** (إدارة): يقلب `received↔searching` ويسجّل `assign/unassign` (غير ظاهر للزبون). لا `update` مباشر على `delegate_id` أو `status`.

**مسار المندوب:** يسجّل من `/delegate/login/` (pending) → الإدارة تعتمده في `/admin/delegates/` (`approved_at` يُملأ تلقائياً) → يحجز من `/delegate/` (`delegate_open_orders` مرتبة بـ `urgency_rank` ثم `created_at`؛ `claim_order` — من يسبق يفوز، بحد **5 طلبات جارية** وإلا `too_many_active`) → يحدّث من `/delegate/mine/` (`delegate_my_orders` بلا `internal_notes`؛ التحديث عبر `set_order_status`؛ ملاحظاته تُجبر على `kind='note'`).

**قاعدة التراجع الآمن (graceful fallback):** `db.isConfigured()` يرجع `false` ما دامت القيم فارغة → كل دوال `db.js` تُرجع `null` بدل أن ترمي، نموذج الطلب والتتبع يعملان بواتساب كما قبل Task 16، ولوحة التحكم تعرض `ui.setupNoticeHtml()` ("قاعدة البيانات غير مهيأة بعد"). عند فشل الحفظ في `request.astro` لسبب غير مُصلَح من المستخدم (شبكة/خادم) يُكمل الإرسال بواتساب برقم احتياطي بصمت.

**النشر:** لا متغيرات بيئة في GitHub Pages ولا تعديل على `deploy.yml` — `Project URL` و`anon key` يُلصقان في `src/lib/supabase-config.js` (أو `.env.production` المُودَع). `.env` للتطوير المحلي فقط (`npx supabase start`). التفاصيل: [`docs/SUPABASE-SETUP.md`](docs/SUPABASE-SETUP.md).

**PostgREST gotcha:** `orders` له ثلاثة FKs إلى `profiles` (`delegate_id`, `delivered_by`, `cancelled_by`) — التضمين يُميَّز: `delegate:profiles!orders_delegate_id_fkey(full_name,phone,email)`.

### 🔐 Environment Variables
| المتغير | الملف | الاستخدام |
|---------|-------|-----------|
| `PUBLIC_SUPABASE_URL` | `.env` (محلي فقط) | رابط مشروع Supabase — للإنتاج يُلصق في `src/lib/supabase-config.js` |
| `PUBLIC_SUPABASE_ANON_KEY` | `.env` (محلي فقط) | المفتاح العام anon (آمن للنشر؛ الحماية في RLS) — ⛔ ليس `service_role` |
| `MOAMALAT_MERCHANT_ID` | `.env` | رقم التاجر في Moamalat |
| `MOAMALAT_TERMINAL_ID` | `.env` | رقم الطرفية |
| `MOAMALAT_SECRET_KEY` | `.env` | مفتاح SHA-512 |
| `MOAMALAT_ENV` | `.env` | `sandbox` أو `production` |
| `MOAMALAT_CURRENCY` | `.env` | `434` = LYD |
| `MOAMALAT_SANDBOX_URL` | `.env` | رابط بيئة التجريب (`https://demo.moamalat.net`) |

> ⚠️ **مهم:** مفاتيح الإنتاج يجب إضافتها كـ GitHub Repository Secrets وليس في `.env` المُودَع.

---

## ✅ Tasks History

| # | المهمة | الوصف | الحالة | Commit |
|---|--------|-------|--------|--------|
| **1** | **Project Init** | إعداد Astro 4.5 + GitHub Pages + CNAME | ✅ مكتملة | — |
| **2** | **Core Pages** | index, services, request, pricing, contact | ✅ مكتملة | — |
| **3** | **i18n System** | `dawerliDict` AR/EN مدمج في Layout.astro | ✅ مكتملة | — |
| **4** | **Firebase Integration** | Firebase 10.12 Spark — config + init | ⚠️ أُزيلت — استُبدلت بـ Supabase في Task 16 (لا يوجد `src/firebase/` في الكود) | — |
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
| **14-ج** | **Pricing Transparency** | قسم شفافية التسعير في services.astro + 4 خطوات تفصيلية في pricing.astro — المعادلة + ضمان الشفافية | ✅ مكتملة | `feat(task14c)` |
| **11.6–11.8** | **Nav Smart Placement** | placeNav() ذكي: header على desktop، body على mobile + resize debounce 200ms | ✅ مكتملة | `4e4651b3abc8` |
| **15** | **التجريد (De-AI Pass)** | حذف مؤثرات القالب (نيون/جزيئات/مغناطيس/إمالة + صفحة /lab وReact) · لوحة "غروب ليبي" دافئة (عنبري→طيني) · إعادة كتابة النصوص التسويقية باللهجة الليبية · المحتوى يظهر بدون JS (html.js reveal gate) | ✅ مكتملة | `feat(task15)` |
| **16** | **Data Layer — Supabase** | Postgres + Auth + Storage من المتصفح مباشرة بـ anon key؛ migration v2 (`supabase/migrations/20261017000000_init.sql`): جداول profiles/customers/merchants/suppliers/products/orders/order_events + RLS + حرّاس + RPC (`submit_order`, `get_order_status`, `respond_to_quote`, `public_stats`, `claim_order`, `set_order_status`, `assign_order`, `admin_stats`, `delegate_stats`) + views + Realtime + bucket `product-images` · `src/lib/{db,admin-ui,supabase-config}.js` · `AdminLayout.astro` · لوحة `/admin/*` وبوابة `/delegate/*` · الطلب والتتبع (مع قبول/رفض عرض السعر) مربوطان مع تراجع آمن لواتساب · بيئة محلية (`supabase/config.toml`, `seed.sql`) + اختبار RLS (`supabase/tests/rls_smoke.sql`) · `docs/SUPABASE-SETUP.md` | ✅ مكتملة في الكود · يحتاج ربط مشروع Supabase | `feat(task16)` |

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

**مع قاعدة بيانات محلية (Task 16)** — يحتاج Docker Desktop:

```bash
npx supabase start      # يطبّق migrations + seed.sql (حسابات: admin@dawerli.local/admin12345 · delegate@dawerli.local/delegate12345 · pending@dawerli.local/pending12345)
npx supabase status     # انسخ API URL و anon key إلى .env:
                        #   PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
                        #   PUBLIC_SUPABASE_ANON_KEY=<anon key>
npm run dev             # /admin/login/ و /delegate/login/ يعملان على القاعدة المحلية
npx supabase db reset   # إعادة تطبيق migrations + seed
# اختبار الصلاحيات (كل سطر OK/FAIL): docker exec -i supabase_db_cloud-local-deployment-cc7fad psql -U postgres -d postgres -v ON_ERROR_STOP=0 < supabase/tests/rls_smoke.sql
```

بدون `.env` (أو بقيم فارغة) يعمل الموقع في وضع واتساب فقط وتعرض اللوحة "قاعدة البيانات غير مهيأة بعد". الدليل الكامل: [`docs/SUPABASE-SETUP.md`](docs/SUPABASE-SETUP.md).

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
| **Task 14 (أ)** | **نظام تتبع الطلبات المتقدم (Live Tracking):** خط زمني رأسي تفاعلي في track.astro مع 5 مراحل وحالات بصرية — مربوط بحالة الطلب الحقيقية عبر Supabase منذ Task 16 | ✅ مكتملة |
| **Task 14 (ب)** | **محرك قطع الغيار الذكي (Spare Parts Engine):** نموذج متخصص لقطع الغيار لتقليل الخطأ في الطلبات اللوجستية | 🟡 تحددها الإدارة |
| **Task 14 (ج)** | **توضيح آلية التسعير:** معادلة واضحة (منتج+شحن+عمولة) + 4 خطوات تفصيلية + ضمان شفافية — التسعير يعتمد على عروض أسعار حقيقية ومقارنات شحن | ✅ مكتملة |

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
