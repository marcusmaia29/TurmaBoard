# Security Policy

## Supported versions

TurmaBoard does not currently publish versioned releases. Security fixes target
the latest code on the `main` branch. Older commits and forks are not supported.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability.

Email [vinicius99maia@gmail.com](mailto:vinicius99maia@gmail.com) with a clear
subject line and include:

- the affected component and environment;
- steps to reproduce or a proof of concept;
- the potential impact;
- any suggested mitigation;
- whether the report or related details have been shared elsewhere.

Avoid accessing, modifying, or retaining data that does not belong to you. Stop
testing once you have enough evidence to demonstrate the issue.

Maintainers will acknowledge the report, investigate it, and coordinate next
steps privately. Please allow time for a fix before public disclosure. Credit
will be offered when desired and appropriate.

## Security boundaries

Supabase Row Level Security is TurmaBoard's authorization boundary. A hidden UI
control is not a security control. Never expose a Supabase service role key,
shared administrator password, or another secret through a `VITE_` environment
variable, issue, pull request, or log.
