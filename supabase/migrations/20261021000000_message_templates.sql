-- الرسائل الجاهزة (واتساب): الإدارة تعدّل نصوصها من /admin/messages/، والمندوب يقرأها ليبعت نفس الرد الموحد للزبون.
-- الجدول يخزّن النصوص المعدّلة فقط؛ النصوص الأصلية في src/lib/wa-templates.js (حذف الصف = رجوع للنص الأصلي).

create table public.message_templates (
  key         text primary key check (key ~ '^[a-z_]{2,40}$'),
  body        text not null check (char_length(body) between 1 and 2000),
  updated_by  uuid references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create trigger message_templates_set_updated_at before update on public.message_templates
  for each row execute function public.set_updated_at();

alter table public.message_templates enable row level security;

-- Supabase يمنح الجداول الجديدة لـ anon/authenticated افتراضياً — نسحب ثم نمنح المطلوب فقط
revoke all on public.message_templates from public, anon, authenticated;
grant select, insert, update, delete on public.message_templates to authenticated;

create policy message_templates_admin on public.message_templates for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy message_templates_delegate_read on public.message_templates for select to authenticated
  using ((select public.is_delegate()));
