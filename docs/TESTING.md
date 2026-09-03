# Testing and verification

## Standard check

Run the complete repository check before handing off source changes:

```powershell
npm run check
```

It runs lint with zero warnings, the Vitest suite, and the production build.

## Proportional verification

| Change | Minimum verification |
| --- | --- |
| Markdown only | Inspect links and encoding; run `git diff --check` |
| Pure utility | Targeted unit test, then `npm run check` |
| React component | Component test plus keyboard and mobile inspection |
| Route or Vercel config | `npm run check` and direct route refresh |
| Migration, RLS, Auth, or seed | Local database reset, type generation, then `npm run check` |
| Realtime behavior | Verify initial reads, local mutation refresh, and remote invalidation |

## Individual commands

```powershell
npm run lint -- --max-warnings=0
npm test
npm run build
npm run test:watch
```

Use targeted Vitest execution during iteration, but run the complete check before
handoff when source behavior changed.

## What to test

Prefer observable behavior over implementation details. Important boundaries are:

- Monday-to-Sunday and month transitions in `America/Sao_Paulo`;
- urgent and overdue deadline classification;
- public versus administrator controls;
- dialog focus, cancellation, confirmation, and feedback;
- query invalidation after mutations and Realtime events;
- empty, loading, error, and unconfigured-Supabase states;
- direct loading of every public SPA route.

Database policy behavior is not proven by frontend unit tests. Verify it against
the local Supabase stack as described in [DATABASE.md](./DATABASE.md).
