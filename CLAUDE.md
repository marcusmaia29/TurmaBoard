# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read [AGENTS.md](AGENTS.md) too — it holds the repository's own agent rules, and this file complements rather than replaces it.

## Commands

```powershell
npm run dev                     # Vite dev server on http://localhost:5173
npm run check                   # lint (zero warnings) + vitest + build; what CI runs
npm run build                   # tsc -b (app and api projects), then vite build
npm test                        # vitest run
npx vitest run src/lib/date.test.ts          # single test file
npx vitest run -t "shows the academic"       # single test by name
npx vercel dev                  # serves api/ too; npm run dev does not
```

Database (requires Docker Desktop):

```powershell
npx supabase start              # local stack; Studio at http://127.0.0.1:54323
npx supabase migration new descriptive_change_name
npx supabase db reset           # replays all migrations + seed.sql
npm run types:generate          # regenerate src/lib/database.generated.ts
```

`npm run types:generate` writes a checked-in file. Run it after every migration and commit the result — `src/lib/database.types.ts` derives every application type from it, so stale generated types drift from the schema silently.

Linking or pushing to the hosted project needs explicit user authorization; never do it unprompted.

## Language convention

UI copy, toast messages, `aria-label`s, and audit summaries are Brazilian Portuguese. Everything else — identifiers, table and column names, comments, tests, docs like this one — is English. Test assertions match Portuguese accessible names (`getByRole("button", { name: /ações/i })`).

## Architecture

Single-page React 19 app on Vite, served statically by Vercel. The browser talks directly to Supabase, so **Row Level Security is the authorization boundary**. The client ships only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; anything prefixed `VITE_` is inlined into the bundle, so a secret must never use that prefix.

The one piece of server-side code is [api/agenda.ts](api/agenda.ts), a read-only Vercel function proxying Insper's public XML calendar (the browser cannot fetch it — no CORS). It holds no credentials and touches no project data. Details in [docs/AGENDA.md](docs/AGENDA.md).

### Routes

`/week`, `/calendar`, `/subjects`, `/history` read Supabase; `/grade` is static data in `grade.data.ts`; `/rooms` calls `/api/agenda`; `/login` is auth. Unknown routes redirect to `/week`.

### Feature slices

`src/features/<feature>/` holds pages, dialogs, and a `<feature>.service.ts` per slice. Components never call `supabase` directly: services own all queries and are the only callers of `getSupabase()`. `src/shared/` holds the shell, dialogs, toasts, and loading/empty/error states; `src/lib/` holds the Supabase client, date helpers, query keys, and types.

`supabase` is `null` when env vars are missing — `isSupabaseConfigured` drives a banner in the shell so the app renders without a backend, while `getSupabase()` throws for service calls. Preserve that split when adding services.

### Auth model

Public sign-up is disabled (`enable_signup = false`). `AuthProvider` loads the caller's `profiles` row after the session resolves and derives `isAdmin` from `profile.role` via `hasAdminRole` — **not** from the presence of a session. That flag only toggles UI affordances; the real check is `private.is_admin()` inside every write policy.

### Data flow and cache invalidation

TanStack Query with a 60s `staleTime` and structured keys in [queryKeys.ts](src/lib/queryKeys.ts). Deliveries are keyed by the ISO window (`["deliveries", startIso, endIso]`), so invalidation always targets the **key prefix** (`{ queryKey: ["deliveries"] }`), never one exact window.

`RealtimeProvider` in [RealtimeSync.tsx](src/features/realtime/RealtimeSync.tsx) wraps the routes, subscribes once to `postgres_changes` on the four Supabase tables, and maps each table to the prefixes it affects. Mutations *also* invalidate locally rather than relying on Realtime, because the app must stay usable when the socket is down. Adding a table means updating both that mapping and the mutation's `onSuccess`.

### Time zone

Everything is anchored to `America/Sao_Paulo` ([date.ts](src/lib/date.ts)). Date keys are `YYYY-MM-DD` strings rehydrated as noon UTC (`utcDateFromKey`) so day arithmetic never crosses a boundary; query ranges are built as explicit `-03:00` ISO strings. Weeks run Monday–Sunday, half-open (`gte startIso`, `lt endIso`). Use these helpers rather than raw `Date` math or `toLocaleDateString`.

### Database invariants

Full detail in [docs/DATABASE.md](docs/DATABASE.md). The load-bearing points:

- **Privileged code lives in a `private` schema**, not `public`: `is_admin()`, `create_profile_for_user()`, `record_audit_log()`, `set_delivery_actor()`. That schema is not exposed through PostgREST, so `private.is_admin()` is not callable as an RPC. Only `public.set_updated_at()` and the `public.reorder_subjects(uuid[])` RPC sit in `public`.
- **`profiles.role` is `('admin', 'member')` and new profiles default to `member`.** The signup trigger names the profile from `raw_user_meta_data.display_name` (fallback `'Membro TurmaBoard'`). Promotion is a manual `update` on `profiles.role` — creating a login and granting administration are separate steps.
- **Two kinds of soft removal**: `deliveries.deleted_at` and `subjects.archived_at`. Archiving a subject also hides its deliveries and links, because those read policies join back to `subjects` and filter `archived_at is null`. A new child table needs that same join or archiving leaks.
- **Policies are split per command**, not one `for all`: `*_admin_insert` / `*_admin_update` / `*_admin_delete` gated on `private.is_admin()`, plus separate `*_anon_read` and `*_authenticated_read`, where the authenticated variant adds `or private.is_admin()` so administrators see rows visitors cannot. Reproduce that five-policy shape for any new table.
- **The audit log and actor attribution are trigger-owned.** `private.record_audit_log()` composes the Portuguese summary, snapshots `before_state`/`after_state`, treats a `deleted_at` *or* `archived_at` transition as a `deleted` action, and resolves `actor_name` from the acting profile (fallback `'Sistema TurmaBoard'`). Never insert into `audit_log` from application code.
- **`deliveries` carries denormalized `created_by_name` / `updated_by_name`** filled by `private.set_delivery_actor()` from `auth.uid()`. The `created_by`/`updated_by` that [delivery.service.ts](src/features/deliveries/delivery.service.ts) sends are overwritten by that trigger, so they are redundant rather than authoritative.
- `public.reorder_subjects(subject_ids uuid[])` raises `42501` without admin and `22023` unless the array is an exact permutation of the active subjects.
- History pagination over-fetches by one row (`range(start, start + PAGE_SIZE)`) to derive `hasNextPage`.

Migrations are append-only once applied. Read them in order — `harden_auth_and_audit` and `add_subject_administration` are where most of the above was established, and the initial `create_core_schema` no longer describes the current shape on its own.

## Styling

Tailwind v4 via `@tailwindcss/vite`, but the app is written mostly in hand-authored semantic classes in [styles.css](src/styles.css) (`.app-shell`, `.delivery-card`, …) using `@theme` design tokens in oklch. Follow that pattern instead of introducing utility-class soup. Z-index goes through the `--z-*` scale. [DESIGN.md](DESIGN.md) is the token and component reference.

Accessibility targets WCAG 2.1 AA: never encode subject, type, or urgency in color alone, and respect reduced motion.

## Project docs

- [README.md](README.md) — entry point, setup, account model.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — runtime structure and boundaries.
- [docs/DATABASE.md](docs/DATABASE.md) — schema, roles, RLS, migration workflow.
- [docs/AGENDA.md](docs/AGENDA.md) — the rooms integration and its endpoint.
- [docs/TESTING.md](docs/TESTING.md) — proportional verification table.
- [docs/decisions/](docs/decisions/) — architecture decision records.
- [CONTRIBUTING.md](CONTRIBUTING.md) — branch, commit, and review workflow.
- [PRODUCT.md](PRODUCT.md) — positioning, design principles, anti-references.
- [VISAO_DO_PROJETO.md](VISAO_DO_PROJETO.md) — original brief in Portuguese; historical context, not a contract.
- [TODO.md](TODO.md) — epic-level status.
- [turmaboard-prototipo.html](turmaboard-prototipo.html) — original standalone prototype, reference only; not built or served.
