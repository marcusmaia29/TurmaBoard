begin;

create type public.lesson_note_format as enum ('markdown', 'latex');

create table public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 160),
  occurred_at timestamptz not null,
  content_format public.lesson_note_format not null,
  content text not null check (char_length(content) between 1 and 50000),
  created_by uuid references public.profiles(id) on delete set null,
  created_by_name text not null default 'Admin TurmaBoard',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_by_name text not null default 'Admin TurmaBoard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.lesson_note_images (
  id uuid primary key default gen_random_uuid(),
  lesson_note_id uuid not null references public.lesson_notes(id) on delete cascade,
  storage_path text not null check (
    storage_path ~ ('^' || lesson_note_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$')
  ),
  original_name text not null check (char_length(trim(original_name)) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  alt_text text not null check (char_length(trim(alt_text)) between 1 and 200),
  caption text check (caption is null or char_length(caption) <= 300),
  position smallint not null default 0 check (position between 0 and 7),
  created_at timestamptz not null default now(),
  check (
    (mime_type = 'image/jpeg' and storage_path ~ '\.jpg$') or
    (mime_type = 'image/png' and storage_path ~ '\.png$') or
    (mime_type = 'image/webp' and storage_path ~ '\.webp$')
  ),
  unique (lesson_note_id, storage_path)
);

create index lesson_notes_subject_occurred_at_idx
on public.lesson_notes(subject_id, occurred_at desc)
where deleted_at is null;

create index lesson_notes_occurred_at_idx
on public.lesson_notes(occurred_at desc)
where deleted_at is null;

create index lesson_note_images_note_position_idx
on public.lesson_note_images(lesson_note_id, position);

create trigger lesson_notes_set_updated_at
before update on public.lesson_notes
for each row execute function public.set_updated_at();

create or replace function private.set_lesson_note_actor()
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
    select display_name into actor_display_name
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

revoke execute on function private.set_lesson_note_actor() from public, anon, authenticated;

create trigger lesson_notes_set_actor
before insert or update on public.lesson_notes
for each row execute function private.set_lesson_note_actor();

create or replace function private.enforce_lesson_note_image_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.lesson_note_id::text, 0));
  if (
    select count(*) >= 8
    from public.lesson_note_images
    where lesson_note_id = new.lesson_note_id and id <> new.id
  ) then
    raise exception 'Uma anotação aceita no máximo oito imagens.' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke execute on function private.enforce_lesson_note_image_limit() from public, anon, authenticated;

create trigger lesson_note_images_enforce_limit
before insert or update of lesson_note_id on public.lesson_note_images
for each row execute function private.enforce_lesson_note_image_limit();

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
    (tg_table_name in ('deliveries', 'lesson_notes')
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

  if tg_table_name in ('deliveries', 'lesson_notes') then
    record_title := coalesce(new.title, old.title);
  elsif tg_table_name = 'subjects' then
    record_title := coalesce(new.name, old.name);
  elsif tg_table_name = 'lesson_note_images' then
    record_title := coalesce(new.original_name, old.original_name);
  else
    record_title := coalesce(new.label, old.label);
  end if;

  audit_summary := case audit_action
    when 'created' then 'adicionou “' || record_title || '”'
    when 'updated' then 'atualizou “' || record_title || '”'
    when 'deleted' then 'removeu “' || record_title || '”'
  end;

  select display_name into audit_actor_name
  from public.profiles
  where id = audit_actor_id;

  insert into public.audit_log (
    entity_type, entity_id, action, summary, before_state, after_state, actor_id, actor_name
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

create trigger lesson_notes_record_audit
after insert or update or delete on public.lesson_notes
for each row execute function private.record_audit_log();

create trigger lesson_note_images_record_audit
after insert or update or delete on public.lesson_note_images
for each row execute function private.record_audit_log();

alter table public.lesson_notes enable row level security;
alter table public.lesson_note_images enable row level security;

create policy lesson_notes_anon_read
on public.lesson_notes for select to anon
using (
  deleted_at is null and exists (
    select 1 from public.subjects
    where subjects.id = lesson_notes.subject_id and subjects.archived_at is null
  )
);

create policy lesson_notes_authenticated_read
on public.lesson_notes for select to authenticated
using (
  (deleted_at is null and exists (
    select 1 from public.subjects
    where subjects.id = lesson_notes.subject_id and subjects.archived_at is null
  )) or (select private.is_admin())
);

create policy lesson_notes_admin_insert
on public.lesson_notes for insert to authenticated
with check ((select private.is_admin()));

create policy lesson_notes_admin_update
on public.lesson_notes for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy lesson_notes_admin_delete
on public.lesson_notes for delete to authenticated
using ((select private.is_admin()));

create policy lesson_note_images_anon_read
on public.lesson_note_images for select to anon
using (
  exists (
    select 1 from public.lesson_notes
    join public.subjects on subjects.id = lesson_notes.subject_id
    where lesson_notes.id = lesson_note_images.lesson_note_id
      and lesson_notes.deleted_at is null
      and subjects.archived_at is null
  )
);

create policy lesson_note_images_authenticated_read
on public.lesson_note_images for select to authenticated
using (
  exists (
    select 1 from public.lesson_notes
    join public.subjects on subjects.id = lesson_notes.subject_id
    where lesson_notes.id = lesson_note_images.lesson_note_id
      and lesson_notes.deleted_at is null
      and subjects.archived_at is null
  ) or (select private.is_admin())
);

create policy lesson_note_images_admin_insert
on public.lesson_note_images for insert to authenticated
with check ((select private.is_admin()));

create policy lesson_note_images_admin_update
on public.lesson_note_images for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy lesson_note_images_admin_delete
on public.lesson_note_images for delete to authenticated
using ((select private.is_admin()));

create policy lesson_note_storage_admin_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'lesson-note-images' and (select private.is_admin()));

create policy lesson_note_storage_admin_delete
on storage.objects for delete to authenticated
using (bucket_id = 'lesson-note-images' and (select private.is_admin()));

grant select on public.lesson_notes, public.lesson_note_images to anon;
grant select, insert, update, delete on public.lesson_notes, public.lesson_note_images to authenticated;

alter publication supabase_realtime add table public.lesson_notes;
alter publication supabase_realtime add table public.lesson_note_images;

commit;
