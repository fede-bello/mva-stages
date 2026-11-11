# MVA internship rules and calendar

What decides whether an offer belongs on the board, and how to fill `april_start`. Read at the
start of a sweep and paste the scope part into every subagent brief.

**Checked 2026-11-11 for the 2026-2027 cycle.** At the first sweep of a new academic year
(from September), re-read the sources below and update the dates in this file before
sweeping: they change every year.

Sources:
- Stage page: https://www.master-mva.com/formation-mva/stage/
- Planning: https://www.master-mva.com/formation-mva/planning/
- Student guide (PDF): https://www.master-mva.com/wp-content/uploads/2026/05/Guide-du-stage-MVA.pdf
- Host guide (EN, PDF): https://www.master-mva.com/wp-content/uploads/2025/11/InternshipGuideForOrganizations.pdf
- French gratification: https://www.service-public.gouv.fr/particuliers/vosdroits/F32131

## What the MVA accepts

- A **research** internship on the topics the master teaches. Industry and academia, France
  and abroad, are all fine ("en laboratoire académique ou en entreprise, en France ou à
  l'étranger").
- **At least 4 months.** French conventions cap a stage at 6 months per host and year, so most
  offers say 4 to 6 months.
- **In person**, unless the host has special conditions written in the convention. A
  fully remote offer can still go on the board; record `work_mode: "remote"`.
- The master validates every topic before the convention is signed. The board cannot know
  the outcome, so it lists offers the MVA *could* validate.

What it does not accept, so the board skips it:
- Quantitative finance and trading ("les stages en finance quantitative ou trading sont
  prohibés").
- Work that is mostly data collection, cleaning, deployment or applying an existing library
  tool, with no research question. Pure software engineering, MLOps, dashboards, consulting
  delivery.
- Full-time jobs.
- **PhD-only roles, with no exception**: the board is for master's students. That includes
  big tech and well-known labs ("PhD students only", "enrolled in a PhD", "PhD Intern",
  "doctoral candidate"). An offer open to master's **or** PhD students stays, and so does a
  PhD position that explicitly offers a master's internship before it.
- **Offers an MVA student cannot apply to**: undergraduates only, or only the students of one
  named university or country ("UvA students only", "ETH enrolment required").

Gray zones go on the board with a factual note rather than being dropped: "50% client work"
consulting internships, 3-month summer programs (too short alone, but some hosts extend them),
offers open to "M1 or M2".

## Calendar 2026-2027

| Date | What | Effect on the board |
|---|---|---|
| 2026-12-02 | MVA internship forum (about 70 hosts) | Offers spike in December: sweep the week after |
| 2027-04-02 | Last courses | |
| 2027-04-05 | Earliest internship start | `april_start` |
| 2027-05-10 | Latest start for students on the 1st jury (ENS Paris-Saclay, UPCité; report due 2027-09-10) | `april_start` |
| 2027-09-24 | 1st jury | |
| 2027-10-31 | Report deadline for the 2nd jury (double degrees: IPP, ENPC, CentraleSupélec, Mines) | |

## `april_start`

| Value | When |
|---|---|
| `yes` | The posting allows a start between 2027-04-05 and 2027-05-10 (e.g. "from March/April", "April or May", "spring 2027") |
| `no` | The stated start window excludes it (e.g. "September 2027", "must start in February") |
| `flexible` | The posting says the start date is flexible or to be agreed |
| `unknown` | No start date stated |

## Stipend

The legal minimum gratification in France is 4.50 €/h in 2026 (15% of the hourly social
security ceiling), mandatory beyond 2 months (more than 308 hours). For a full-time month
(35 h a week, 151.67 h) that is **682.50 €/month in 2026**.

When a posting says the stipend is the legal minimum, the board treats that as the posting
stating this amount: `stipend_text` keeps the wording ("Gratification légale") and
`stipend_min_eur_month` = `stipend_max_eur_month` = 682.5. "Above the legal minimum" with no
figure gets no number: both fields stay null and the wording stays in `stipend_text`. The rate changes every January: update the amount here at the
first sweep of the year, and re-apply it to the open offers that state the legal minimum.
