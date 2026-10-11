# 07 — Design the entry screens

**What to build:** The two screens standing between somebody and a Room — create a Room, and pick a nickname — currently look like a paragraph and an input centred on a dark page. They work, and ticket 04 proved they work, but they are the first and often only impression the product makes, and right now they make none.

The deal the product offers is unusually good: no account, no sign-up, no private window, a link that keeps working. A screen that states that in plain body text is underselling it. These two screens should look like somebody designed them.

**Blocked by:** 06 — The Room is a table

**Status:** ready-for-agent

- [x] The create screen is composed rather than centred text, and what it promises — no account, no sign-up, no limit — is part of the design rather than a sentence under a heading
- [x] Creating a Room is visibly the one thing to do on that screen
- [x] The nickname screen treats choosing a name as an event, not as filling in a form field
- [x] Somebody arriving at a Room link sees who is already there while they type, which is what ticket 06's table makes possible
- [x] The transition from the nickname screen into the Room is animated rather than a swap, so taking a seat feels like entering
- [x] Validation still comes from `nicknameSchema` in the shared package, and still reads as a sentence a person wrote
- [x] The warning about a nickname already taken is designed rather than appended as a note
- [x] Both screens hold up at phone width, since this is where somebody joining from their phone starts
- [x] No literal colour, spacing, radius or duration is introduced

## Notes

This ticket is mostly taste, and the criteria above are deliberately about composition and hierarchy rather than about a particular look — there is no mockup, and inventing one in prose would be worse than deciding at the keyboard against the real screen.

Two constraints are not taste, though, and they bound it. ADR 0004 fixes the palette: near-monochrome low-saturation greys with one inverted near-white primary action, dark only. And whatever lands here has to survive ticket 14's phone-width pass, so a composition that only works wide is not finished.

What **not** to do: add a logo, a brand colour, an illustration library or a font that is not already in the token layer. The palette is deliberately quiet, and the way to make these screens good is composition, type scale, spacing and motion — not decoration bolted onto a design system that has no room for it.

## Comments

**The create screen's promises became its bottom third.** "No accounts, no sign-up, no limit" was one clause inside the Lead, which is the weakest place a promise can sit — it reads as filler and the eye skips it. It is now three headed terms below a rule, in an `auto-fit` grid that is three columns on a laptop and one on a phone, and each one says something the other two do not: `No account` is about identity, `No sign-up` is about what you have to do before you start, `No limit` is about the Room outliving the meeting. The Lead that remains explains the mechanic instead of the terms, which is what a lead is for.

The product name moved out of the heading and became a quiet tracked wordmark above it, so the display line can say what the product does rather than what it is called. There is one interactive element on the page and nothing competes with it; "visibly the one thing to do" is whitespace and position, not a louder colour, because ADR 0004 has no second colour to reach for.

**The hero is vertically centred by `min-height: calc(100dvh - …)` plus `justify-content: center`,** which is the safe form of centring: when the content is taller than the viewport the container grows and nothing is clipped off the top. The `height: 100vh` version of this loses the top of the page on short windows, and on a phone the terms band makes that the normal case.

**The nickname screen's question is the field's label.** That is the whole of criterion 3's "an event, not a form field": there is no `Your nickname` caption above a box. The `<h1>` invites — `Take a seat` — and the `<label>` asks `What should the team call you?` at `--text-lg` in primary text, with a large field under it and a full-width action under that. Keeping it a real `<label htmlFor>` rather than an `aria-labelledby` pointing at the heading means the association is the plain HTML one, and the question is what a screen reader announces for the field.

**Who is already there is said twice, on purpose.** The panel names them — `Ana, Bruno and Carla are already at the table.` — and the table below seats them. This looks like redundancy and is not: on a phone the software keyboard covers everything below the field, so the table is exactly what a person cannot see at the moment they are typing, and the sentence is what survives. They also carry different information, names versus the shape of the Room. Names are spelled out up to four, and only from five does it become `Ana, Bruno, Carla and 5 others` — an earlier pass capped at three and produced `and 1 more`, which spends a word hiding a name it could have said.

**The entry panel is kept mounted for `--duration-departure` after the Room says you are in.** `useArrival` watches the snapshot's status and reports `standing`, `taking-a-seat` or `seated`; the panel sinks and fades while your own seat arrives on the ring with ticket 06's existing `arrive`, and only then do the Room's banner and share block rise into place. The hold is a `setTimeout` reading the token through `motionDuration`, never an `animationend` — ADR 0009 forbids depending on an animation event for correctness, and a tab that is not rendering never delivers one.

Two details in that hook are deliberate. It takes the previous status as well as the current one, because `resolving → present` (a reload with a token) and `unidentified → present` (actually joining) have to behave differently, and only the second is somebody taking a seat; without that distinction a reload flashes the nickname panel for 200ms. And it assigns the state in a `useLayoutEffect` rather than a `useEffect`, so the correct branch is committed before the browser paints — the same reason `useSeating` uses one.

The table stays at the same position in `Screen`'s children across the transition, so React reconciles it rather than remounting it. If it remounted, every seat would replay its arrival and the one arrival that matters — yours — would be lost in the crowd.

**The nickname clash is now warned about before the join, not only after it.** Ticket 04 derived the warning from the snapshot once you were in, which was right and stays. What it could not do is tell you while there is still time to pick another name, and that is the warning criterion 7 is about. It appears as you type, it never disables the action — ticket 04's rule that a taken nickname does not refuse the Participant is a domain rule and this is presentation — and the comparison is the case-insensitive one ticket 04 settled on, now in `routes/nicknames.ts` so the before and after halves cannot drift apart.

**`maxLength` means only one of `nicknameSchema`'s two messages is reachable, and that is the right trade.** The field is capped at `NICKNAME_MAX_LENGTH`, which stops typing and pasting past it, so `A nickname is at most 24 characters.` can never fire — a hard stop beats an error about something the person cannot see they did. What is left is `A nickname cannot be empty.`, shown once the field has been touched and holds only whitespace, and it is still the schema's own sentence rather than a second copy written in the component. The message is built by joining every issue's message, so if the schema grows a third rule the screen says it without being changed.

**`Alert` is a new primitive and is deliberately colourless.** Three things needed to be found at a glance — the refused nickname, the nickname already taken, a call that failed — and all three were `Note`, which is the same small grey text as every caption on the page. ADR 0004 fixes exactly two state colours and reserves both for the revealed Round, so there is no warning colour to use and inventing one would be the decoration this ticket rules out. `Alert` is therefore an inset well with a `--border-prominent` leading edge, which is the documented role of that token: "anything else found at a glance". It carries no tone prop, because a tone that cannot change anything is a prop that lies.

**Four primitives gained a `size` of `regular | large`** — `Heading`, `Lead`, `Button`, `Input` — rather than the two screens declaring their own type scale in route modules. The point of ADR 0004's token layer is that the scale is decided in one place, and a route CSS module writing `font-size: var(--text-hero)` is only one step better than writing `3.25rem`. `Input`'s had to `Omit` the native `size` attribute, which is a number and silently collapsed the union to `never`.

New tokens: `--text-lg`, `--text-hero` (a `clamp`, so the headline is 36px on a phone and 52px on a laptop without a media query), `--tracking-wide`, `--space-10`, `--measure-column` and `--measure-narrow`. `text-wrap: balance` on headings and `pretty` on leads went into `shared/ui` rather than into the hero, since no heading in this app wants a one-word last line.

### How this was verified

The web app has no test runner and ADR 0006 puts the only seam at the API use cases, which this ticket does not touch, so this was driven in Chrome against a stub API: the create screen and its failure, a Room with nobody in it, with three, four and eight Participants, the validation and clash messages, joining, and a reload while already identified.

Checked rather than assumed: the refusal is `nicknameSchema`'s own sentence and not a copy; the clash warning leaves the action enabled; `aria-describedby`, `aria-invalid`, the polite live region and the autofocus are all on the field; the heading outline is one `h1` per screen; and with the duration tokens forced to `0ms` the panel is released immediately and the panel, banner, share block and every seat sit at full opacity with no transform and no animation running — ADR 0009's "keyframes end at the resting state" holds for all three new ones.

**The motion was again verified by its mechanics rather than watched,** for the reason ADR 0009 records. The automated tab never renders, so Chrome throttles its timers to about a second and freezes animations — measured here, not assumed: a 15ms polling loop produced two samples in 1500ms. What that tab can still prove is that the right animations are created on the right elements at the right moment, that the panel is released even when every timer is throttled, and that nothing is left behind. Whether the sink-and-rise reads as entering a room is a taste call that needs `pnpm dev` and a human.

### Left for ticket 14

**On a laptop the entry screen shows the panel and the top of the table; on a phone it shows both whole.** This is the inverse of what one would guess, and it is ticket 06's table geometry rather than anything this ticket introduced: the table is capped at 832px and is 1.5 times as wide as it is tall, so at full size it needs 683px of vertical space, and a 945px window has room for it or for the panel but not for both. A phone's table is small enough that the whole figure fits under the panel.

Three ways out were considered and all three belong to ticket 14 rather than here. Capping the table narrower on the entry screen fits it on a laptop but makes seats overlap at counts that currently do not overlap, which trades a layout problem for one that looks like a bug. Putting the panel beside the table needs the Room to be wider than `--measure-wide`, which is a decision about the Room, not about the entry screen. Putting the panel in the middle of the table — where ticket 08's Round will go — is the nicest composition of the three and is impossible at phone width, where the ellipse's middle is about 116px across.

The eight-Participant case already overlaps at phone width, which is ticket 06's documented debt and is unchanged by this ticket.

## From the review — not yet acted on

Both axes ran against `main...HEAD`. The standards axis found one hard violation, the spec axis found one real bug; the rest are judgement calls. **None of this is fixed yet** — the commit on this branch is the pre-review state.

### Hard

**"Everyone you send the link to is one click from the table" breaks CONTEXT.md.** On the create screen. The glossary lists `table` among the words to avoid _for a Room_, and in that sentence the table is the destination of the Room link, which is the Room. Every other use in the diff is the furniture (`alreadyAtTheTable`, "already at the table") and is correct. The fix is that one sentence.

**A second join is reachable for `--duration-departure`.** While the panel is `leaving` it is still interactive: the mutation has succeeded so `action.isJoining` is false, `typed` is intact, and focus is still in the field, so a second Enter calls `join` again and adds a duplicate Participant. This is not purely a regression — before this ticket the same window existed and was longer, lasting the whole invalidate-and-refetch round trip rather than 200ms. The fix belongs in `useJoinRoom`: expose the mutation's success as `joined` and include it in the action's `disabled`, which closes both windows and still allows a retry after a failure.

### Real, worth fixing

**The transition still ends in a swap.** `sit` fades and sinks the panel but never collapses it, so when it unmounts a roughly 400px card is replaced by a roughly 120px banner and the table jumps up in one frame. The animated half is the panel; the half criterion 5 is actually about — the Room arriving — is still a cut. Collapsing the panel's height as it leaves (a `1fr → 0fr` grid row on a wrapper, with `overflow: hidden` on the card) turns the big movement into motion and leaves only the banner's own entrance to account for the rest. This was invisible to the verification done here for the reason recorded above: the automated tab never renders.

**`Alert` borrows `--border-width-focus` for its leading edge.** The focus ring's width used as a decorative accent — the same token-for-its-value habit ticket 06's review rejected for `--surface-elevated-hover`. It wants its own width token paired with `--border-prominent`.

**The alerts outside the entry panel are never announced.** `Alert` carries no role, and the panel's polite region is what announces the two inside it. The Room's "somebody else answers to that nickname too" and the share block's "the browser blocked copying" sit outside any live region, so a screen reader is told nothing. `role="status"` on `Alert` itself covers all five uses with one mechanism.

**`useArrival` commits a throwaway `EntryPanel` on reload.** On `resolving → present` the layout effect corrects `arrival` to `seated` before paint, so nothing is visible — but the leaving panel is mounted and unmounted first, autofocus and all. Deriving the state during render instead, with the previous status held in state rather than a ref, removes the commit rather than hiding it.

### Judgement calls

- `@keyframes approach` and `@keyframes arrive` are byte-identical in two modules; the rise-in belongs once in `shared/ui`.
- `min-height: calc(100dvh - var(--space-8) * 2)` on the hero re-derives `Screen`'s own padding, and drifts silently if that padding changes. `Screen` should expose it as a custom property the child can read.
- `.consequence` and `.verdict` do not say what they hold, and `listing()` reads as a noun.
- `export type Arrival` has no importer, and `same()`'s `.trim()` is unreachable because `nicknameSchema` already trimmed both sides.
- Two of the five `Alert` sites are on the joined Room rather than an entry screen. The duplicate-nickname one is criterion 7 and belongs here; the copy-blocked one is unrequested, and is kept so that this ticket does not leave two spellings of the same role in the same file.

### One claim in these notes is wrong

"Only from five does it become `Ana, Bruno, Carla and 5 others`" — with `NAMES_SPELLED_OUT = 3`, five Participants read "and 2 others". The rule and the code are right, the example is not.

### The laptop fold does not belong to ticket 14

The note above parks it there. That is wrong and should not be relied on: every one of ticket 14's criteria is phone-width, and none of them picks up a composition that clips on a laptop. This ticket also made the case worse than it found it, since the panel is taller than the `aside` it replaced. It needs a decision of its own rather than a ticket that will not look for it.
