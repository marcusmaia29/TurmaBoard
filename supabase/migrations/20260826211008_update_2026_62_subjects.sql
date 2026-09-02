begin;
-- The original trigger tried to access OLD.deleted_at for every table. Links
-- and subjects do not have that column, so their DELETE operations failed.
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
revoke execute on function public.record_audit_log() from public, anon, authenticated;
-- Remove the demo deadlines before reusing the former DW and PI records.
-- Soft deletion keeps the audit trail and prevents incorrect deadlines from
-- being displayed under the new subjects.
update public.deliveries
set deleted_at = now()
where deleted_at is null
  and (
    subject_id in (
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444'
    )
    or source_url like 'https://example.com/%'
    or source_url like 'https://github.com/example/%'
  );
-- Remove only placeholder links. Real links created after the seed are kept.
delete from public.subject_links
where url like 'https://example.com/%'
   or url like 'https://github.com/example/%';
update public.subjects
set
  name = 'Algoritmos e Estruturas de Dados',
  code = 'AED',
  color = '#168C62',
  position = 1,
  notes = 'Professor: FÁBIO JOSÉ AYRES. Blackboard: 202662.GRCIECOMP_202262_011.ALGOESTRDADOS_4A.',
  official_url = null,
  platform_url = null,
  repository_url = null
where id = '33333333-3333-4333-8333-333333333333';
update public.subjects
set
  name = 'Linguagens e Paradigmas',
  code = 'LP',
  color = '#E68A0A',
  position = 2,
  notes = 'Vários instrutores. Blackboard: 202662.GRCIECOMP_202262_013.LINGUAEPARAD_4A.',
  official_url = null,
  platform_url = null,
  repository_url = null
where id = '22222222-2222-4222-8222-222222222222';
update public.subjects
set
  name = 'Machine Learning',
  code = 'ML',
  color = '#3578E5',
  position = 3,
  notes = 'Vários instrutores. Blackboard: 202662.GRCIECOMP_202262_012.MACHINELEARN_4A.',
  official_url = null,
  platform_url = null,
  repository_url = null
where id = '11111111-1111-4111-8111-111111111111';
update public.subjects
set
  name = 'Projeto de Software e Gestão Ágil',
  code = 'PSGA',
  color = '#D9435E',
  position = 4,
  notes = 'Professor: Eduardo Felipe Zambom Santana. Blackboard: 202662.GRCIECOMP_202262_015.PROJSOFTGESTAGIL_4A.',
  official_url = null,
  platform_url = null,
  repository_url = null
where id = '44444444-4444-4444-8444-444444444444';
insert into public.subjects (id, name, code, color, position, notes)
values
  (
    '55555555-5555-4555-8555-555555555555',
    'Sessão Sprint 4',
    'SP4',
    '#7C5CE7',
    5,
    'Vários instrutores. Blackboard: 202662.GRCIECOMP_202262_016.SESSAOSPRINT4_4A.'
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'Sistemas Hardware-Software',
    'SHS',
    '#008A9A',
    6,
    'Blackboard: 202662.GRCIECOMP_202262_014.SISTHARDSOFT_4A.'
  );
-- This real SHS handout had previously been saved under the demo PI subject.
update public.subject_links
set subject_id = '66666666-6666-4666-8666-666666666666',
    position = 1
where subject_id = '44444444-4444-4444-8444-444444444444'
  and url = 'https://insper.github.io/SistemasHardwareSoftwareBCC/';
commit;
