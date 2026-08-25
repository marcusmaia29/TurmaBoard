insert into public.subjects (id, name, code, color, position, notes, official_url, platform_url, repository_url)
values
  ('11111111-1111-4111-8111-111111111111', 'Machine Learning', 'ML', '#3578E5', 1, 'Acompanhar os notebooks e os prazos publicados no ambiente da disciplina.', 'https://example.com/ml', 'https://example.com/ml/classes', 'https://github.com/example/ml'),
  ('22222222-2222-4222-8222-222222222222', 'Linguagens e Paradigmas', 'LP', '#E68A0A', 2, 'Materiais práticos e listas são atualizados semanalmente.', 'https://example.com/lp', 'https://example.com/lp/classes', null),
  ('33333333-3333-4333-8333-333333333333', 'Desenvolvimento Web', 'DW', '#168C62', 3, 'O repositório concentra exemplos de aula e entregas das APS.', 'https://example.com/dw', 'https://example.com/dw/classes', 'https://github.com/example/dw'),
  ('44444444-4444-4444-8444-444444444444', 'Projeto Integrador', 'PI', '#D9435E', 4, 'Registrar decisões e manter o roteiro das apresentações atualizado.', 'https://example.com/pi', null, 'https://github.com/example/pi')
on conflict (id) do nothing;

insert into public.subject_links (subject_id, label, url, position)
values
  ('11111111-1111-4111-8111-111111111111', 'Notebooks da disciplina', 'https://example.com/ml/notebooks', 1),
  ('33333333-3333-4333-8333-333333333333', 'Documentação da API', 'https://example.com/dw/api', 1),
  ('44444444-4444-4444-8444-444444444444', 'Roteiro da apresentação', 'https://example.com/pi/demo', 1);

insert into public.deliveries (subject_id, title, type, description, due_at, source_url)
values
  ('11111111-1111-4111-8111-111111111111', 'Quiz 02 — Regressão linear', 'quiz', 'Conteúdo das aulas 03 e 04. Duas tentativas disponíveis.', '2026-08-25 23:59:00-03', 'https://example.com/ml/quiz-02'),
  ('11111111-1111-4111-8111-111111111111', 'Checkpoint do projeto', 'project', 'Enviar notebook com preparação dos dados e primeira análise.', '2026-08-27 18:00:00-03', 'https://example.com/ml/checkpoint'),
  ('22222222-2222-4222-8222-222222222222', 'Exercícios de ponteiros em C', 'activity', 'Resolver e enviar os cinco exercícios da lista prática.', '2026-08-26 23:59:00-03', 'https://example.com/lp/ponteiros'),
  ('22222222-2222-4222-8222-222222222222', 'Quiz — Structs e memória', 'quiz', 'Questionário individual disponível no ambiente da disciplina.', '2026-08-28 17:00:00-03', 'https://example.com/lp/quiz'),
  ('33333333-3333-4333-8333-333333333333', 'APS 01 — API REST', 'aps', 'Implementar endpoints, testes e documentação do projeto.', '2026-08-27 23:59:00-03', 'https://github.com/example/dw/aps-01'),
  ('33333333-3333-4333-8333-333333333333', 'Plantão de dúvidas', 'notice', 'Sala 302. Levar dúvidas sobre autenticação e banco de dados.', '2026-08-26 12:30:00-03', null),
  ('44444444-4444-4444-8444-444444444444', 'Demo intermediária', 'exam', 'Apresentação de 8 minutos e demonstração do protótipo funcional.', '2026-08-28 14:00:00-03', 'https://example.com/pi/demo');
