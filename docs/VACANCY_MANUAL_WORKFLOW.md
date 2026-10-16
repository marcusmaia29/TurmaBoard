# Manual vacancy publication

Use this workflow for vacation internships in technology that accept Computer
Science students in São Paulo state or remotely. The AI researches and checks
each opportunity on an official page. The local CLI checks the evidence format,
trusted domains, dates, and selected eligibility rules; the operator must
still verify that each quoted statement really appears on the linked page
and applies to the exact vacancy. Monitoring a company does not imply an open
vacancy.

## Sources

Start with [BTG Pactual's vacation program](https://conteudo.btgpactual.com/estagio-de-ferias)
and its [technology careers portal](https://carreiras.btgpactual.com/tecnologia),
[Genial's vacation program](https://lp.genialinvestimentos.com.br/estagioferias/)
and [Genial careers](https://genial.gupy.io/), and
[Itaú careers](https://carreiras.itau.com.br/busca-de-vagas/). Find the specific
technology listing and active application link. The BTG January 2027 cycle
whose deadline was 21 August 2026 is closed. Do not publish it as open.
Exclude an opportunity when it requires a university outside São Paulo, is
onsite outside São Paulo, or is a regular semester internship.

## Prepare and check

1. Open the exact official vacancy and application page. Confirm that the
   application form or active apply action still works. Read the accepted
   courses, technology role, work mode, location, internship period, and
   application deadline. If a criterion is missing or ambiguous, do not publish.
2. Create a local JSON file following the shape below. Use the exact sentence
   from the official page for each `quote` and its direct URL. Set `checked_on`
   to today's date in `America/Sao_Paulo`. The deadline quote must contain the
   exact date in `YYYY-MM-DD` or `DD/MM/YYYY` format.
3. Run `npm run vacancies -- validate path/to/vacancy.json`. This only reads
   the file and prints the normalized record. Review the evidence once more.
4. In a controlled maintainer environment, put `SUPABASE_URL` and an
   `sb_secret_` value in `.env.vacancies.local`, which Git ignores. Use a
   separate secret dedicated to this operation when possible. Never use a
   `VITE_` variable, commit the file, paste the key into an AI prompt, or run
   this script in the browser. Apply both vacancy migrations to the target
   Supabase project before publishing; the second grants `service_role` SELECT,
   INSERT, and UPDATE, while public roles have SELECT only.
5. Run `npm run vacancies -- publish path/to/vacancy.json`. Repeat the command
   safely: `application_url` is unique, so it updates the existing row, keeps
   `first_seen_at`, and refreshes `last_seen_at` and `last_verified_at`.
   Verify the opportunity appears on `/vagas` as a visitor. Browser query
   caching may require a refresh for immediate visibility.

Example shape (replace every URL and quote with evidence from a real, open
listing; these placeholders must not be published):

```json
{
  "source": "btg",
  "checked_on": "YYYY-MM-DD",
  "title": "Exact role title",
  "area": "software",
  "location": "São Paulo, SP",
  "state": "SP",
  "work_mode": "hybrid",
  "internship_period": "Exact period on the page",
  "application_deadline": "YYYY-MM-DD",
  "summary": "Short factual description",
  "source_url": "https://carreiras.btgpactual.com/EXACT-LISTING",
  "application_url": "https://carreiras.btgpactual.com/EXACT-APPLICATION",
  "evidence": {
    "vacation_internship": { "url": "https://carreiras.btgpactual.com/EXACT-LISTING", "quote": "Exact vacation internship wording" },
    "technology_area": { "url": "https://carreiras.btgpactual.com/EXACT-LISTING", "quote": "Exact technology role wording" },
    "computer_science": { "url": "https://carreiras.btgpactual.com/EXACT-LISTING", "quote": "Exact accepted Computer Science course wording" },
    "location": { "url": "https://carreiras.btgpactual.com/EXACT-LISTING", "quote": "Exact São Paulo and modality wording" },
    "internship_period": { "url": "https://carreiras.btgpactual.com/EXACT-LISTING", "quote": "Exact internship period wording" },
    "applications_open": { "url": "https://carreiras.btgpactual.com/EXACT-LISTING", "quote": "Exact open application wording" },
    "application_deadline": { "url": "https://carreiras.btgpactual.com/EXACT-LISTING", "quote": "Exact deadline wording" }
  }
}
```

The CLI accepts `source` values `btg`, `genial`, and `itau`; `area` values
`software`, `data_ai`, `infrastructure`, `security`, `product`, and `other`;
and `work_mode` values `onsite`, `hybrid`, and `remote`. Onsite and hybrid
listings require `state: "SP"` and a location identifying São Paulo. All
listings require a confirmed, unexpired application deadline, even though the
database can represent a missing deadline for future ingestion models.

## Close and reopen

Recheck the official page when the deadline passes or the apply action closes.
Create a closure JSON file with `source`, today's `checked_on`, the same
`application_url`, a short `reason`, and an `evidence` object with direct
official `url` and exact `quote`. Run:

```powershell
npm run vacancies -- close path/to/closure.json
```

The row becomes `closed` and disappears from `/vagas`. Repeating `close` is
safe. The tool will never reopen it through an ordinary `publish`. Only after
new official confirmation and a new, future deadline, run:

```powershell
npm run vacancies -- publish path/to/vacancy.json --reopen
```

Keep the reviewed JSON and source notes in a private maintainer workspace if an
audit trail is needed. The public table stores the vacancy and verification
time, not the full evidence quotes. Do not commit unverified applications or
private applicant data. There is no scraper, scheduler, or public write API in
this phase.

## Local verification

After `npx supabase start` and `npx supabase db reset`, use the local API URL,
secret key, and publishable key as `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and
`SUPABASE_PUBLISHABLE_KEY`. Run `npm run vacancies:test:local`. This test only
accepts a localhost URL. It checks repeated publication, updating, closure,
explicit reopening, public visibility, and visitor write denial. It leaves a
closed fixture in the disposable local database; run `npx supabase db reset`
again to clear it. `npm run check` runs the pure validation tests and build.
