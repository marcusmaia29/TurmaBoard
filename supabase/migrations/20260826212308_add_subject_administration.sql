begin;

alter table public.subjects
  add column archived_at timestamptz;

alter table public.subjects
  add constraint subjects_name_length check (char_length(trim(name)) between 1 and 120),
  add constraint subjects_code_length check (char_length(trim(code)) between 1 and 8);

create index subjects_active_position_idx
on public.subjects(position)
where archived_at is null;

drop policy if exists subjects_public_read on public.subjects;
drop policy if exists subject_links_public_read on public.subject_links;
drop policy if exists deliveries_anon_read on public.deliveries;
drop policy if exists deliveries_authenticated_read on public.deliveries;

create policy subjects_anon_read
on public.subjects for select
to anon
using (archived_at is null);

create policy subjects_authenticated_read
on public.subjects for select
to authenticated
using (archived_at is null or (select private.is_admin()));

create policy subject_links_anon_read
on public.subject_links for select
to anon
using (
  exists (
    select 1 from public.subjects
    where subjects.id = subject_links.subject_id
      and subjects.archived_at is null
  )
);

create policy subject_links_authenticated_read
on public.subject_links for select
to authenticated
using (
  exists (
    select 1 from public.subjects
    where subjects.id = subject_links.subject_id
      and subjects.archived_at is null
  )
  or (select private.is_admin())
);

create policy deliveries_anon_read
on public.deliveries for select
to anon
using (
  deleted_at is null
  and exists (
    select 1 from public.subjects
    where subjects.id = deliveries.subject_id
      and subjects.archived_at is null
  )
);

create policy deliveries_authenticated_read
on public.deliveries for select
to authenticated
using (
  (
    deleted_at is null
    and exists (
      select 1 from public.subjects
      where subjects.id = deliveries.subject_id
        and subjects.archived_at is null
    )
  )
  or (select private.is_admin())
);

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
  elsif (
    (tg_table_name = 'deliveries'
      and (to_jsonb(old) ->> 'deleted_at') is null
      and (to_jsonb(new) ->> 'deleted_at') is not null)
    or
    (tg_table_name = 'subjects'
      and (to_jsonb(old) ->> 'archived_at') is null
      and (to_jsonb(new) ->> 'archived_at') is not null)
  ) then
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

create or replace function public.reorder_subjects(subject_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  active_count integer;
  provided_count integer := coalesce(array_length(subject_ids, 1), 0);
  matching_count integer;
  distinct_count integer;
begin
  if not (select private.is_admin()) then
    raise exception 'Permissão administrativa necessária.' using errcode = '42501';
  end if;

  select count(*) into active_count
  from public.subjects
  where archived_at is null;

  select count(distinct id) into distinct_count
  from unnest(subject_ids) as items(id);

  select count(*) into matching_count
  from public.subjects
  where archived_at is null and id = any(subject_ids);

  if provided_count <> active_count
    or distinct_count <> provided_count
    or matching_count <> active_count then
    raise exception 'A lista deve conter todas as disciplinas ativas uma única vez.' using errcode = '22023';
  end if;

  update public.subjects
  set position = ordered.position::integer
  from unnest(subject_ids) with ordinality as ordered(id, position)
  where subjects.id = ordered.id;
end;
$$;

revoke execute on function public.reorder_subjects(uuid[]) from public, anon;
grant execute on function public.reorder_subjects(uuid[]) to authenticated;

commit;
