# Contributing to TurmaBoard

## Development setup

Follow the local setup in [README.md](./README.md). Run commands from the Git
repository root, not from its parent directory.

## Before changing code

Use the documentation map in the README to find the relevant source of truth.
In particular:

- product behavior belongs in `PRODUCT.md`;
- technical boundaries belong in `docs/ARCHITECTURE.md`;
- schema and authorization behavior belong in `docs/DATABASE.md`;
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
