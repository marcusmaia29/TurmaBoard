---
name: turmaboard-database-change
description: Change or review TurmaBoard Supabase migrations, schema, RLS, Auth, Realtime publication, seed data, or generated database types. Do not use for frontend-only work that consumes an unchanged database contract.
---

# TurmaBoard database change

Preserve the public-read, administrator-write model while producing an
append-only, locally verified database change.

## Required context

Read [`docs/DATABASE.md`](../../../docs/DATABASE.md) before making a database
change. Read [`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md) when the
change affects frontend queries, Realtime invalidation, or authentication flow.

Inspect the current migrations, seed, generated types, affected feature service,
and query keys. Do not infer the live schema from TypeScript alone.

## Workflow

1. Check the installed Supabase CLI version and relevant command help.
2. Confirm that the repository still uses imperative migrations.
3. Create a migration through the CLI; never invent its timestamp or rewrite an
   applied migration.
4. Review grants, RLS, privileged functions, audit behavior, Realtime, and Data
   API exposure for every affected object.
5. Reset the disposable local database and regenerate TypeScript types.
6. Update application type aliases, services, query keys, tests, and docs when
   their contracts changed.
7. Run database advisors when supported, inspect the generated diff, and run
   `npm run check`.

Stop before linking, pushing, or changing a hosted project unless the user
explicitly authorized that external mutation.

## Security invariants

- Enable RLS on every exposed table and grant only the required operations.
- Treat `authenticated` as authentication, not administrator authorization.
- Never use user-editable metadata for authorization.
- Give update policies appropriate `USING` and `WITH CHECK` expressions.
- Prefer invoker behavior. For necessary `SECURITY DEFINER` functions, use an
  empty safe `search_path`, schema-qualified objects, explicit caller checks,
  and restricted execution grants.
- Never expose service-role or secret keys to Vite client code.

## Handoff evidence

Report the migration created, schema contracts affected, generated files changed,
commands run, and any verification that could not be completed. Do not describe
the database as secure solely because TypeScript tests passed.
