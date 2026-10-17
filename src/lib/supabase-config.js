// إعداد Supabase — عام بطبيعته.
// المفتاح المنشور هنا (publishable / anon) مصمم للمتصفح؛ الحماية الفعلية في سياسات RLS داخل قاعدة البيانات.
// لا تضع هنا مفتاح service_role أو sb_secret_ أبداً.
//
// للتطوير المحلي: ملف .env (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY) يتقدّم على القيم أدناه.

const PROD_URL = 'https://ubyzdzbubmffdxtygoah.supabase.co';
const PROD_KEY = 'sb_publishable_XODVoT4TIhnx4XAiqy6Aqg_p2JPId7r';

const ENV_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const ENV_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const SUPABASE_URL = (ENV_URL && String(ENV_URL).trim()) || PROD_URL;
export const SUPABASE_ANON_KEY = (ENV_KEY && String(ENV_KEY).trim()) || PROD_KEY;
