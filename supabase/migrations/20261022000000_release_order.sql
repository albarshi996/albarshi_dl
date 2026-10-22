-- المندوب يرجّع طلب حجزه وما يقدرش عليه — قبل عرض السعر فقط (بعده الإدارة تتصرّف).
-- الطلب يرجع للطلبات المتاحة («استلمنا طلبك»)، والسبب ينسجّل في سجل الطلب للإدارة (ما يظهرش للزبون).

create or replace function public.release_order(p_order_id uuid, p_reason text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_reason text := left(trim(coalesce(p_reason, '')), 300);
  v_status public.order_status;
begin
  if not public.is_delegate() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if char_length(v_reason) < 3 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  select status into v_status from public.orders
   where id = p_order_id and delegate_id = auth.uid()
   for update;
  if v_status is null then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if v_status not in ('received', 'searching') then
    raise exception 'cannot_release' using errcode = '22023';
  end if;
  -- حدث الحالة التلقائي (يظهر للزبون) يبقى بدون ملاحظة — السبب للإدارة فقط في حدث داخلي
  perform set_config('dawerli.event_note', '', true);
  update public.orders set delegate_id = null, status = 'received' where id = p_order_id;
  insert into public.order_events (order_id, kind, status, note, visible_to_customer, actor_id)
  values (p_order_id, 'unassign', 'received', 'المندوب رجّع الطلب: ' || v_reason, false, auth.uid());
  return true;
end $$;

revoke execute on function public.release_order(uuid, text) from public, anon, authenticated;
grant execute on function public.release_order(uuid, text) to authenticated;
