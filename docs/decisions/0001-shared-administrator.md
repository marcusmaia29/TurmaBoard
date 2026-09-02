# ADR 0001: Use a shared administrator account

- Status: Accepted
- Date: 2026-08-25

## Context

TurmaBoard serves one undergraduate class. Everyone needs low-friction read
access, while content changes must remain attributable and protected from
anonymous mutation. The MVP does not need public account registration or member
management.

## Decision

Visitors read published content without signing in. A single administrator
account, created through Supabase administration rather than public sign-up,
maintains deliveries, subjects, and links.

The frontend exposes editing controls only during an authenticated session. The
database independently authorizes mutations through RLS and the administrator
profile.

## Consequences

- Onboarding and permission management remain small for the MVP.
- Administrator credentials must be distributed and rotated securely.
- Audit history identifies the shared account, not necessarily the individual
  person using it.
- Adding individual collaborators requires a new role and membership design;
  authentication alone must not grant administrator access.
