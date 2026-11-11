# Offer and coverage format

What a sweep subagent writes. Give this file to every subagent. `scripts/build_seed.py` is
the authority on allowed values; `scripts/merge.py --dry-run` prints every problem it finds.

## Contents

1. Offer file (`NN-group.json`)
2. Field by field
3. Updates to known offers
4. Coverage file (`NN-group.coverage.json`)
5. Example

## 1. Offer file

A JSON array of objects. Every value comes from the posting itself. Unknown means `null` (or
the field left out), never a guess: the board tells students the data can be wrong, and that
is not a license to make it wrong.

## 2. Field by field

| Field | Rule |
|---|---|
| `organization` | Canonical name from `data/organizations.json`, then the unit, site or partner in parentheses: `CEA (List, Saclay)`, `Safran (Tech, PRISM)`, `Institut Pasteur (Epiméthée, with Inria)`. A raw spelling listed in `aliases` also works. A new organization: its usual short name, plus a coverage line with `type` and `group` (section 4). No people's names |
| `title` | As written in the posting, original language, without "H/F", "(F/M)" or "Stage -" noise |
| `title_en` | English translation when `title` is not English, else the same text |
| `org_type` | Leave out. `merge.py` takes it from `data/organizations.json` |
| `city` | City of the workplace as written (`Palaiseau`, `Paris`). Several sites: `Paris or Grenoble` |
| `country` | English short name: `France`, `United States`, `United Kingdom`, `Netherlands`. Several sites to choose from: `Germany, France`. Never `Multiple`, `EMEA` or `remote`. Neither city nor country stated: null |
| `work_mode` | `onsite`, `hybrid`, `remote` only if the posting says so, else `unknown` |
| `topics` | 1 to 5 of: `computer-vision`, `3d-vision`, `llm`, `agents`, `nlp`, `rl`, `time-series`, `foundation-models`, `generative-models`, `health`, `neuro`, `bio-chem`, `robotics`, `earth-observation`, `climate-energy`, `physics-sim`, `speech-audio`, `graphs`, `optimization`, `theory`, `recsys-ir`, `efficiency`, `trustworthy-ai` (explainability, fairness, robustness, uncertainty, privacy, unlearning), `signal-processing` (radar, telecom, sensors), `other`. `other` only alone, when nothing fits. A broad call (all Inria M2 topics, a summer program) gets the topics it names |
| `stipend_text` | The amount as written (`1 400 € brut/mois`, `gratification légale`). Null if the posting says nothing |
| `stipend_min_eur_month`, `stipend_max_eur_month` | Monthly euros when the posting states a number. Other currencies: leave null and keep the amount in `stipend_text`. **Exception, French legal minimum:** a posting that says the stipend is the legal minimum ("gratification légale", "taux légal", "legal minimum") counts as stating the current legal monthly amount from `mva-rules.md` (682.50 in 2026): set min and max to it. "Above the legal minimum" with no figure: no number, both null (the wording stays in `stipend_text`) |
| `start_text` | As written (`Février à avril 2027`, `Flexible`) |
| `april_start` | Whether an MVA student can start when MVA internships begin (dates in `mva-rules.md`): `yes` if the stated window allows it, `no` if it excludes it, `flexible` if the posting says the start is flexible, else `unknown` |
| `duration_text`, `duration_months_min`, `duration_months_max` | As written, and as whole months when stated (`5 to 6 months` gives 5 and 6) |
| `posted_date` | Date the posting shows, ISO `YYYY-MM-DD`. JSON-LD `datePosted` counts |
| `deadline` | Application deadline the posting states, ISO. JSON-LD `validThrough` counts when it is a real date, not a far default |
| `status` | `open` if it accepts applications, `expected` for a recurring program not published yet, `closed` if the deadline passed or the organization closed it, `removed` if the posting is gone. Never about anyone's application |
| `status_checked` | Today, ISO, when the subagent read the posting |
| `first_seen` | Today, ISO, for a new offer. Leave out for known ones |
| `requirements` | Level and key requirements in one short line (`M2 student, PyTorch, French not required`) |
| `msc_eligible` | `yes` if master's students can apply, `no` if the posting limits it to students an MVA student cannot be (undergraduates only, one named university's students only), else `unknown`. PhD-only offers never get here: skip them (`mva-rules.md`) |
| `reference` | The employer's job id (`JR2027377`, `R0341666`, `2026-10466`) |
| `apply_url` | Link to apply, on the employer's own site or ATS when it exists. Copied, never built |
| `apply_method` | `portal`, `email`, `form`, `spontaneous`, `unknown` |
| `ats` | `Workday`, `Greenhouse`, `Lever`, `Ashby`, `SmartRecruiters`, `Taleo`, `SuccessFactors`, `Talentsoft`, `WTTJ`... |
| `apply_contact` | Only a role address (`jobs@`, `recrutement@`, `internships@`). A person's address never goes anywhere in the data: write "Apply by email to the address given in the posting." in `notes` instead |
| `source_type` | `official_posting`, `lab_website`, `mva_drive`, `mailing_list`, `linkedin`, `aggregator`, `other` |
| `source_url` | Where the subagent read it. Null for the MVA Drive (cohort-only links) |
| `description` | 1 to 3 sentences in English, in our own words: what the intern does and on what data or problem. Never pasted text |
| `notes` | Facts that do not fit elsewhere, short and neutral. Never anyone's application, opinions or fit |

## 3. Updates to known offers

For an offer already in `data/offers.json`, write only `slug` and the fields that changed,
plus `status_checked`:

```json
{"slug": "ekimetrics-ai-ml-engineer-intern", "status": "removed", "status_checked": "2026-11-20"}
```

`merge.py` matches by slug first, so the other fields are kept. A changed `title` comes with its
`title_en` (the same text when the title is English), and a changed `apply_url` with
`source_type`, `source_url` and `ats` when those changed too.

## 4. Coverage file

One line per organization in the subagent's list, and one per source (board, mailing list)
it read. This is how the board knows that "Valeo was checked and has nothing open", which is
worth as much as a new offer.

```json
[
  {"name": "Valeo", "result": "nothing open", "careers_url": "https://..."},
  {"name": "Mistral AI", "result": "2 offers"},
  {"name": "Kyutai", "result": "not covered: internships page returns 403"},
  {"name": "Living Models", "result": "no careers page; site has a contact form only"},
  {"name": "Rivercell", "result": "1 offer", "type": "startup", "group": "startups_fr"},
  {"name": "GdR IASIS offers page", "result": "3 offers", "source": true}
]
```

- `source: true`: the line is a board, feed or mailing list, not an organization. It is shown
  in the merge summary and not stored in `data/organizations.json`.
- `name`: canonical name or an alias. When only part of a large organization was checked
  (one CEA institute, one Max Planck institute), name the unit: `CEA (NeuroSpin)`. The result is
  then recorded as "NeuroSpin: nothing open" and does not claim the whole organization.
- `result`: `N offers`, `nothing open`, or `not covered: <reason>`. Short, factual.
- `careers_url`: only a page the subagent actually opened and that lists jobs.
- `type` and `group`: only for an organization not in `data/organizations.json` yet. Type by
  the criteria in `CLAUDE.md` (big_tech is a closed list; startup means private, not listed,
  founded 2016 or later, not owned by a group).

## 5. Example

A complete new offer:

```json
{
  "organization": "Institut Pasteur (Epiméthée, with Inria)",
  "title": "Generative and foundation models for neurophysiological signals",
  "title_en": "Generative and foundation models for neurophysiological signals",
  "city": "Paris",
  "country": "France",
  "work_mode": "onsite",
  "topics": ["foundation-models", "health", "neuro"],
  "stipend_text": "Gratification légale",
  "stipend_min_eur_month": 682.5,
  "stipend_max_eur_month": 682.5,
  "start_text": "Flexible",
  "april_start": "flexible",
  "duration_text": "6 months",
  "duration_months_min": 6,
  "duration_months_max": 6,
  "deadline": "2027-09-01",
  "status": "open",
  "status_checked": "2026-11-09",
  "first_seen": "2026-11-09",
  "requirements": "Open to M1 and M2 students",
  "msc_eligible": "yes",
  "apply_url": "https://research.pasteur.fr/en/job/generative-and-foundation-models-for-neurophysiological-signals/",
  "apply_method": "email",
  "apply_contact": "dbc-epi-recrutement@pasteur.fr",
  "source_type": "lab_website",
  "source_url": "https://research.pasteur.fr/en/job/generative-and-foundation-models-for-neurophysiological-signals/",
  "description": "Generative and foundation models trained on a large clinical EEG dataset (about 50,000 recordings), in a joint Institut Pasteur and Inria team."
}
```
