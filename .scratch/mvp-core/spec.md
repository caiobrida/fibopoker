# Spec: core voting flow

Status: ready-for-agent

Domain language is defined in `CONTEXT.md` and used throughout this document. The decisions behind it are recorded in `docs/adr/0001` through `0006`. The delivery order is in `plan.md`.

## Problem Statement

A development team estimates tasks in Fibonacci points together, and the hosted tool it uses for this gets in the way every single time.

Two things go wrong. First, the team has to open an incognito window to use it at all. Second, a room accepts only a limited number of votes; once that runs out mid-session, somebody has to generate a fresh room and get everyone to move, in the middle of a meeting with the whole team on the call.

The result is that a ceremony which should take one click of setup instead starts with a small ritual of workarounds, and can be interrupted by one halfway through. The team does not need accounts, permissions, integrations or reporting. It needs a link that works, that keeps working for as long as the session lasts, and that anyone can join without being a customer of anything.

## Solution

Anyone on the team opens the app and creates a Room. They get a link, copy it in one click, and paste it wherever the team already talks. Everyone who opens that link picks a nickname and is in — no account, no sign-up, no incognito window.

Inside the Room, the team estimates one task at a time. Someone titles a Round with what is being estimated, everyone picks a card from the Deck, and nobody can see anyone else's Estimate until the Round is revealed. The screen shows who is present and who has already voted, but never what they voted. When the team is ready, any Participant reveals, and every Estimate appears at once with identical values grouped and the disagreement highlighted — because the disagreement is the reason to talk.

After discussing, the team records the Final Estimate they agreed on, and opens the next Round. There is no limit on how many Rounds a Room holds. At the end, the session can be exported as a plain list of task and points to paste into the team's board.

## User Stories

### Creating and sharing a Room

1. As a team member, I want to create a Room without signing up, so that setting up a session costs one click instead of an account.
2. As a team member, I want a shareable link the moment the Room exists, so that I can paste it into the team chat before anyone has joined.
3. As a team member, I want to copy that link with one click, so that I am not selecting text out of the address bar while people wait.
4. As a team member, I want the link to keep working for the whole session, so that I never have to generate a new Room and migrate everyone mid-meeting.
5. As a team member, I want the Room's address to be unguessable, so that nobody outside the team can find it and watch us estimate.
6. As a team member, I want the Room to still exist days later, so that a link in a chat thread does not rot.
7. As a team member who created the Room, I want to be in it as a Participant right away, so that creating and joining are not two separate chores.
8. As a team member, I want a fresh Room for each planning, so that today's history is only today's work.

### Joining

9. As a Participant, I want to join with a nickname I choose, so that the team recognises me without me having an identity in the system.
10. As a Participant, I want to join from my phone, so that being away from my desk does not exclude me from the estimate.
11. As a Participant, I want to reload the page and still be me, so that a stray refresh does not cost me my vote or duplicate me in the list.
12. As a Participant, I want to rename myself, so that a nickname typed in a hurry can be fixed without me losing my place or my Estimate.
13. As a Participant, I want to leave a Room and rejoin as someone else in the same browser, so that a shared machine never forces anybody into an incognito window.
14. As a Participant, I want to be warned when my nickname is already used in the Room, so that two people called the same thing is a choice rather than an accident.
15. As a Spectator, I want to be present without estimating, so that I can bring the work and answer questions without my opinion anchoring the team's numbers.
16. As a Spectator, I want to start voting, and as a Participant to stop, so that my role in the session is not fixed by what I clicked on the way in.
17. As a Participant, I want to see who else is in the Room, so that I know whether we are waiting for anyone before we start.
18. As a Participant, I want people who closed their laptop to drop off the list, so that we are not waiting on somebody who left twenty minutes ago.

### Estimating

19. As a Participant, I want to see the whole Deck at once, so that choosing is a glance rather than a scroll.
20. As a Participant, I want to cast an Estimate with one click, so that voting does not interrupt the conversation.
21. As a Participant, I want to change my Estimate before the Reveal, so that something said in discussion can change my mind.
22. As a Participant, I want my Estimate hidden until the Reveal, so that I am not anchored by whoever voted first.
23. As a Participant, I want to see who has already voted without seeing what they voted, so that we know when we are ready without spoiling anything.
24. As a Participant, I want to see how many of the people present have voted, so that I can tell whether to wait or to prompt someone.
25. As a Participant, I want a `?` card, so that "I do not understand this task well enough to estimate it" is sayable without me inventing a number.
26. As a Participant, I want a `☕` card, so that asking for a break does not require interrupting the meeting out loud.
27. As a Participant, I want a `0` card, so that work that is already done or trivially small can be marked as such.

### Running Rounds

28. As a Participant, I want to title a Round, so that everyone is estimating the same thing and the history says what it was.
29. As a Participant, I want to open a Round without a title, so that a quick unplanned vote does not require paperwork.
30. As a Participant, I want to reveal the Round myself, so that the session never stalls waiting for one particular person to be at their keyboard.
31. As a Participant, I want to reveal before everyone has voted, so that one teammate who stepped away does not block the whole team.
32. As a Participant, I want nothing to reveal automatically, so that the Round opens up exactly when a human decides it should.
33. As a Participant, I want every Estimate to appear at the same instant, so that nobody gets to adjust after seeing a number.
34. As a Participant, I want identical values grouped together, so that I can read the shape of the team's opinion without counting cards.
35. As a Participant, I want the highest and lowest Estimates highlighted, so that the people who should explain their reasoning are obvious immediately.
36. As a Participant, I want no average or median on screen, so that the team discusses the difference instead of splitting it.
37. As a Participant, I want to record the Final Estimate the team agreed on, so that the session's outcome is the number we chose rather than one a formula picked.
38. As a Participant, I want to re-vote a task after discussing it, so that converging on a number is a normal part of the ceremony.
39. As a Participant, I want the first vote on a task to survive the re-vote, so that the record shows that we started far apart and converged.
40. As a Participant, I want to open the next Round and keep going indefinitely, so that a long refinement session never hits a wall.
41. As a Participant, I want to see the Rounds we have already finished, so that I can check what we said about an earlier task.

### Leaving with something

42. As a Participant, I want to export the session as a list of task and points, so that nobody transcribes fifteen lines by hand into the board afterwards.
43. As a Participant, I want the export to carry the Final Estimates, so that what reaches the board is what the team committed to.

### Being able to rely on it

44. As a Participant, I want other people's votes and arrivals to appear without me reloading, so that the screen is a shared view of the room rather than a snapshot.
45. As a Participant, I want the app to work the moment I open it, so that nobody has to wake a sleeping service minutes before a meeting.
46. As a Participant, I want a dark interface, so that it sits comfortably alongside the editor and terminal I already have open.
47. As a Participant, I want the Room to work in my normal browser profile, so that using the tool is not conditional on browsing privately.

## Implementation Decisions

### Shape of the project

Three workspaces in one pnpm-managed monorepo: the web app (Vite, React, TypeScript), the API (NestJS), and a shared package holding the contract between them. No task runner beyond pnpm until build times justify one.

The web app and the API deploy as two separate units, therefore two origins, therefore CORS on the API. The allowlist matches preview origins by pattern rather than by exact string, because each preview deployment gets a new hostname and a fixed origin makes every preview dead on arrival.

### The contract between the apps

The shared package is the single source of truth for every payload crossing the boundary, expressed as runtime schemas rather than as types. The API validates incoming requests with them; the web app derives its TypeScript types from the same schemas and reuses them for form validation. The package stays runtime-agnostic — nothing framework-specific, nothing browser-specific — since both sides build it.

The Deck is a constant in that package, so the values the UI renders and the values the API accepts cannot disagree.

### How state reaches participants

The web app polls a Room snapshot on an adaptive interval: frequent while a Round is open, slower when idle, slower still when the tab is in the background. Nothing is pushed.

Two rules make this reversible, and they matter more than the choice itself. No Room state lives in process memory — the database is the only source of truth, which is what allows the same domain to run unchanged behind a push transport later. And every snapshot carries a monotonically increasing revision for its Room, bumped inside the same transaction as any mutation to that Room's data; nothing writes without bumping it. The revision keeps polling cheap today and is what would make "send me everything after revision N" an addition rather than a rewrite.

On the client, exactly one module knows a transport exists. Everything else consumes Room state through it.

### Identity and presence

A Participant is identified by an opaque token, generated on joining and held in browser storage scoped to that Room. It travels in an `Authorization` header, never in a cookie: two origins plus a cookie means a third-party cookie, which browsers increasingly refuse. A token is valid only for the Room it was issued for.

Reading the snapshot doubles as the heartbeat — it touches the Participant's last-seen time, so presence costs no extra request. A Participant is active if seen within the activity window; beyond it they leave the list and stop counting toward the voted tally. The window is generous enough that a backgrounded tab does not evict anyone.

Time is injected, never ambient. Nothing reads the system clock directly, because the activity window is otherwise untestable without sleeping.

### Data model

Four entities: Room, Round, Participant, Estimate. A Room has many Rounds and many Participants; a Round has many Estimates; an Estimate belongs to one Round and one Participant.

Decisions worth naming:

- A Room's identifier is a short random string, not a sequential integer. The link is the only credential in the system, so enumerable identifiers would let anyone watch the team estimate.
- A Round is open or revealed, and the transition happens once, in that direction only.
- **A revealed Round is immutable.** Its Estimates are never updated or deleted afterwards. The Final Estimate is the single exception — it is nullable and may be written after the Reveal, because it comes out of the discussion that the Reveal starts.
- One Estimate per Participant per Round, enforced by the database rather than by application code.
- An Estimate stores the chosen value literally, not a reference to a Deck entry, so historical Rounds stay truthful if the Deck ever changes.
- Spectator is a property of a Participant, not a separate entity. Spectators are excluded from the voted tally, so their presence never makes the count unreadable.
- Leaving is asymmetric by design: a Participant who leaves takes their Estimate out of an **open** Round, so the tally stops counting a person who is gone; their Estimates in **revealed** Rounds stay, because history does not get rewritten when someone closes a browser.
- A re-vote creates a new Round carrying the previous title. It does not reopen the old one.

### API surface

Resource-shaped and small: create a Room; join a Room; read a Room snapshot; cast or change an Estimate; reveal a Round; open a Round; set a Round's Final Estimate; rename oneself; leave; switch between voting and spectating. One error shape for everything, defined in the shared package.

The snapshot is the only read, and it returns everything a client needs to draw the Room: its Rounds, the present Participants with whether each has voted, the open Round's state, and the revision. Clients never assemble Room state from multiple calls.

Domain failures are typed in the domain layer and mapped to status codes at the edge, so use cases never know about HTTP.

### Database and persistence

Plain Postgres, hosted on Neon, accessed through Prisma. No vendor-specific features of any kind — the dependency is the Postgres wire protocol, which is what keeps a move to self-hosted Postgres a matter of changing a connection string.

The runtime uses the pooled connection; migrations use the direct one. The Prisma client is a module-scoped singleton — instantiating per request exhausts the connection pool. The API instance is likewise cached at module scope so a warm invocation skips framework bootstrap.

### Interface

Dark mode only, deliberately. The palette is near-monochrome low-saturation greys with a white inverted primary action and very subtle borders. Because that palette has no vocabulary for state, exactly two low-saturation semantic colors are added: one for voted and consensus, one for divergence. Colour carries the signal a revealed Round exists to communicate, because the eye reads it faster than it reads numbers.

Styling is CSS Modules over semantic custom properties. Components reference tokens only — never a literal colour, spacing, radius or duration. Only the dark set of values is defined; the token layer is what keeps a light theme an addition rather than a rewrite.

The design system holds only primitives the screens actually need, with variants expressed as typed unions rather than boolean props, so mutually exclusive states cannot both be set.

### Continuous integration

Two GitHub Actions workflows with path filters, so a change to one app does not run the other's checks. The API workflow runs lint, build and the test suite. The web workflow runs lint and build — there are no frontend tests by decision, and its value is catching broken builds and style violations.

## Testing Decisions

### What makes a good test here

A test describes behaviour a caller can observe, and nothing else. It names a rule of the domain — not a function, not a class, not a database table. It must survive any internal restructuring that does not change what the system does: if renaming a method or reorganising a module breaks a test, that test was written against the implementation and is a liability.

### The seam

There is exactly one: the use cases. They are driven directly, with an in-memory implementation of the repository interface and an injected clock. No database, no HTTP, no request library. The suite runs in milliseconds and CI needs no service container.

The repository interface therefore earns its existence as a test seam rather than as speculative indirection — the in-memory fake is its second implementation. The injected clock is what makes the activity window testable: a test moves time forward instead of waiting.

### What gets tested

The invariants, stated as rules:

- A revealed Round refuses new and changed Estimates.
- A Round reveals once; revealing an already-revealed Round is an error.
- A Final Estimate may be set after the Reveal, and is the only thing that may.
- A Participant has at most one Estimate per Round; voting again replaces it while the Round is open.
- A Participant who leaves an open Round takes their Estimate with them; a revealed Round keeps it.
- A Spectator never appears in the voted tally, in either the numerator or the denominator.
- A Participant not seen within the activity window stops being present and stops counting toward the tally.
- A re-vote opens a new Round carrying the title, leaving the previous Round and its Estimates untouched.
- Every mutation to a Room's data advances that Room's revision.
- A Participant token is valid only for the Room it was issued for.
- An Estimate outside the Deck is rejected.

### Prior art

None — this is the repository's first test. These tests therefore set the pattern for everything after them, which is a reason to be deliberate about the seam rather than a reason to hurry.

### What is deliberately not covered

The Prisma repository and the migrations have no automated coverage. A wrong query or a migration that drops the wrong constraint passes CI green. This is an accepted trade, not an oversight: the queries carry no derived logic, the invariants that matter most are enforced by database constraints rather than by application code, and the real integration check is human — two separate browsers driving one Room before the feature is called done, then the team's first real session. ADR 0006 records this.

The web app has no tests at all by decision, which leaves the polling interval logic and the export formatting unverified except by use.

## Out of Scope

Accounts, login and any persistent identity across Rooms. Importing a backlog from a board or tracker. Average or median displayed anywhere. A host or facilitator role, and any permission model — every Participant can do everything. Light mode. Removing or muting another Participant. Reordering or deleting Rounds. Sound or desktop notification on Reveal. An "is choosing" indicator. A per-Round timer, which would need clock synchronisation between clients to avoid showing different numbers to different people. Editing a revealed Round's title. Pushing state over WebSocket or SSE, which ADR 0002 covers and which the revision field is designed to allow later.

## Further Notes

**The hosting is knowingly against the terms.** The deployment target's free tier is restricted to non-commercial use, and a tool a company's team uses for sprint estimation is not that. The risk was weighed and accepted — minimal traffic, no revenue — on the condition that portability stays a design property rather than an aspiration. Everything above that looks like over-caution (no vendor features, the database as sole source of truth, the revision field, the API as its own deployable) is what makes moving a weekend rather than a rewrite.

**Two escape hatches are already built in.** Moving the API to a long-running host makes WebSocket transport viable and touches one environment variable on the web side; the revision field means the client change is additive. Moving the database to self-hosted Postgres is a connection string.

**One platform limit is worth remembering** if push transport is ever revisited on the current host: a WebSocket connection there is capped at 300 seconds with no extension on the free tier, so every connection would need reconnect-and-resync logic regardless of how well it is written.

**Three micro-decisions are deliberately left open** and recorded in `plan.md`: the polling implementation (a data-fetching library whose refetch interval accepts a function, versus a hand-rolled hook), whether the Participant token is stored raw or hashed, and the routing library. None blocks starting, and the first only matters once the browser work begins.
