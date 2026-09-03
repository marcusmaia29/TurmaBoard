# Contributing to TurmaBoard

Thank you for helping improve TurmaBoard. Contributions of code,
documentation, tests, bug reports, and focused feature proposals are welcome.

By participating, you agree to follow the
[code of conduct](./CODE_OF_CONDUCT.md).

## Before opening an issue

- Search the [existing issues](https://github.com/marcusmaia29/TurmaBoard/issues)
  to avoid duplicates.
- Use the bug report, feature request, or question template and include enough
  context for another contributor to reproduce or evaluate the request.
- Do not disclose vulnerabilities in a public issue. Follow
  [SECURITY.md](./SECURITY.md) instead.
- Keep proposals aligned with the current constraints in
  [PRODUCT.md](./PRODUCT.md).

## Development setup

Follow the local setup in [README.md](./README.md). Run commands from the Git
repository root, not from its parent directory.

Fork the repository, clone your fork, and install the locked dependencies:

```powershell
git clone https://github.com/YOUR-USERNAME/TurmaBoard.git
Set-Location TurmaBoard
git remote add upstream https://github.com/marcusmaia29/TurmaBoard.git
npm ci
```

Create a focused branch from an up-to-date `main` branch:

```powershell
git switch main
git pull --ff-only upstream main
git switch -c feat/short-description
```

## Before changing code

Use the documentation map in the README to find the relevant source of truth.
In particular:

- product behavior belongs in `PRODUCT.md`;
- technical boundaries belong in `docs/ARCHITECTURE.md`;
- schema and authorization behavior belong in `docs/DATABASE.md`;
- the rooms integration and its serverless endpoint belong in `docs/AGENDA.md`;
- reusable agent guidance belongs in `AGENTS.md` or a narrowly scoped skill.

Do not treat `VISAO_DO_PROJETO.md` as the current implementation contract. It is
the original product brief and may describe ideas that changed during delivery.

## Change workflow

1. Make the smallest coherent change.
2. Add or update tests for changed behavior.
3. Update documentation when a contract, workflow, route, or invariant changes.
4. Run the checks described in [docs/TESTING.md](./docs/TESTING.md).
5. Review `git diff` for secrets, generated noise, and accidental formatting.

Database work has additional requirements in
[docs/DATABASE.md](./docs/DATABASE.md). Use the repository skill
`turmaboard-database-change` when working with migrations, RLS, Auth, Realtime,
seed data, or generated database types.

Never commit `.env.local`, credentials, shared administrator passwords, service
role keys, or other secrets. Use `.env.example` to document new public
configuration values.

## Language and encoding

UI copy is Brazilian Portuguese. Source identifiers, technical documentation,
tests, and commit messages are English. Preserve UTF-8 and verify that no
broken accent sequences or Unicode replacement characters were introduced.

In PowerShell, explicitly request UTF-8 when inspecting text:

```powershell
Get-Content -Encoding utf8 README.md
```

## Commits

Use Conventional Commits and group changes by independently reviewable
responsibility. Do not mix unrelated product, infrastructure, and documentation
changes in one commit.

Examples:

```text
feat(calendar): add delivery filters
fix(auth): reject expired sessions
docs: clarify local Supabase setup
```

## Pull requests

- Keep each pull request focused on one outcome.
- Explain why the change is needed and link related issues with keywords such
  as `Closes #123` when applicable.
- Describe how the change was verified and include screenshots or recordings
  for visible interface changes.
- Confirm that `npm run check` passes before requesting review.
- Mark the pull request as a draft while it is incomplete.
- Respond to review comments and avoid force-pushing after review starts unless
  history cleanup was requested.

Maintainers may ask for changes, close proposals that do not fit the current
product direction, or request that a large contribution be split into smaller
pull requests.
