# TurmaBoard Epics

This file tracks product work at the epic level. Completed implementation stays
visible so the current state and the remaining release work are clear.

## MVP

### Epic 1 — Application foundation

- [x] Set up React, TypeScript, Vite, and Tailwind CSS.
- [x] Add feature-based source organization.
- [x] Configure SPA routing and Vercel cache headers.
- [x] Keep technical identifiers in English and user copy in Portuguese.

### Epic 2 — Data and security

- [x] Create the Supabase schema and seed data.
- [x] Add Row Level Security for public reads and administrator writes.
- [x] Add soft deletion, timestamps, indexes, and audit triggers.
- [x] Generate and version TypeScript database types.

### Epic 3 — Weekly board

- [x] Display one column per subject.
- [x] Filter all delivery types.
- [x] Navigate between Monday-to-Sunday periods.
- [x] Show normal, urgent, overdue, cancelled, loading, error, and empty states.

### Epic 4 — Administration

- [x] Add shared administrator login.
- [x] Create, edit, cancel, and remove deliveries.
- [x] Restrict mutations in the database and interface.
- [x] Show operation feedback in Portuguese.

### Epic 5 — Supporting views

- [x] Add the monthly calendar and delivery details.
- [x] Add subject notes and official links.
- [x] Add paginated audit history.
- [x] Reuse the same records across every view.

### Epic 6 — Live synchronization

- [x] Subscribe to relevant Supabase Realtime changes.
- [x] Invalidate TanStack Query caches after remote changes.
- [x] Keep the application usable when Realtime is unavailable.

### Epic 7 — Quality and accessibility

- [x] Add date and component tests.
- [x] Validate migrations, seed data, RLS, and audit behavior locally.
- [x] Validate production build and direct SPA routes.
- [x] Inspect desktop and mobile layouts.
- [x] Add keyboard labels, reduced-motion behavior, and Portuguese encoding checks.

### Epic 8 — Production launch

- [ ] Create the hosted Supabase project.
- [ ] Link the local repository to the hosted project.
- [ ] Apply database migrations and production seed data.
- [ ] Confirm that public sign-up is disabled.
- [ ] Create and securely distribute the shared administrator credentials.
- [ ] Configure Supabase environment variables in Vercel.
- [ ] Deploy the Vite application to Vercel.
- [ ] Run public and administrator smoke tests in production.
- [ ] Verify direct refreshes on every application route.

## Future backlog

These epics are intentionally outside the current MVP and are not scheduled.

### Epic 9 — Automated data ingestion

- [ ] Define the first official data source.
- [ ] Design an ingestion contract and conflict policy.
- [ ] Add scheduled jobs and execution monitoring.
- [ ] Add review flows for automated deadline changes.

### Epic 10 — Multiple class spaces

- [ ] Add class and semester isolation to the data model.
- [ ] Add membership management.
- [ ] Add class selection and administration.
