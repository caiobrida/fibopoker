# Motion is a token, and reduced motion zeroes it

Durations and easings join `tokens.css` the way colour did in ticket 02, named by the moment they belong to rather than by their magnitude: `--duration-feedback` (an element acknowledging the pointer), `--duration-departure`, `--duration-settle` (something moving to a new place), `--duration-arrival`, and the curves `--ease-standard`, `--ease-entrance`, `--ease-exit`.

The names are roles because the mapping from moment to duration **is** the design decision. `--duration-fast` tells the next ticket nothing about whether a Reveal should use it; `--duration-arrival` tells it that an arriving thing already has an answer. Ticket 15 is meant to be a sweep rather than a reconciliation, and that only works if tickets 08 and 09 reach for a named moment instead of inventing a curve.

## Reduced motion is the token layer, not a separate rule

`prefers-reduced-motion: reduce` redefines the duration tokens to `0ms` on `:root`. Nothing else in the app mentions the preference.

This is the whole mechanism, and it is airtight only because of ADR 0004's existing rule that a component never writes a literal: a duration a component cannot spell is a duration it cannot smuggle past the preference. A component added next year is covered without its author having thought about it, which is not true of the usual blanket `*, *::before, *::after { animation-duration: 1ms !important }`. That alternative works, but it sits outside the token layer, it overrides rather than configures, and JavaScript cannot read it.

Two obligations follow for anything that animates:

- **Keyframes end at the resting state.** A zero-duration animation lands on its `to` frame immediately, so `to` must be what the element looks like at rest. An animation that fades _to_ nothing is fine; one that leaves the element mid-transform is a blank screen for a reduced-motion reader.
- **JavaScript reads the token.** `motionDuration()` in `shared/ui/motion.ts` resolves `--duration-*` off `:root`, so code that has to outlast a motion gets `0ms` under the preference for free, and the token layer stays the single source.

## Nothing may depend on an animation event for correctness

A hidden tab stops rendering, and Chrome then freezes CSS animations: `currentTime` stays at zero, `animationend` never fires, and `Animation.finished` never resolves. All three were measured in this project's own Room screen, not assumed.

That is not an edge case here. ADR 0002 has every client polling, ADR 0008 keeps a backgrounded tab polling at 30s, and ADR 0008 computes presence at read time — so a tab behind somebody's editor goes on learning that Participants have dropped out of the activity window while no frame is ever drawn. The seat that empties has to be cleaned up on a timer, because the event that would announce its exit animation is never delivered. `setTimeout` is throttled in that tab but it does fire, which is the only reason the app can rely on it.

So an exit animation may _look_ like the thing that ends a component's life, but the timer is what actually ends it, and the animation only has to finish before the timer does.
