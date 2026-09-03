# Architecture

## Purpose

TurmaBoard is a client-rendered React application backed directly by Supabase.
It has no custom application server. Supabase Database, Auth, Row Level
Security, and Realtime provide persistence, authorization, and synchronization.

## Runtime structure

`src/main.tsx` composes the global providers:

1. `BrowserRouter` handles SPA navigation.
2. `QueryClientProvider` owns server-state caching.
3. `AuthProvider` exposes the current Supabase session.
4. `ToastProvider` exposes operation feedback.

`src/App.tsx` mounts `RealtimeSync` once and lazy-loads the current routes:

| Route | Feature | Responsibility |
| --- | --- | --- |
| `/week` | `deliveries` | Weekly board and delivery administration |
| `/calendar` | `calendar` | Monthly view of the same delivery records |
| `/subjects` | `subjects` | Subject notes and reference links |
| `/history` | `history` | Paginated audit history |
| `/login` | `auth` | Shared administrator sign-in |

Unknown routes redirect to `/week`. Vercel rewrites browser requests to the SPA
entry point so direct route refreshes continue to work.

## Source organization

```text
src/
├── features/       Product capabilities and their service modules
├── lib/            Supabase client, database types, dates, and query keys
├── shared/         Reusable layout, dialogs, feedback, and toasts
└── test/           Shared test setup
```

Keep feature-specific components, services, and tests together. Move a module to
`shared` only when multiple features genuinely depend on it.

## Data flow

The normal read path is:

```text
Page → TanStack Query → feature service → Supabase Data API → RLS → Postgres
```

The normal mutation path is:

```text
Admin action → mutation → feature service → Supabase Data API → RLS/trigger
             → query invalidation → refreshed views
```

Presentation components must not become authorization boundaries. The interface
may hide administrator actions, but the database must reject unauthorized writes.

## Server state and Realtime

Query keys are centralized in `src/lib/queryKeys.ts`. After a mutation, invalidate
every view affected by the changed entity. `RealtimeSync` subscribes to changes
for deliveries, subjects, subject links, and audit history and invalidates the
same caches for changes made by another client.

Realtime improves freshness but is not required for correctness. Initial reads
and mutation responses still come through the Data API.

## Authentication and authorization

Public sign-up is disabled. The application uses one shared administrator
account created outside the public interface. A frontend session controls which
actions are displayed, while RLS and database functions determine whether a
write is authorized.

The current frontend treats any valid session as the administrator because the
project admits only the controlled account. If the access model expands, the UI
must read the profile role instead of equating authentication with authorization.

## Dates and time zones

Date helpers live in `src/lib/date.ts`. Calendar and weekly boundaries use
`America/Sao_Paulo`; database deadlines are stored as `timestamptz`. Avoid parsing
date-only strings through environment-dependent browser defaults.

## Deployment boundary

Vercel serves the static `dist/` output. Only the Supabase project URL and
publishable key belong in public frontend environment variables. Secrets and
service-role credentials must never be bundled into the browser application.
