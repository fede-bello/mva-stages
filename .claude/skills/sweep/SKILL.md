---
name: sweep
description: Re-run the internship sweep for the MVA stages board. Searches every source with parallel subagents, re-checks the status of known offers, merges the results into data/offers.json, regenerates the seed and loads it into Supabase. Use when asked, in any language, to run a sweep, redo the search, refresh, update or re-check the offers.
---

# Sweep

Goal: every research internship an MVA student could do for the 2027 internship period, from
every source, with its status up to date. The board is for the whole cohort, so **do not filter
by anyone's preferences**. Filtering happens on the site.

## Scope (what counts as an offer)

- Research or R&D internship, roughly 4 to 6 months, M2 level, that the MVA could validate
  ([internship rules](https://www.master-mva.com/formation-mva/stage/)).
- Any start date and any country: the site shows `april_start` and `country` so students can filter.
  Record them faithfully instead of discarding.
- Skip only what the MVA cannot validate: quantitative finance and trading, pure software
  engineering with no research, PhD-only roles (keep them with `msc_eligible: "no"` if they
  are notable, e.g. a well-known lab, otherwise skip), and full-time jobs.
- Recurring programs that are not published yet (DeepMind Master Level Intern, ESA student
  internships, Meta "(MSc)" postings) go in with `status: "expected"` and a note on when they
  opened last cycle.

## 1. Prepare

1. Read `data/offers.json` to know what is already there, and the date of the last sweep
   (`git log -1 --format=%cs -- data/offers.json`).
2. Create `data/incoming/YYYY-MM-DD/` (gitignored). Each subagent writes one file there.
3. The MVA Drive folder ID is in the env var `MVA_DRIVE_STAGES_FOLDER`
   (`.claude/settings.local.json`, not committed). Never write it into a committed file.

## 2. Subagents, all launched in one message

Give each one: the scope above, the offer format from `CLAUDE.md` (the field list), the privacy
rules from `CLAUDE.md`, its source list, the path of its output file, and a short list of the
organizations already in `data/offers.json` for its group so it focuses on new or changed
offers. Each returns only facts quoted from the source, with the link. What it could not read
goes in its final message as "not covered", never as guessed data.

| # | Group | Sources |
|---|---|---|
| 1 | MVA Drive | List the folder with `gws drive files list` (query `'<folder>' in parents and trashed=false`, fields `id,name,createdTime,modifiedTime`). Download and read files created or modified since the last sweep (`pdftotext -layout`, docx via `textutil -convert txt`). `source_type: "mva_drive"`, `source_url: null`: Drive links only open for the cohort and must not go in the data |
| 2 | Status re-check | Every offer in `data/offers.json` with status `open`, `expected` or `unknown`: fetch `apply_url` / `source_url`. Gone (404, 410, "no longer accepting", Workday "job not found") → `removed`. Deadline past → `closed`. Still there → keep `open` and set `status_checked` to today. Output only `slug` + changed fields |
| 3 | Corporates and big tech | Public ATS APIs: Greenhouse (`boards-api.greenhouse.io/v1/boards/<org>/jobs`), Lever (`api.lever.co/v0/postings/<org>`), Ashby (`api.ashbyhq.com/posting-api/job-board/<org>`), Workday (`<tenant>.wd*.myworkdayjobs.com/wday/cxs/<tenant>/<site>/jobs`, POST with `searchText`), SmartRecruiters. Big tech portals: Google Careers, Apple, Meta (JS only: Claude in Chrome), Amazon, Microsoft, NVIDIA, Qualcomm, IBM. Europe-wide, interns only |
| 4 | French startups | Welcome to the Jungle (Algolia index), Station F job board, Ashby/Lever/Dover/Greenhouse boards of Paris AI startups (Mistral, H, Kyutai, Hugging Face, Owkin, Bioptimus, Sigma Nova, Karavela, Raidium, Inbolt, Wandercraft, Enchanted Tools, UMA, Pigment, Dust, Alan, Doctrine, Photoroom, Gladia, LightOn, Giskard, Nabla, ...) |
| 5 | Research in France | Inria (jobs.inria.fr), CNRS (emploi.cnrs.fr), CEA, ONERA, Institut Pasteur, IRT SystemX, PRAIRIE, DATAIA, Hi! PARIS, GdR IASIS mailing list archive, ENS / ENPC / X / Télécom lab pages |
| 6 | Research in Europe | ESA (jobs.esa.int), JRC, EMBL, ECMWF, EUMETSAT, DLR, Fraunhofer, MPI, ISTA, ELLIS, EPFL, ETH, CWI, CERN |
| 7 | Aggregators | LinkedIn guest search (`linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=...&location=...&f_JT=I`), by topic (computer vision, LLM, machine learning research, time series, robotics, medical imaging, generative) and country (France, Switzerland, Germany, Netherlands, Belgium, Spain, Italy, Denmark, Sweden). Euraxess, HelloWork, JobTeaser, Indeed (Chrome) |

Portals that block curl or render only with JS (metacareers, Indeed, JobTeaser, CNES, Safran,
JRC): use Claude in Chrome or report them as not covered.

## 3. Consolidate (main session)

1. `python3 -I scripts/merge.py --dry-run data/incoming/YYYY-MM-DD/*.json` and read the counts.
   Skim the new offers for duplicates the matcher missed (same posting under two titles,
   French and English copies of one posting) and fix them in the incoming files.
   For offers found on LinkedIn or an aggregator, look for the same posting on the
   employer's own ATS and use that link instead (see `CLAUDE.md`, rules for the data). Drop any
   offer whose slug is in `data/takedowns.txt`.
2. Verify in the source, yourself, every new offer that has a stipend, a deadline within 3 weeks
   or a big-name organization. Subagent output is not trusted until checked.
3. `python3 -I scripts/merge.py data/incoming/YYYY-MM-DD/*.json`
4. `python3 -I scripts/build_seed.py`. If the privacy check fails, fix the offer, never the
   denylist.
5. Load it:
   - Local: `supabase db reset` (needs Docker), then spot-check in Studio.
   - Remote: `psql "$SUPABASE_DB_URL" -f supabase/seed.sql`. **Outward-facing: show the user the
     counts (added, updated, newly closed/removed) and ask before running it.**
6. Commit on a branch (`data: sweep YYYY-MM-DD, N new, M closed`) and open a PR. Do not push to main.
7. Report to the user in a few lines: how many new, how many closed or removed, what was not
   covered, and the offers with the nearest deadlines.
