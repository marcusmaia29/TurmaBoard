begin;

create type public.vacancy_area as enum (
  'software', 'data_ai', 'infrastructure', 'security', 'product', 'other'
);
create type public.vacancy_work_mode as enum ('onsite', 'hybrid', 'remote');
create type public.vacancy_review_status as enum ('pending', 'approved', 'rejected');
create type public.vacancy_opening_status as enum ('open', 'closed');

create table public.vacancies (
  id uuid primary key default gen_random_uuid(),
  company text not null check (char_length(trim(company)) between 1 and 120),
  title text not null check (char_length(trim(title)) between 1 and 160),
  area public.vacancy_area not null,
  location text check (location is null or char_length(trim(location)) between 1 and 160),
  work_mode public.vacancy_work_mode,
  internship_period text check (
    internship_period is null or char_length(trim(internship_period)) between 1 and 120
  ),
  application_deadline date,
  summary text check (summary is null or char_length(trim(summary)) between 1 and 300),
  source_name text not null check (char_length(trim(source_name)) between 1 and 120),
  source_url text check (source_url is null or source_url ~ '^https://[^[:space:]]+$'),
  application_url text not null unique check (application_url ~ '^https://[^[:space:]]+$'),
  review_status public.vacancy_review_status not null default 'pending',
  opening_status public.vacancy_opening_status not null default 'open',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (last_seen_at >= first_seen_at),
  check (review_status <> 'approved' or last_verified_at is not null)
);

create index vacancies_public_deadline_idx
on public.vacancies(application_deadline asc nulls last, last_verified_at desc)
where review_status = 'approved' and opening_status = 'open';

create trigger vacancies_set_updated_at
before update on public.vacancies
for each row execute function public.set_updated_at();

alter table public.vacancies enable row level security;

create policy vacancies_public_read
on public.vacancies for select to anon, authenticated
using (
  review_status = 'approved'
  and opening_status = 'open'
  and (
    application_deadline is null
    or application_deadline >= (now() at time zone 'America/Sao_Paulo')::date
  )
);

grant select on public.vacancies to anon, authenticated;

commit;
