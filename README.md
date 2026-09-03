# TurmaBoard

[![CI](https://github.com/marcusmaia29/TurmaBoard/actions/workflows/ci.yml/badge.svg)](https://github.com/marcusmaia29/TurmaBoard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

TurmaBoard is a shared academic board for one undergraduate class. Anyone can
read the weekly deadlines, the monthly calendar, the class timetable, room
availability, course references, and the change history without signing in.
Administrators maintain the published content.

**Production:** [turmaboard.vercel.app](https://turmaboard.vercel.app)

The interface is written in Brazilian Portuguese. Source code, database names,
tests, and technical documentation are written in English.

## What the application does

| Route | Name in the interface | Purpose |
| --- | --- | --- |
| `/week` | Semana | Weekly board, one column per subject, with administration |
| `/calendar` | Calendário | Monthly view of the same delivery records |
| `/subjects` | Disciplinas | Subject notes, official links, and ordering |
| `/history` | Histórico | Paginated audit trail of every content change |
| `/grade` | Grade | Static weekly class timetable |
| `/rooms` | Salas | Room availability, read from the Insper agenda feed |
| `/login` | — | Administrator sign-in |

`/week`, `/calendar`, `/subjects` and `/history` are backed by Supabase.
`/grade` is static data in the repository. `/rooms` reads a public upstream feed
through the project's only serverless endpoint.

## Documentation

- [Product principles](./PRODUCT.md) — positioning and design constraints
- [Design system](./DESIGN.md) — colors, typography, elevation, components
- [Architecture](./docs/ARCHITECTURE.md) — runtime structure and boundaries
- [Database and Supabase](./docs/DATABASE.md) — schema, roles, RLS, migrations
- [Rooms and the agenda feed](./docs/AGENDA.md) — the serverless endpoint
- [Testing and verification](./docs/TESTING.md) — what to run before handoff
- [Contribution workflow](./CONTRIBUTING.md) — setup, branches, commits, reviews
- [Architecture decisions](./docs/decisions/) — the reasoning behind key choices
- [Original product brief](./VISAO_DO_PROJETO.md) — historical context, not a contract

Repository instructions for coding agents live in [AGENTS.md](./AGENTS.md).
Release status is tracked in [TODO.md](./TODO.md).

## Stack

- React 19 and TypeScript on Vite
- Tailwind CSS v4, used through hand-authored semantic classes
- TanStack Query for server state
- Supabase for Database, Auth, Row Level Security, and Realtime
- Vercel for static hosting plus one serverless function

There is no application server of our own. The browser talks to Supabase
directly, so **Row Level Security is the authorization boundary**. The single
exception is `api/agenda.ts`, a read-only proxy that holds no credentials.

## Repository layout

```text
api/            Vercel serverless function: the Insper agenda proxy
docs/           Architecture, database, testing, and decision records
src/features/   One folder per product capability, with its service and tests
src/lib/        Supabase client, database types, date helpers, query keys
src/shared/     Shell, dialogs, toasts, and loading/empty/error states
supabase/       Migrations and seed data
```

## Local development

Requirements: Node.js 22 or newer, and Docker Desktop for the local database.

```powershell
npm install
npx supabase start
```

Copy the API URL and publishable key printed by Supabase into `.env.local`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-key
```

Then start the application:

```powershell
npm run dev
```

`npx supabase db reset` applies every migration in `supabase/migrations/` and
then loads `supabase/seed.sql`. Supabase Studio runs at `http://127.0.0.1:54323`.

Without the environment variables the app still renders: `isSupabaseConfigured`
drives a banner in the shell instead of crashing, which keeps interface work
possible without a database.

> The Vite dev server does not serve `api/`. Requests to `/api/agenda` fall
> through to the SPA rewrite and the Salas screen shows its error state. To
> exercise the endpoint locally run `npx vercel dev` instead of `npm run dev`.

## Accounts and roles

Public sign-up is disabled (`enable_signup = false` in `supabase/config.toml`).
Accounts are created by a maintainer from **Authentication → Users** in the
Supabase dashboard, or through the Auth Admin API.

`profiles.role` is `admin` or `member`, and the `auth_user_created` trigger
always creates new profiles as **`member`**. Granting administration is a
deliberate, separate step:

```sql
update public.profiles set role = 'admin' where id = '<user id>';
```

The profile name comes from the account's `display_name` user metadata, so set
it when creating the account. See [docs/DATABASE.md](./docs/DATABASE.md) for the
authorization model.

Never commit credentials. `.env`, `.env.local`, and `.env.*.local` are ignored;
use `.env.example` to document new public configuration values.

## Database workflow

```powershell
npx supabase migration new descriptive_change_name
npx supabase db reset
npm run types:generate
```

`npm run types:generate` rewrites the checked-in `src/lib/database.generated.ts`.
Run it after every migration and commit the result, because every application
type derives from that file.

Applying migrations to the hosted project requires maintainer access and
explicit authorization:

```powershell
npx supabase link
npx supabase db push
```

The browser only ever receives the Supabase project URL and the publishable key.
Never put a secret or service-role key behind a `VITE_` variable — Vite inlines
those into the client bundle.

Lesson-note images use a public Storage bucket whose writes remain protected by
RLS. Provision or reconcile it through the Storage API with a server-side secret
(never expose this key to Vite):

```bash
SUPABASE_URL=https://PROJECT.supabase.co \
SUPABASE_SECRET_KEY=YOUR_SERVER_SECRET npm run storage:provision
```

## Quality checks

```powershell
npm run check      # lint with zero warnings, Vitest, and the production build
```

The same command runs in CI on every pull request. See
[docs/TESTING.md](./docs/TESTING.md) for targeted and database-specific checks.

## Deployment

Vercel builds with `npm run build`, serves `dist/`, and deploys `api/` as a
serverless function. `vercel.json` provides the SPA rewrites and cache headers.
The deployment needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`;
the agenda endpoint needs no configuration.

## Contributing

Contributions are welcome. Read the [contribution guide](./CONTRIBUTING.md) and
the [code of conduct](./CODE_OF_CONDUCT.md) before opening a pull request, and
use the issue templates to report a bug, suggest an improvement, or ask a
question.

Report suspected vulnerabilities privately according to the
[security policy](./SECURITY.md). Do not open a public issue for them.

## License

TurmaBoard is available under the [MIT License](./LICENSE).
