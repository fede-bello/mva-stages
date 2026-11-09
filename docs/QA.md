# QA

## Local (2026-11-09)

Run against `npm run dev` (port 5173) and a production build served by `vite preview` (port 4173),
both pointed at local Supabase (`127.0.0.1:55321`, 668 offers). The preview build used for
Lighthouse and axe was built into the scratch dir with the values of `.env.development.local`
injected as process env, so no request reached the remote project. Browser: Chrome 156 (Claude
in Chrome, own tab). Today = 2026-11-09 (Europe/Paris).

Expected numbers from SQL (effective status: `open` with `deadline < today` counts as `closed`):
open 391, closing in 3 weeks 19, stipend stated 71, open or expected 440, `max(status_checked)`
2026-11-09, open with past deadline 1, verified 0, user_submitted 0.

Result: **PASS** after 3 fixes (below). Items under "Open" are not failures of the checklist, they
need a product decision.

### Board

| Item | Result | Evidence or note |
|---|---|---|
| Header: brand, tagline, Board `aria-current`, Add an offer; focus ring on dark bg | PASS | `aria-current` on Board at `/`, on `+ Add an offer` at `/submit`; header links ring `#A9BBFF`. Skip link ring fixed (see Fixes) |
| Warning note always visible, literal copy | PASS | Copy equals design.md 4.2 |
| Stats equal SQL | PASS | Open 391, Closing in 3 weeks 19 (urgent color), Stipend stated 71, Last sweep `09 Nov` = `max(status_checked)` 2026-11-09 |
| Search: text, debounce | PASS | URL written once, 250 ms after the last keystroke (`mistral` typed in 5 steps: no URL until the end, then `q=mistral`, 3 offers) |
| Search accents both ways | PASS | `Saint-Denis` = `saint denis` = 2 (all statuses); `Île-de-France` = `ile de france` = 10 all, 6 open or expected; SQL agrees |
| Search on `title_en` | PASS | `peer review` finds the Samovar offer (English title) |
| Each toggle alone and combined | PASS | default 440, `open=0` 668, `april=1` 64, `paid=1` 48, `open=0&april=1` 90, `open=0&paid=1` 71, `april=1&paid=1` 12; all equal SQL |
| "Verified only" empty state | PASS | `No offer is verified yet.` with the hint to turn it off |
| Country select: atomic list with counts, USA, multi-country | PASS | `France (443)` = 439 + `France or United Kingdom` (2) + `Germany or France` (1) + `Germany or France (remote)` (1); `United States` = `USA` + `United States` = 6 all / 3 open (SQL 6 / 3); France open = 305 (SQL 305) |
| Topic chips: pressed state, OR, `aria-pressed` | PASS | `llm` 53, `llm,agents` 61 (SQL `&&` 61) |
| Sort: deadline, stipend, A to Z, `aria-pressed`, stable | PASS | Stipend: highest max first; A to Z: Aalto, ABB, ABB Corporate Research, Ai2; deadline: soonest first, ties by org |
| Clear filters resets all except sort | PASS | From 7 active filters + `sort=az` to `?sort=az`, search box emptied, 440 offers |
| Query string written, reload and new tab restore | PASS | Fresh tab on `?q=inria&topics=computer-vision,health&country=France&open=0&april=1&sort=az` restored search box, toggles, select, chips and sort (1 offer). Invalid `sort`/`topics` values are ignored |
| Empty state copy and Submit link | PASS | `No offers match these filters.` / `Clear a filter, or add an offer you found.` |
| Cards: fields and pill variants | PASS | All 668 rendered with `open=0`: Open 372 + Closes in N days 18 + Closes in 1 day 1 (= 391), Expected 49, Closed 28 (27 + 1 past deadline), Posting removed 155, Status unknown 45: equal SQL. Stipend bold only with a number; deadline urgent within 21 days (`Closes in 21 days` = 30 Nov included); `Rolling or not stated` muted |
| Unverified badge only on student submissions | PASS | 0 badges on the 668 swept offers; shown on a test submission |
| Closed and removed dimmed, still AA | PASS | Paper background, no opacity; axe color-contrast passes on 100 cards incl. 43 dimmed |
| Show more: count left, step 50, reset on filter change | PASS | `Show more offers (618 left)`, then 100 shown and `(568 left)`; back to 50 after a filter or sort change |
| Back from an offer returns to the same filtered board | PASS | `?topics=llm&sort=az` with 100 cards shown and scrolled: Back restores the URL, 100 cards and the exact scroll position |
| Loading skeleton | PASS | Fetch delayed 1.5 s: `Loading offers...` in the live region, `aria-busy`, 5 skeleton cards, stat values `...` |
| Error box + Try again | PASS | Second dev server with `VITE_SUPABASE_URL` on a dead port: `Could not load the offers. Check your connection and try again.` after about 7 s (client retries). Try again with requests rerouted to the real port loaded the board |
| 390px: no horizontal scroll, filters disclosure, skip link | PASS | 390px iframe: `scrollWidth` = viewport on `/`, offers, `/submit`, `/legal`, not-found. `Filters` button toggles the panel (`aria-expanded`), label shows the active count `(1)` |

### Offer

| Item | Result | Evidence or note |
|---|---|---|
| Full offer | PASS | `institut-pasteur-inria-epimethee-...`: Where, Stipend (683 €/month + text), Start and duration, Deadline, How to apply (role address), Eligibility, About |
| Near-empty offer | PASS | `apple-sear-agents-and-cybersecurity-internship` (22 null/unknown fields): only Stipend `Not stated`, Start `Not stated` + April line, Deadline `Rolling or not stated`; Where hidden |
| `title_en`, `org_type`, Posted | PASS | Airbus `JR10444227`: English subtitle, `Company`, `Posted 30 Sep 2026` |
| Open the original posting | PASS | `href` = `apply_url`, `target="_blank"`, `rel="noopener noreferrer"`, hidden `(opens in a new tab)`. No link: `No public link. Source: official posting.` |
| Provenance; report count line | PASS | Source `Official posting (Workday)`, first seen, status checked, `Verified: Not yet`; after one report: `1 open report from students` |
| Similar offers | PASS | 3 items, shared topics, links open the right offer; `Closes 16 Nov` urgent, `Closes 03 Dec` muted |
| Report form | PASS | Radios move with arrow keys, default `It closed`; sent `wrong_info` + message, success box, row in `offer_reports`; blocked request shows `Could not send. Try again in a moment.` |
| Unknown slug | PASS | Not-found card, `noindex`, title `MVA Stages: offer not found` (after fix for in-app navigation) |
| Deep link + refresh | PASS | Dev and preview serve deep links (production rewrite is a production item) |

### Submit

| Item | Result | Evidence or note |
|---|---|---|
| Required errors and focus | PASS | Empty submit: errors on link, organization, title, `aria-invalid`, focus on the link field |
| URL format | PASS | `ftp://...` refused |
| Length limits | PASS | 201 / 301 / 121 / 121 chars on organization, title, city, reference refused, focus on the first |
| Drive link rejected | PASS | `drive.google.com` and `docs.google.com` refused, also with "MVA Drive" chosen |
| Personal email rejected (client and DB) | PASS | Client: error on the field that holds it (notes, stipend); `jobs@` accepted. DB: direct insert with the publishable key returns `22023 Personal email addresses are not allowed` |
| Topic limit 3 | PASS | After 3, the other 20 chips get `aria-disabled` + `aria-describedby="topics-help"` and the disabled colors |
| Duplicate by link | PASS | `https://WWW...pasteur...signals?utm_source=x#top` matched the existing offer, box with link |
| Duplicate by organization + reference | PASS | `airbus (central r&t, ai)` + `jr10444227` matched (case-insensitive). The database fallback queries (`ilike` on org + reference, `in` on URL variants) return the row via REST |
| Valid insert, thank-you, See your offer, row in DB, Add another | PASS | Two inserts (with and without link): `user_submitted`, `verified = false`, random slug, `Found on: ...` first line of notes; `See your offer` opens it with the badge; `Add another` clears the form and focuses the link |

### Legal

| Item | Result | Evidence or note |
|---|---|---|
| Host, database, analytics sentence, "no tracking cookies" | PASS | Text equals PLAN.md legal block |
| Contact form validation | PASS | Empty: `Write a message.`; bad URL, bad email, 2001 chars refused; focus on first error |
| Contact success, row in DB, not readable | PASS | Row in `contact_requests` (`correct`, URL, message, reply email); `GET /rest/v1/contact_requests` with the publishable key returns `[]` (same for `offer_reports`) |
| `/legal#contact` | PASS | Footer link scrolls to the form |

### Cross-cutting

| Item | Result | Evidence or note |
|---|---|---|
| Keyboard only, visible focus, no traps, skip link | PASS | Tab walk on board (45 stops), offer, submit, legal: every stop has an outline, order follows the layout, Tab wraps from footer back to the skip link. Skip to content and Skip to offers move focus |
| Console without errors | PASS | Dev: only Vercel Analytics debug logs on every route. Preview: only the expected 404 of `/_vercel/insights/script.js` (served by Vercel in production) |
| Lighthouse board, mobile and desktop | PASS | See scores |
| axe 0 serious | PASS | 0 violations on every route and state after the fix (before: 1 moderate `region`) |
| Titles, descriptions, OG, favicon, robots.txt | PASS | Per-route title and description, `og:title` follows; 9 OG tags; `favicon.svg`, `robots.txt` 200; `og.png` 1200x630 |
| Design comparison 1440 and 390 | PASS | Layout, spacing, colors and copy match `design/*.dc.html` plus the PLAN.md adaptations; literal copy spot-checked |
| Test rows deleted | PASS | offers 668, offer_reports 0, contact_requests 0 |

### Scores

| Tool | Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|---|
| Lighthouse mobile | `/` (preview) | 100 | 100 | 96 | 100 |
| Lighthouse desktop | `/` (preview) | 100 | 100 | 96 | 100 |

Best practices 96 only because of the local 404 of `/_vercel/insights/script.js`. Mobile LCP 0.8 s,
TBT 10 ms, CLS 0.03.

axe-core 4.10.2 (injected, the CLI needs a ChromeDriver matching Chrome 156), tags wcag2a, wcag2aa,
wcag21aa, wcag22aa, best-practice: 0 violations on `/`, `/?open=0&sort=az` (100 cards, 43 dimmed),
`?verified=1` empty state, full offer, near-empty offer, not found, `/submit` (clean and with
errors), `/legal` (clean and with errors).

### Fixes made

- `src/Root.tsx`: the "Skip to content" link sits over the dark header; its focus ring now uses `--color-focus-on-dark` (was the blue ring at 2.38:1).
- `src/components/Notes.tsx`: warning banner wrapped in `<aside aria-label="Warning">` so it is inside a landmark (axe `region`).
- `src/pages/Offer.tsx`: on in-app navigation to an unknown slug, the parent page overwrote the not-found title and description with `MVA Stages: offer`; it now sets the same not-found meta.
- `src/pages/Submit.tsx`: topic toggling uses a functional state update, so two quick clicks cannot read a stale list and drop a topic.

After the fixes: `npm test` (32 passed), `npm run lint` (clean), `npm run build` (ok).

### Decided and fixed by the orchestrator (after the local run)

1. Drive link message: now `Drive links cannot be published. Paste the original posting, or pick MVA Drive or Mailing list below and leave the link empty.` (`src/lib/validate.ts`).
2. Length message: now `Keep it to N characters or fewer.`, which matches the limit (`src/lib/validate.ts`).
3. Removed postings keep the link (the board always links to the original) and add a muted line: `The posting was taken down when we last checked, so the link may no longer work.` (`src/pages/Offer.tsx`).
4. Focus moves to the success message after sending a report or a contact request (`ReportForm.tsx`, `ContactForm.tsx`).

`npm test` (32/32), `npm run lint` and `npm run build` pass after these changes. They are re-checked in production QA.

### Notes

- **Headless Chrome screenshots at 390** render wider than 390 (minimum window width), so 390 checks were done in a 390px iframe in Chrome instead.

## Production (2026-11-09)

Run against https://mva-stages.vercel.app (Vercel, deployment from `fcd5334`) and the remote
Supabase project (eu-west-3). Browser: Chrome (Claude in Chrome, own tab). Narrow checks at 390 in
390px iframes, as in the local run. Today = 2026-11-09 (Europe/Paris). Test rows were tagged
`QA-PROD-TEST` and deleted at the end.

Expected numbers from SQL on the remote DB (effective status): open 391, closing in 3 weeks 19,
stipend stated 71, open or expected 440, `max(status_checked)` 2026-11-09; by effective status
open 391, expected 49, closed 28, removed 155, unknown 45. Same data as the local run.

Result: **PASS**. No checklist failure. Two observations under "Notes" (one about the data).

### Production only

| Item | Result | Evidence or note |
|---|---|---|
| Env vars loaded | PASS | Board shows Open 391, Closing in 3 weeks 19, Stipend stated 71, Last sweep `09 Nov`; no "not configured" or error box on any route; offers fetched from the remote project |
| Deep links and refresh | PASS | Direct load and reload of `/offer/<slug>`, `/submit`, `/legal`, `/?topics=llm&sort=az` (53 offers, `llm` and `A to Z` pressed): all 200 and render. `/offer/nope` and `/whatever`: not-found card, `<meta name="robots" content="noindex">`, titles `MVA Stages: offer not found` / `page not found` (HTTP status is 200, SPA rewrite) |
| robots.txt | PASS | `User-agent: *` / `Allow: /`, text/plain |
| OG and description in the HTML | PASS | `curl /`: title, description, 9 `og:*` tags (`og:image` absolute, 1200x630 declared), `twitter:card`, theme-color |
| favicon, og.png | PASS | `/favicon.svg` 200 image/svg+xml; `/og.png` 200 image/png, `file`: 1200 x 630 |
| Web Analytics script and page views | PASS | `/_vercel/insights/script.js` 200; `POST /_vercel/insights/view` 200 on load and again on client-side navigation board to offer |
| Custom events | N.A. (Hobby) | `track()` does send `POST /_vercel/insights/event` (200) on "Open the original posting", on report sent and on offer added. The dashboard Events panel says "No custom events ... Upgrade to a Pro team", as documented in PLAN.md |
| Vercel dashboard | PASS | Project Analytics (Production, last 7 days) shows 5 visitors, 113 page views, the QA routes listed. Nothing clicked; the "Enable 2FA" card was left alone (it has no "Remind me" button) |
| Bundle: secrets | PASS | 9 files scanned (HTML, 7 JS chunks incl. lazy `Offer`, `Submit`, `Legal`, `FormBits`, `analytics`, 1 CSS). 0 hits for the values of `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `POSTGRES_PASSWORD` and the DB URLs; 0 `sb_secret_` keys (the only `sb_secret_` string is supabase-js's prefix check); 0 JWTs, 0 `service_role` |
| Bundle: publishable key | PASS | The remote `VITE_SUPABASE_PUBLISHABLE_KEY` and URL are in the bundle, no other `sb_publishable_` key, no `127.0.0.1:55321` |
| Bundle: denylists | PASS | `privacy-denylist.txt` 9 patterns, `privacy-denylist.local.txt` 15 patterns: 0 hits each. Only email in the bundle: `privacy@vercel.com` (role address, legal page) |
| Test rows deleted and counted | PASS | See Cleanup |

### RLS with the production publishable key (remote REST)

| Check | Result | Evidence |
|---|---|---|
| Read offers | PASS | `count=exact`: `Content-Range 0-667/668` |
| Forged insert (`verified` true, `source_type` official_posting, own slug, `status` closed) | PASS | 201, stored `verified=false`, `user_submitted`, random 36-char slug, `status=unknown` |
| Personal email in an offer | PASS | 400 `22023 Personal email addresses are not allowed...`; a `jobs@` address is accepted |
| PATCH / DELETE on offers (swept and own submission) | PASS | 200 `[]`, SQL: no row changed, none deleted |
| Insert report | PASS | 201; with `resolved: true` refused (401, RLS) |
| Read reports | PASS | `[]` |
| `offer_report_counts` | PASS | Readable, `open_reports: 1` for the reported offer |
| PATCH / DELETE on reports | PASS | `[]`, SQL: row unchanged |
| Insert contact request | PASS | 201 |
| Read contact requests | PASS | `[]` |
| PATCH / DELETE on contact requests | PASS | `[]`, SQL: row unchanged |

### Board

| Item | Result | Evidence or note |
|---|---|---|
| Header, Board `aria-current`, Add an offer, focus ring on dark bg | PASS | Header stops ring `rgb(169,187,255)` (`#A9BBFF`) |
| Warning note | PASS | Visible on the board at 1440 and 390 |
| Stats equal SQL, Last sweep | PASS | 391 / 19 (urgent color) / 71 / `09 Nov` = remote `max(status_checked)` 2026-11-09 |
| Search, debounce | PASS | `mistral` set in 5 steps 100 ms apart: no URL change until 250 ms after the last, then `?q=mistral`, 3 offers |
| Accents both ways | PASS | `Saint-Denis` = `saint denis` = 2 (all statuses); `Île-de-France` = `ile de france` = 10 all, 6 open or expected |
| `title_en` search | PASS | `peer review` = 1 (Samovar) |
| Toggles alone and combined | PASS | default 440, `open=0` 668, `april=1` 64, `paid=1` 48, `open=0&april=1` 90, `open=0&paid=1` 71, `april=1&paid=1` 12; SQL agrees |
| Verified only empty state | PASS | `No offer is verified yet.` with the hint to turn it off |
| Country select | PASS | United States 3 open or expected / 6 all (SQL 3 / 6, covers `USA`); France 305 (SQL 305) |
| Topic chips | PASS | `llm` 53, `llm,agents` 61 (SQL 53 / 61), `aria-pressed` on the chosen chips |
| Sort | PASS | A to Z: Aalto, ABB, ABB Corporate Research, Ai2; Stipend: highest first (Google DeepMind, NVIDIA); `aria-pressed` moves |
| Clear filters | PASS | From 2 toggles + `llm` + France + `sort=az` (7 offers) to `?sort=az`, 440 offers, toggles back to default |
| Query string restore | PASS | Fresh load of `?q=inria&topics=computer-vision,health&country=France&open=0&april=1&sort=az` restores search, toggles, select, chips, sort (1 offer); invalid `sort`/`topics` ignored (440) |
| Empty state | PASS | `No offers match these filters.` / `Clear a filter, or add an offer you found.` with Submit link |
| Cards and pills | PASS | All 668 with `open=0`: Open 372, Closes in N days 18, Closes in 1 day 1, Expected 49, Closed 28, Posting removed 155, Status unknown 45 (= SQL); 0 Unverified badges on swept offers, badge shown on a test submission |
| Show more | PASS | `Show more offers (618 left)`, then 100 and `(568 left)`; 50 after a filter change (see Notes) |
| Back from an offer | PASS | `?open=0&sort=az`, 100 cards, scrolled to y=17152: Back restores URL, 100 cards and y=17152 |
| Loading skeleton | PASS | On a fresh load: `aria-busy`, `Loading offers...`, stat values `...`, then the list |
| Error box + Try again | N.A. | Cannot break the production DB; covered by the local run (same build path) |
| 390px | PASS | `scrollWidth` 390 on `/`, two offers, `/submit`, `/legal`, not-found; `Filters` disclosure toggles `aria-expanded`, label `Hide filters (1)` with one active filter; skip link present; visual check of board, offer and submit at 390 |

### Offer

| Item | Result | Evidence or note |
|---|---|---|
| Full offer | PASS | `institut-pasteur-inria-epimethee-...`: Where, Stipend (683 €/month + text), Start and duration, Deadline, How to apply, Eligibility, About, Good to know |
| Near-empty offer | PASS | `apple-sear-agents-and-cybersecurity-internship`: only Stipend and Start `Not stated`, Deadline `Rolling or not stated`; Where hidden; `No public link. Source: official posting.` |
| `title_en`, Posted | PASS | Airbus `JR10444227`: English subtitle `2027 internship: AI for aircraft production optimis...`, Posted shown |
| Open the original posting | PASS | `target="_blank"`, `rel="noopener noreferrer"`, hidden `(opens in a new tab)`, href = `apply_url` |
| Removed posting keeps the link + muted line (orchestrator fix 3) | PASS | Air Liquide `R10096835` and Airbus `JR10444227` (both `removed`): link kept, `The posting was taken down when we last checked, so the link may no longer work.` |
| Provenance, report count | PASS | Source, first seen, status checked, verified; after one report `1 open report from students` |
| Similar offers | PASS | 3 links on full, near-empty and removed offers |
| Report form, focus on success (orchestrator fix 4) | PASS | Arrow key moved the radio from `closed` to `wrong_info`; sent with message; focus on `Thanks, your report was sent.` (`role=status`, `tabindex=-1`); row in `offer_reports` (`wrong_info`, right offer) |
| Unknown slug | PASS | Not-found card, `noindex` |

### Submit

| Item | Result | Evidence or note |
|---|---|---|
| Required errors and focus | PASS | url, org, title `aria-invalid`, focus on the link |
| URL format | PASS | `ftp://...` refused |
| Length limits and message (orchestrator fix 2) | PASS | 201/301/121/121 chars: `Keep it to 200 characters or fewer.` / `300` / `120`, focus on organization |
| Drive link and message (orchestrator fix 1) | PASS | `drive.google.com` and `docs.google.com` (also with MVA Drive chosen): `Drive links cannot be published. Paste the original posting, or pick MVA Drive or Mailing list below and leave the link empty.` |
| Personal email (client and DB) | PASS | Notes and stipend refused with `Remove personal email addresses...`, focus on the field; `jobs@` accepted; DB refusal in the RLS table |
| Topic limit 3 | PASS | 3 pressed, other 20 `aria-disabled` + `aria-describedby="topics-help"`, a 4th click ignored |
| Duplicate by link | PASS | `https://WWW.research.pasteur.fr/...?utm_source=x#top` matched the Pasteur offer, box with link |
| Duplicate by org + reference | PASS | `airbus (central r&t, ai)` + `jr10444227` matched |
| Valid insert, thank-you, See your offer, Add another | PASS | Two inserts (with link, and without link from Mailing list): `user_submitted`, `verified=false`, random slug, notes start with `Found on: ...`; focus on the thank-you; See your offer shows the Unverified badge and `Added by a student`; Add another clears the form and focuses the link |

### Legal

| Item | Result | Evidence or note |
|---|---|---|
| Host, database, analytics sentence, no tracking cookies | PASS | Vercel and Supabase addresses, `privacy@vercel.com`, eu-west-3, analytics sentence and the no-cookies sentence present |
| Contact validation | PASS | Empty: `Write a message.`; bad URL, 2001 chars, bad email refused, focus on the first error |
| Contact success, focus (orchestrator fix 4), row, not readable | PASS | Focus on `Thanks, we got your request.` (`role=status`); row in `contact_requests` (`correct`, URL, message, reply email); REST select returns `[]` |
| `/legal#contact` | PASS | Footer `Report a mistake` lands on `/legal#contact` with the form at the top |

### Cross-cutting

| Item | Result | Evidence or note |
|---|---|---|
| Keyboard only | PASS | Board (60 Tab stops) and submit (46 stops): every stop has a 2px outline, order follows the layout |
| Console | PASS | 0 errors and 0 messages on board, offer, submit, legal, not-found (insights script loads in production) |
| Lighthouse | PASS | See Scores |
| axe | PASS | 0 violations (see Scores) |
| Titles and descriptions per route | PASS | Board, offer (`MVA Stages: <org>, <title>`), submit, legal, not-found each set their own title and description |

### Scores

| Tool | Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|---|
| Lighthouse mobile | `/` (production) | 96 | 100 | 100 | 100 |
| Lighthouse desktop | `/` (production) | 95 | 100 | 100 | 100 |

Mobile LCP 0.8 s, TBT 50 ms, CLS 0.028; desktop LCP 0.4 s, TBT 0 ms, CLS 0.011. Best practices is
100 now that the insights script exists.

axe-core 4.10.2 (injected, same tags as local): 0 violations on `/`, `/?open=0&sort=az` (100 cards),
`?verified=1`, full offer, near-empty offer, removed offer, `/offer/nope`, `/whatever`, `/submit`
(clean and with errors), `/legal` (clean and with errors).

### Cleanup

All `QA-PROD-TEST` rows (2 offers + 1 report + 1 contact from the RLS script, 2 offers + 1 report +
1 contact from the UI) deleted with `psql`. Counts after: **offers 668, offer_reports 0,
contact_requests 0**, `user_submitted` 0.

### Notes

- **Show more memory**: after "Show more" (100 cards), changing a filter shows 50 as expected, but
  undoing that filter right away shows 100 again (`Board.tsx` keeps `shown` for the old key). Harmless,
  not a checklist failure.
- **Data, for the maintainer**: some `notes` described a candidate's own selection experience rather
  than facts from the posting. CLAUDE.md forbids interview notes. Resolved below.

### Follow-up by the orchestrator (after the production run)

- **Candidate-experience notes removed.** qa-prod flagged `notes` that described someone's interview experience or mails received during an application (forbidden by `CLAUDE.md`). Checked each against its public source: the Skypher hiring process and the Perplexity application exercise are stated in the posting and stay. The process details of 7 offers (Institut Pasteur + Inria Epiméthée, Inbolt, Bosch agentic AI, 2 BNP Paribas CIB, Parrot Drones, Safran.AI) were not in any public source and were removed from `data/offers.json`, the seed and both databases. Remote check: 0 offers match those phrases, 668 offers.
- **Not fixed (minor):** on the board, after "Show more" to 100 cards, changing a filter drops to 50 (correct), but undoing that filter restores 100 (the visible count is remembered per filter key). Harmless.
- **Not fixed (by design of the SPA):** unknown paths return HTTP 200 with a client-side not-found page and `noindex`.
