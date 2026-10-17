-- اختبار دخاني لصلاحيات RLS — يُنفَّذ على القاعدة المحلية بعد db reset (مع seed.sql).
-- التشغيل:
--   npx supabase db reset
--   docker exec -i supabase_db_<project> psql -U postgres -d postgres -v ON_ERROR_STOP=0 < supabase/tests/rls_smoke.sql
-- كل سطر نتيجة يبدأ بـ OK أو FAIL. لا يُفترض ظهور أي ERROR خام.
\set QUIET on
\pset format unaligned
\pset tuples_only on

-- دالة مؤقتة: تنفّذ SQL بصلاحيات المستدعي وتُرجع 'ERR <msg>' أو 'ROWS <n>'
create or replace function pg_temp.try(sql text) returns text language plpgsql as $$
declare n int;
begin
  execute sql;
  get diagnostics n = row_count;
  return 'ROWS ' || n;
exception when others then
  return 'ERR ' || sqlerrm;
end $$;
grant execute on function pg_temp.try(text) to public;

create or replace function pg_temp.expect(label text, got text, want text) returns text language sql as $$
  select case when got like want then 'OK   ' || label else 'FAIL ' || label || ' → got [' || got || '] want [' || want || ']' end
$$;
grant execute on function pg_temp.expect(text, text, text) to public;

\echo '=== 0. السياق الموثوق (SQL Editor)'
update public.profiles set role = 'admin' where id = '33333333-3333-3333-3333-333333333333';
select pg_temp.expect('trusted context changes roles', (select role from public.profiles where id = '33333333-3333-3333-3333-333333333333'), 'admin');
update public.profiles set role = 'pending' where id = '33333333-3333-3333-3333-333333333333';

\echo '=== 1. anon'
set role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', false);
select pg_temp.expect('anon cannot read orders',     pg_temp.try('select count(*) from public.orders'),    'ERR permission denied%');
select pg_temp.expect('anon cannot read customers',  pg_temp.try('select count(*) from public.customers'), 'ERR permission denied%');
select pg_temp.expect('anon cannot read pool view',  pg_temp.try('select * from public.delegate_open_orders'), 'ERR permission denied%');
select pg_temp.expect('anon cannot claim',           pg_temp.try('select public.claim_order(gen_random_uuid())'), 'ERR permission denied%');
select pg_temp.expect('anon cannot admin_stats',     pg_temp.try('select public.admin_stats()'), 'ERR permission denied%');
select pg_temp.expect('anon cannot burn sequence',   pg_temp.try('select nextval(''public.order_code_seq'')'), 'ERR permission denied%');
select pg_temp.expect('submit_order works', (public.submit_order('{"name":"زبون اختبار","phone":"+218 91 234 5678","city":"بنغازي","category":"إلكترونيات","details":"شاحن","quantity":"2","urgency":"عاجل"}'))->>'code', 'DW-%');
select pg_temp.expect('submit_order rejects non-Libyan phone', pg_temp.try('select public.submit_order(''{"name":"x y","phone":"0711111111","city":"بنغازي","category":"أخرى"}'')'), 'ERR invalid_phone');
select pg_temp.expect('submit_order tolerates bad quantity', (public.submit_order('{"name":"زبون ثاني","phone":"0922334455","city":"طرابلس","category":"أخرى","quantity":"abc"}'))->>'code', 'DW-%');
select pg_temp.expect('status without phone hides price', coalesce((public.get_order_status('dw-2026-1004'))->>'quoted_price', 'hidden'), 'hidden');
select pg_temp.expect('status with phone shows price', (public.get_order_status('DW-2026-1004', '0924444444'))->>'quoted_price', '420%');
select pg_temp.expect('status tolerates missing DW- prefix', (public.get_order_status('2026-1004'))->>'code', 'DW-2026-1004');
select pg_temp.expect('cancelled → stage -1', (public.get_order_status('DW-2026-1008'))->>'stage_idx', '-1');
select pg_temp.expect('unknown code → null', coalesce((public.get_order_status('DW-1999-1'))::text, 'null'), 'null');
select pg_temp.expect('respond_to_quote', public.respond_to_quote('DW-2026-1004', '0924444444', true)::text, 'true');
select pg_temp.expect('respond_to_quote wrong phone', public.respond_to_quote('DW-2026-1004', '0900000000', true)::text, 'false');
reset role; select set_config('request.jwt.claims', '', false);
select pg_temp.expect('quote response stored', (select quote_response from public.orders where code = 'DW-2026-1004'), 'accepted');
select pg_temp.expect('phone normalized +218→0 & urgency kept', (select customer_phone || '/' || urgency from public.orders where customer_name = 'زبون اختبار'), '0912345678/عاجل');
select pg_temp.expect('customer auto-created', (select count(*)::text from public.customers where phone = '0912345678'), '1');

\echo '=== 2. pending'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', false);
select pg_temp.expect('pending sees no orders', (select count(*)::text from public.orders), '0');
select pg_temp.expect('pending sees no pool',   (select count(*)::text from public.delegate_open_orders), '0');
select pg_temp.expect('pending cannot promote self', pg_temp.try('update public.profiles set role = ''admin'' where id = ''33333333-3333-3333-3333-333333333333'''), 'ERR not_allowed');
select pg_temp.expect('pending can edit own name', pg_temp.try('update public.profiles set full_name = ''علي المعدّل'' where id = ''33333333-3333-3333-3333-333333333333'''), 'ROWS 1');
reset role; select set_config('request.jwt.claims', '', false);

\echo '=== 3. delegate'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', false);
select pg_temp.expect('pool visible (unassigned received)', (select (count(*) >= 3)::text from public.delegate_open_orders), 'true');
select pg_temp.expect('pool has no customer columns', (select count(*)::text from information_schema.columns where table_name = 'delegate_open_orders' and column_name in ('customer_name','customer_phone')), '0');
select pg_temp.expect('cannot delete via pool view', pg_temp.try('delete from public.delegate_open_orders'), 'ERR permission denied%');
select pg_temp.expect('cannot update via pool view', pg_temp.try('update public.delegate_open_orders set city = ''x'''), 'ERR permission denied%');
select pg_temp.expect('sees only own orders (4 in seed)', (select count(*)::text from public.orders), '4');
select pg_temp.expect('my_orders view hides internal_notes', (select count(*)::text from information_schema.columns where table_name = 'delegate_my_orders' and column_name = 'internal_notes'), '0');
select pg_temp.expect('claim via pool id', public.claim_order((select id from public.delegate_open_orders where code = 'DW-2026-1002'))::text, 'true');
select pg_temp.expect('claim twice → false', public.claim_order((select id from public.orders where code = 'DW-2026-1002'))::text, 'false');
select pg_temp.expect('phone visible after claim', (select customer_phone from public.orders where code = 'DW-2026-1002'), '0922222223');
select pg_temp.expect('assign event logged internal', (select count(*)::text from public.order_events e join public.orders o on o.id = e.order_id where o.code = 'DW-2026-1002' and e.kind = 'assign' and not e.visible_to_customer), '1');
select pg_temp.expect('cannot edit customer phone', pg_temp.try('update public.orders set customer_phone = ''0900000000'' where code = ''DW-2026-1002'''), 'ERR not_allowed');
select pg_temp.expect('cannot cancel',             pg_temp.try('update public.orders set status = ''cancelled'' where code = ''DW-2026-1002'''), 'ERR not_allowed');
select pg_temp.expect('cannot go backwards',       pg_temp.try('update public.orders set status = ''purchasing'' where code = ''DW-2026-1005'''), 'ERR not_allowed');
select pg_temp.expect('cannot unassign self',      pg_temp.try('update public.orders set delegate_id = null where code = ''DW-2026-1002'''), 'ERR not_allowed');
select pg_temp.expect('cannot touch delivered',    pg_temp.try('update public.orders set service_fee = 999 where code = ''DW-2026-1006'''), 'ERR not_allowed');
select pg_temp.expect('cannot set own commission', pg_temp.try('update public.orders set delegate_commission = 500 where code = ''DW-2026-1002'''), 'ERR not_allowed');
select pg_temp.expect('cannot read internal_notes via update trick', pg_temp.try('update public.orders set internal_notes = ''x'' where code = ''DW-2026-1002'''), 'ERR not_allowed');
select pg_temp.expect('forward step via set_order_status', (public.set_order_status((select id from public.orders where code = 'DW-2026-1002'), 'quoted', 'لقينا الكريم بـ 85 د.ل', 85, 20, null)).status::text, 'quoted');
select pg_temp.expect('exactly one quoted event with note', (select count(*)::text from public.order_events e join public.orders o on o.id = e.order_id where o.code = 'DW-2026-1002' and e.status = 'quoted' and e.note is not null), '1');
select pg_temp.expect('total auto 85+20', (select total::text from public.orders where code = 'DW-2026-1002'), '105%');
select pg_temp.expect('quoted_at stamped', (select (quoted_at is not null)::text from public.orders where code = 'DW-2026-1002'), 'true');
select public.set_order_status((select id from public.orders where code = 'DW-2026-1002'), 'quoted', 'ملاحظة إضافية');
select pg_temp.expect('note without status change → note event', (select kind from public.order_events where note = 'ملاحظة إضافية'), 'note');
select pg_temp.expect('skip quoted → shipping blocked', pg_temp.try('select public.set_order_status((select id from public.orders where code = ''DW-2026-1002''), ''shipping'')'), 'ERR not_allowed');
select pg_temp.expect('forged event insert accepted (then neutralized)', pg_temp.try('insert into public.order_events (order_id, kind, status, note, created_at) select id, ''status'', ''delivered'', ''fake'', ''2020-01-01'' from public.orders where code = ''DW-2026-1002'''), 'ROWS 1');
select pg_temp.expect('forged event neutralized', (select kind || '/' || status || '/' || (created_at > now() - interval '1 minute')::text from public.order_events where note = 'fake'), 'note/quoted/true');
select pg_temp.expect('event on someone else''s order blocked', pg_temp.try('insert into public.order_events (order_id, kind, status, note) select id, ''note'', ''received'', ''x'' from public.delegate_open_orders limit 1'), 'ERR %');
select pg_temp.expect('empty note blocked', pg_temp.try('insert into public.order_events (order_id, status, note) select id, status, ''  '' from public.orders where code = ''DW-2026-1002'''), 'ERR not_allowed');
select pg_temp.expect('admin_stats null for delegate', coalesce(public.admin_stats()::text, 'null'), 'null');
select pg_temp.expect('delegate_stats works', (public.delegate_stats())->>'active', '%');
select pg_temp.expect('5th active claim allowed', public.claim_order((select id from public.delegate_open_orders order by created_at limit 1))::text, 'true');
select pg_temp.expect('claim cap at 5 active', pg_temp.try('select public.claim_order((select id from public.delegate_open_orders limit 1))'), 'ERR too_many_active');
reset role; select set_config('request.jwt.claims', '', false);

\echo '=== 4. admin'
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', false);
select pg_temp.expect('admin sees all orders', (select (count(*) >= 10)::text from public.orders), 'true');
select pg_temp.expect('assign flips received→searching', (public.assign_order((select id from public.orders where code = 'DW-2026-1001'), '22222222-2222-2222-2222-222222222222', null)).status::text, 'searching');
select pg_temp.expect('assigned_at stamped', (select (assigned_at is not null)::text from public.orders where code = 'DW-2026-1001'), 'true');
select pg_temp.expect('unassign flips back to received', (public.assign_order((select id from public.orders where code = 'DW-2026-1001'), null, 'إعادة للمتاح')).status::text, 'received');
select pg_temp.expect('assign to pending user blocked', pg_temp.try('select public.assign_order((select id from public.orders where code = ''DW-2026-1001''), ''33333333-3333-3333-3333-333333333333'')'), 'ERR invalid_delegate');
select pg_temp.expect('admin cancel with reason stamped', (public.set_order_status((select id from public.orders where code = 'DW-2026-1001'), 'cancelled', 'الزبون غيّر رأيه', null, null, null, 'طلب الزبون')).cancelled_at::text, '2%');
select pg_temp.expect('admin can reopen cancelled', (public.set_order_status((select id from public.orders where code = 'DW-2026-1001'), 'received')).status::text, 'received');
select pg_temp.expect('admin_stats works', (public.admin_stats())->>'open', '%');
select pg_temp.expect('admin direct update any column', pg_temp.try('update public.orders set internal_notes = ''ملاحظة داخلية'' where code = ''DW-2026-1003'''), 'ROWS 1');
select pg_temp.expect('cannot remove last admin', pg_temp.try('update public.profiles set role = ''delegate'' where id = ''11111111-1111-1111-1111-111111111111'''), 'ERR last_admin');
update public.profiles set role = 'delegate' where id = '33333333-3333-3333-3333-333333333333';
select pg_temp.expect('approve stamps approved_at', (select (approved_at is not null and role = 'delegate')::text from public.profiles where id = '33333333-3333-3333-3333-333333333333'), 'true');
select pg_temp.expect('no profile delete policy', pg_temp.try('delete from public.profiles where id = ''33333333-3333-3333-3333-333333333333'''), 'ROWS 0');
select pg_temp.expect('admin reads profiles with email', (select email from public.profiles where id = '22222222-2222-2222-2222-222222222222'), 'delegate@dawerli.local');
reset role; select set_config('request.jwt.claims', '', false);

\echo '=== انتهى الاختبار'
