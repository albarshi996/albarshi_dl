// الرسائل الجاهزة لواتساب: الرد الموحد للزبون مع كل حالة، وإرسال الطلب للمندوبين.
// النصوص هنا هي الأصل؛ الإدارة تعدّلها من /admin/messages/ وتنحفظ في جدول message_templates (تتقدّم على الأصل).
// الإرسال بضغطة: رابط wa.me يفتح واتساب والرسالة مكتوبة — المستخدم يضغط «إرسال» بنفسه.
import { formatMoney } from './db.js';

// الروابط داخل الرسائل تروح لناس حقيقيين → دائماً الموقع الحي حتى أثناء التطوير
const SITE = 'https://dawerli.org.ly';

/** المتغيرات المتاحة داخل النصوص — تُكتب بين قوسين معقوفين: {الاسم} */
export const PLACEHOLDERS = [
  { key: 'الاسم',        label: 'اسم الزبون' },
  { key: 'الهاتف',       label: 'هاتف الزبون' },
  { key: 'رقم_الطلب',    label: 'رقم الطلب' },
  { key: 'المدينة',      label: 'المدينة' },
  { key: 'النوع',        label: 'نوع الطلب' },
  { key: 'الكمية',       label: 'الكمية' },
  { key: 'الاستعجال',    label: 'الاستعجال' },
  { key: 'التفاصيل',     label: 'تفاصيل الطلب' },
  { key: 'القطعة',       label: 'السيارة والقطعة (قطع الغيار)' },
  { key: 'سعر_السلعة',   label: 'سعر السلعة' },
  { key: 'رسوم_الخدمة',  label: 'رسوم الخدمة' },
  { key: 'الإجمالي',     label: 'الإجمالي' },
  { key: 'سبب_الإلغاء',  label: 'سبب الإلغاء' },
  { key: 'اسم_المندوب',  label: 'اسم المندوب' },
  { key: 'هاتف_المندوب', label: 'هاتف المندوب' },
  { key: 'رابط_التتبع',  label: 'رابط تتبع الطلب' },
  { key: 'رابط_البوابة', label: 'رابط بوابة المندوبين' },
  { key: 'رابط_طلباتي',  label: 'رابط «طلباتي» للمندوب' },
  { key: 'الطلبات',      label: 'قائمة الطلبات (للرسالة المجمّعة)' },
  { key: 'العدد',        label: 'عدد الطلبات (للرسالة المجمّعة)' },
];

/** audience: customer = الزبون، group = قروب المندوبين (بدون بيانات الزبون)، delegate = المندوب المعيّن */
export const TEMPLATES = [
  { key: 'customer_received', audience: 'customer', status: 'received', label: 'استلام الطلب (الرد الموحد)', body:
`يا هلا {الاسم} 👋
استلمنا طلبك رقم {رقم_الطلب} ✅
🏷️ {النوع} · الكمية {الكمية}
📝 {التفاصيل}
ندوّروا عليه توا، ونبعتولك السعر قبل أي شراء — ما تدفع شي مقدّم.
تابع طلبك من هنا: {رابط_التتبع}
دورلي 🧡` },
  { key: 'customer_searching', audience: 'customer', status: 'searching', label: 'ندوّروا ونسعّروا', body:
`{الاسم}، بدينا ندوّروا على طلبك {رقم_الطلب} 🔎
أول ما نلقوه نبعتولك السعر.
تابع: {رابط_التتبع}` },
  // بدون حالة: رسالة تُختار يدوياً من تفاصيل الطلب لما البحث يطوّل وتنتهي المهلة
  { key: 'customer_search_delay', audience: 'customer', label: 'تأخّر البحث (البحث على حسابنا)', body:
`زبوننا الكريم {الاسم} 🙏
نعتذروا منك، البحث على طلبك {رقم_الطلب} طوّل أكثر من المتوقع، لأننا لسّا ما لقيناش المطلوب.
وبما إن المهلة انتهت، خدمة طلبك صارت علينا: نكمّلوا البحث بدون أي رسوم.
وأول ما نلقوه نبلّغوك باش نعاودوا نأكّدوا معاك قبل الشراء.
نتأسفوا على التأخير، وشكراً على صبرك 🧡
تابع طلبك: {رابط_التتبع}` },
  { key: 'customer_quoted', audience: 'customer', status: 'quoted', label: 'عرض السعر', body:
`{الاسم}، لقينا طلبك {رقم_الطلب} ✅
💰 سعر السلعة: {سعر_السلعة}
🧾 رسوم الخدمة: {رسوم_الخدمة}
✅ الإجمالي: {الإجمالي}
وافق على العرض بضغطة من هنا: {رابط_التتبع}
ولا رد علينا هنا بـ «موافق».` },
  { key: 'customer_purchasing', audience: 'customer', status: 'purchasing', label: 'الشراء والتجهيز', body:
`تمام {الاسم} 👌 نشروا ونجهّزوا طلبك {رقم_الطلب} توا.
تابع: {رابط_التتبع}` },
  { key: 'customer_shipping', audience: 'customer', status: 'shipping', label: 'في الطريق ليك', body:
`طلبك {رقم_الطلب} في الطريق ليك 🚚
جهّز {الإجمالي} عند الاستلام.
تابع: {رابط_التتبع}` },
  { key: 'customer_delivered', audience: 'customer', status: 'delivered', label: 'وصل', body:
`وصل طلبك {رقم_الطلب} ✓
شكراً إنك اخترت دورلي يا {الاسم} 🧡 — أي حاجة ثانية تدوّر عليها، احنا هنا.` },
  { key: 'customer_cancelled', audience: 'customer', status: 'cancelled', label: 'ملغي', body:
`{الاسم}، نعتذروا — تم إلغاء طلبك {رقم_الطلب}.
السبب: {سبب_الإلغاء}
لو تبي نعاودوا ندوّروا بطريقة ثانية، رد علينا هنا.` },
  { key: 'delegates_group', audience: 'group', label: 'طلب جديد لقروب المندوبين', body:
`🆕 طلب جديد {رقم_الطلب}
📍 {المدينة}
🏷️ {النوع} · الكمية {الكمية}
⏱️ {الاستعجال}
🔧 {القطعة}
📝 {التفاصيل}
اللي يقدر يدوّره يحجزه من البوابة 👇
{رابط_البوابة}` },
  { key: 'delegates_digest', audience: 'group', label: 'عدة طلبات للقروب (رسالة مجمّعة)', body:
`📋 طلبات متاحة للمندوبين — دورلي ({العدد})
{الطلبات}
اللي يقدر على طلب يحجزه من البوابة 👇
{رابط_البوابة}` },
  { key: 'delegate_assigned', audience: 'delegate', label: 'تعيين الطلب لمندوب', body:
`السلام عليكم {اسم_المندوب} 👋
تعيّن ليك الطلب {رقم_الطلب}
👤 الزبون: {الاسم} — {الهاتف}
📍 {المدينة}
🏷️ {النوع} · الكمية {الكمية}
⏱️ {الاستعجال}
🔧 {القطعة}
📝 {التفاصيل}
التفاصيل وتحديث الحالة من «طلباتي»: {رابط_طلباتي}` },
];

export const AUDIENCE_LABELS = { customer: 'للزبون', group: 'لقروب المندوبين', delegate: 'للمندوب المعيّن' };

export const DEFAULTS = Object.fromEntries(TEMPLATES.map(t => [t.key, t.body]));

/** مفتاح رسالة الزبون المناسبة لحالة الطلب. */
export const statusKey = status => 'customer_' + status;

let _cache = null;

/**
 * النصوص الفعلية: الأصل + ما عدّلته الإدارة. لو الجدول مش متاح (صلاحية/شبكة) نرجع للأصل بصمت —
 * الإرسال ما يتعطّلش بسبب الرسائل الجاهزة.
 */
export async function loadTemplates(sb, { fresh = false } = {}) {
  if (_cache && !fresh) return _cache;
  const merged = { ...DEFAULTS };
  const custom = new Set();
  if (sb) {
    const { data, error } = await sb.from('message_templates').select('key,body');
    if (error) console.warn('message_templates:', error.message);
    for (const r of data || []) if (r.key in DEFAULTS && r.body) { merged[r.key] = r.body; custom.add(r.key); }
  }
  _cache = { bodies: merged, custom };
  return _cache;
}

const clip = (s, n) => { s = String(s || '').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const money = v => (v === null || v === undefined || v === '') ? '' : formatMoney(v);

/** قيم المتغيرات من صف الطلب (+ المندوب إن وُجد). */
export function orderVars(o, delegate) {
  const dl = delegate || o.delegate || null;
  const part = [o.car_model, o.part_description, o.part_condition].map(x => String(x || '').trim()).filter(Boolean).join(' — ');
  return {
    'الاسم': String(o.customer_name || '').trim(),
    'الهاتف': String(o.customer_phone || '').trim(),
    'رقم_الطلب': o.code || '',
    'المدينة': o.city || '',
    'النوع': o.category || '',
    'الكمية': o.quantity != null ? String(o.quantity) : '',
    'الاستعجال': o.urgency || '',
    'التفاصيل': clip(o.details, 400),
    'القطعة': clip(part, 200),
    'سعر_السلعة': money(o.quoted_price),
    'رسوم_الخدمة': money(o.service_fee),
    'الإجمالي': money(o.total),
    'سبب_الإلغاء': clip(o.cancel_reason, 300),
    'اسم_المندوب': dl ? String(dl.full_name || '').trim().split(/\s+/)[0] || '' : '',
    'هاتف_المندوب': dl ? String(dl.phone || '').trim() : '',
    'رابط_التتبع': o.code ? `${SITE}/track/?id=${encodeURIComponent(o.code)}` : '',
    'رابط_البوابة': `${SITE}/delegate/`,
    'رابط_طلباتي': `${SITE}/delegate/mine/`,
  };
}

/**
 * يعبّي النص. السطر اللي فيه متغير فاضي يُحذف كله (مثلاً «🔧 {القطعة}» لطلب مش قطع غيار)،
 * والمتغير غير المعروف يبقى كما هو باش يبان للي يعدّل النص.
 */
export function fill(body, vars) {
  return String(body || '').split('\n').map(line => {
    let empty = false;
    const out = line.replace(/\{([^{}\n]{1,30})\}/g, (m, k) => {
      if (!(k in vars)) return m;
      const v = vars[k];
      if (v === '' || v === null || v === undefined) { empty = true; return ''; }
      return String(v);
    });
    return empty ? null : out;
  }).filter(l => l !== null).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** رقم ليبي بأي صيغة → 2189XXXXXXXX (أو '' لو فاضي). */
export function waPhone(phone) {
  let d = String(phone || '').replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '218' + d.slice(1);
  else if (!d.startsWith('218')) d = '218' + d;
  return d;
}

/** رابط واتساب بالرسالة جاهزة. بدون رقم → واتساب يطلب منك تختار المحادثة (مثلاً قروب المندوبين). */
export function waUrl(phone, text) {
  const p = waPhone(phone);
  const q = text ? '?text=' + encodeURIComponent(text) : '';
  return 'https://wa.me/' + p + q;
}

/** سطر واحد لطلب في الرسالة المجمّعة — بدون اسم ورقم الزبون. */
export function digestLine(o) {
  const det = clip(o.details || o.part_description, 70);
  return `• ${o.code} · ${o.city} · ${o.category}${o.urgency === 'عاجل' ? ' · ⚡ عاجل' : ''}${det ? ` — ${det}` : ''}`;
}

/** متغيرات الرسالة المجمّعة لعدة طلبات (حد أقصى للسطور باش رابط واتساب ما يطولش). */
export function digestVars(list, max = 15) {
  const shown = list.slice(0, max);
  const more = list.length - shown.length;
  return {
    'الطلبات': shown.map(digestLine).join('\n') + (more > 0 ? `\n… و${more} طلب آخر في البوابة` : ''),
    'العدد': String(list.length),
    'رابط_البوابة': `${SITE}/delegate/`,
  };
}

/** رقم مؤقت لطلب ما تسجّلش في القاعدة (الشبكة/الخادم واقف) — صيغة مختلفة ما تتلخبطش مع أرقام القاعدة. */
export const tempOrderCode = () => 'DW-TMP-' + Date.now().toString(36).slice(-5).toUpperCase();

/**
 * يقرأ رسالة الطلب اللي يبعتها الزبون من صفحة /request/ على واتساب (ولو منسوخة مع اسم المرسل والوقت).
 * يُرجع { code, temp, fields } — fields بأسماء أعمدة orders. الحقول الناقصة تبقى فاضية.
 */
export function parseOrderMessage(text) {
  const t = String(text || '').replace(/\r/g, '').replace(/[‎‏⁦-⁩]/g, '').replace(/\*/g, '');
  const pick = label => {
    const m = t.match(new RegExp(label + '\\s*[:：]\\s*(.+)'));
    return m ? m[1].trim() : '';
  };
  const codeM = t.match(/DW-(?:TMP-[A-Z0-9]{3,8}|\d{4}-\d{3,6})/i);
  const code = codeM ? codeM[0].toUpperCase() : '';
  // التفاصيل: من «ملاحظات إضافية:» لين آخر الرسالة (قبل ملاحظات الصورة)
  const detM = t.match(/ملاحظات إضافية\s*[:：]\s*([\s\S]*?)(?:\n\s*\n?\s*(?:📸|📷)|$)/);
  const phoneRaw = pick('الهاتف').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/\D/g, '');
  const phone = phoneRaw.replace(/^(00218|218)/, '0').replace(/^9/, '09');
  const qty = parseInt(pick('الكمية').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))), 10);
  const pay = pick('طريقة الدفع');
  const fields = {
    customer_name: pick('الاسم').slice(0, 120),
    customer_phone: /^09\d{8}$/.test(phone) ? phone : '',
    city: pick('مدينة التسليم'),
    category: pick('نوع الطلب'),
    details: detM ? detM[1].trim().slice(0, 2000) : '',
    quantity: qty > 0 && qty < 1000 ? qty : 1,
    urgency: pick('الاستعجال'),
    payment_method: /تحويل/.test(pay) ? 'bank' : 'cash',
    car_model: pick('الموديل').slice(0, 120),
    part_condition: pick('• الحالة') || pick('الحالة'),
    part_description: pick('وصف القطعة').slice(0, 500),
  };
  return { code, temp: /^DW-TMP-/.test(code), fields };
}

/** طلب تجريبي لمعاينة النصوص في صفحة الرسائل الجاهزة. */
export const SAMPLE_ORDER = {
  code: 'DW-2026-1920', customer_name: 'أحمد', customer_phone: '0912345678', city: 'بنغازي',
  category: 'قطع غيار سيارات', quantity: 1, urgency: 'عاجل',
  details: 'فلتر زيت أصلي', car_model: 'هيونداي النترا 2015', part_description: 'فلتر زيت', part_condition: 'جديد',
  quoted_price: 85, service_fee: 20, total: 105, cancel_reason: 'القطعة مش متوفرة في ليبيا حالياً',
  delegate: { full_name: 'سالم المندوب', phone: '0923456789' },
};
