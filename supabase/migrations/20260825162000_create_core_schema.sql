create extension if not exists pgcrypto;

create type public.user_role as enum ('admin');
create type public.delivery_type as enum ('quiz', 'exam', 'aps', 'project', 'activity', 'notice');
create type public.delivery_status as enum ('active', 'cancelled');
create type public.audit_action as enum ('created', 'updated', 'deleted');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Admin TurmaBoard',
  role public.user_role not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position integer not null default 0,
  notes text not null default '',
  official_url text,
  platform_url text,
  repository_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subject_links (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  label text not null,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  type public.delivery_type not null,
  description text not null default '',
  due_at timestamptz not null,
  source_url text,
  status public.delivery_status not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  entity_type text not null,
  entity_id uuid not null,
  action public.audit_action not null,
  summary text not null,
  before_state jsonb,
  after_state jsonb,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default 'Admin TurmaBoard',
  created_at timestamptz not null default now()
);

create index deliveries_due_at_idx on public.deliveries(due_at) where deleted_at is null;
create index deliveries_subject_id_idx on public.deliveries(subject_id) where deleted_at is null;
create index deliveries_deleted_at_idx on public.deliveries(deleted_at);
create index subject_links_subject_id_idx on public.subject_links(subject_id, position);
create index audit_log_created_at_idx on public.audit_log(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

create trigger subject_links_set_updated_at
before update on public.subject_links
for each row execute function public.set_updated_at();

create trigger deliveries_set_updated_at
before update on public.deliveries
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, 'Admin TurmaBoard', 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_user();

create or replace function public.is_admin()
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

create or replace function public.record_audit_log()
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
begin
  record_id := coalesce(new.id, old.id);

  if tg_op = 'INSERT' then
    audit_action := 'created';
  elsif tg_op = 'DELETE' or (tg_table_name = 'deliveries' and old.deleted_at is null and new.deleted_at is not null) then
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

  insert into public.audit_log (
    entity_type,
    entity_id,
    action,
    summary,
    before_state,
    after_state,
    actor_id
  ) values (
    tg_table_name,
    record_id,
    audit_action,
    audit_summary,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    auth.uid()
  );

  return coalesce(new, old);
end;
$$;

create trigger deliveries_record_audit
after insert or update or delete on public.deliveries
for each row execute function public.record_audit_log();

create trigger subjects_record_audit
after insert or update or delete on public.subjects
for each row execute function public.record_audit_log();

create trigger subject_links_record_audit
after insert or update or delete on public.subject_links
for each row execute function public.record_audit_log();

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.subject_links enable row level security;
alter table public.deliveries enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_read_own
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy subjects_public_read
on public.subjects for select
to anon, authenticated
using (true);

create policy subjects_admin_write
on public.subjects for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy subject_links_public_read
on public.subject_links for select
to anon, authenticated
using (true);

create policy subject_links_admin_write
on public.subject_links for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy deliveries_public_read
on public.deliveries for select
to anon, authenticated
using (deleted_at is null or (select public.is_admin()));

create policy deliveries_admin_write
on public.deliveries for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy audit_log_public_read
on public.audit_log for select
to anon, authenticated
using (true);

revoke all on public.profiles from anon;
grant select on public.profiles to authenticated;

grant select on public.subjects, public.subject_links, public.deliveries, public.audit_log to anon;
grant select, insert, update, delete on public.subjects, public.subject_links, public.deliveries to authenticated;
grant select on public.audit_log to authenticated;
grant usage, select on sequence public.audit_log_id_seq to authenticated;
grant execute on function public.is_admin() to authenticated;

alter publication supabase_realtime add table public.subjects;
alter publication supabase_realtime add table public.subject_links;
alter publication supabase_realtime add table public.deliveries;
alter publication supabase_realtime add table public.audit_log;
