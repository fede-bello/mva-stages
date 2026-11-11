# MVA stages board

A filterable board of research internship offers for students of the M2 MVA (ENS Paris-Saclay),
backed by Supabase. There is no sign-in: anyone can browse and filter offers, add new ones and
flag wrong information. The data is gathered by periodic sweeps (`/sweep`) and by students'
submissions.

## Layout

| Path | What it is |
|---|---|
| `data/offers.json` | **Source of truth for swept offers.** One object per offer, sorted by organization |
| `data/organizations.json` | Every organization the sweeps know: canonical name, `type`, sweep `group`, `aliases` (raw spelling to canonical form), `careers_url`, and `last_checked` / `last_result` from the last sweep that looked at it, even when it found nothing |
| `data/research-exceptions.txt` | Slugs whose title looks like engineering but whose posting describes research, each with a reason. `build_seed.py` refuses engineering titles not listed here |
| `data/privacy-denylist.txt` | Regexes that must never appear in the data (generic). A gitignored `.local.txt` holds the maintainer's own identifiers |
| `data/incoming/` | Gitignored scratch area for sweep results before merging |
| `scripts/merge.py` | Merges sweep results into `data/offers.json` (dedupe by slug, reference, title) |
| `scripts/build_seed.py` | Validates `data/offers.json` against `data/organizations.json` and writes `supabase/seed.sql` as upserts on `slug` |
| `scripts/pull_remote.py` | Read-only pull of the live database before a sweep: dashboard edits, deletions, submissions and reports |
| `supabase/migrations/` | Schema, RLS and triggers |
| `scripts/load_remote.py` | Loads `data/offers.json` into the remote database through the REST API (no password), optionally pruning stale swept rows |
| `supabase/seed.sql` | Generated. Never edit by hand |
| `.claude/skills/sweep/` | How to run a sweep |

Run Python with `python3 -I` (no third-party deps).

## Data model

`public.offers` (see the migration for the constraints):

- Identity: `slug` (unique, stable), `organization`, `title` (original language), `title_en`, `org_type`, `reference`.
- Place: `city`, `country`, `work_mode`.
- Content: `topics` (fixed list in the latest topics migration, `build_seed.py` and `src/lib/validate.ts`, keep the three in sync), `description`, `requirements`, `msc_eligible`, `notes`.
- Money and dates: `stipend_text` as written plus `stipend_min/max_eur_month` when known, `start_text`, `april_start`, `duration_*`, `posted_date`, `deadline`.
- Status: `status` (`open`, `closed`, `removed`, `expected`, `unknown`), `status_checked`, `first_seen`.
- Applying and provenance: `apply_url`, `apply_method`, `ats`, `apply_contact`, `source_type`, `source_url`.
- Moderation: `verified`. Swept offers and submissions both start unverified; a maintainer verifies.

### Organizations

`organization` is `Canonical name` or `Canonical name (unit, site or partner)`: `CEA (List,
Saclay)`, `Safran (Tech, PRISM)`, `Institut Pasteur (Epiméthée, with Inria)`. The part before
` (` must be a `name` in `data/organizations.json`; `build_seed.py` refuses anything else. A
joint offer goes under the lead organization, partners after `with`. No people's names in it.

`org_type` belongs to the organization, not the offer: it comes from `data/organizations.json`
and `build_seed.py` checks every offer against it. One rule per type:

| Type | Criterion | Examples |
|---|---|---|
| `big_tech` | Closed list: Alphabet (Google, Google DeepMind, Waymo), Amazon, Apple, Meta, Microsoft, NVIDIA, IBM, Intel, Qualcomm, Samsung, Huawei, Sony, Adobe, Naver, and companies they wholly own. Adding one needs a reason in the PR | Google DeepMind, Sony AI, RIVR (Amazon) |
| `startup` | Private, not listed, founded in 2016 or later, not owned by a larger group | Mistral AI, Hugging Face, Owkin, Perplexity |
| `company` | Every other business: listed groups, older private firms, subsidiaries, consultancies | SAP, Prosus, Criteo, Wandercraft (2012), InstaDeep (BioNTech) |
| `academic_lab` | Universities, schools, and public or non-profit institutes whose main output is research: CNRS, Inria, INRAE, Inserm, Institut Pasteur, Max Planck, Helmholtz, EMBL, ELLIS, and non-profits like Ai2, Kyutai, Flatiron, Mila | Ai2, Kyutai, CREATIS |
| `public_agency` | Government bodies, mission agencies and intergovernmental organisations (ESA, CNES, ECMWF, EUMETSAT, CERN, JRC, UN agencies, met offices, IGN), and technology research organisations with a public mandate (CEA, ONERA, DLR, Fraunhofer, TNO, imec, CSEM, IRTs) | CEA, ONERA, ESA |

A startup that turns 11 or gets acquired moves to `company` (or `big_tech`) in
`data/organizations.json`, and every offer follows at the next build.

### Countries

`country` is an English short name from `COUNTRIES` in `build_seed.py` (`United States`, not
`USA`). When the intern picks among sites, list them: `Germany, France`. Never `Multiple`,
`EMEA` or `remote`. No city and no country in the posting: null.

### Reports, requests and access

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
(Supabase dashboard or scripts). Every sweep starts with `scripts/pull_remote.py`, so dashboard
edits reach `data/offers.json` before the next seed would overwrite them. Everything in `offers` is public, including the offers that
came from the MVA Drive.

## Rules for the data

- **Every value must come from the offer's own source.** Copy links that exist, never build or
  guess one. When unsure, leave the field null. One exception: a French posting that pays "the
  legal minimum" counts as stating the current legal monthly amount (682.50 € in 2026, see
  `.claude/skills/sweep/references/mva-rules.md`). The site tells users the data can be wrong; that
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
- Remote: `supabase login` once, then `supabase link --project-ref <ref>`. No database password
  is needed for anything below: the scripts ask the linked CLI for the service key
  (`supabase projects api-keys`), keep it in memory and use the REST API.
  - Schema: `supabase db push` (new migrations only).
  - Read: `scripts/pull_remote.py` (read-only; uses `SUPABASE_DB_URL` with psql when set).
  - Write offers: `scripts/load_remote.py --dry-run [--prune]`, then without `--dry-run`. It
    upserts `data/offers.json` on `slug` like the seed (`first_seen` only on insert) and, with
    `--prune`, deletes swept rows that are no longer in `data/offers.json`. It refuses to run
    without a `pull_remote.py` pull from the same day.
  - Not `supabase db push --include-seed`: after the first load the CLI only updates the seed
    hash and never runs `seed.sql` again, even though its dry run says "Would seed".
  - With `SUPABASE_DB_URL` set, `psql "$SUPABASE_DB_URL" -f supabase/seed.sql` also loads the
    seed (no deletes).

  All writes are outward-facing: ask first, and run `pull_remote.py` afterwards (0 edited,
  0 deleted remotely).
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
