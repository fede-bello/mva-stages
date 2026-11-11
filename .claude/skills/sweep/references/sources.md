# Sources per group

Paste a group's section into its brief, with "How to read job sites" for every group that
searches. Careers pages of individual organizations are in `data/organizations.json`
(`careers_url`); this file lists the shared portals, boards and lists.

Checked 2026-11-11. A URL that stops working goes in coverage as `not covered: <status>`;
the main session fixes this file after the sweep.

## Contents

- How to read job sites (all groups)
- 01 MVA Drive
- 02 Status re-check
- 03 Big tech
- 04 Corporates
- 05 Startups
- 06 Research in France
- 07 Health and neuro in France
- 08 Research in Europe
- 09 Mailing lists and boards
- 10 Aggregators
- Recurring programs calendar

## How to read job sites

Prefer, in order: the ATS's public JSON API, the employer's RSS feed, the HTML page, then the
browser tool for JS-only pages. Never log in, never bypass a block or a rate limit, and honour
robots.txt (including `Crawl-delay`: ONERA and CNES ask for 10 s, Lever 1 s). A page you may
not or cannot read is `not covered: <reason>`.

| ATS | Recognise it | Read the board | One posting, and how removal shows |
|---|---|---|---|
| Greenhouse | `job-boards.greenhouse.io/<board>`, `boards.greenhouse.io/<board>`, `?gh_jid=` on the employer's site (EU boards too) | `GET https://boards-api.greenhouse.io/v1/boards/<board>/jobs` (`?content=true` adds text, can be MBs) | `.../jobs/<id>`: 404 `Job not found` |
| Lever | `jobs.lever.co/<site>`, `jobs.eu.lever.co/<site>` | `GET https://api.lever.co/v0/postings/<site>?mode=json&skip=0&limit=100` (EU: `api.eu.lever.co`; filters `commitment`, `location` are case-sensitive) | `.../postings/<site>/<id>`: 404 `Document not found`, **also for unlisted postings that are still open**: confirm on the hosted page (`jobs.lever.co/<site>/<id>` still shows "Apply for this job") |
| Ashby | `jobs.ashbyhq.com/<name>` | `GET https://api.ashbyhq.com/posting-api/job-board/<name>?includeCompensation=true` (whole board, can be 15 MB; `employmentType: "Intern"`) | No single-posting endpoint: removed when its id leaves the board |
| Workday | `<tenant>.wd<N>.myworkdayjobs.com/[<locale>/]<site>/job/<location>/<slug>_<req>` | `POST https://<tenant>.wd<N>.myworkdayjobs.com/wday/cxs/<tenant>/<site>/jobs` with `{"limit":20,"offset":0,"searchText":"intern","appliedFacets":{}}`; sitemap at `/<site>/siteMap.xml` | `GET .../wday/cxs/<tenant>/<site>/job/<path after /job/>`: 404 when gone. **The HTML page answers 200 even for postings that do not exist**: never use it as proof. Some tenants (NVIDIA) answer 403 to detail requests: search the board for the requisition id (`searchText: "JR2026775"`); `total: 0` while other ids are found means it is gone. A search result's posting link is `https://<tenant>.wd<N>.myworkdayjobs.com/<site>` + its `externalPath`: that is the API's own link, not a guessed one. Never change the User-Agent to get past a block |
| Workable | `apply.workable.com/<sub>` | `GET https://apply.workable.com/api/v1/widget/accounts/<sub>?details=true` | Removed when it leaves the list |
| Recruitee | `<company>.recruitee.com` | `GET https://<company>.recruitee.com/api/offers/` (token mandatory from 2027-02-10: then HTML only) | `/api/offers/<id>`: 404 |
| Personio | `<company>.jobs.personio.de` | `GET https://<company>.jobs.personio.de/xml?language=en` (`employmentType: intern`) | Removed when it leaves the feed |
| Teamtailor | `<company>.teamtailor.com` or custom domain | `GET https://<site>/jobs.rss?per_page=100&offset=0` | Job page 404 |
| SmartRecruiters | `jobs.smartrecruiters.com/<Company>/<id>-<slug>` | **Its API's robots.txt disallows crawlers: do not call it.** Read the careers page with the browser tool | Browser |
| Welcome to the Jungle, Homerun, Taleo, SuccessFactors, Talentsoft, BambooHR | | HTML or browser tool. On SuccessFactors sites (ESA, EPFL) robots.txt disallows `/services/` (RSS): use the search page | |

The schema.org `JobPosting` JSON-LD on a page is a weak signal: Workday sets `validThrough` a
few days after `datePosted` (not a deadline) and `employmentType: FULL_TIME` even for
internships; Greenhouse and Ashby pages have none. Use it for `datePosted` and `identifier`,
not for deadlines.

Search terms that work across portals: `intern`, `internship`, `stage`, `stagiaire`,
`master thesis`, `Praktikum`, `Masterarbeit`, `M2`, `fin d'études`, `student researcher`.

Some employers' robots.txt set `ai-train=no` content signals (Lever, Workable): the board only
summarizes facts and links back, which is what those signals allow. Never paste posting text.

## 01 MVA Drive

List the folder in `$MVA_DRIVE_STAGES_FOLDER` with `gws drive files list` (query
`'<folder>' in parents and trashed=false`, fields `id,name,createdTime,modifiedTime`, and
recurse into subfolders). Read files created or modified since the last sweep: PDF with
`pdftotext -layout`, docx with `textutil -convert txt`, Google Docs exported as text.
`source_type: "mva_drive"`, `source_url: null`: Drive links only open for the cohort. If the
offer is also published by the employer, set `source_type` and the links to that posting
instead. Never write the folder id or a Drive link into any file.

## 02 Status re-check

Input: the rows of `checks/status-precheck.json` whose verdict is `gone`, `unreachable`, `listing`,
`no_url` or `linkedin`, the reported slugs, and `remote/user_submitted.json`.

- `gone`: an API 404 is a hint, not proof (Lever hides unlisted postings that are still open;
  some sites answer 404 to scripts). Open the posting page itself; for Workday, search the board
  for the requisition id. Gone there too: `removed`, with the evidence in your final message.
- `unreachable`: browser tool; still unreadable: leave the status, note it.
- `listing`: the link is a careers page. Find the posting on it; found: update `apply_url`;
  the program is not published yet: keep `expected`.
- `no_url`: search the employer's careers page for the same title or reference. Found: add the
  link. Not found and the offer is older than 4 months: say so for the maintainer, do not
  remove it on that basis.
- `linkedin`: find the same posting on the employer's site and replace the link. Do not open
  the LinkedIn posting itself: LinkedIn's terms restrict automated access, and the employer's
  page is the one the board should link anyway.
- Reports: check what the report claims (closed, wrong info, duplicate) against the source.
- Unverified submissions: does the posting exist, does it match, is it a duplicate (of which
  slug)? Write `02-submissions.md`; do not change those rows.

## 03 Big tech

Every organization of group `big_tech`. Their `careers_url` is the starting point. Notes:
Google and Google DeepMind share Google Careers (search "student researcher", "intern"
with location filters); Meta and Microsoft render with JS (browser tool); Apple has a
filter for internships; Amazon publishes one rolling "Applied Scientist Intern (EMEA)" posting;
NVIDIA's Workday needs the browser. Europe and remote-in-Europe internships, plus well-known
North American programs open to European students.

## 04 Corporates

Every organization of group `corporates`. Find each one's ATS (from its careers page or past
`apply_url`s on the board) and read it with the table above, searching for interns. Corporate
research labs to cover in full even when the group page shows nothing: Valeo.ai, Thales
cortAIx (yearly campaign October to January), Safran Tech, Sanofi AI, Criteo AI Lab, Ubisoft
La Forge, Nokia Bell Labs, Orange Innovation, EDF R&D, Dassault Systèmes R&D, L'Oréal R&I,
Philips Research, Snap Research, Disney Research, Mobileye.

## 05 Startups

Every organization of groups `startups_fr` and `startups_eu`: their own Ashby, Lever,
Greenhouse, Workable, Homerun or Welcome to the Jungle board. Then discovery: the Station F
job board (jobs.stationf.co), Welcome to the Jungle searches ("stage machine learning",
"research intern", "stage IA") in France. Many startups have no internship posted: that is a
coverage result ("nothing open"), not something to fill.

## 06 Research in France

Portals carry most of the volume:
- Inria: https://jobs.inria.fr/public/classic/en/offres (filter internships; M2 topics appear
  October to January).
- CNRS: https://emploi.cnrs.fr/Offres/Recherche.aspx (few internships; most CNRS M2 topics are
  on lab sites and in group 09's lists).
- CEA, all institutes in one portal: https://www.emploi.cea.fr/offre-de-emploi/liste-offres.aspx.
  Internships RSS (every CEA internship, French): https://www.emploi.cea.fr/handlers/offerRss.ashx?LCID=1036&Rss_Contract=579
  Record the institute as the unit: List, Leti, DAM, DES, NeuroSpin.
- ONERA: RSS https://w3.onera.fr/stages/fr/rss.xml (Crawl-delay 10 s), and https://rejoindre.onera.fr/
- CNES: https://recrutement.cnes.fr/fr/annonces (internships posted from September).
- INRAE: https://jobs.inrae.fr/
- PSL recruitment (PRAIRIE-PSAI and PSL labs): https://recrutement.psl.eu/
- Université Paris-Saclay graduate schools internship board
  (`www.stages-gs.universite-paris-saclay.fr`, already a source on the board).
- AI clusters: ANITI https://aniti.univ-toulouse.fr/en/internship-positions/, DATAIA
  https://www.dataia.eu/offres, Hi! PARIS https://hi-paris.fr/recruitment/, 3IA Côte d'Azur
  (and EFELIA M2 grants at Université Côte d'Azur), MIAI Grenoble (funded M2 internships
  published after its September call), SCAI https://scai.sorbonne-universite.fr/jobs,
  PostGenAI@Paris.
- Labs that post their own M2 topics: Centre Borelli
  (https://centreborelli.ens-paris-saclay.fr/fr/offres-demploi-post-doc-these), IRISA
  (https://www.irisa.fr/recrutement), LIP6, L2S, LIRIS, LISN, LIX, CMAP, LIGM, GREYC, ICube,
  LJK, LAAS, Télécom Paris LTCI, DI ENS.

## 07 Health and neuro in France

Institut Pasteur (https://www.pasteur.fr/en/about-us/join-us and research.pasteur.fr job
pages), Institut Curie, Gustave Roussy, Paris Brain Institute (ICM), Inserm, NeuroSpin (record
as `CEA (NeuroSpin)`), AP-HP, CREATIS. Their careers pages are hard to find: report the page
you used in `careers_url`, or `not covered` with what you tried.

## 08 Research in Europe

Every organization of groups `research_eu` and `international`. Programs:
- ESA student internships (member-state nationality required; 2027 call opened 2026-11-02):
  https://www.esa.int/careers/careers/launch-your-career/entry-level-progammes/student-internships
  and the vacancies on https://jobs.esa.int/search/ (not the `/services/` RSS: disallowed).
- JRC traineeships via https://recruitment.jrc.ec.europa.eu/ (JS app; two calls a year), EMBL (Workday), ECMWF
  (https://jobs.ecmwf.int/Home/Job), EUMETSAT, CERN technical studentship.
- Max Planck (each institute posts its own; MPI-INF https://www.mpi-inf.mpg.de/career/job-openings),
  Helmholtz (https://www.helmholtz.de/en/search/jobs/, DKFZ, Helmholtz Munich), Fraunhofer
  (https://jobs.fraunhofer.de/), DLR, TNO, imec, CSEM, CWI, Idiap, IDSIA (posted as SUPSI
  notices), IIT, ELLIS (https://ellis.eu/research/jobs), Tübingen AI Center, Pioneer Centre for AI.
- EPFL master's project for external students
  (https://www.epfl.ch/education/international/en/coming-to-epfl/project/), ETH.
- EURAXESS (https://euraxess.ec.europa.eu/jobs/search) filtered on "Other research profiles"
  or keyword "internship" / "master".

## 09 Mailing lists and boards

- GdR IASIS: https://gdr-iasis.cnrs.fr/proposition-de-postes/ ("Offres de stages", titles
  "[Stage M2]", no dates shown: read each post).
- GdR MaDICS: https://www.madics.fr/offres/ ("Stages", deadlines shown).
- SFdS: https://www.sfds.asso.fr/fr/n/506-consulter_les_offres_demploi/ (type "Stage", level
  "Master").
- ABG: https://www.abg.asso.fr/fr/candidatOffres ("Type d'offre: Stage master 2 / Ingénieur").
- ROADEF posts (operations research M2 offers).
- AFIA: https://afia.asso.fr/les-offres-demploi/ (JS: browser tool).
- `[mva26]` cohort list in the maintainer's Gmail, read-only with `gws gmail` (search
  `subject:[mva26] (stage OR internship OR offre)` since the last sweep).
- Not publicly readable, skip unless that changes: IASD, MASH and IP Paris Data Science offer
  lists, the Paris-Saclay graduate school list on gsweb1 (campus only), AFRIF (certificate
  error), GdR MIA (mailing list only).

`source_type: "mailing_list"` for list posts, `lab_website` when the post links the lab's own
page (then use that page as `source_url`). These sources carry more personal contacts than any
other: a post from a person announces an offer; record the offer, never the sender, and never a
supervisor's name or address.

## 10 Aggregators

Discovery only: every offer found here needs the employer's own link (section "How to read job
sites") before it is recorded; keep the aggregator link only when there is no other.

- LinkedIn guest search. Its terms restrict automated access, so keep it small: a few result
  pages per query, no per-posting fetches, nothing stored beyond what leads to the employer's
  posting:
  `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=<k>&location=<country>&f_JT=I&start=<0,25,50>`
  with keywords `machine learning research intern`, `computer vision intern`, `LLM intern`,
  `research intern AI`, `stage recherche IA`, `time series intern`, `robotics intern`,
  `medical imaging intern`, `generative AI intern`, and countries France, Switzerland, Germany,
  Netherlands, Belgium, Spain, Italy, Denmark, Sweden, United Kingdom.
- EURAXESS, HelloWork, JobTeaser and Indeed: browser tool; not covered if blocked.

## Recurring programs calendar

When they opened last cycle, so `expected` offers can be flipped to `open` on time. Confirm
on the official page before relying on a date.

| Program | Last opening | Notes |
|---|---|---|
| ESA student internships | 2026-11-02 (2027 call) | About a month, per vacancy deadlines |
| Google / DeepMind Student Researcher (EMEA) | late October to November | Rolling review |
| Meta Research Scientist Intern (MSc), Paris | October to November | |
| Amazon Applied Scientist Intern EMEA | rolling, reposted through the year | |
| Thales cortAIx, Inria M2 topics, Safran Tech | October to January | Dozens of topics per campaign |
| CERN technical studentship | 2027-1 intake closed 2026-10-16; next around February | Member-state nationality |
| JRC traineeships | autumn call (March start) closed about 2026-10-28; spring call around April-May | |
| ETH SSRF, Summer@EPFL, CaCTüS | November to December | 3-month summer programs: weak fit |
| ISTA ISTernship | paused for 2026 and 2027 | Group leaders still take interns directly |
| MVA internship forum | 2026-12-02 | Sweep the week after |
