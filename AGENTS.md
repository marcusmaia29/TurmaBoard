# TurmaBoard Agent Guide

## Start here

Work from the Git repository root. Read only the sources relevant to the task:

- `README.md` for setup, operations, and the documentation map.
- `PRODUCT.md` for current product and experience constraints.
- `docs/ARCHITECTURE.md` for system boundaries and data flow.
- `docs/DATABASE.md` for schema, authorization, and migration rules.
- `docs/TESTING.md` for proportional verification.
- `VISAO_DO_PROJETO.md` for historical product context only.

When documentation conflicts with current code or migrations, treat code and
migrations as observed behavior, then update the stale documentation in the
same change.

## Project invariants

- UI copy is Brazilian Portuguese. Keep accents and UTF-8 encoding intact.
- Code, identifiers, tests, commit messages, and technical docs are English.
- In PowerShell, read UTF-8 text with `Get-Content -Encoding utf8`.
- Visitors can read published data. Only the shared administrator may mutate it.
- Supabase Row Level Security is the authorization boundary; UI checks are not.
- Never expose a secret or service-role key through a `VITE_` variable.
- Store each delivery once and reuse it across week, calendar, and subject views.
- Date and deadline behavior uses `America/Sao_Paulo`.
- Preserve mobile usability, keyboard operation, and reduced-motion behavior.

## Change rules

- Keep feature code under `src/features/<feature>` and reusable UI under
  `src/shared`.
- Keep Supabase access in feature service modules, not presentation components.
- Reuse query keys from `src/lib/queryKeys.ts` and invalidate every affected
  view after mutations or Realtime events.
- Add or update tests for observable behavior, especially date boundaries,
  permissions, dialogs, and data transformations.
- Create a new migration for schema changes. Never edit an applied migration.
- Do not hand-edit `src/lib/database.generated.ts`; regenerate it from the local
  database. Add application-level aliases to `src/lib/database.types.ts`.
- Keep seeds deterministic and safe to run after `supabase db reset`.

For database, RLS, Auth, Realtime, seed, or generated-type work, use the
repository skill at `.agents/skills/turmaboard-database-change/SKILL.md`.

## Verification

- Documentation-only changes: inspect links, encoding, and `git diff --check`.
- TypeScript or UI changes: run `npm run check`.
- Database changes: follow `docs/DATABASE.md`, then run `npm run check`.
- Route or deployment changes: also verify direct SPA route refreshes.

Do not commit, push, deploy, link a Supabase project, or mutate production unless
the user explicitly requests it.
