# CSS Modules with dark-only semantic tokens

Styling is CSS Modules plus CSS custom properties, with the design system in `apps/web/src/shared/ui`. Colors, spacing, typography and radii are defined once as semantic tokens on `:root` (`--bg-base`, `--surface-elevated`, `--text-secondary`, `--border-subtle`), and components reference tokens only — never literal values.

**styled-components was considered and rejected.** It entered maintenance mode in March 2025, with only critical and security fixes promised, for a limited time. The reason given upstream — incompatibility with React Server Components — does not apply to a Vite SPA, and an earlier draft of this project chose it anyway because the author's personal skill tooling was built around it. That tooling is not used in this repo, which removed the only real argument in its favour and left just the liability. CSS Modules is native to Vite, adds no dependency and no runtime, and nothing about it can be deprecated out from under the project.

**The product ships dark mode only, deliberately.** The palette follows ChatGPT's: near-monochrome low-saturation greys, a white inverted primary button, very subtle borders. That palette has no vocabulary for state, so exactly two low-saturation semantic colors are added — one for voted/consensus, one for divergence — because "where is the disagreement" is the signal a revealed Round exists to communicate, and the eye reads color faster than it reads numbers.

Light mode is not a goal, but the token layer is what keeps it from becoming a rewrite: adding it later means defining a second set of values, not hunting hex codes through components. Hardcoding dark values in components is the one thing that would make this irreversible.

## Token values

The colours this palette is built from. These are starting values matched to the reference product — calibrate against it rather than treating them as sacred.

Since ticket 02 the one place they live is `apps/web/src/shared/ui/tokens.css`, which also holds the spacing, radius, typography and duration scales. Change a value there, and keep the table below in step with the colours.

| Token                            | Value     | Role                                               |
| -------------------------------- | --------- | -------------------------------------------------- |
| `--bg-base`                      | `#212121` | main surface                                       |
| `--bg-recessed`                  | `#171717` | wells, sidebars                                    |
| `--surface-elevated`             | `#2f2f2f` | inputs, cards, the secondary action                |
| `--surface-elevated-hover`       | `#3f3f3f` | the secondary action under the pointer             |
| `--border-subtle`                | `#383838` | dividers                                           |
| `--border-prominent`             | `#8e8e8e` | your own seat, and anything else found at a glance |
| `--border-focus`                 | `#8e8e8e` | the focus ring                                     |
| `--text-primary`                 | `#ececec` | body and headings                                  |
| `--text-secondary`               | `#b4b4b4` | supporting text                                    |
| `--action-primary-surface`       | `#ececec` | the primary action, inverted                       |
| `--action-primary-surface-hover` | `#ffffff` | the primary action under the pointer               |
| `--action-primary-text`          | `#171717` | text on the primary action                         |

The primary action is inverted — a near-white surface with dark text — rather than a brand colour,
which is why it reuses the text palette's values instead of introducing its own.

The two state colours are deliberately left unfixed here. They have to be desaturated enough to sit inside this palette without shouting, and choosing them against the real revealed-Round screen beats choosing them in the abstract. One reads as voted and consensus, the other as divergence.
