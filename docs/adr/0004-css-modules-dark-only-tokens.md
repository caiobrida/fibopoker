# CSS Modules with dark-only semantic tokens

Styling is CSS Modules plus CSS custom properties, with the design system in `apps/web/src/shared/ui`. Colors, spacing, typography and radii are defined once as semantic tokens on `:root` (`--bg-base`, `--surface-elevated`, `--text-secondary`, `--border-subtle`), and components reference tokens only — never literal values.

**styled-components was considered and rejected.** It entered maintenance mode in March 2025, with only critical and security fixes promised, for a limited time. The reason given upstream — incompatibility with React Server Components — does not apply to a Vite SPA, and an earlier draft of this project chose it anyway because the author's personal skill tooling was built around it. That tooling is not used in this repo, which removed the only real argument in its favour and left just the liability. CSS Modules is native to Vite, adds no dependency and no runtime, and nothing about it can be deprecated out from under the project.

**The product ships dark mode only, deliberately.** The palette follows ChatGPT's: near-monochrome low-saturation greys, a white inverted primary button, very subtle borders. That palette has no vocabulary for state, so exactly two low-saturation semantic colors are added — one for voted/consensus, one for divergence — because "where is the disagreement" is the signal a revealed Round exists to communicate, and the eye reads color faster than it reads numbers.

Light mode is not a goal, but the token layer is what keeps it from becoming a rewrite: adding it later means defining a second set of values, not hunting hex codes through components. Hardcoding dark values in components is the one thing that would make this irreversible.

## Token values

The colours this palette is built from. These are starting values matched to the reference product — calibrate against it rather than treating them as sacred.

Since ticket 02 the one place they live is `apps/web/src/shared/ui/tokens.css`, which also holds the spacing, radius, typography and duration scales. Change a value there, and keep the table below in step with the colours.

| Token                            | Value     | Role                                                |
| -------------------------------- | --------- | --------------------------------------------------- |
| `--bg-base`                      | `#212121` | main surface                                        |
| `--bg-recessed`                  | `#171717` | wells, sidebars                                     |
| `--surface-elevated`             | `#2f2f2f` | inputs, cards, the secondary action                 |
| `--surface-elevated-hover`       | `#3f3f3f` | the secondary action under the pointer              |
| `--surface-prominent`            | `#3f3f3f` | your own seat                                       |
| `--border-subtle`                | `#383838` | dividers                                            |
| `--border-prominent`             | `#8e8e8e` | your own seat, and anything else found at a glance  |
| `--border-focus`                 | `#8e8e8e` | the focus ring                                      |
| `--text-primary`                 | `#ececec` | body and headings                                   |
| `--text-secondary`               | `#b4b4b4` | supporting text                                     |
| `--action-primary-surface`       | `#ececec` | the primary action, inverted                        |
| `--action-primary-surface-hover` | `#ffffff` | the primary action under the pointer                |
| `--action-primary-text`          | `#171717` | text on the primary action                          |
| `--state-voted-surface`          | `#2b4034` | an Estimate is in, and later consensus              |
| `--state-voted-border`           | `#5c8f70` | the edge of the same                                |
| `--state-divergent-surface`      | `#50372b` | the highest and lowest Estimate in a revealed Round |
| `--state-divergent-border`       | `#a67359` | the edge of the same                                |

The primary action is inverted — a near-white surface with dark text — rather than a brand colour,
which is why it reuses the text palette's values instead of introducing its own.

**The voted colour was chosen in ticket 08**, against the real table rather than in the abstract: a
desaturated green that fills the Estimate slot in a seat and the card you picked out of the Deck.
Calibrated at a full table — at eight seats, five of them voted, the filled slots are findable in one
sweep of the eye and still quiet enough that nobody reads them as an alert. It carries consensus
later for the same reason it carries voted now: it is the colour of agreement, and a revealed Round
that lands on one number should look like this.

**The divergence colour was chosen in ticket 09**, against a real revealed Round holding `3`, `8`,
`8` and `21`. It is a clay rather than a red or an amber, because the brief was to be legible beside
the voted green without the two reading as a traffic light — and green with amber is exactly that
traffic light. Clay against moss is two states of one system instead.

It is derived from the green rather than picked beside it: the same construction at a warm hue, so
neither can shout louder than the other by accident. The one deliberate difference is saturation —
30% against the voted colour's 20% — which gives divergence slightly more pull, because it is the
thing the Reveal exists to send you looking at.

**Colour is not the only carrier of the extremes**, which is the one place this palette could not be
taken at its word. A revealed group also states its standing in its accessible name — "3, chosen
once, the lowest" — so a reader who cannot separate clay from moss still gets the signal. The ADR's
claim that the eye reads colour faster than numbers is about speed, not about colour being the only
channel.

Two cases wear the voted green instead, and both are consensus rather than exceptions: a Round where
every number agrees, and a Round holding a single Estimate. `?` and `☕` are never an extreme and
never agreement — they are not numbers, so they stay neutral.
