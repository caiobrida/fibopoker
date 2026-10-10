# Plain Postgres on Neon, with no platform features

Supabase was the original choice, but its free tier pauses a project after a week of inactivity and **unpausing is a manual dashboard action**. A team that estimates once per sprint would routinely find the database paused minutes before a session — the exact kind of "the tool is not there when I need it" failure this project exists to fix. Neon suspends far more aggressively (5 minutes idle, not disableable on free) but resumes automatically on the next query, with no human in the loop.

The decision is as much about what we don't use as where we host. We depend on **nothing but the Postgres wire protocol**: no vendor SDK, no hosted auth, no row-level security, no realtime. Portability is a property of the code, not the host — Supabase does not lock you in with Postgres, it locks you in with `supabase-js`, its auth and its RLS. Writing standard SQL and standard migrations keeps the move to a self-hosted Postgres a matter of changing `DATABASE_URL`.

## Consequences

- Any future need for real user accounts means building auth or adding a provider; we cannot reach for a bundled one.
- Neon was acquired by Databricks in 2025, so its free tier may change. This is symmetric across free tiers and is mitigated by the no-proprietary-surface rule above, not by the choice of host.
