# 06 — The Room is a table

**What to build:** The Room stops being a list of names and becomes a table the team sits around. Participants take seats as they arrive, the seating stays balanced whether two people showed up or ten, and the middle of the table is where the Round will happen.

Ticket 05 made the Room keep itself current; it currently expresses that as a `<ul>` that gets longer. The same facts — who is here, who just arrived, who dropped off — read completely differently as people appearing around a table, and that reading is the product. Somebody opening the link before the meeting starts should see the team assembling.

This lands before ticket 08 on purpose. The Deck, the voted state and the Reveal all need somewhere to live, and that somewhere is a seat. Building them against a list first would mean re-homing every one of them afterwards.

**It also establishes the motion vocabulary**, because this is the first screen with something worth animating. Durations and easings join the token layer the way colour did in ticket 02, so that tickets 08, 09 and 15 reach for a named curve rather than inventing one — and so that the motion pass later is a sweep rather than a reconciliation.

**Blocked by:** 05 — Live Room

**Status:** ready-for-agent

- [x] Participants are seated around a table rather than listed in a column
- [x] The seating stays balanced at any count the Room realistically holds, from one person to a dozen
- [x] Somebody arriving takes a seat with motion that draws the eye to them
- [x] Somebody dropping out of the activity window vacates their seat, and the remaining seats rebalance by moving rather than by snapping
- [x] Your own seat is identifiable at a glance without reading the names
- [x] Each seat has a place for the Estimate that ticket 08 will put there, so nothing has to be re-homed
- [x] The middle of the table carries the Round's state, and says what it is waiting for while no Round exists
- [x] The table is visible to somebody who has not joined yet, so the nickname form is answered next to a Room that is visibly filling up
- [x] Duration and easing tokens live in `tokens.css` alongside the rest, and no component introduces a literal one
- [x] Every animation is suppressed under `prefers-reduced-motion`, and the screen is still fully legible with it on
- [x] Nothing animates on every poll — an unchanged Room is a still screen

## Notes

The shape comes from a planning-poker product the maintainer uses; it is a reference, not a thing to reproduce. What matters is seats around a table, filling in as people arrive.

Where this ticket says a motion should "draw the eye", taste decides — the criterion is that the arrival is noticeable without being disruptive to somebody mid-sentence, and that is a judgement to make on the real screen rather than a number to specify here.

Seating geometry is the one genuinely open question. An even distribution around an ellipse reads best at larger counts; two people facing each other across the table reads best at two. Whether that is one layout that degrades well or two layouts with a threshold between them is worth deciding at the keyboard, against both cases, rather than guessing here.

ADR 0004 governs: no literal colours, spacings, radii or durations in components. If the table needs values the token layer cannot express, that is a reason to extend the token layer, not to bypass it.

## Comments

**The seating question went the simple way: one layout, no threshold.** The ticket left open whether an even ellipse and a two-people-facing-each-other case were one layout or two. They are one. Seats are spaced evenly **by arc length** rather than by angle, starting at top centre — and arc-length spacing on an ellipse puts two people at top and bottom, which is facing each other across the table. Three gives a top and two at the near corners, four gives the cardinal points, twelve gives an even ring. Angle-even spacing would not have done this: on a 1.5 ellipse it bunches seats at the left and right ends, which is exactly where the seats are tallest and the room is tightest. `seatsAround` walks the perimeter once and drops an occupant every `perimeter / count`, which is a dozen lines and removes the threshold the ticket was braced for.

**The table's size was solved rather than eyeballed, because twelve is genuinely tight.** The first pass looked right at four and overlapped at twelve — on the flanks, where consecutive seats are stacked almost vertically and a seat is taller than it is wide. The binding constraint is the vertical gap at the ends of the ellipse, and seat _width_ barely enters into it. Searching the geometry gave a 44rem table at aspect 1.5 with 6 × 8rem seats, which clears twelve by 0.5rem. One consequence worth knowing: making the table _wider_ helps far less than making it _rounder_, so a future squeeze should spend its budget on the aspect.

**Reduced motion is implemented by zeroing the duration tokens, which makes it unforgettable.** The media query redefines `--duration-*` to `0ms` on `:root` and nothing else in the app mentions the preference. It is airtight only because ADR 0004 already forbids a component from writing a literal duration — a duration a component cannot spell is one it cannot smuggle past the preference. ADR 0009 records this along with the two obligations it creates: keyframes must end at the resting state, and JavaScript that needs a duration reads the token through `motionDuration()`.

**A hidden tab freezes animations, so the vacated seat is cleaned up by a timer.** This was found the hard way and is the one genuinely surprising thing in the ticket. With the tab not rendering, Chrome freezes CSS animations at `currentTime: 0`, never fires `animationend`, and never resolves `Animation.finished` — all three measured here, not assumed. The first implementation released a vacated seat on `onAnimationEnd` and therefore leaked an invisible, `aria-hidden` seat every time somebody dropped out of a backgrounded Room, which ADR 0008 guarantees will happen: a tab behind an editor keeps polling at 30s and keeps learning that people fell outside the activity window, with no frame ever drawn. A `setTimeout` reading `--duration-departure` is throttled in that tab but does fire. ADR 0009 generalises the rule: nothing may depend on an animation event for correctness.

**Durations are named for moments, not magnitudes**, so `--duration-fast` became `--duration-feedback` and joined `--duration-departure`, `--duration-settle` and `--duration-arrival`. Tickets 08, 09 and 15 are supposed to reach for a named curve; a magnitude name would make them guess. `Button`'s literal `ease` became `--ease-standard` in the same pass, which was the only easing literal in the codebase.

**`ParticipantList` is gone** and `CONTEXT.md` gained a sentence. The domain language lists "table" among the words to avoid _for a Room_, which this ticket's own title appears to break. It does not: the table is furniture drawn inside a Room, not another word for it. The component is `RoomTable` so that it can never be read as the Room, and the glossary now says so rather than leaving the next reader to resolve the clash.

**Each seat already has the Estimate's place in it** — a quiet dashed slot sized by `--estimate-width` / `--estimate-height`, sitting above the nickname and reserving its space now so ticket 08 fills a hole rather than re-homing anything.

## Left for ticket 14

**The table has a working width, and below it seats overlap.** This is not only a phone problem, which is how an earlier draft of this note under-sold it — a half-height browser window on a laptop is already inside the range. The table is `viewport − 128px` up to its 832px cap, and the smallest viewport each count needs:

| Participants | 2–4    | 5–6    | 7      | 8–10   | 12     |
| ------------ | ------ | ------ | ------ | ------ | ------ |
| Needs        | ~360px | ~460px | ~525px | ~640px | ~790px |

So a dozen people need a nearly full-width desktop window, and a typical six fit on a phone. The fix is not a smaller seat — the geometry search above shows seat _width_ barely moves the binding constraint, which is vertical spacing at the flanks — so it is probably the whole figure scaling down as a unit, or a different arrangement below a breakpoint. That is the call ticket 14 exists to make, and ticket 07 later added the laptop half of the same problem to it. Nothing here is in its way: the ring comes from one aspect constant and the seat metrics are four tokens.

## How it was verified

The web app has no test runner and ADR 0006 puts the only test seam at the API use cases, which this ticket does not touch — so this was verified by driving the real components in Chrome. The seating geometry, arrival, rebalance, departure and the reduced-motion case were exercised against a temporary harness feeding `RoomTable` a scripted roster, and the whole screen was then driven through the real `RoomScreen` and the real polling path against a stub API: join, the table filling up, your own seat, the share block. Measured rather than eyeballed: twelve seats clear by 8px; an identical roster creates no new animations and no transitions, and leaves every existing animation object untouched; under zero-duration tokens arriving seats land at full opacity and scale, and departing seats are released immediately; and no seat clips at `NICKNAME_MAX_LENGTH`, checked with an unbroken 24-character name as well as a real 22-character one on the self seat, which carries an extra line.

**One thing could not be checked this way, and is worth a human's eye.** The automated browser drives a tab that never renders, and Chrome freezes CSS animations in exactly that state — the same fact this ticket had to design around. So the motion was verified by its mechanics (which animations exist, on which elements, at what progress, and that an unchanged Room produces none) but never watched at speed. Whether the arrival "draws the eye without being disruptive to somebody mid-sentence" is the ticket's own taste call and is still open: it is a 0.6→1 scale with a border flash over 440ms. `pnpm dev` and a second browser is the way to settle it.

## From the review

Two axes were reviewed. The standards axis found no hard violations; both axes found real defects, and the fixes are in the same branch.

**The seat layer was swallowing clicks aimed at the middle of the table.** `.seats` is a full-bleed `ul` stacked over `.middle`, so anything ticket 08 puts in the centre — the Round title, the Reveal — would have been unclickable, and the failure would have looked like a broken button rather than a stacking order. `pointer-events: none` on the layer, `auto` on each seat. This is the kind of thing that is nearly free now and baffling in three weeks.

**Your own seat was borrowing `--surface-elevated-hover`,** whose documented role in ADR 0004 is "the secondary action under the pointer" — so your seat was literally styled as though it were hovered. It gets its own `--surface-prominent`, the same way the border already had `--border-prominent`. Reusing a token because the value happens to match is exactly the habit the semantic layer exists to prevent, and this one slipped through on the first pass.

**A long nickname clipped.** `NICKNAME_MAX_LENGTH` is 24, and the first sizing was checked against short names; at 22 characters a seat overflowed by 8px, worst of all on the self seat, which spends a line on "you". A pathological 24-character name of wide glyphs needs three lines at any width the ring can afford, so growing the seat does not solve it — the nickname is clamped to two lines with an ellipsis and the full name is on `title`, and the seat went to 8rem, which costs a quarter of the twelve-seat clearance.

**`motionDuration` read `0.2s` as 0.2ms.** Only `ms` tokens exist today, so this was latent, but a silently wrong duration is the worst kind of wrong; it now handles both units.

Smaller: `ringPerimeter()` was recomputing 720 samples on every call when it is a constant, and `presence()`, `ringSpeedAt()` and `sampleLength()` were each named for something other than what they return — which matters more here than usual, since this repo bans the comment that would have explained them.

**One finding was investigated and does not hold.** The review flagged that seat position derives from array index while `PrismaRoomRepository.findById` loads participants with no `orderBy`, so Postgres row order could re-rank every seat on an unchanged Room. It cannot: `snapshotOf` sorts by `joinedAt` with `id` as a total tiebreak before the snapshot leaves the domain, so repository order never reaches the client. Ticket 06 does make that sort load-bearing in a way it was not before, which is worth knowing — but it is already there.

**One change was unrequested and is kept deliberately.** The Lead no longer ends with "Paste this link wherever the team talks — it keeps working for as long as the team keeps using it"; that sentence moved into the share block. With the table now sitting between the Lead and the link, "this link" had nothing nearby to point at. It is editorial, it was not asked for, and it is a consequence of the layout this ticket introduces rather than a separate opinion.
