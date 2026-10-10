# CSS Modules with dark-only semantic tokens

Styling is CSS Modules plus CSS custom properties, with the design system in `apps/web/src/shared/ui`. Colors, spacing, typography and radii are defined once as semantic tokens on `:root` (`--bg-base`, `--surface-elevated`, `--text-secondary`, `--border-subtle`), and components reference tokens only — never literal values.

**styled-components was considered and rejected.** It entered maintenance mode in March 2025, with only critical and security fixes promised, for a limited time. The reason given upstream — incompatibility with React Server Components — does not apply to a Vite SPA, and an earlier draft of this project chose it anyway because the author's personal skill tooling was built around it. That tooling is not used in this repo, which removed the only real argument in its favour and left just the liability. CSS Modules is native to Vite, adds no dependency and no runtime, and nothing about it can be deprecated out from under the project.

**The product ships dark mode only, deliberately.** The palette follows ChatGPT's: near-monochrome low-saturation greys, a white inverted primary button, very subtle borders. That palette has no vocabulary for state, so exactly two low-saturation semantic colors are added — one for voted/consensus, one for divergence — because "where is the disagreement" is the signal a revealed Round exists to communicate, and the eye reads color faster than it reads numbers.

Light mode is not a goal, but the token layer is what keeps it from becoming a rewrite: adding it later means defining a second set of values, not hunting hex codes through components. Hardcoding dark values in components is the one thing that would make this irreversible.
