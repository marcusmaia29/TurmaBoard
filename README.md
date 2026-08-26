# TurmaBoard

TurmaBoard is a shared academic board for one undergraduate class. Visitors can
read weekly deadlines, the monthly calendar, course references, and the audit
history. A shared administrator account can maintain all published content.

**Production:** [Access TurmaBoard](https://turmaboard.vercel.app)

Development status and release work are tracked in [TODO.md](./TODO.md).

The interface is written in Brazilian Portuguese. Source code, database names,
tests, and technical documentation are written in English.

## Stack

- React and TypeScript
- Vite and Tailwind CSS
- TanStack Query
- Supabase Database, Auth, Row Level Security, and Realtime
- Vercel static hosting

## Local development

Requirements:

- Node.js 22 or newer
- Docker Desktop

Install dependencies and start Supabase:

```powershell
npm install
npx supabase start
```

Copy the API URL and publishable key shown by Supabase into `.env.local`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-key
```

Start the application:

```powershell
npm run dev
```

The local database applies every migration in `supabase/migrations/` and then
loads `supabase/seed.sql`.

## Shared administrator account

Public sign-up is disabled. Create the shared account from **Authentication →
Users** in the Supabase dashboard. The database trigger creates its
`Admin TurmaBoard` profile automatically.

For local development, open Supabase Studio at `http://127.0.0.1:54323`. For
production, create the account in the hosted project after applying migrations.
Do not commit or expose the shared password.

## Database workflow

Create and test schema changes locally:

```powershell
npx supabase migration new descriptive_change_name
npx supabase db reset
npm run types:generate
```

Apply committed migrations to the linked hosted project:

```powershell
npx supabase link
npx supabase db push
```

The browser receives only the Supabase project URL and publishable key. Row
Level Security is the authorization boundary. Never add a secret or service
role key to a `VITE_` environment variable.

## Quality checks

```powershell
npm run lint -- --max-warnings=0
npm test
npm run build
npm run preview
```

## Vercel deployment

Import the Git repository in Vercel and add the two public Supabase environment
variables. Use the default Vite build command (`npm run build`) and output
directory (`dist`). `vercel.json` provides SPA rewrites and cache headers.

Before the first production deployment:

1. Create the hosted Supabase project.
2. Link it and apply the migrations.
3. Confirm that public sign-up is disabled.
4. Create the shared administrator account.
5. Configure the Vercel environment variables.
6. Deploy and verify all routes with a direct page refresh.
