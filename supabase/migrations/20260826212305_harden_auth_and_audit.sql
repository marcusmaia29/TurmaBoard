begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
alter table public.profiles alter column role set default 'member';
alter table public.profiles alter column display_name set default 'Membro TurmaBoard';
create or replace function private.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Membro TurmaBoard'),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function private.create_profile_for_user() from public, anon, authenticated;
drop trigger if exists auth_user_created on auth.users;
create trigger auth_user_created
after insert on auth.users
for each row execute function private.create_profile_for_user();
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;
alter table public.deliveries
  add column created_by_name text not null default 'Admin TurmaBoard',
  add column updated_by_name text not null default 'Admin TurmaBoard';
alter table public.deliveries disable trigger deliveries_record_audit;
update public.deliveries
set
  created_by_name = coalesce(
    (select display_name from public.profiles where id = public.deliveries.created_by),
    'Admin TurmaBoard'
  ),
  updated_by_name = coalesce(
    (select display_name from public.profiles where id = public.deliveries.updated_by),
    'Admin TurmaBoard'
  );
alter table public.deliveries enable trigger deliveries_record_audit;
create or replace function private.set_delivery_actor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_display_name text;
begin
  if actor_id is not null then
    select display_name
    into actor_display_name
    from public.profiles
    where id = actor_id;

    actor_display_name := coalesce(actor_display_name, 'Membro TurmaBoard');

    if tg_op = 'INSERT' then
      new.created_by := actor_id;
      new.created_by_name := actor_display_name;
    end if;

    new.updated_by := actor_id;
    new.updated_by_name := actor_display_name;
  end if;

  return new;
end;
$$;
revoke execute on function private.set_delivery_actor() from public, anon, authenticated;
create trigger deliveries_set_actor
before insert or update on public.deliveries
for each row execute function private.set_delivery_actor();
create or replace function private.record_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  record_id uuid;
  record_title text;
  audit_action public.audit_action;
  audit_summary text;
  audit_actor_id uuid := auth.uid();
  audit_actor_name text;
begin
  record_id := coalesce(new.id, old.id);

  if tg_op = 'INSERT' then
    audit_action := 'created';
  elsif tg_op = 'DELETE' then
    audit_action := 'deleted';
  elsif tg_table_name = 'deliveries'
    and (to_jsonb(old) ->> 'deleted_at') is null
    and (to_jsonb(new) ->> 'deleted_at') is not null then
    audit_action := 'deleted';
  else
    audit_action := 'updated';
  end if;

  if tg_table_name = 'deliveries' then
    record_title := coalesce(new.title, old.title);
  elsif tg_table_name = 'subjects' then
    record_title := coalesce(new.name, old.name);
  else
    record_title := coalesce(new.label, old.label);
  end if;

  audit_summary := case audit_action
    when 'created' then 'adicionou “' || record_title || '”'
    when 'updated' then 'atualizou “' || record_title || '”'
    when 'deleted' then 'removeu “' || record_title || '”'
  end;

  select display_name
  into audit_actor_name
  from public.profiles
  where id = audit_actor_id;

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    summary,
    before_state,
    after_state,
    actor_id,
    actor_name
  ) values (
    tg_table_name,
    record_id,
    audit_action,
    audit_summary,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    audit_actor_id,
    coalesce(audit_actor_name, 'Sistema TurmaBoard')
  );

  return coalesce(new, old);
end;
$$;
revoke execute on function private.record_audit_log() from public, anon, authenticated;
drop trigger if exists deliveries_record_audit on public.deliveries;
drop trigger if exists subjects_record_audit on public.subjects;
drop trigger if exists subject_links_record_audit on public.subject_links;
create trigger deliveries_record_audit
after insert or update or delete on public.deliveries
for each row execute function private.record_audit_log();
create trigger subjects_record_audit
after insert or update or delete on public.subjects
for each row execute function private.record_audit_log();
create trigger subject_links_record_audit
after insert or update or delete on public.subject_links
for each row execute function private.record_audit_log();
drop policy if exists subjects_admin_write on public.subjects;
drop policy if exists subject_links_admin_write on public.subject_links;
drop policy if exists deliveries_public_read on public.deliveries;
drop policy if exists deliveries_admin_write on public.deliveries;
create policy subjects_admin_insert
on public.subjects for insert
to authenticated
with check ((select private.is_admin()));
create policy subjects_admin_update
on public.subjects for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy subjects_admin_delete
on public.subjects for delete
to authenticated
using ((select private.is_admin()));
create policy subject_links_admin_insert
on public.subject_links for insert
to authenticated
with check ((select private.is_admin()));
create policy subject_links_admin_update
on public.subject_links for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy subject_links_admin_delete
on public.subject_links for delete
to authenticated
using ((select private.is_admin()));
create policy deliveries_anon_read
on public.deliveries for select
to anon
using (deleted_at is null);
create policy deliveries_authenticated_read
on public.deliveries for select
to authenticated
using (deleted_at is null or (select private.is_admin()));
create policy deliveries_admin_insert
on public.deliveries for insert
to authenticated
with check ((select private.is_admin()));
create policy deliveries_admin_update
on public.deliveries for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy deliveries_admin_delete
on public.deliveries for delete
to authenticated
using ((select private.is_admin()));
drop function if exists public.create_profile_for_user();
drop function if exists public.record_audit_log();
drop function if exists public.is_admin();
commit;
