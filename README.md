# MVA Stages

A filterable board of research internship offers for students of the
[M2 MVA](https://www.master-mva.com/) (ENS Paris-Saclay). Offers are collected by periodic
sweeps of company portals, research institutes, job boards and the MVA's own list, and by
students who add what they find. Every entry links to the original posting.

The data can be wrong or out of date. The original posting is always what counts.

Not an official ENS Paris-Saclay or MVA service.

Live at **https://mva-stages.vercel.app**.

Stack: Vite, React, TypeScript, Tailwind CSS and React Router (static SPA on Vercel), Supabase
(Postgres with row level security). Build plan and QA: `docs/PLAN.md`, `docs/QA.md`.

## Run it locally

Requires Node 22, Docker and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
supabase start          # API on http://127.0.0.1:55321, Postgres on 55322
supabase db reset       # applies migrations and loads supabase/seed.sql
npm ci
# .env.development.local: VITE_SUPABASE_URL=http://127.0.0.1:55321 and
# VITE_SUPABASE_PUBLISHABLE_KEY from `supabase status` (see .env.example)
npm run dev
```

`npm test`, `npm run lint` and `npm run build` must pass before a PR.

## Update the offers

```bash
python3 -I scripts/pull_remote.py [--apply]                   # read dashboard edits, submissions, reports
python3 -I scripts/check_status.py [--groups health_fr]       # pre-check which known offers are still up
python3 -I scripts/merge.py data/incoming/YYYY-MM-DD/*.json   # add sweep results and coverage
python3 -I scripts/dedupe.py pairs.json                       # collapse confirmed duplicates
python3 -I scripts/build_seed.py                              # validate and regenerate the seed
```

With Claude Code, `/sweep` runs the whole sweep (`/sweep recheck`, `/sweep 5`, `/sweep sync`
for parts of it). See `CLAUDE.md` for the data rules and `data/organizations.json` for the
organizations every sweep checks.

## Contributing an offer

Use "Add an offer" on the site. It shows up right away, marked unverified until a maintainer
checks it. To fix or remove an entry, use "Something is wrong" on the offer or use the contact form in the legal notice.
