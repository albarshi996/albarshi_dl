-- بيانات اختبار للبيئة المحلية فقط (supabase start / db reset). لا تُنفَّذ على الإنتاج.
-- حسابات الدخول المحلية:
--   مدير:  admin@dawerli.local    / admin12345
--   مندوب: delegate@dawerli.local / delegate12345   (معتمد)
--   مندوب: pending@dawerli.local  / pending12345    (بانتظار الاعتماد)

create or replace function pg_temp.seed_user(p_id uuid, p_email text, p_password text, p_meta jsonb)
returns void language plpgsql as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, p_meta, now(), now(), '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
          jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
end $$;

select pg_temp.seed_user('11111111-1111-1111-1111-111111111111', 'admin@dawerli.local',    'admin12345',    '{"full_name":"مدير دورلي","phone":"0946507954","city":"بنغازي"}');
select pg_temp.seed_user('22222222-2222-2222-2222-222222222222', 'delegate@dawerli.local', 'delegate12345', '{"full_name":"سالم المندوب","phone":"0911111111","city":"بنغازي"}');
select pg_temp.seed_user('33333333-3333-3333-3333-333333333333', 'pending@dawerli.local',  'pending12345',  '{"full_name":"علي الجديد","phone":"0922222222","city":"طرابلس"}');

update public.profiles set role = 'admin'    where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set role = 'delegate' where id = '22222222-2222-2222-2222-222222222222';

insert into public.suppliers (id, name, phone, city, categories, rating, notes) values
  ('a0000000-0000-0000-0000-000000000001', 'محل الصادق لقطع الغيار', '0913333333', 'بنغازي', '{"قطع غيار سيارات","قطع غيار شاحنات"}', 5, 'أسعار ممتازة وقطع أصلية'),
  ('a0000000-0000-0000-0000-000000000002', 'رابش الهواري',            '0914444444', 'بنغازي', '{"قطع غيار سيارات"}', 4, 'قطع مستعملة بحالة جيدة'),
  ('a0000000-0000-0000-0000-000000000003', 'مخازن الجملة — طرابلس',   '0915555555', 'طرابلس', '{"مواد غذائية وحلويات","تجميل ونظافة"}', 4, null);

insert into public.products (name, category, description, supplier_id, price_min, price_max) values
  ('مضخة مياه تويوتا هايلاكس 2018 ديزل', 'قطع غيار سيارات', 'أصلية — ضمان 6 أشهر', 'a0000000-0000-0000-0000-000000000001', 450, 600),
  ('بطارية 70 أمبير', 'قطع غيار سيارات', 'كورية', 'a0000000-0000-0000-0000-000000000001', 280, 350),
  ('كرتون شوكولاتة 24 قطعة', 'مواد غذائية وحلويات', 'جملة', 'a0000000-0000-0000-0000-000000000003', 60, 75);

insert into public.merchants (name, owner_name, phone, city, activity, notes) values
  ('سوبر ماركت النخيل', 'محمد العبيدي', '0916666666', 'جالو', 'مواد غذائية', 'طلب شهري منتظم'),
  ('ورشة الأمل', 'خالد الفاخري', '0917777777', 'أوجلة', 'قطع غيار', null);

-- طلبات بحالات مختلفة
insert into public.orders (code, customer_name, customer_phone, city, category, details, quantity, urgency, payment_method, status, delegate_id, service_fee, quoted_price, total, car_model, part_condition, part_description) values
  ('DW-2026-1001', 'أحمد البرعصي',   '0921111111', 'جالو',   'قطع غيار سيارات', 'مضخة مياه للهايلاكس', 1, 'عاجل', 'cash', 'received',   null, null, null, null, 'تويوتا هايلاكس 2018 ديزل', 'جديدة', 'مضخة مياه محرك'),
  ('DW-2026-1002', 'فاطمة الزوي',    '0922222223', 'بنغازي', 'تجميل ونظافة',    'كريم أساس ماركة ماك — درجة NC42', 2, 'عادي', 'bank', 'received',   null, null, null, null, null, null, null),
  ('DW-2026-1003', 'عمر المجبري',    '0923333333', 'أوجلة',  'قطع غيار شاحنات', 'فلتر زيت مان 2015', 3, 'متوسط', 'cash', 'searching',  '22222222-2222-2222-2222-222222222222', null, null, null, 'مان TGS 2015', 'مستعملة (رابش)', 'فلتر زيت'),
  ('DW-2026-1004', 'سارة الدرسي',    '0924444444', 'إجخرة',  'ملابس وأزياء',    'فستان سهرة أزرق مقاس M', 1, 'عادي', 'cash', 'quoted',     '22222222-2222-2222-2222-222222222222', 30, 420, 450, null, null, null),
  ('DW-2026-1005', 'محمد الفيتوري',  '0925555555', 'جالو',   'مواد غذائية وحلويات', 'كرتون شوكولاتة للمحل', 5, 'عادي', 'cash', 'shipping',  '22222222-2222-2222-2222-222222222222', 40, 300, 340, null, null, null),
  ('DW-2026-1006', 'هدى العرفي',     '0926666666', 'بنغازي', 'أوراق ومستندات',  'توصيل مستندات لمكتب السجل المدني', 1, 'عاجل', 'cash', 'delivered', '22222222-2222-2222-2222-222222222222', 25, 0, 25, null, null, null),
  ('DW-2026-1007', 'أحمد البرعصي',   '0921111111', 'جالو',   'إلكترونيات',      'شاحن لابتوب HP 65W', 1, 'عادي', 'cash', 'delivered',  null, 20, 95, 115, null, null, null),
  ('DW-2026-1008', 'نور الشريف',     '0927777777', 'سبها',   'أخرى',            'طلب تجريبي ملغي', 1, 'عادي', 'cash', 'cancelled',  null, null, null, null, null, null, null);

-- ملاحظة ظاهرة للزبون على طلب في مرحلة التسعير
insert into public.order_events (order_id, kind, status, note, actor_id)
select id, 'note', 'quoted', 'لقينا الفستان في بنغازي بسعر 420 د.ل + 30 رسوم خدمة. ننتظر موافقتك.', '22222222-2222-2222-2222-222222222222'
from public.orders where code = 'DW-2026-1004';

select setval('public.order_code_seq', 1100);
