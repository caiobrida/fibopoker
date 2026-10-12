# 13 — Export the session

**What to build:** One action copies the session as a plain list of task and points, ready to paste into the team's board. Without it, somebody transcribes fifteen lines by hand at the end of every planning — which is the last place a tool should hand work back to a person.

What reaches the board is the Final Estimates: the numbers the team committed to, not the individual Estimates and not anything averaged.

**Blocked by:** 10 — Final Estimate and the next Round

**Status:** ready-for-agent

- [x] One action copies the whole session to the clipboard
- [x] The export carries Final Estimates, never individual Estimates and never a computed figure
- [x] Rounds that never received a Final Estimate are represented unambiguously rather than silently omitted
- [x] Rounds with no title are represented unambiguously
- [x] Pasting into a plain-text destination produces readable output

## Comments

**The export carries one more Round than the screen does, and that is the whole point.** The
snapshot splits the Rounds in two: `history` is `rounds.slice(0, -1)` and `round` is the current
one. A session normally ends on a Round the team just settled — which is the _current_ Round, not
a historical one — so an export built from `history` alone would drop the last task of every
planning. That is precisely the hand-transcription this ticket exists to kill, so `roundsAsText`
composes both. The visible consequence is that "4 finished Rounds" can sit above an export of
five lines; the list is about Rounds that are done, the export is about the session.

**An open Round reads `Still open`, not `No Final Estimate`.** Both are Rounds without a Final
Estimate, and collapsing them into one phrase passed the letter of the third criterion while
failing the word _unambiguously_ in it: a Round the team revealed and deliberately left unsettled
would have been indistinguishable from one the vote was still running on. `CONTEXT.md` already
has the distinction — "A Round is either open or revealed" — so the export borrows its words
rather than inventing a third. Caught by the spec review.

**One module owns how a Round reads.** `round-wording.ts` holds `An untitled Round`,
`No Final Estimate` and `Still open`; `FinishedRounds` and the export both import them. They had
already drifted inside a single ticket — the screen said `No Final Estimate` and the export said
`no Final Estimate` — which is a good argument that two copies of a phrase will not stay one
phrase. Both reviews found this independently.

**The separator is `→`, which `plan.md` named.** Stage 6 asks for a "`task → points` list for the
clipboard" and the first attempt used an em dash. The arrow is also the sturdier of the two: an
em dash is ordinary punctuation inside a title, so `Fix the login — again — 5` is three dashes
and no obvious separator, while an arrow in a task title is nearly unheard of.

**A title is forced onto one line, because the format promises one line per Round.**
`roundTitleSchema` only trims, so an embedded newline survives the API, and one pasted Round
would silently become two lines with the second missing its number. The `<input>` on
`OpenTheRound` cannot produce one, so this is a guard against the API rather than against the UI
— and it belongs in the formatter, which is what makes the one-line promise, rather than in the
shared schema, which would be a contract change for a reason the contract does not have yet.

**Blocked copying now persists until the next attempt, which changes shipped behaviour.** The
feedback timer used to clear _any_ outcome after two seconds, including `blocked` — so "select
the link above and copy it by hand" erased itself before it could be acted on. It now clears only
`copied`, a confirmation that should fade, and leaves `blocked`, a condition the person has to do
something about, until a later copy succeeds. Found by stubbing the clipboard and watching the
advice disappear. The Room link block inherits the fix.

**The blocked export also prints itself.** The link block's fallback works because the link is
already on screen to select; the export's is not — the current Round never appears in the
finished list, and a Final Estimate recorded moments ago is in the middle of the table, not in a
copyable line. So the `<pre>` is the export's equivalent of the visible link rather than an extra.
Not asked for by any criterion, and noted as an addition by the spec review.

**Verified against a throwaway local Postgres**, seeded through the HTTP API to reach every case
in one Room: a titled Round settled at 5, an untitled Round revealed and never settled, a title
carrying a newline and two spaces, a Round whose only Estimate was 21 and whose Final Estimate is
3, and a Round left open. One click, then a real `ctrl+v` into a text box, produced:

```
Make the login page responsive → 5
An untitled Round → No Final Estimate
Rewrite the parser → 13
Tune the slow query → 3
Still on the table → Still open
```

The fourth line is the second criterion: 21 was estimated, 3 was agreed, and 3 is what reaches the
board. The third line is a title that arrived with a newline in it. Also checked: the button
flips to `Copied` and back, a Room with no Rounds draws no panel at all, a 98-character unbroken
title wraps inside the panel instead of widening the page, and forcing the clipboard to reject
raises the Alert and the hand-copy list and keeps them up.

**What the review moved.** `nameOf` was doing two things under one name and became `nameOf` over
`onOneLine`. `RoundOnTheRecord` and `onTheRecord` read as a status rather than a title-and-outcome
pair, and disappeared — the module now maps Rounds straight to lines. `CopyOutcome` and
`Clipboard` were exported with no importer, and `Clipboard` shadowed the DOM type; both are local
now, the second as `CopyAction`, which is what `shared/api` calls this shape. The hook had also
lost something in the extraction: `.then(ok, fail)` only catches a rejection, but
`navigator.clipboard` is _undefined_ over plain http, so a phone opening a LAN address during
ticket 14 would have thrown past the handler and shown nothing at all. The `try`/`catch` the
original had is back.

**Three findings were declined.** Collapsing `ShareBlock` and `ExportBlock` into one panel would
share a shape they only rhyme in — the heading, the button label, the explanation, the preview
element and where it sits all differ, which is five parameters to save eight lines, and the part
that was genuinely duplicated is the behaviour, which `useClipboard` already took. `FEEDBACK_MS`
is a literal duration sitting next to `motion.ts`, but it must not become a motion token: ADR 0009
zeroes those under `prefers-reduced-motion`, and a confirmation that shows for 0ms is a
confirmation nobody sees. And "Take it to the board" uses a word on the Room's `_Avoid_` list,
which bans it as _another name for the Room_ — the same way "table" is banned and the Room is
drawn as one. The board here is the team's tracker, somewhere else entirely, which is the sense
`spec.md` uses it in.

**What was not checked.** Phone width — ticket 14 owns it, and the panel is `ShareBlock`'s twin,
so the sweep will find them together. The long-title wrap was checked at desktop width only,
though an unbroken 98 characters already overflows the 34rem panel there, which is the case that
matters.
