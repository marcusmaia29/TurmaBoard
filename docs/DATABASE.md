# Database and Supabase

## Workflow type

This repository uses imperative, ordered migrations in `supabase/migrations/`.
The migration files are the schema history and must be append-only after they
have been applied outside a disposable local database.

## Data model

| Object | Purpose | Important behavior |
| --- | --- | --- |
| `profiles` | Maps Auth users to application roles | One current role: `admin` |
| `subjects` | Course identity, order, notes, and primary links | Publicly readable |
| `subject_links` | Additional ordered links per subject | Cascades with subject |
| `deliveries` | Shared deadlines and notices | Soft deletion via `deleted_at` |
| `audit_log` | Immutable record of content changes | Populated by triggers |

The enums `user_role`, `delivery_type`, `delivery_status`, and `audit_action`
form contracts shared by SQL and generated TypeScript types.

## Authorization model

- `anon` and `authenticated` may read the published board data.
- Only authenticated users accepted by `public.is_admin()` may mutate content.
- A user may read their own profile.
- The browser uses a publishable key; RLS remains enabled on every exposed table.
- New exposed tables require both explicit grants and appropriate RLS policies.

Do not use frontend checks, editable user metadata, or a `VITE_` secret as an
authorization mechanism.

## Privileged database code

The schema uses trigger functions for profile creation, timestamps, and audit
records. `SECURITY DEFINER` functions require special review because they run
with the function owner's privileges.

For every new or changed privileged function:

- set a safe, explicit `search_path`;
- schema-qualify referenced objects;
- verify the caller with `auth.uid()` when appropriate;
- revoke default execution and grant only the roles that require it;
- confirm that the function cannot be used to bypass the intended RLS model.

Do not add `SECURITY DEFINER` merely to make a permission error disappear.

## Making a schema change

Confirm the installed CLI syntax before use:

```powershell
npx supabase --version
npx supabase migration --help
npx supabase db --help
```

Then use this project workflow:

1. Start the local stack with `npx supabase start`.
2. Create a migration with `npx supabase migration new descriptive_name`.
3. Implement and review the SQL in the generated migration.
4. Rebuild the local database with `npx supabase db reset`.
5. Regenerate types with `npm run types:generate`.
6. Review changes to `src/lib/database.generated.ts`.
7. Add domain aliases to `src/lib/database.types.ts` when application code needs
   a stable or joined type.
8. Run `npm run check`.

Never invent a migration timestamp manually and never edit an already applied
migration. Linking or pushing to a hosted Supabase project requires explicit
user authorization.

## Generated types

`src/lib/database.generated.ts` is generated from the local schema and should
not contain hand-written application types. `src/lib/database.types.ts` imports
that generated contract and defines readable aliases and joined result shapes.

When the generated file changes unexpectedly, fix the migration or local schema
and regenerate instead of editing the output.

## Seed data

`supabase/seed.sql` runs after migrations during `supabase db reset`. Keep it:

- deterministic;
- free of real credentials and personal data;
- compatible with the latest schema;
- safe for repeated use in disposable local databases.

## Verification checklist

- RLS is enabled on every exposed table.
- Grants and policies cover both `anon` and `authenticated` intentionally.
- `UPDATE` policies have appropriate `USING` and `WITH CHECK` expressions.
- Soft-deleted deliveries are excluded from public reads.
- Audit triggers capture the actor and expected before/after state.
- Realtime publication and frontend invalidation include new shared entities.
- `npx supabase db reset` succeeds from an empty local state.
- Generated types and application aliases compile.

Run database advisors when the installed CLI supports them:

```powershell
npx supabase db advisors --local
```
