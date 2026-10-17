// طبقة الوصول لقاعدة البيانات (Supabase) — تُستورد من سكربتات Astro المجمّعة.
// كل دالة تتعامل بأمان مع حالة "غير مهيأ": تُرجع null ولا ترمي، فيبقى الموقع يعمل بواتساب فقط.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

export const STATUS_LABELS = {
  received:   'استلمنا طلبك',
  searching:  'ندوّروا ونسعّروا',
  quoted:     'عرض السعر',
  purchasing: 'الشراء والتجهيز',
  shipping:   'في الطريق ليك',
  delivered:  'وصل ✓',
  cancelled:  'ملغي',
};

// ترتيب الحالات في دورة الطلب (للانتقال للأمام فقط عند المندوب)
export const STATUS_FLOW = ['received', 'searching', 'quoted', 'purchasing', 'shipping', 'delivered'];

export const ROLE_LABELS = { pending: 'بانتظار الاعتماد', delegate: 'مندوب', admin: 'مدير' };

export const PAYMENT_LABELS = { cash: 'نقدي عند الاستلام', bank: 'تحويل مصرفي', online: 'دفع إلكتروني' };

export function isConfigured() {
  return /^https?:\/\/\S+$/.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 20;
}

let _client = null;
let _clientPromise = null;

/** عميل Supabase (تحميل كسول للمكتبة حتى لا تثقل صفحات الموقع العامة). */
export async function getClient() {
  if (!isConfigured()) return null;
  if (_client) return _client;
  if (!_clientPromise) {
    _clientPromise = import('@supabase/supabase-js').then(({ createClient }) => {
      _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      return _client;
    });
  }
  return _clientPromise;
}

// ───────────────────────── الموقع العام (anon) ─────────────────────────

/** إنشاء طلب. يُرجع { id, code } أو null إن لم تكن القاعدة مهيأة. يرمي خطأً عند فشل التحقق. */
export async function submitOrder(payload) {
  const sb = await getClient();
  if (!sb) return null;
  const { data, error } = await sb.rpc('submit_order', { p: payload });
  if (error) throw error;
  return data;
}

/** حالة طلب برقمه. مع هاتف الزبون المطابق تظهر الأسعار أيضاً. يُرجع الكائن أو null (غير موجود / غير مهيأ). */
export async function getOrderStatus(code, phone) {
  const sb = await getClient();
  if (!sb) return null;
  const args = { p_code: String(code || '').trim() };
  if (phone) args.p_phone = String(phone).trim();
  const { data, error } = await sb.rpc('get_order_status', args);
  if (error) throw error;
  return data && data.code ? data : null;
}

export async function getPublicStats() {
  const sb = await getClient();
  if (!sb) return null;
  const { data, error } = await sb.rpc('public_stats');
  if (error) throw error;
  return data;
}

// ───────────────────────── المصادقة والملف الشخصي ─────────────────────────

export async function getSession() {
  const sb = await getClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session || null;
}

export async function getProfile() {
  const sb = await getClient();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data ? { ...data, email: user.email } : null;
}

export async function signIn(email, password) {
  const sb = await getClient();
  if (!sb) throw new Error('not_configured');
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** تسجيل مندوب جديد — يُنشأ ملفه بدور pending حتى تعتمده الإدارة. */
export async function signUpDelegate({ email, password, full_name, phone, city }) {
  const sb = await getClient();
  if (!sb) throw new Error('not_configured');
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { full_name, phone, city } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = await getClient();
  if (sb) await sb.auth.signOut();
}

// ───────────────────────── المندوبون والإدارة ─────────────────────────

export async function claimOrder(orderId) {
  const sb = await getClient();
  if (!sb) throw new Error('not_configured');
  const { data, error } = await sb.rpc('claim_order', { p_order_id: orderId });
  if (error) throw error;
  return data === true;
}

export async function adminStats() {
  const sb = await getClient();
  if (!sb) return null;
  const { data, error } = await sb.rpc('admin_stats');
  if (error) throw error;
  return data;
}

export async function delegateStats() {
  const sb = await getClient();
  if (!sb) return null;
  const { data, error } = await sb.rpc('delegate_stats');
  if (error) throw error;
  return data;
}

/**
 * تغيير حالة الطلب (+ أسعار + ملاحظة للزبون) في عملية واحدة — للمدير والمندوب.
 * الحارس في القاعدة يرفض انتقالات المندوب غير المسموحة. يُرجع صف الطلب المحدّث.
 */
export async function setOrderStatus(orderId, status, { note, quoted_price, service_fee, total, cancel_reason } = {}) {
  const sb = await getClient();
  if (!sb) throw new Error('not_configured');
  const { data, error } = await sb.rpc('set_order_status', {
    p_order_id: orderId, p_status: status,
    p_note: note || null,
    p_quoted_price: quoted_price ?? null, p_service_fee: service_fee ?? null, p_total: total ?? null,
    p_cancel_reason: cancel_reason || null,
  });
  if (error) throw error;
  return data;
}

/** تعيين مندوب (أو null لإلغاء التعيين) — إدارة فقط. يضبط الحالة ويوثّق الحدث. */
export async function assignOrder(orderId, delegateId, note) {
  const sb = await getClient();
  if (!sb) throw new Error('not_configured');
  const { data, error } = await sb.rpc('assign_order', { p_order_id: orderId, p_delegate_id: delegateId || null, p_note: note || null });
  if (error) throw error;
  return data;
}

/** ردّ الزبون على عرض السعر من صفحة التتبع (يتطلب هاتفه). */
export async function respondToQuote(code, phone, accept) {
  const sb = await getClient();
  if (!sb) return null;
  const { data, error } = await sb.rpc('respond_to_quote', { p_code: code, p_phone: phone, p_accept: !!accept });
  if (error) throw error;
  return data === true;
}

// ───────────────────────── أدوات ─────────────────────────

/** رسالة عربية مفهومة من خطأ Supabase/Postgres. */
export function friendlyError(err) {
  const msg = String((err && (err.message || err.error_description || err.msg)) || err || '');
  const map = [
    ['invalid_phone',               'رقم الهاتف لازم يكون ليبي صحيح — 10 أرقام ويبدا بـ 09.'],
    ['invalid_name',                'اكتب اسمك من فضلك.'],
    ['missing_fields',              'باقي خانات مطلوبة ما عبّيتهاش.'],
    ['rate_limited',                'وصلتنا طلبات كثيرة من رقمك في وقت قصير — جرّب بعد شوية أو كلمنا على الواتساب.'],
    ['not_allowed',                 'ما عندكش صلاحية لهذا الإجراء.'],
    ['too_many_active',             'عندك 5 طلبات جارية — كمّل واحد منها قبل ما تحجز طلباً جديداً.'],
    ['last_admin',                  'ما ينفعش — هذا آخر مدير نشط في المنصة.'],
    ['invalid_delegate',            'المندوب المختار غير نشط أو غير معتمد.'],
    ['not_found',                   'الطلب غير موجود أو ما عندكش صلاحية عليه.'],
    ['Invalid login credentials',   'الإيميل أو كلمة السر غير صحيحة.'],
    ['Email not confirmed',         'أكّد إيميلك من الرسالة اللي وصلتك أولاً.'],
    ['User already registered',     'هذا الإيميل مسجّل من قبل — سجّل دخولك.'],
    ['Password should be',          'كلمة السر لازم تكون 6 أحرف على الأقل.'],
    ['Failed to fetch',             'تعذّر الاتصال بالخادم — تأكد من الإنترنت وجرّب تاني.'],
    ['not_configured',              'قاعدة البيانات غير مهيأة بعد.'],
    ['row-level security',          'ما عندكش صلاحية لهذا الإجراء.'],
    ['duplicate key',               'هذا السجل موجود من قبل.'],
  ];
  for (const [needle, text] of map) if (msg.includes(needle)) return text;
  return msg || 'صار خطأ غير متوقع — جرّب تاني.';
}

export function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ar-LY', { dateStyle: 'medium', timeStyle: 'short', numberingSystem: 'latn' }).format(new Date(iso));
  } catch (_) { return String(iso).slice(0, 16).replace('T', ' '); }
}

export function formatMoney(n) {
  if (n === null || n === undefined || n === '') return '—';
  const v = Number(n);
  if (Number.isNaN(v)) return '—';
  return v.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' د.ل';
}

/** تهريب نص قبل إدراجه في innerHTML. استخدمه لكل بيانات المستخدمين. */
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
