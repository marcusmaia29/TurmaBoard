# Vacation internship vacancy collection research

Research date: 2026-10-16 (America/Sao_Paulo). This is a proposal for
[issue #9](https://github.com/marcusmaia29/TurmaBoard/issues/9), not a list of
currently open applications. Source availability and deadlines must be checked
again before publication.

## Recommendation

Start with a small allowlist of employer or authorized recruiting pages. Prefer
published vacancy APIs, then structured data on public job pages, then targeted
HTML extraction. Run collection on the server once a day, stage candidates for
administrator review, and expose only approved, verified, open vacancies. Keep
the application on the original site.

For this repository, a Vercel Node function plus Vercel Cron is the shortest
path to a first implementation: Vercel already hosts a serverless endpoint,
Node can parse ordinary HTML with Cheerio, and the existing browser can read
published rows from Supabase under RLS. Protect the cron endpoint with
`CRON_SECRET`; keep the database write credential in server environment
variables only. Vercel documents at-least-once delivery, possible overlapping
runs, UTC schedules, and a once-per-day limit on Hobby plans, so the importer
needs a database-backed lock and idempotent upserts. [Vercel cron overview](https://vercel.com/docs/cron-jobs),
[Vercel cron operation and security](https://vercel.com/docs/cron-jobs/manage-cron-jobs),
[Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

Supabase Edge Functions scheduled through `pg_cron` and `pg_net` are a viable
alternative for JSON-only collection. They would put scheduling and ingestion
inside Supabase but add another deployment/runtime path. Supabase documents
that combination and recommends Vault for the invocation credential. Use it if
the team later consolidates server work there; keep the collection adapters
independent of the scheduler. [Supabase scheduling guide](https://supabase.com/docs/guides/functions/schedule-functions).

## Source options and tools

| Source type | How to collect | Useful fields | Main limit |
| --- | --- | --- | --- |
| Greenhouse Job Board API | `GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true` | Posting `id`, title, location, URL, description, department; an individual post may expose `application_deadline` | Every board must be discovered and checked; a published post is not necessarily a vacation internship. [API docs](https://docs.greenhouse.io/job-board.html) |
| Lever Postings API | `GET https://api.lever.co/v0/postings/{site}?mode=json&skip=0&limit=100` and paginate | Posting ID, title, categories, `hostedUrl`, `applyUrl`, location and workplace type | API is per company and does not provide full-text search across companies; collect server-side. [API docs](https://github.com/lever/postings-api) |
| Ashby public Job Postings API | `GET https://api.ashbyhq.com/posting-api/job-board/{board_name}` | Title, plain description, `employmentType`, `isListed`, location, `jobUrl`, `applyUrl`, publication time | `isListed=false` means the posting should not be listed on the board; respect it. Use the stable job URL as the external identity if no ID is exposed. [API docs](https://developers.ashbyhq.com/docs/public-job-posting-api) |
| Public employer or authorized recruiting page | `fetch` plus Cheerio, first looking for `JobPosting` JSON-LD and then stable HTML selectors | Employer, title, eligibility, application window, location, application URL | Each page needs a source-specific parser and an operational check when its layout changes. Cheerio does not execute JavaScript. [Cheerio docs](https://cheerio.js.org/docs/intro/), [JobPosting guidance](https://developers.google.com/search/docs/appearance/structured-data/job-posting) |
| Browser-rendered public page | Playwright only after the simpler options fail | Content added by client-side JavaScript | Browser binaries and execution cost make it a poor default for the daily job. Keep it in a separate worker if needed. [Playwright browser docs](https://playwright.dev/docs/browsers) |

Do not crawl search results or major job aggregators indiscriminately. Search
can help discover a new official source, but the persisted application link
should point to the employer or its authorized recruiting page. Before enabling
each HTML adapter, check its current terms and `robots.txt`, use a descriptive
user agent, low request frequency, timeouts, and backoff for 429/5xx responses.
The [Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309) defines
the crawler rules; it does not itself grant permission to reuse content.
Never automate sign-in to the Insper Symplicity portal. The Insper page links to
that portal for students and employers; any portal feed needs an authorized
integration. [Insper careers page](https://www.insper.edu.br/pt/transformacao/carreiras/pop).

## Initial sources to monitor

These examples were checked on 2026-10-16. They demonstrate why an accessible
page or an active posting is not enough to mark applications as open.

| Source | Collection approach | Relevance and current caveat |
| --- | --- | --- |
| [BTG Pactual vacation internship](https://conteudo.btgpactual.com/estagio-de-ferias) | Greenhouse board `btgpactual` for postings, plus the public program page for the application window | The board responded to a read-only API check on 16 October. The program accepts technology students and describes January–February 2027 work in São Paulo or Rio. Its listed application window ended on 21 August 2026, so this cycle must not appear as open. |
| [Itaú vacation internship](https://programasdeferiasitauunibanco.com/) | Public program page, with a linked recruiting page | Accepts students at Brazilian universities from the second semester; the program has several tracks, so review the technology fit of the chosen track. The stated national-program deadline was 25 September 2026. |
| [Aperam / IEL vacation internship](https://carreiras.iel.org.br/MG/vaga/estagio/31642/estagio-de-ferias-aperam-timoteo-2027) | Public authorized recruiting page, targeted HTML parser | Explicitly lists Computer Science and Software Engineering. Work is in person in Timóteo and requires living in the region during the program. The page has an application action but no clear deadline; request administrator verification before displaying an open status. |
| [Enter 2027 internship](https://jobs.ashbyhq.com/enter-ai/1eaf411e-c883-457b-905f-d9696ac06bd5) | Ashby API, board `enter-ai` | The public API returned a listed `Intern` posting on 16 October. Its **vacation** track requires study outside São Paulo state or abroad, so it should not be recommended as an eligible vacation role for a typical Insper São Paulo student. Its regular track is separate from this issue's initial scope. |

The [Insper careers page](https://www.insper.edu.br/pt/transformacao/carreiras/pop)
currently gives a 2026 vacation internship period of 3 June to 7 August. Do
not hard-code that range for later years or assume every summer program fits
Insper's academic calendar. Confirm the next period with the school and capture
each program's dates separately.

## Candidate and publication rules

Use a deterministic filter to create review candidates, with the source text
and matched evidence attached. Do not publish based only on keyword matching or
an LLM score.

1. Require an explicit internship or vacation-program signal in the title,
   employment type, or program description. Treat “paid vacation” in a benefits
   section as unrelated.
2. Require a credible Computer Science connection: accepted degree, software,
   data, AI, infrastructure, security, product engineering, or a broad program
   with a clearly applicable technology track. Tag broad programs as “track
   requires review.”
3. Extract the application interval and internship work interval separately.
   A future start date does not mean applications are still open. If there is
   no reliable application deadline, require manual verification.
4. Extract eligibility constraints such as study location, semester, expected
   graduation, language, in-person city, and relocation. A mismatch can exclude
   the vacation track even when the company works in technology.
5. Normalize dates in `America/Sao_Paulo` when a Brazilian source provides
   date-only deadlines. Keep the original text and mark uncertain year or
   time-zone interpretations for review.
6. Store a short factual summary and a link to the original posting. Never
   copy an entire employer description into the public page by default.

Suggested records: `vacancy_sources` (allowlisted URL, adapter, enabled state,
last successful scan), `vacancies` (source, external ID or canonical URL,
company, title, location, modality, dates, original URL, approval state,
opening state, `first_seen_at`, `last_seen_at`, `last_verified_at`), and
`vacancy_collection_runs` (start/end, source, HTTP outcome, item counts, error
category). Keep administrator edits separate from imported fields or define
which fields may be refreshed, so later scans do not overwrite corrections.

Use a unique key on `(source_id, external_id)` with canonical URL as fallback.
An upsert should update `last_seen_at` but preserve `first_seen_at` and the
administrator decision. A failed or partial scan must not change opening state.
After a **complete successful** scan omits a previously seen vacancy, mark it
for recheck; close it only after a second complete scan or a verified explicit
deadline. A manual closure remains closed until an administrator reopens it.
These are proposed rules for the issue's “do not close on source failure”
criterion, not behavior already implemented.

Public RLS reads should return only approved and open rows. Administrative
review and collection writes need distinct authorization paths. The browser
must never receive a secret key, and every table exposed through the Supabase
Data API needs grants and RLS policies for the intended roles. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## Pilot and checks

1. Implement an Ashby adapter against the public `enter-ai` board to validate
   JSON normalization and the exclusion of an ineligible vacation track. The
   board returned the 2027 posting with `isListed=true` and
   `employmentType=Intern` in a read-only check on 16 October 2026.
2. Add a Greenhouse adapter for the `btgpactual` board and an HTML adapter for
   its program page, which supplies the past application deadline. Use the IEL
   page as a no-deadline review case.
3. Run the same fixtures twice and verify one vacancy per external identity;
   simulate a timeout, a partial response, and a complete scan with a missing
   posting to verify lifecycle rules.
4. Test RLS as anonymous visitor, member, and administrator. Verify that
   candidates and failed runs never appear in public reads, and that neither
   the bundle nor `VITE_` variables contain a write credential.
5. Check the `/vagas` page on mobile and by keyboard, with the original link,
   source, last verification date, and an honest “deadline not provided” label.

The pilot should remain a staging exercise until application windows and
eligibility are verified on the official source. The examples above do not
establish a currently open, eligible posting for this class.
