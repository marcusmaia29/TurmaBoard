# ADR 0002: Use America/Sao_Paulo as the application time zone

- Status: Accepted
- Date: 2026-08-25

## Context

The class operates in São Paulo, and deadlines are communicated in local civil
time. Browser and CI environments may otherwise interpret date-only values in
different time zones.

## Decision

Use `America/Sao_Paulo` for week boundaries, calendar labels, relative deadline
logic, and form conversion. Persist deadlines as Postgres `timestamptz` values.

Centralize conversions in `src/lib/date.ts` instead of duplicating date parsing
inside components.

## Consequences

- Users see dates according to the class context rather than device location.
- Tests must cover day, week, and month boundaries explicitly.
- Supporting classes in other time zones would require making the time zone a
  class-level setting instead of changing this constant globally.
