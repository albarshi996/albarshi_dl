// إعداد Supabase — عام بطبيعته.
// الـ anon key مصمم للنشر في المتصفح؛ الحماية الفعلية في سياسات RLS داخل قاعدة البيانات.
//
// طريقتان للتهيئة:
//   1. ملف .env محلي (للتطوير):  PUBLIC_SUPABASE_URL=...  PUBLIC_SUPABASE_ANON_KEY=...
//   2. للنشر على GitHub Pages (لا متغيرات بيئة في deploy.yml): الصق القيمتين هنا مباشرة واعتمد الملف.
//
// إن بقيت القيم فارغة يعمل الموقع كما كان تماماً (واتساب فقط) وتعرض لوحة التحكم رسالة "لم يتم الربط بعد".

const ENV_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const ENV_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_URL = (ENV_URL && String(ENV_URL).trim()) || '';
export const SUPABASE_ANON_KEY = (ENV_KEY && String(ENV_KEY).trim()) || '';
