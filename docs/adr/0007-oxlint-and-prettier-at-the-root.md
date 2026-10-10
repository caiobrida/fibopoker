# oxlint rather than ESLint, configured once at the root

Linting is oxlint, with a single `.oxlintrc.json` at the repository root serving all three workspaces. Formatting is prettier, likewise one `.prettierrc` at the root. The delivery plan said ESLint; this replaces that sentence.

The reason is that neither app's generator produces ESLint any more. `create-vite` writes a `.oxlintrc.json`, and `nest new` writes an `oxlint.json`. Choosing ESLint would mean deleting what both generators ship, reinstating `typescript-eslint` against a TypeScript version its peer range does not yet cover, and re-deriving the React and Nest rule sets by hand — three workspaces fighting their own templates, for a rule set the templates already agree on.

Two things were given up with it, and both were checked rather than assumed:

- **Type-aware rules.** oxlint reads no type information, so `no-floating-promises` and friends are inert. The rule was tried and removed rather than left in the config looking load-bearing. What catches type errors is `pnpm build`, which typechecks in every workspace.
- **The ESLint plugin ecosystem.** Nothing in the MVP needs a plugin oxlint lacks. If something does, the answer is to reconsider this decision rather than to run both linters.

## Consequences

- The config enables the `react` plugin, which is off by default, and turns `react/react-in-jsx-scope` off, which is only correct because every workspace compiles JSX with the automatic runtime.
- `correctness` is raised from warning to error, because oxlint exits zero on warnings and CI would otherwise pass over them.
- A rule added to the root config applies to all three workspaces at once. Per-workspace rule sets would mean per-workspace config files, which is the thing this avoids.
