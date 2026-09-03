insert into public.subjects (id, name, code, color, position, notes, official_url, platform_url, repository_url)
values
  (
    '33333333-3333-4333-8333-333333333333',
    'Algoritmos e Estruturas de Dados',
    'AED',
    '#14B8A6',
    1,
    'Professor: FÁBIO JOSÉ AYRES. Blackboard: 202662.GRCIECOMP_202262_011.ALGOESTRDADOS_4A.',
    null,
    null,
    null
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Linguagens e Paradigmas',
    'LP',
    '#F97316',
    2,
    'Vários instrutores. Blackboard: 202662.GRCIECOMP_202262_013.LINGUAEPARAD_4A.',
    null,
    null,
    null
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    'Machine Learning',
    'ML',
    '#16A344',
    3,
    'Vários instrutores. Blackboard: 202662.GRCIECOMP_202262_012.MACHINELEARN_4A.',
    null,
    null,
    null
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Projeto de Software e Gestão Ágil',
    'PSGA',
    '#D946A1',
    4,
    'Professor: Eduardo Felipe Zambom Santana. Blackboard: 202662.GRCIECOMP_202262_015.PROJSOFTGESTAGIL_4A.',
    null,
    null,
    null
  ),
  (
    '55555555-5555-4555-8555-555555555555',
    'Sessão Sprint 4',
    'SP4',
    '#4C6BFF',
    5,
    'Vários instrutores. Blackboard: 202662.GRCIECOMP_202262_016.SESSAOSPRINT4_4A.',
    null,
    null,
    null
  ),
  (
    '66666666-6666-4666-8666-666666666666',
    'Sistemas Hardware-Software',
    'SHS',
    '#EAB308',
    6,
    'Blackboard: 202662.GRCIECOMP_202262_014.SISTHARDSOFT_4A.',
    null,
    null,
    null
  )
on conflict (id) do update
set
  name = excluded.name,
  code = excluded.code,
  color = excluded.color,
  position = excluded.position,
  notes = excluded.notes,
  official_url = excluded.official_url,
  platform_url = excluded.platform_url,
  repository_url = excluded.repository_url;

insert into public.subject_links (id, subject_id, label, url, position)
values (
  '1c6c0327-3fdc-4aef-ae22-04a8fb13ba08',
  '66666666-6666-4666-8666-666666666666',
  'Handout',
  'https://insper.github.io/SistemasHardwareSoftwareBCC/',
  1
)
on conflict (id) do update
set
  subject_id = excluded.subject_id,
  label = excluded.label,
  url = excluded.url,
  position = excluded.position;
