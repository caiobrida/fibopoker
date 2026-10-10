# fibopoker

## Conventions

- **No comments in code.** Names and structure carry the meaning. Code that needs a comment to be understood is a signal to rename or restructure, not to annotate. This bans explanatory prose — not lint suppressions or a license header.
- **Everything in English**: code, identifiers, commit messages, branch names, pull requests, issues, and the documents in this repo. Conversation with the maintainer happens in Portuguese; nothing that lands in the repository or on GitHub does.
- **No tooling attribution** in commit messages or pull request descriptions — no co-author trailers, no "generated with" lines.
- **Simplicity where it applies.** The project is built so it can grow, but a layer, a package or an abstraction is added when it earns its place, never in anticipation of one.

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature-slug>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, unrenamed, recorded as `Status:` lines in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.
