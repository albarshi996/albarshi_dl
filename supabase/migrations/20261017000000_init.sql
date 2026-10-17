-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  دورلي · Dawerli — المخطط الأساسي لقاعدة البيانات (Supabase) v2   ║
-- ║  العملاء · التجار · الموردون · المنتجات · الطلبات · المندوبون      ║
-- ╚══════════════════════════════════════════════════════════════════╝
--
-- نموذج الصلاحيات:
--   anon          زائر الموقع: يُنشئ طلباً ويستعلم عن حالته برقمه (عبر RPC فقط، لا وصول مباشر للجداول)
--   delegate      مندوب معتمد: يرى الطلبات المتاحة (أعمدة محدودة)، يحجز طلباً، ويحدّث حالة طلباته للأمام فقط
--   admin         الإدارة: كل شيء
--   pending       حساب مندوب جديد بانتظار اعتماد الإدارة: لا شيء
--   postgres / service_role / SQL Editor: سياق موثوق — الحرّاس لا يعترضونه
--
-- أول مدير: بعد تسجيل حسابك من /delegate/login/ نفّذ في SQL Editor:
--   update public.profiles set role = 'admin' where email = 'you@example.com';

create extension if not exists pgcrypto;
create extension if not exists pg_trgm with schema extensions;

-- ───────────────────────── الأنواع والدوال المساعدة ─────────────────────────

-- ترتيب الإعلان = ترتيب دورة الطلب (يُستخدم في منع الرجوع للخلف)
create type public.order_status as enum (
  'received',    -- استلمنا طلبك
  'searching',   -- ندوّروا ونسعّروا
  'quoted',      -- عرض السعر (بانتظار موافقة الزبون)
  'purchasing',  -- الشراء والتجهيز
  'shipping',    -- في الطريق
  'delivered',   -- تم التسليم
  'cancelled'    -- ملغي
);

-- فهرس المرحلة في الخط الزمني العام (5 مراحل: 0..4، الملغي = -1) — للعرض فقط
create or replace function public.order_stage_idx(s public.order_status)
returns int language sql immutable as $$
  select case s
    when 'received'   then 0
    when 'searching'  then 1
    when 'quoted'     then 2
    when 'purchasing' then 3
    when 'shipping'   then 3
    when 'delivered'  then 4
    else -1 end
$$;

create or replace function public.order_status_label(s public.order_status)
returns text language sql immutable as $$
  select case s
    when 'received'   then 'استلمنا طلبك'
    when 'searching'  then 'ندوّروا ونسعّروا'
    when 'quoted'     then 'عرض السعر — بانتظار موافقتك'
    when 'purchasing' then 'الشراء والتجهيز'
    when 'shipping'   then 'في الطريق ليك'
    when 'delivered'  then 'تم التسليم'
    else 'ملغي' end
$$;

-- السياق الموثوق: كل ما ليس طلب API (anon/authenticated) — المالك، service_role، SQL Editor،
-- وداخل دوال SECURITY DEFINER (current_user = المالك)
create or replace function public.is_trusted_context()
returns boolean language sql stable as $$
  select current_user not in ('anon', 'authenticated')
$$;

create or replace function public.tripoli_now()
returns timestamptz language sql stable as $$ select now() $$;

create or replace function public.tripoli_month_start()
returns timestamptz language sql stable as $$
  select (date_trunc('month', now() at time zone 'Africa/Tripoli') at time zone 'Africa/Tripoli')
$$;

create or replace function public.tripoli_day_start()
returns timestamptz language sql stable as $$
  select (date_trunc('day', now() at time zone 'Africa/Tripoli') at time zone 'Africa/Tripoli')
$$;

create or replace function public.normalize_phone(p text)
returns text language sql immutable as $$
  select regexp_replace(
           regexp_replace(translate(coalesce(p, ''), '٠١٢٣٤٥٦٧٨٩', '0123456789'), '[\s-]', '', 'g'),
           '^(\+?218|00218)', '0')
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────────────────── الملفات الشخصية (مديرون ومندوبون) ─────────────────────────

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text not null default '',
  phone        text,
  city         text,
  role         text not null default 'pending' check (role in ('pending','delegate','admin')),
  active       boolean not null default true,
  approved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role, created_at);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- يُنشئ ملفاً شخصياً تلقائياً لكل مستخدم جديد في Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, city)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120),
    left(public.normalize_phone(new.raw_user_meta_data->>'phone'), 20),
    left(new.raw_user_meta_data->>'city', 60)
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.handle_user_email_change();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin' and active
  )
$$;

create or replace function public.is_delegate()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'delegate' and active
  )
$$;

-- غير المدير لا يغيّر دوره/تفعيله؛ لا يمكن إزالة آخر مدير نشط
create or replace function public.profiles_guard()
returns trigger language plpgsql as $$
declare v_other_admins int;
begin
  if new.id <> old.id then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if old.role = 'pending' and new.role = 'delegate' and new.approved_at is null then
    new.approved_at := now();
  end if;
  if public.is_trusted_context() then
    return new;
  end if;
  if not public.is_admin() then
    if new.role is distinct from old.role or new.active is distinct from old.active
       or new.email is distinct from old.email or new.approved_at is distinct from old.approved_at then
      raise exception 'not_allowed' using errcode = '42501';
    end if;
    return new;
  end if;
  if old.role = 'admin' and old.active and (new.role <> 'admin' or not new.active) then
    select count(*) into v_other_admins from public.profiles
     where role = 'admin' and active and id <> old.id;
    if v_other_admins = 0 then
      raise exception 'last_admin' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.profiles_guard();

-- ───────────────────────── السجلات الأساسية ─────────────────────────

create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null unique,
  city        text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index customers_name_trgm_idx on public.customers using gin (name extensions.gin_trgm_ops);
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create table public.merchants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,            -- اسم المحل / النشاط
  owner_name  text,
  phone       text not null,
  city        text,
  activity    text,                     -- نوع النشاط (قطع غيار، مواد غذائية ...)
  notes       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index merchants_phone_key on public.merchants (phone);
create index merchants_name_trgm_idx on public.merchants using gin (name extensions.gin_trgm_ops);
create trigger merchants_set_updated_at before update on public.merchants
  for each row execute function public.set_updated_at();

create table public.suppliers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  city        text,
  categories  text[] not null default '{}',
  rating      smallint check (rating between 1 and 5),
  notes       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index suppliers_name_trgm_idx on public.suppliers using gin (name extensions.gin_trgm_ops);
create index suppliers_categories_idx on public.suppliers using gin (categories);
create trigger suppliers_set_updated_at before update on public.suppliers
  for each row execute function public.set_updated_at();

create table public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text,
  description  text,
  image_url    text,
  supplier_id  uuid references public.suppliers(id) on delete set null,
  price_min    numeric(12,2) check (price_min is null or price_min >= 0),
  price_max    numeric(12,2) check (price_max is null or price_max >= 0),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index products_supplier_idx on public.products (supplier_id);
create index products_category_idx on public.products (category) where active;
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ───────────────────────── الطلبات ─────────────────────────

create sequence public.order_code_seq start 1001;

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  customer_id         uuid references public.customers(id) on delete set null,
  merchant_id         uuid references public.merchants(id) on delete set null,
  customer_name       text not null,
  customer_phone      text not null,
  city                text not null,
  category            text not null,
  details             text,
  quantity            int not null default 1 check (quantity between 1 and 999),
  urgency             text not null default 'عادي' check (urgency in ('عادي','متوسط','عاجل')),
  payment_method      text not null default 'cash' check (payment_method in ('cash','bank','online')),
  car_model           text,
  part_condition      text,
  part_description    text,
  status              public.order_status not null default 'received',
  delegate_id         uuid references public.profiles(id) on delete set null,
  supplier_id         uuid references public.suppliers(id) on delete set null,
  product_id          uuid references public.products(id) on delete set null,
  quoted_price        numeric(12,2) check (quoted_price is null or quoted_price >= 0),
  service_fee         numeric(12,2) check (service_fee is null or service_fee >= 0),
  total               numeric(12,2) check (total is null or total >= 0),
  delegate_commission numeric(12,2) check (delegate_commission is null or delegate_commission >= 0),
  quote_response      text check (quote_response in ('accepted','rejected')),
  quote_responded_at  timestamptz,
  internal_notes      text,
  cancel_reason       text,
  source              text not null default 'web' check (source in ('web','admin','whatsapp','phone')),
  assigned_at         timestamptz,
  quoted_at           timestamptz,
  status_changed_at   timestamptz not null default now(),
  delivered_at        timestamptz,
  delivered_by        uuid references public.profiles(id) on delete set null,
  cancelled_at        timestamptz,
  cancelled_by        uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index orders_status_created_idx  on public.orders (status, created_at desc);
create index orders_created_idx         on public.orders (created_at desc, id desc);
create index orders_delegate_status_idx on public.orders (delegate_id, status, created_at desc) where delegate_id is not null;
create index orders_open_pool_idx       on public.orders (created_at) where delegate_id is null and status = 'received';
create index orders_customer_idx        on public.orders (customer_id);
create index orders_merchant_idx        on public.orders (merchant_id);
create index orders_city_idx            on public.orders (city);
create index orders_delivered_at_idx    on public.orders (delivered_at desc) where delivered_at is not null;
create index orders_name_trgm_idx       on public.orders using gin (customer_name extensions.gin_trgm_ops);
create index orders_phone_trgm_idx      on public.orders using gin (customer_phone extensions.gin_trgm_ops);
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_events (
  id                   bigint generated always as identity primary key,
  order_id             uuid not null references public.orders(id) on delete cascade,
  kind                 text not null default 'status' check (kind in ('status','note','assign','unassign')),
  status               public.order_status not null,
  note                 text,
  visible_to_customer  boolean not null default true,
  actor_id             uuid references public.profiles(id) on delete set null,
  created_at           timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at, id);
create index order_events_actor_idx on public.order_events (actor_id, created_at desc);

-- قبل الإدراج: توليد الرقم، تطبيع الهاتف، ربط/إنشاء العميل، وربط التاجر بهاتفه
create or replace function public.orders_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.customer_phone := public.normalize_phone(new.customer_phone);
  if new.code is null or new.code = '' then
    new.code := 'DW-' || to_char(now() at time zone 'Africa/Tripoli', 'YYYY') || '-' || nextval('public.order_code_seq')::text;
  end if;
  if new.customer_id is null and new.customer_phone <> '' then
    insert into public.customers (name, phone, city)
    values (new.customer_name, new.customer_phone, nullif(new.city, ''))
    on conflict (phone) do update
      set name = case when length(trim(excluded.name)) >= 2 then excluded.name else public.customers.name end,
          city = coalesce(excluded.city, public.customers.city),
          updated_at = now()
    returning id into new.customer_id;
  end if;
  if new.merchant_id is null and new.customer_phone <> '' then
    select m.id into new.merchant_id from public.merchants m
     where m.phone = new.customer_phone and m.active limit 1;
  end if;
  return new;
end $$;

create trigger orders_before_insert before insert on public.orders
  for each row execute function public.orders_before_insert();

-- حارس التعديل (للمندوب فقط — المدير والسياق الموثوق يمرّان):
--   أعمدة مسموحة فقط، انتقالات للأمام فقط عبر جدول صريح، الحالات النهائية مجمّدة
create or replace function public.orders_guard_update()
returns trigger language plpgsql as $$
declare
  allowed text[] := array['status','supplier_id','product_id','quoted_price','service_fee','total','updated_at'];
begin
  if public.is_trusted_context() or public.is_admin() then
    return new;
  end if;
  if old.delegate_id is distinct from auth.uid() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if old.status in ('cancelled', 'delivered') then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if new.status is distinct from old.status and not (
       (old.status = 'received'   and new.status = 'searching')
    or (old.status = 'searching'  and new.status in ('quoted', 'purchasing'))
    or (old.status = 'quoted'     and new.status = 'purchasing')
    or (old.status = 'purchasing' and new.status = 'shipping')
    or (old.status = 'shipping'   and new.status = 'delivered')) then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger orders_guard_update before update on public.orders
  for each row execute function public.orders_guard_update();

-- الطوابع الزمنية (يعمل بعد الحارس بترتيب الاسم: g < s)
create or replace function public.orders_stamp_status()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.delegate_id is not null then new.assigned_at := now(); end if;
    if new.status = 'quoted'    then new.quoted_at := now(); end if;
    if new.status = 'delivered' then new.delivered_at := now(); new.delivered_by := new.delegate_id; end if;
    if new.status = 'cancelled' then new.cancelled_at := now(); end if;
    return new;
  end if;
  if new.delegate_id is distinct from old.delegate_id then
    new.assigned_at := case when new.delegate_id is null then null else now() end;
  end if;
  if new.status is distinct from old.status then
    new.status_changed_at := now();
    if new.status = 'quoted' then
      new.quoted_at := now();
    end if;
    if new.status = 'delivered' then
      new.delivered_at := now();
      new.delivered_by := coalesce(new.delegate_id, (select id from public.profiles where id = auth.uid()));
    end if;
    if new.status = 'cancelled' then
      new.cancelled_at := now();
      new.cancelled_by := (select id from public.profiles where id = auth.uid());
    end if;
  end if;
  return new;
end $$;

create trigger orders_stamp_status before insert or update on public.orders
  for each row execute function public.orders_stamp_status();

-- سجل الأحداث: كل تغيير حالة يُسجَّل تلقائياً (مع ملاحظة اختيارية تُمرَّر عبر set_order_status)
create or replace function public.log_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_events (order_id, kind, status, note, actor_id)
    values (new.id, 'status', new.status,
            nullif(current_setting('dawerli.event_note', true), ''),
            (select id from public.profiles where id = auth.uid()));
  end if;
  return new;
end $$;

create trigger orders_log_status after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- حارس الأحداث: غير المدير لا يزوّر حالة ولا تاريخاً ولا فاعلاً — ملاحظة فقط على حالة الطلب الحالية
-- (ليس SECURITY DEFINER عمداً: يجب أن يرى سياق المستخدم الحقيقي)
create or replace function public.order_events_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if public.is_trusted_context() or public.is_admin() then
    return new;
  end if;
  new.kind       := 'note';
  new.actor_id   := auth.uid();
  new.created_at := now();
  new.visible_to_customer := true;
  select status into new.status from public.orders where id = new.order_id and delegate_id = auth.uid();
  if new.status is null or nullif(trim(coalesce(new.note, '')), '') is null then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger order_events_guard before insert on public.order_events
  for each row execute function public.order_events_guard();

-- ───────────────────────── دوال RPC العامة (anon) ─────────────────────────

-- إنشاء طلب من الموقع. يُرجع { id, code }.
create or replace function public.submit_order(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_phone text := public.normalize_phone(coalesce(p->>'phone', p->>'customer_phone'));
  v_name  text := left(trim(coalesce(p->>'name', p->>'customer_name', '')), 120);
  v_city  text := left(trim(coalesce(p->>'city', p->>'delivery_city', '')), 60);
  v_cat   text := left(trim(coalesce(p->>'category', p->>'order_category', '')), 60);
  v_det   text := left(coalesce(p->>'details', p->>'order_details'), 2000);
  v_pay   text := coalesce(p->>'payment_method', 'cash');
  v_qty   int  := coalesce(substring(coalesce(p->>'quantity', p->>'order_quantity', '') from '^[0-9]{1,3}$')::int, 1);
  v_urg   text := case when coalesce(p->>'urgency', p->>'order_urgency') in ('متوسط','عاجل')
                       then coalesce(p->>'urgency', p->>'order_urgency') else 'عادي' end;
  v_id    uuid;
  v_code  text;
begin
  if v_phone !~ '^09[0-9]{8}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if length(v_name) < 2 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;
  if v_city = '' or v_cat = '' then
    raise exception 'missing_fields' using errcode = '22023';
  end if;
  if v_pay not in ('cash','bank','online') then
    v_pay := 'cash';
  end if;
  -- حد بسيط ضد الإغراق: 5 طلبات لكل رقم كل 10 دقائق، و600 إجمالاً كل 10 دقائق (صمام أمان فقط)
  if (select count(*) from public.orders
        where customer_phone = v_phone and created_at > now() - interval '10 minutes') >= 5
     or (select count(*) from public.orders
        where source = 'web' and created_at > now() - interval '10 minutes') >= 600 then
    raise exception 'rate_limited' using errcode = '53400';
  end if;

  insert into public.orders (
    customer_name, customer_phone, city, category, details, quantity, urgency,
    payment_method, car_model, part_condition, part_description, source
  ) values (
    v_name, v_phone, v_city, v_cat, v_det, greatest(1, least(999, v_qty)), v_urg, v_pay,
    left(p->>'car_model', 120),
    left(p->>'part_condition', 40),
    left(p->>'part_description', 500),
    'web'
  )
  returning id, code into v_id, v_code;

  return jsonb_build_object('id', v_id, 'code', v_code);
end $$;

-- حالة الطلب برقمه. بدون هاتف: بيانات غير حساسة فقط. مع الهاتف المطابق: تظهر الأسعار أيضاً.
create or replace function public.get_order_status(p_code text, p_phone text default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_code     text := upper(trim(translate(coalesce(p_code, ''), '٠١٢٣٤٥٦٧٨٩', '0123456789')));
  v_phone    text := public.normalize_phone(p_phone);
  o          public.orders;
  v_verified boolean;
begin
  if v_code = '' then return null; end if;
  if v_code !~ '^DW-' then v_code := 'DW-' || v_code; end if;
  select * into o from public.orders where code = v_code;
  if o.id is null then return null; end if;
  v_verified := v_phone <> '' and o.customer_phone = v_phone;
  return jsonb_build_object(
    'code',              o.code,
    'status',            o.status,
    'stage_idx',         public.order_stage_idx(o.status),
    'status_label',      public.order_status_label(o.status),
    'city',              o.city,
    'category',          o.category,
    'quantity',          o.quantity,
    'created_at',        o.created_at,
    'updated_at',        o.updated_at,
    'status_changed_at', o.status_changed_at,
    'delivered_at',      o.delivered_at,
    'cancelled_at',      o.cancelled_at,
    'cancel_reason',     case when o.status = 'cancelled' then o.cancel_reason end,
    'verified',          v_verified,
    'quoted_price',      case when v_verified then o.quoted_price end,
    'service_fee',       case when v_verified then o.service_fee end,
    'total',             case when v_verified then o.total end,
    'quote_response',    case when v_verified then o.quote_response end,
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'kind',         e.kind,
               'status',       e.status,
               'stage_idx',    public.order_stage_idx(e.status),
               'status_label', public.order_status_label(e.status),
               'note',         e.note,
               'at',           e.created_at) order by e.created_at, e.id)
        from public.order_events e
       where e.order_id = o.id and e.visible_to_customer and e.kind in ('status', 'note')), '[]'::jsonb)
  );
end $$;

-- ردّ الزبون على عرض السعر (يتطلب رقم الطلب + هاتفه)
create or replace function public.respond_to_quote(p_code text, p_phone text, p_accept boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  update public.orders
     set quote_response = case when p_accept then 'accepted' else 'rejected' end,
         quote_responded_at = now()
   where code = upper(trim(translate(coalesce(p_code, ''), '٠١٢٣٤٥٦٧٨٩', '0123456789')))
     and customer_phone = public.normalize_phone(p_phone)
     and status = 'quoted'
  returning id into v_id;
  if v_id is null then return false; end if;
  insert into public.order_events (order_id, kind, status, note)
  values (v_id, 'note', 'quoted',
          case when p_accept then 'وافق الزبون على عرض السعر ✓' else 'الزبون رفض عرض السعر' end);
  return true;
end $$;

-- أرقام حقيقية للصفحة الرئيسية
create or replace function public.public_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'delivered_orders', (select count(*) from public.orders where status = 'delivered'),
    'customers',        (select count(distinct customer_id) from public.orders where status = 'delivered'),
    'cities',           (select count(distinct city) from public.orders where status = 'delivered' and city <> 'أخرى'),
    'avg_delivery_hours', (select round((avg(extract(epoch from (delivered_at - created_at))) / 3600)::numeric, 1)
                             from public.orders where delivered_at is not null)
  )
$$;

-- ───────────────────────── دوال المندوبين والإدارة ─────────────────────────

-- الطلبات المتاحة للمندوبين: أعمدة محدودة، بلا اسم أو هاتف حتى الحجز
create view public.delegate_open_orders with (security_invoker = false, security_barrier = true) as
  select id, code, city, category, details, quantity, urgency,
         case urgency when 'عاجل' then 0 when 'متوسط' then 1 else 2 end as urgency_rank,
         car_model, part_condition, part_description, created_at
  from public.orders
  where delegate_id is null
    and status = 'received'
    and (public.is_delegate() or public.is_admin());

-- طلبات المندوب نفسه بلا الأعمدة الداخلية (RLS على orders يبقى سارياً)
create view public.delegate_my_orders with (security_invoker = true) as
  select id, code, status, city, category, details, quantity, urgency, payment_method,
         car_model, part_condition, part_description, customer_name, customer_phone,
         supplier_id, product_id, quoted_price, service_fee, total, delegate_commission,
         quote_response, quote_responded_at, cancel_reason,
         assigned_at, quoted_at, status_changed_at, delivered_at, cancelled_at, created_at, updated_at
  from public.orders
  where delegate_id = auth.uid();

-- المندوب يحجز طلباً متاحاً لنفسه (بحد 5 طلبات جارية)
create or replace function public.claim_order(p_order_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_ok int;
begin
  if not public.is_delegate() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if (select count(*) from public.orders
       where delegate_id = auth.uid() and status in ('searching','quoted','purchasing','shipping')) >= 5 then
    raise exception 'too_many_active' using errcode = '53400';
  end if;
  update public.orders
     set delegate_id = auth.uid(), status = 'searching'
   where id = p_order_id and delegate_id is null and status = 'received';
  get diagnostics v_ok = row_count;
  if v_ok = 1 then
    insert into public.order_events (order_id, kind, status, visible_to_customer, actor_id)
    values (p_order_id, 'assign', 'searching', false, auth.uid());
  end if;
  return v_ok = 1;
end $$;

-- تغيير الحالة (+ أسعار + ملاحظة للزبون) في عملية واحدة. SECURITY INVOKER: RLS والحارس يبقيان ساريين.
create or replace function public.set_order_status(
  p_order_id uuid, p_status public.order_status, p_note text default null,
  p_quoted_price numeric default null, p_service_fee numeric default null, p_total numeric default null,
  p_cancel_reason text default null
)
returns public.orders language plpgsql security invoker as $$
declare
  v     public.orders;
  v_old public.order_status;
begin
  select status into v_old from public.orders where id = p_order_id;
  if v_old is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  perform set_config('dawerli.event_note', coalesce(p_note, ''), true);
  update public.orders
     set status        = p_status,
         quoted_price  = coalesce(p_quoted_price, quoted_price),
         service_fee   = coalesce(p_service_fee, service_fee),
         total         = coalesce(p_total, case when p_quoted_price is not null or p_service_fee is not null
                                                 then coalesce(p_quoted_price, quoted_price, 0) + coalesce(p_service_fee, service_fee, 0)
                                                 else total end),
         cancel_reason = coalesce(p_cancel_reason, cancel_reason),
         -- عرض سعر جديد يلغي ردّ الزبون السابق
         quote_response     = case when p_status = 'quoted' and p_quoted_price is not null then null else quote_response end,
         quote_responded_at = case when p_status = 'quoted' and p_quoted_price is not null then null else quote_responded_at end
   where id = p_order_id
  returning * into v;
  perform set_config('dawerli.event_note', '', true);
  if v.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  -- ملاحظة بلا تغيير حالة: تُسجَّل كحدث ملاحظة (مع تغيير الحالة يسجّلها مشغّل الحالة نفسه)
  if v_old = p_status and nullif(trim(coalesce(p_note, '')), '') is not null then
    insert into public.order_events (order_id, kind, status, note, actor_id)
    values (p_order_id, 'note', v.status, p_note, auth.uid());
  end if;
  return v;
end $$;

-- تعيين/إلغاء تعيين مندوب (إدارة): يضبط الحالة ويوثّق الحدث
create or replace function public.assign_order(p_order_id uuid, p_delegate_id uuid, p_note text default null)
returns public.orders language plpgsql security invoker as $$
declare v public.orders;
begin
  if not public.is_admin() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if p_delegate_id is not null and not exists (
       select 1 from public.profiles where id = p_delegate_id and role in ('delegate','admin') and active) then
    raise exception 'invalid_delegate' using errcode = '22023';
  end if;
  update public.orders
     set delegate_id = p_delegate_id,
         status = case when p_delegate_id is null     and status = 'searching' then 'received'
                       when p_delegate_id is not null and status = 'received'  then 'searching'
                       else status end
   where id = p_order_id and status not in ('delivered', 'cancelled')
  returning * into v;
  if v.id is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  insert into public.order_events (order_id, kind, status, note, visible_to_customer, actor_id)
  values (p_order_id, case when p_delegate_id is null then 'unassign' else 'assign' end, v.status, p_note, false, auth.uid());
  return v;
end $$;

-- إحصائيات لوحة التحكم (إدارة فقط)
create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  d0 timestamptz := public.tripoli_day_start();
  m0 timestamptz := public.tripoli_month_start();
begin
  if not public.is_admin() then return null; end if;
  return jsonb_build_object(
    'today',             (select count(*) from public.orders where created_at >= d0),
    'open',              (select count(*) from public.orders where status in ('received','searching','quoted','purchasing','shipping')),
    'unassigned',        (select count(*) from public.orders where status = 'received' and delegate_id is null),
    'delivered_month',   (select count(*) from public.orders where status = 'delivered' and delivered_at >= m0),
    'fees_month',        (select coalesce(sum(service_fee), 0) from public.orders where status = 'delivered' and delivered_at >= m0),
    'cancelled_month',   (select count(*) from public.orders where status = 'cancelled' and cancelled_at >= m0),
    'avg_delivery_hours',(select round((avg(extract(epoch from (delivered_at - created_at))) / 3600)::numeric, 1)
                            from public.orders where delivered_at >= m0),
    'customers',         (select count(*) from public.customers),
    'merchants',         (select count(*) from public.merchants),
    'suppliers',         (select count(*) from public.suppliers),
    'products',          (select count(*) from public.products),
    'pending_delegates', (select count(*) from public.profiles where role = 'pending'),
    'by_status',         (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                            from (select status, count(*) n from public.orders group by status) s)
  );
end $$;

-- إحصائيات المندوب نفسه
create or replace function public.delegate_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare m0 timestamptz := public.tripoli_month_start();
begin
  if not public.is_delegate() then return null; end if;
  return jsonb_build_object(
    'open_pool',        (select count(*) from public.orders where status = 'received' and delegate_id is null),
    'active',           (select count(*) from public.orders where delegate_id = auth.uid()
                            and status in ('searching','quoted','purchasing','shipping')),
    'delivered_month',  (select count(*) from public.orders where delegate_id = auth.uid()
                            and status = 'delivered' and delivered_at >= m0),
    'delivered_total',  (select count(*) from public.orders where delegate_id = auth.uid() and status = 'delivered'),
    'commission_month', (select coalesce(sum(delegate_commission), 0) from public.orders
                          where delegate_id = auth.uid() and status = 'delivered' and delivered_at >= m0)
  );
end $$;

-- ───────────────────────── الصلاحيات و RLS ─────────────────────────

alter table public.profiles     enable row level security;
alter table public.customers    enable row level security;
alter table public.merchants    enable row level security;
alter table public.suppliers    enable row level security;
alter table public.products     enable row level security;
alter table public.orders       enable row level security;
alter table public.order_events enable row level security;

-- الزائر لا يلمس الجداول/الـ views/التسلسلات مباشرة أبداً — كل شيء عبر الدوال
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from public, anon, authenticated;
revoke truncate, references, trigger on all tables in schema public from authenticated;
revoke all on public.delegate_open_orders, public.delegate_my_orders from public, anon, authenticated;
grant select on public.delegate_open_orders, public.delegate_my_orders to authenticated;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_admin_update on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
-- لا حذف للملفات من الواجهة: التعطيل بدل الحذف (الحذف يتم عبر auth.users)

-- customers / merchants: الإدارة فقط
create policy customers_admin on public.customers for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy merchants_admin on public.merchants for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- suppliers / products: الإدارة كل شيء، المندوب يقرأ النشط منها ليساعده في البحث
create policy suppliers_admin on public.suppliers for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy suppliers_delegate_read on public.suppliers for select to authenticated
  using ((select public.is_delegate()) and active);
create policy products_admin on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy products_delegate_read on public.products for select to authenticated
  using ((select public.is_delegate()) and active);

-- orders: الإدارة كل شيء، المندوب يرى ويعدّل طلباته فقط (الحارس يقيّد الأعمدة والانتقالات)
create policy orders_admin on public.orders for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy orders_delegate_select on public.orders for select to authenticated
  using ((select public.is_delegate()) and delegate_id = (select auth.uid()));
create policy orders_delegate_update on public.orders for update to authenticated
  using ((select public.is_delegate()) and delegate_id = (select auth.uid()))
  with check ((select public.is_delegate()) and delegate_id = (select auth.uid()));

-- order_events: الإدارة كل شيء، المندوب يقرأ أحداث طلباته ويضيف ملاحظات (الحارس يضبط الحقول)
create policy events_admin on public.order_events for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy events_delegate_select on public.order_events for select to authenticated
  using ((select public.is_delegate()) and exists (
    select 1 from public.orders o where o.id = order_id and o.delegate_id = (select auth.uid())));
create policy events_delegate_insert on public.order_events for insert to authenticated
  with check ((select public.is_delegate()) and exists (
    select 1 from public.orders o where o.id = order_id and o.delegate_id = (select auth.uid())));

-- الدوال: Supabase يمنح EXECUTE لـ anon/authenticated افتراضياً — نسحبه صراحةً ثم نمنح المطلوب فقط
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.submit_order(jsonb)                       to anon, authenticated;
grant execute on function public.get_order_status(text, text)              to anon, authenticated;
grant execute on function public.respond_to_quote(text, text, boolean)     to anon, authenticated;
grant execute on function public.public_stats()                            to anon, authenticated;
grant execute on function public.order_stage_idx(public.order_status)      to anon, authenticated;
grant execute on function public.order_status_label(public.order_status)   to anon, authenticated;
grant execute on function public.normalize_phone(text)                     to anon, authenticated;
grant execute on function public.is_admin()                                to authenticated;
grant execute on function public.is_delegate()                             to authenticated;
grant execute on function public.is_trusted_context()                      to anon, authenticated; -- تستدعيها المشغّلات بسياق المستخدم
grant execute on function public.claim_order(uuid)                         to authenticated;
grant execute on function public.set_order_status(uuid, public.order_status, text, numeric, numeric, numeric, text) to authenticated;
grant execute on function public.assign_order(uuid, uuid, text)            to authenticated;
grant execute on function public.admin_stats()                             to authenticated;
grant execute on function public.delegate_stats()                          to authenticated;
-- دوال المشغّلات والمساعدات الداخلية تبقى للمالك فقط (is_trusted_context, tripoli_*, next code...)

-- Realtime للوحة التحكم (RLS يُطبَّق على الاشتراكات)
alter publication supabase_realtime add table public.orders, public.order_events;

-- ───────────────────────── التخزين: صور المنتجات ─────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_public_read on storage.objects for select
  using (bucket_id = 'product-images');
create policy product_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin() and name like 'products/%');
create policy product_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
create policy product_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
