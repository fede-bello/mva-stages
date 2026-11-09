# MVA stages board

A filterable board of research internship offers for students of the M2 MVA (ENS Paris-Saclay),
backed by Supabase. There is no sign-in: anyone can browse and filter offers, add new ones and
flag wrong information. The data is gathered by periodic sweeps (`/sweep`) and by students'
submissions.

## Layout

| Path | What it is |
|---|---|
| `data/offers.json` | **Source of truth for swept offers.** One object per offer, sorted by organization |
| `data/privacy-denylist.txt` | Regexes that must never appear in the data (generic). A gitignored `.local.txt` holds the maintainer's own identifiers |
| `data/incoming/` | Gitignored scratch area for sweep results before merging |
| `scripts/merge.py` | Merges sweep results into `data/offers.json` (dedupe by slug, reference, title) |
| `scripts/build_seed.py` | Validates `data/offers.json` and writes `supabase/seed.sql` as upserts on `slug` |
| `supabase/migrations/` | Schema, RLS and triggers |
| `supabase/seed.sql` | Generated. Never edit by hand |
| `.claude/skills/sweep/` | How to run a sweep |

Run Python with `python3 -I` (no third-party deps).

## Data model

`public.offers` (see the migration for the constraints):

- Identity: `slug` (unique, stable), `organization`, `title` (original language), `title_en`, `org_type`, `reference`.
- Place: `city`, `country` (English name), `work_mode`.
- Content: `topics` (fixed list in the migration and in `build_seed.py`, keep both in sync), `description`, `requirements`, `msc_eligible`, `notes`.
- Money and dates: `stipend_text` as written plus `stipend_min/max_eur_month` when known, `start_text`, `april_start`, `duration_*`, `posted_date`, `deadline`.
- Status: `status` (`open`, `closed`, `removed`, `expected`, `unknown`), `status_checked`, `first_seen`.
- Applying and provenance: `apply_url`, `apply_method`, `ats`, `apply_contact`, `source_type`, `source_url`.
- Moderation: `verified`. Swept offers and submissions both start unverified; a maintainer verifies.

`public.offer_reports` holds "this is wrong / closed / duplicate" flags. The public only sees
counts (`offer_report_counts`), never the messages.

`public.contact_requests` holds correction and takedown requests from `/legal`; nobody reads
them with the public key.

Access: no auth. The publishable key can read offers and insert offers, reports and contact
requests, nothing else.
A trigger forces every public insert to `verified = false`, `source_type = 'user_submitted'`
and a random slug, and rejects personal email addresses. Another trigger caps anonymous inserts
globally (offers and contact requests: 10 per 10 minutes, 60 per day; reports: 30 and 300).
Editing, verifying, deleting and reading reports use the service role
(Supabase dashboard or scripts). Everything in `offers` is public, including the offers that
came from the MVA Drive.

## Rules for the data

- **Every value must come from the offer's own source.** Copy links that exist, never build or
  guess one. When unsure, leave the field null. The site tells users the data can be wrong; that
  is not a license to make it wrong.
- **Status reflects the posting, not anyone's application.** `removed` only when the posting is
  gone, `closed` when the deadline passed or the organization closed the role.
- **Nothing personal, ever.** The data describes offers, never a person's search: no application
  status, fit scores, interview notes, which CV was sent, or reasons someone skipped an offer. No
  names or emails of recruiters, interviewers or people contacted for networking.
- **No personal email addresses anywhere (GDPR)**, even when the posting shows them. Only role
  addresses (jobs@, recrutement@, internships@...) can go in `apply_contact` or any text.
  `merge.py` replaces personal ones with a pointer to the posting, and `build_seed.py` refuses
  to build if one slips through. It also enforces the denylists; review the diff anyway.
- **Summaries, never copies.** Store facts and a 1 to 3 sentence description in our own words.
  Never paste the text of a posting (database and copyright rights of job boards).
- **Prefer the employer's own link.** When the same offer is on the company ATS (Workday,
  Ashby, Lever...) and on LinkedIn or an aggregator, `apply_url` and `source_url` point to the
  ATS. LinkedIn is used only to discover offers.
- **Takedowns win.** If an organization or a person asks to change or remove an entry, do it in
  the database and in `data/offers.json` in the same change, and do not re-add it in later sweeps
  (add its slug to `data/takedowns.txt`).
- **No Drive links or Drive IDs** in committed files. The MVA folder ID lives in
  `MVA_DRIVE_STAGES_FOLDER` in `.claude/settings.local.json`.
- Descriptions and notes in English, short and neutral. Titles keep the posting's language.

## Supabase

- Local: `supabase start` (Docker), `supabase db reset` applies migrations and the seed.
- Remote: link with `supabase link --project-ref <ref>`, schema via `supabase db push`, data via
  `psql "$SUPABASE_DB_URL" -f supabase/seed.sql`. Both are outward-facing: ask first.
- Schema changes go in a new migration file, never by editing an applied one.
- Keep RLS on every table. The anon key ships in the frontend, so every policy must assume the
  caller is hostile.

## Git

- Conventional commit prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, and `data:` for
  sweeps and offer changes.
- One branch per change and a PR into `main`. Never push to `main` directly.
- Commit or push only when asked.
- English in code, comments, commits and PRs.
- No em dashes in any text: use commas, colons, parentheses or rewrite.

## Before publishing anything

Pushing to GitHub, deploying, `supabase db push` and loading the remote seed all make data
visible to others. Confirm with the maintainer each time, and grep the diff for personal data first.
