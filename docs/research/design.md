# Design research: MVA Stages

## Sources (read 2026-11-09)

- `design/Main.dc.html` (board with filters), markup and `<script type="text/x-dc">` logic, read in full.
- `design/Offer.dc.html` (offer page), markup and script, read in full.
- `design/Submit.dc.html` (add an offer), markup and script, read in full.
- `design/Legal.dc.html` (legal notice and contact), markup and script, read in full.
- `CLAUDE.md` (data model and data rules).
- `supabase/migrations/20261109120000_init.sql` (columns, enums, length checks, trigger, RLS).
- the build brief (product decisions already taken, not published; cited where they override the design).
- `data/offers.json` and `scripts/build_seed.py`, only to measure real data (counts below were computed on 2026-11-09 from the 668 offers in the file).
- The live canvas https://claude.ai/artifact/AMirH5RiRkwQrLDYYMeBqQ was **not** read: the local files were complete and unambiguous enough.

Contrast ratios in section 7 were computed with the WCAG 2.x relative luminance formula (script in the session scratchpad, not committed).

---

## 1. Tokens, exact values

### 1.1 Colors

| Hex | Used for (exact places) | Proposed token |
|---|---|---|
| `#F6F5F1` | Page background (`body` and root div), header text, active nav underline (`border-bottom: 2px solid`), "+ Add an offer" button background, disabled topic chip background (Submit) | `--color-paper` |
| `#FFFFFF` | Surfaces: filter panel, stat tiles, offer cards, inputs, selects, field blocks, sections, unpressed chips and choice buttons, pressed sort segment; text on primary/dark buttons and pressed chips | `--color-surface` |
| `#16181D` | Main text (ink), header background, card title link, pressed choice buttons (report kind, work mode) bg and border, "Send report" and "Back to the board" button bg, "+ Add an offer" button text | `--color-ink` |
| `#3E424B` | Secondary text: org name on card, meta line (place/duration/start), "via" link, unpressed sort text, "Good to know" paragraph, similar-offer org, Legal secondary paragraph | `--color-ink-2` |
| `#5A5F69` | Muted text: subtitle, stat labels (`dt`), results count text, empty state body, reference, "via" prefix, field labels (`dt`), "Not stated" values, helper text, footer text, provenance `dt`, Legal `dt` | `--color-muted` |
| `#B9BCC4` | Header tagline "internships 2027" | `--color-header-muted` |
| `#E2E0D9` | Hairlines: panel/card/tile/section borders (1px), footer top border, field grid gap (as background), Submit form footer divider, disabled chip border | `--color-line` |
| `#C9C6BD` | Stronger borders: inputs, selects, textareas, "Clear filters" button, unpressed chips and choice buttons, outline buttons ("Something is wrong", "Add another"), dashed empty-state border | `--color-line-strong` |
| `#ECEAE3` | Sort segmented control track | `--color-track` |
| `#2747C7` | Links (`a`), focus outline, checkbox `accent-color`, topic tag text on card/offer, pressed topic chip bg and border, primary buttons ("Open the original posting", "Add to the board") | `--color-accent` |
| `#1A3296` | Link hover, "expected" pill text, Submit info note text | `--color-accent-strong` |
| `#E7EBFA` | Topic tag background, "expected" pill background, Submit info note background | `--color-accent-soft` |
| `#FBEADB` | Warning note background, "Closes in N days" pill bg, "Unverified" badge bg, provenance disclaimer bg | `--color-warn-bg` |
| `#F0D3B8` | Warning note bottom border | `--color-warn-line` |
| `#5C2B06` | Warning note text, "Closes in N days" pill text, "Unverified" badge text, provenance disclaimer text | `--color-warn-ink` |
| `#A94A0A` | Urgency emphasis: "Closing in 3 weeks" stat value, soon deadline on card and offer page, "April start not stated: ask them", similar-offer "Closes 03 Dec", required asterisk on Submit | `--color-urgent` |
| `#1D5A34` | "Open" pill text, "Thanks, your report was sent." text, "Verified: Yes" text, "Thanks, the offer is on the board." | `--color-ok-ink` |
| `#E2F0E6` | "Open" pill bg, report success box bg | `--color-ok-bg` |
| `#4A4F57` | Neutral pill text (closed, removed, unknown) | `--color-neutral-ink` |
| `#ECECEA` | Neutral pill bg | `--color-neutral-bg` |
| `#767B84` | Disabled topic chip text (Submit, when 3 topics are already chosen) | `--color-disabled` |
| `rgba(22,24,29,0.12)` | Shadow of the pressed sort segment | `--shadow-segment: 0 1px 2px rgba(22,24,29,0.12)` |

Opacity: closed and removed cards get `opacity: 0.62` on the whole `<article>` (see 7.10, this fails contrast).

### 1.2 Typography

- Google Fonts URL (exact, same in all four files):
  `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap`
  with `<link rel="preconnect" href="https://fonts.googleapis.com">`. The design does not preconnect to `https://fonts.gstatic.com` (crossorigin); add it.
- Families: `'IBM Plex Sans', system-ui, sans-serif` (body), `'IBM Plex Mono', monospace` (org names, references, uppercase labels, dates in provenance, tagline).
- Weights used: Sans 400, 500, 600, 700 (h1/h2 without explicit weight inherit the UA bold = 700). Mono 400 and 500 (org on card is 500).
- Base: `font-size: 15px`. Line height per page: Main 1.45, Offer 1.5, Submit 1.5, Legal 1.6.

| Size | Where |
|---|---|
| 11px | Mono uppercase labels: stat `dt`, card "Stipend"/"Deadline", offer field `dt` |
| 12px | Tagline, card org and ref (mono), pills, unverified badge, topic tags, "via" line, similar-offer org |
| 13px | Filter labels and legends (600), chips, sort buttons, offer page org/ref (mono), footer, Submit helper text, provenance disclaimer, similar-offer deadline |
| 14px | Warning note, meta line, "Clear filters", muted stipend/deadline values, field secondary lines, back link, report kind buttons, provenance list, Submit info note and work-mode buttons |
| 15px | Body, card stipend/deadline values, provenance and similar headings |
| 16px | Offer page English title (`title_en`) |
| 18px | Card title (600, lh 1.3), offer stipend value (600), section h2 (Offer, Legal), Submit thank-you headline |
| 20px | Brand "MVA Stages" (700), stat values (600) |
| 30px | h1 on Offer (lh 1.2, -0.015em), Submit and Legal (-0.015em) |
| 32px | h1 on Main (lh 1.15, -0.02em) |

Letter spacing: brand `-0.01em`, Main h1 `-0.02em`, other h1 `-0.015em`, mono uppercase labels and card org `0.04em`. The similar-offer org is uppercase mono without letter spacing (inconsistency; use 0.04em).

Proposed tokens: `--font-sans`, `--font-mono`; `--text-2xs: 11px`, `--text-xs: 12px`, `--text-sm: 13px`, `--text-base-sm: 14px`, `--text-base: 15px`, `--text-md: 16px`, `--text-lg: 18px`, `--text-xl: 20px`, `--text-2xl: 30px`, `--text-3xl: 32px`; `--tracking-label: 0.04em`, `--tracking-h1: -0.02em`, `--tracking-h1-sub: -0.015em`, `--tracking-brand: -0.01em`. Note Tailwind's default `text-xs`/`text-sm`/`text-base` are 12/14/16px: overriding them is clearer than inventing names, but keep 13 and 15 as explicit tokens.

### 1.3 Radii

| Value | Where | Token |
|---|---|---|
| 4px | Status pills, unverified badge | `--radius-xs` |
| 6px | Inputs, selects, buttons, sort segments, provenance disclaimer, report success box | `--radius-sm` |
| 8px | Stat tiles, sort track | `--radius-md` |
| 10px | Filter panel, cards, sections, field grid, empty state, info note | `--radius-lg` |
| 999px | Topic tags and chips | `--radius-full` |

### 1.4 Spacing, sizes, widths

- Max widths: 1240px (header, warning note, board main, offer main, footer), 820px (Submit main), 760px (Legal main), `70ch` (offer description paragraphs).
- Horizontal page gutter: 24px everywhere (header `14px 24px`, note `10px 24px`, main, footer `20px 24px`).
- Main padding: board `28px 24px 64px`, offer `24px 24px 64px`, submit and legal `32px 24px 64px`.
- Header: gap 16px; brand row gap 12px (baseline aligned); nav gap 8px; nav link padding `10px 12px`; add button padding `10px 16px`.
- Board: title row gap 16px, margin-bottom 20px; h1 margin-bottom 6px; stat tiles gap 8px, padding `8px 14px`; columns gap 24px; filter panel padding 18px, inner gap 20px; label-to-input gap 6px; toggles gap 4px, row gap 10px, min-height 36px, checkbox 18x18; chips gap 6px, padding `6px 12px`, min-height 32px; results column gap 12px; sort track padding 3px, gap 4px, segment padding `8px 12px`, min-height 36px.
- Card: padding `18px 20px`, gap `16px 24px`; left column gap 8px; header row gap 8px; meta line gap `4px 14px`; tags gap 6px, tag padding `3px 10px`; badge padding `2px 6px`; pill padding `3px 8px`; right column gap 8px.
- Empty state: padding `40px 24px`, dashed border.
- Offer: header card padding 28px, gap 14px; buttons gap 10px, padding `12px 18px`; field grid `repeat(auto-fit, minmax(200px, 1fr))`, gap 1px (hairlines), cell padding `16px 18px`; sections padding `24px 28px`; aside sections padding 20px, gap 16px; provenance rows gap 10px; disclaimer padding `10px 12px`; similar list gap 12px.
- Submit: form padding 28px, gap 24px; fields grid `repeat(auto-fit, minmax(240px, 1fr))` gap 16px; inputs padding 12px (filters use `10px 12px`); info note padding `14px 16px`, gap 12px; footer of form `padding-top: 20px` with top border.
- Legal: sections padding `24px 28px`, gap 16px; dl `grid-template-columns: minmax(120px, max-content) 1fr`, gap `6px 20px`.
- Min target heights: 44px (inputs, selects, "Clear filters", primary/secondary buttons, back link, report and work-mode choice buttons), 36px (toggle rows, sort segments), 32px (topic chips).
- Focus: `outline: 2px solid #2747C7; outline-offset: 2px` on `:focus-visible` for input, select, textarea, button, a (Legal only declares it for `a`).

### 1.5 Proposed Tailwind v4 `@theme`

```css
@theme {
  --font-sans: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --color-paper: #F6F5F1;
  --color-surface: #FFFFFF;
  --color-ink: #16181D;
  --color-ink-2: #3E424B;
  --color-muted: #5A5F69;
  --color-header-muted: #B9BCC4;
  --color-line: #E2E0D9;
  --color-line-strong: #C9C6BD;
  --color-track: #ECEAE3;
  --color-accent: #2747C7;
  --color-accent-strong: #1A3296;
  --color-accent-soft: #E7EBFA;
  --color-warn-bg: #FBEADB;
  --color-warn-line: #F0D3B8;
  --color-warn-ink: #5C2B06;
  --color-urgent: #A94A0A;
  --color-ok-ink: #1D5A34;
  --color-ok-bg: #E2F0E6;
  --color-neutral-ink: #4A4F57;
  --color-neutral-bg: #ECECEA;
  --color-disabled: #767B84;
  /* added for accessibility, see 7.10 */
  --color-input-line: #858178;   /* 3.88:1 on white, 3.56:1 on paper */
  --color-focus-on-dark: #A9BBFF; /* 9.5:1 on #16181D */

  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;

  --shadow-segment: 0 1px 2px rgba(22, 24, 29, 0.12);

  --text-2xs: 11px;
  --text-sm-13: 13px;
  --text-body: 15px;

  --tracking-label: 0.04em;
  --container-board: 1240px;
  --container-form: 820px;
  --container-prose: 760px;
}
```

---

## 2. Component inventory

Legend: "shown" means the design draws it; "not shown" means it must be designed in the build.

| Component | Variants / states shown | Not shown |
|---|---|---|
| **Header** | Dark bar, brand + tagline, nav with "Board" link and "+ Add an offer" light button. Active state: only Main draws it (Board gets `border-bottom: 2px solid #F6F5F1`). Offer, Submit and Legal show no active item. | Hover (inline color overrides `a:hover`), `aria-current`, active state of "+ Add an offer" on /submit, focus ring on dark bg (the blue ring is 2.38:1 there) |
| **Warning note** (`role="note"`) | One variant, board only, triangle icon, bold lead sentence | Dismiss (do not add: decision says always visible) |
| **Info note** (Submit) | Blue variant, info circle icon | n/a |
| **Stat tile** | Label (mono uppercase) + value; value normal or urgent color | Loading value |
| **Filter panel** | Container with search, toggles, country, topics, clear | Collapsed mobile variant, active-filter count |
| **Search input** | Default, focus-visible | Clear button (native `type=search` gives one in some browsers), debounce |
| **Checkbox toggle** | Checked / unchecked, native checkbox with accent color | Disabled |
| **Select** | Default, focus-visible | Disabled, loading options |
| **Topic chip** (filter button) | Unpressed (white, strong border), pressed (accent bg, white text), `aria-pressed`. Submit adds disabled-like "full" state (paper bg, line border, `#767B84`, `cursor: not-allowed`) | Hover, count per topic |
| **Topic tag** (read-only, card and offer) | One style | n/a |
| **Sort segmented control** | Pressed (white, 600, shadow), unpressed (transparent, ink-2) | Hover |
| **Results count** | "**N** offers", `aria-live="polite"` | Singular "1 offer", loading text |
| **Empty state** | Dashed box, two lines, link to Submit | Distinct empty state for "database is empty" vs "filters match nothing" |
| **Offer card** | Normal; dimmed (closed/removed, opacity .62); with/without ref; with/without unverified badge; stipend emphasized (numeric) or muted; deadline soon (urgent), dated, or muted "Rolling or not stated" | Hover, focus within, skeleton |
| **Status pill** | `Open` (green), `Closes in N days` (warn), `Expected, not published yet` (blue), `Closed`, `Posting removed`, `Status unknown` (neutral) | "Closes today" / "1 day" wording, "deadline passed but still open" |
| **Unverified badge** | "Unverified · added by a student" | Variant for unverified swept offers (see 7.12) |
| **Back link** | "All offers" with chevron, 44px tall | n/a |
| **Primary link-button** | "Open the original posting" with external arrow icon | Hover, case with no URL |
| **Outline link-button** | "Something is wrong" (anchor to `#report`), "Add another" | Hover |
| **Field block** (offer `dl` grid) | Label + main value (500 or 600/18px) + optional secondary line (muted, or urgent for April warning); muted "Not stated" | Hidden-when-null rule (decision says hide), long values |
| **About section** | h2, description paragraph, "Good to know." notes paragraph | Missing description or notes |
| **Provenance block** | Source, First seen, Status checked, Verified (green "Yes, against the posting"), warn disclaimer | Verified = false wording, open report count |
| **Similar offers** | List of org + title + "Closes DD Mon" (urgent) | Empty (hide), item without deadline |
| **Report form** | Kind choice buttons (pressed = ink bg, default "It closed"), optional textarea, "Send report" dark button; success box (`role="status"`) | Sending (disabled), error, length counter |
| **Choice button group** (report kind, work mode) | Pressed / unpressed, 44px | Proper radio semantics (see 7.10) |
| **Submit form fields** | Label (600), optional red asterisk for required, input/select/textarea, helper text under URL | Inline validation errors, invalid styling, duplicate found, sending, server error, character limits |
| **Privacy notice** | Info note on Submit | Client-side check for personal emails |
| **Thank-you state** (Submit) | Green headline, explanation, "Back to the board" dark button, "Add another" outline | Link to the created offer |
| **Legal sections** | White sections with h2 and paragraphs; definition grid for publisher/host/database | Contact form (required by decision), analytics sentence |
| **Contact form** | **Not in the design at all** | Everything (see 7.9) |
| **Footer** | Only on Main: disclaimer + 3 links | On Offer, Submit, Legal |

---

## 3. Screens decomposed

### 3.1 Board (`/`, Main.dc.html)

1. Header (Board active).
2. Warning note, full width bar, inner max 1240.
3. `main` (max 1240, padding 28/24/64):
   1. Title row: `flex-wrap`, `align-items: flex-end`, `space-between`, gap 16. Left: h1 + subtitle. Right: `dl` of 4 stat tiles, `flex-wrap`, gap 8.
   2. Two-column row: `flex-wrap`, gap 24, `align-items: flex-start`.
      - `aside` Filters: `flex: 1 1 260px; max-width: 100%`, column, gap 20: Search, "Show" fieldset (4 toggles), Country select, Topics fieldset (chips wrap, gap 6), "Clear filters".
      - `section` Offers: `flex: 999 1 560px; min-width: 0`, column, gap 12: results bar (count left, sort control right, wrap, gap 8), empty state (conditional), cards.
   3. Card: `flex-wrap`, gap `16px 24px`. Left column `flex: 999 1 380px; min-width: 0` (org row, title, meta line, tags + via). Right column `flex: 1 1 180px` (pill, Stipend, Deadline stacked).
4. Footer.

Implied breakpoints: filters sit beside results when the main content box is at least 260 + 24 + 560 = 844px, so at viewport >= 892px. At 1440 the content is 1192px, the aside stays about 260px (it gets 1/1000 of the free space) and results about 908px. Card columns sit side by side when the card's inner width is at least 380 + 24 + 180 = 584px (card width 626px), true from about 892px up; below that the right column wraps under the left and takes full width.

### 3.2 Offer (`/offer/:slug`, Offer.dc.html)

1. Header (no active item).
2. `main` (max 1240, padding 24/24/64): back link "All offers".
3. Row `flex-wrap`, gap 24, margin-top 8:
   - `article` `flex: 999 1 560px; min-width: 0`, column gap 20:
     1. Header card: meta row (org mono 13, ref mono 13 muted, status pill; wrap, gap `8px 12px`), h1 title, `title_en` subtitle, tags, buttons row (primary "Open the original posting", outline "Something is wrong").
     2. Field grid `dl`: Where, Stipend, Start and duration, Deadline, How to apply, Eligibility.
     3. About section.
     4. Report section (`id="report"`).
   - `aside` `flex: 1 1 300px; max-width: 100%`, column gap 16: Provenance, Similar offers.

Breakpoint: side by side when content >= 560 + 24 + 300 = 884px (viewport >= 932px). Field grid gives 1 column under about 400px of width, 2 at >= 401, 3 at >= 602 (article ~ 850px at 1440 gives 4 columns of 6 cells, so 4 + 2; check visually, `auto-fit` at 850px: floor((850+1)/201) = 4).

### 3.3 Submit (`/submit`, Submit.dc.html)

1. Header (no active item).
2. `main` max 820, column gap 20: intro (h1 + paragraph), info note, then either thank-you card or form.
3. Form card (padding 28, gap 24): URL field (full width) with helper; grid `auto-fit minmax(240px,1fr)` gap 16 with Organization, Title, City, Country, Stipend, Deadline, Start, Duration; Work mode choice group; Topics chips (max 3) with "Up to 3."; "Where you found it" select; "Anything else useful" textarea; footer row (submit button + helper), top border.

At 820 max the form inner width is 820 - 48 - 58 = 714px, so the grid shows 2 columns (2 x 240 + 16 = 496 <= 714 < 752).

### 3.4 Legal (`/legal`, Legal.dc.html)

1. Header (no active item).
2. `main` max 760, column gap 16: h1, then 4 sections: "Remove or correct an offer", "What this site is", "Personal data", "Publisher and host" (dl grid).
3. No footer in the design.

---

## 4. Copy, literally

### 4.1 Shared

- Brand: `MVA Stages`; tagline: `internships 2027`.
- Nav: `Board`, `+ Add an offer`. Nav `aria-label="Main"`.
- Page titles: `MVA Stages: board`, `MVA Stages: offer`, `MVA Stages: add an offer`, `MVA Stages: legal notice and contact`.
- Footer (Main only): `Run by MVA students, not by the program. Not an official ENS Paris-Saclay service.` Links: `Add an offer`, `Report a mistake`, `Legal notice and contact`.

### 4.2 Board

- Warning: **`This information may be wrong or out of date.`** ` It is collected from public postings, the MVA Drive and other students. Always check the original posting before applying.`
- h1: `Research internships for the MVA`
- Subtitle: `Every offer we found, from every source. Filter by what you need, then go to the original posting.`
- Stats: `Open`, `Closing in 3 weeks`, `Stipend stated`, `Last sweep` (value mock `06 Nov`).
- Filters `aria-label="Filters"`. Label `Search`, placeholder `Organization, title, city`. Legend `Show`. Toggles: `Open or expected only`, `Can start in April`, `Stipend stated`, `Verified only`. Label `Country`, first option `All countries`. Legend `Topics`. Button `Clear filters`.
- Results `aria-label="Offers"`: `{count} offers` (count in bold). Sort group `aria-label="Sort"`: `Deadline`, `Stipend`, `A to Z`.
- Empty: `No offers match these filters.` / `Clear a filter, or ` + link `add an offer you found` + `.`
- Card: badge `Unverified · added by a student`; meta `Start: {start}`; `via {source}`; labels `Stipend`, `Deadline`; fallback `Rolling or not stated`.
- Status labels: `Open`, `Closes in {n} days`, `Expected, not published yet`, `Closed`, `Posting removed`, `Status unknown`.

### 4.3 Offer

- Back link: `All offers`.
- Buttons: `Open the original posting`, `Something is wrong`.
- Field labels: `Where`, `Stipend`, `Start and duration`, `Deadline`, `How to apply`, `Eligibility`.
- Mock values that are copy patterns: `935 to 1,682 €/month`; `Depends on degree and school, per the posting` (secondary line); `"Dès que possible" · 6 months`; `April start not stated: ask them`; `03 Dec 2026`; `Through the posting`; `EDF careers portal`; `Not stated`.
- `About the internship`; notes lead **`Good to know.`**
- Report: h2 `Something is wrong?`; `Tell us and a maintainer will fix it. Reports are anonymous.`; legend `What is wrong`; kinds `It closed`, `Wrong info`, `Duplicate`, `Other`; label `Details (optional)`; placeholder `e.g. the posting now says the deadline is 15 December`; button `Send report`; success `Thanks, your report was sent.`
- Provenance: h2 `Where this comes from`; `Source`, `First seen`, `Status checked`, `Verified`; value `Yes, against the posting`; disclaimer `This summary can be wrong or out of date. The original posting is what counts.`
- Similar: h2 `Similar offers`; item line `Closes {DD Mon}`.

### 4.4 Submit

- h1 `Add an offer`; intro `Found something that is not on the board? Paste the link and fill what the posting says. It shows up right away, marked as unverified until a maintainer checks it.`
- Note: **`Only facts about the offer.`** ` Leave out your own application, interviews, and names or emails of recruiters. Use an email only if the posting says to apply there.`
- Labels and placeholders: `Link to the posting *` (placeholder `https://`, helper `The original page, not a repost. If it came as a PDF by mail, pick "Mailing list" below and leave this empty.`); `Organization *`; `Title, as posted *`; `City`; `Country`; `Stipend, as written` (`e.g. 1,500 €/month`); `Deadline` (date); `Start` (`e.g. April 2027, flexible`); `Duration` (`e.g. 5 to 6 months`).
- Legend `Work mode`: `On site`, `Hybrid`, `Remote`, `Not stated` (default).
- Legend `Topics`, helper `Up to 3.`, 23 chips (all topics, in migration order).
- `Where you found it`: `Company or lab website`, `MVA Drive`, `LinkedIn`, `Job board (WTTJ, Indeed, JobTeaser...)`, `Mailing list`.
- `Anything else useful` (`e.g. French B2 required; there is a twin posting in Grenoble`).
- Button `Add to the board`; helper `We check for duplicates by link and reference.`
- Thank you: `Thanks, the offer is on the board.` / `It shows as "Unverified · added by a student" until a maintainer checks it against the posting. To fix something later, use "Something is wrong" on the offer.` / `Back to the board` / `Add another`.

### 4.5 Legal

- h1 `Legal notice and contact`.
- `Remove or correct an offer`: `If you published one of these offers and want it changed or taken down, or you see your personal data here, write to [CONTACT EMAIL]. We act within a few days.` / `For a simple mistake, the "Something is wrong" button on each offer is faster.`
- `What this site is`: `A non-commercial index of research internship offers, kept by MVA students for other students. It is not a service of ENS Paris-Saclay or of the MVA program.` / `Each entry is a short summary written by us: organization, title, place, dates, stipend when the posting states it, and a link to the original. We do not copy the text of postings. The original posting is always what counts.`
- `Personal data`: `There are no accounts and no tracking cookies. Offers and reports are stored without any information about who sent them.` / `We never publish personal email addresses, only role addresses like jobs@ or recrutement@ when a posting gives one. A supervisor's name appears only when the public posting names them.`
- `Publisher and host`: `Publisher` = `Private individual, non-professional site (art. 6-III-2 LCEN). Identity held by the host.`; `Host` = `[HOST NAME, ADDRESS AND PHONE]`; `Database` = `[DATABASE PROVIDER AND REGION]`.

---

## 5. Behavior from the scripts

### 5.1 Board state and filters (Main)

Initial state, quoted:

```js
this.state = { q: '', topics: [], country: 'all', april: false, paid: false, openOnly: true, verifiedOnly: false, sort: 'deadline' };
```

Filter, quoted:

```js
if (s.openOnly && !(o.status === 'open' || o.status === 'expected')) return false;
if (s.april && !(o.april === 'yes' || o.april === 'flexible')) return false;
if (s.paid && o.min == null) return false;
if (s.verifiedOnly && !o.verified) return false;
if (s.country !== 'all' && o.country !== s.country) return false;
if (s.topics.length && !s.topics.some(function (t) { return o.topics.indexOf(t) >= 0; })) return false;
if (q && (o.org + ' ' + o.title + ' ' + o.city).toLowerCase().indexOf(q) < 0) return false;
```

- All filters are AND; topics are OR among themselves.
- Search: `q.trim().toLowerCase()`, plain substring on org + title + city. No accent folding, no `title_en`.
- `Clear filters` resets everything to the initial state **except `sort`** (reset object has no `sort`).
- Stats are computed on **all** offers, not on the filtered list: `open` counts `status === 'open'` only (expected excluded), `soon` counts open offers with 0 <= days left <= 21, `paid` counts `min != null`. "Last sweep" is hardcoded.
- Countries: `['all'].concat(Array.from(new Set(OFFERS.map(o => o.country))).sort())`, label `All countries` for `all`.
- Topic chips: a fixed 12-item `TOPICS` list: `llm, agents, computer-vision, time-series, foundation-models, neuro, health, earth-observation, climate-energy, graphs, rl, optimization`.

### 5.2 Sort

```js
var rank = { open: 0, expected: 1, unknown: 2, closed: 3, removed: 4 };
list.sort(function (a, b) {
  if (s.sort === 'stipend') return (b.max || b.min || -1) - (a.max || a.min || -1);
  if (s.sort === 'org') return a.org.localeCompare(b.org);
  var r = rank[a.status] - rank[b.status];
  if (r) return r;
  var da = daysLeft(a.deadline), db = daysLeft(b.deadline);
  return (da == null ? 9999 : da) - (db == null ? 9999 : db);
});
```

- Deadline sort: by status rank, then soonest deadline, null deadlines last (9999). Past deadlines are negative, so an `open` offer whose deadline has passed sorts **first** (5 such offers exist in the data today).
- Stipend sort: descending by max, else min; no stipend = -1 so last. No tiebreak; `||` would treat 0 as missing (harmless).
- A to Z: `localeCompare` on organization, no tiebreak.

### 5.3 Countdown, dates

```js
var TODAY = new Date('2026-11-09T00:00:00Z');
function daysLeft(iso) { return iso ? Math.round((new Date(iso + 'T00:00:00Z') - TODAY) / MS_DAY) : null; }
var soon = o.status === 'open' && dl != null && dl >= 0 && dl <= 21;
// label: soon ? 'Closes in ' + dl + ' days' : 'Open'
```

- Window: 21 days inclusive, deadline day counts as 0. Only `open` gets the soon label (not `expected`).
- `fmt`: `toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })` gives `03 Dec 2026`. Caution: recent ICU renders September as `Sept` in en-GB; use a fixed month array (`Jan` ... `Dec`) for deterministic output.
- Short form without year: `06 Nov` (Last sweep), `Closes 03 Dec` (similar offers).
- Inconsistency: the Offer mock shows `Closes in 24 days` with the warn style, but 24 > 21 so the board script would render it as green `Open`. Follow the script (21 days).

### 5.4 Card derivations

```js
place: o.city + (o.country !== 'Multiple' && o.city !== 'Remote' ? ', ' + o.country : '') + ' · ' + o.mode,
start: 'Start: ' + o.start,
stipendStyle: o.min != null ? 'font-weight: 600; font-size: 15px;' : 'color: #5A5F69; font-size: 14px;',
deadline: o.deadline ? fmt(o.deadline) : 'Rolling or not stated',
deadlineStyle: soon ? 'font-weight: 600; color: #A94A0A; font-size: 15px;' : (o.deadline ? 'font-size: 15px;' : 'color: #5A5F69; font-size: 14px;'),
var dim = o.status === 'closed' || o.status === 'removed';
```

Pill colors per status: open `#1D5A34/#E2F0E6`, soon `#5C2B06/#FBEADB`, expected `#1A3296/#E7EBFA`, closed/removed/unknown `#4A4F57/#ECECEA`; base `display: inline-block; font-size: 12px; font-weight: 600; border-radius: 4px; padding: 3px 8px;`.

### 5.5 Mock fields to real columns (proposal)

| Mock | Real column(s) | Rule |
|---|---|---|
| `org` | `organization` | as is |
| `title` | `title` | as is; `title_en` shown as subtitle on the offer page when it differs (287 offers) |
| `ref` | `reference` | hide when null (263 have one, max 36 chars) |
| `city`, `country` | `city` (112 null), `country` (22 null) | see place rule below |
| `mode` | `work_mode` | `onsite` `On site`, `hybrid` `Hybrid`, `remote` `Remote`, `unknown` hidden on cards (631 of 668 are unknown; `Not stated` only in the Submit choice) |
| `topics` | `topics` | as is |
| `min`, `max` | `stipend_min_eur_month`, `stipend_max_eur_month` | "Stipend stated" filter and stat and the bold style use `min != null` (71 offers) |
| `stipend` | `stipend_text` (162 non-null) | card shows `stipend_text`; if null but numbers exist, format `X to Y €/month` (or `X €/month` when equal); else `Not stated` |
| `start` | `start_text` | `Start: {start_text}` or `Start: Not stated` |
| `april` | `april_start` | filter yes or flexible |
| `duration` | `duration_text`, else from `duration_months_min/max` (`6 months`, `5 to 6 months`) | omit from the card when both null |
| `deadline` | `deadline` | as is |
| `status` | `status` | plus effective status, see 8 |
| `source` | derived | see below |
| `verified` | `verified` + `source_type` | see 7.12 |

Place: `[city, countryPart].filter(Boolean).join(', ')`, where `countryPart` is omitted if the city already contains it, then `' · ' + modeLabel` only when `work_mode !== 'unknown'`; if city and country are both null, `Location not stated`.

"via" source label: if `ats` is set, use it (map `WTTJ` to `Welcome to the Jungle`); else by `source_type`: `linkedin` `LinkedIn`, `mva_drive` `MVA Drive`, `mailing_list` `Mailing list`, `user_submitted` `a student`, `official_posting`/`lab_website`/`aggregator`/`other` the host of `source_url ?? apply_url` without `www.` (for example `jobs.esa.int`), falling back to `official posting`, `lab website`, `job board`, `other source`.

Other label maps (proposed, the design only shows some):

- `april_start`: `yes` `Can start in April`, `flexible` `Flexible start, April possible`, `no` `Does not start in April`, `unknown` `April start not stated: ask them` (urgent color, from the design).
- `apply_method`: `portal` `Through the posting` (design), `email` `By email`, `form` `Through a form`, `spontaneous` `Spontaneous application`, `unknown` hide. Secondary line: `apply_contact` (role address only) or `ats`.
- `msc_eligible`: `yes` `Open to M2 students`, `no` `Not open to M2 students`, `unknown` hide (design shows `Not stated`, but the decision in `docs/oneshot-build.md` says null-like fields are hidden except stipend, start and deadline). Secondary line: `requirements`.
- `org_type`: `company` `Company`, `startup` `Startup`, `big_tech` `Big tech`, `academic_lab` `Academic lab`, `public_agency` `Public agency` (show in the offer meta row, mono muted).
- `source_type` (provenance "Source"): `official_posting` `Official posting`, `lab_website` `Lab website`, `linkedin` `LinkedIn`, `aggregator` `Job board`, `mva_drive` `MVA Drive`, `mailing_list` `Mailing list`, `user_submitted` `Added by a student`, `other` `Other`; append ` ({ats})` when `ats` is set.
- Report `kind` values match the DB enum exactly: `closed`, `wrong_info`, `duplicate`, `other`.
- Work mode values on Submit match `work_mode` exactly: `onsite`, `hybrid`, `remote`, `unknown`.

### 5.6 Offer page

- Script only manages the report: `state = { kind: 'closed', sent: false }`; `send` just sets `sent: true`. No validation, no error. Real: insert `{ offer_id, kind, message: trimmed || null }` into `offer_reports` (message <= 2000), disable the button while sending, show the success box on success, inline error on failure.
- Similar offers are static in the mock (two EDF/Schneider items sharing `time-series`/`foundation-models`); logic is ours, see 8.
- Field values are static; mapping proposed in 5.5.

### 5.7 Submit

- Script: `state = { done: false, mode: 'unknown', topics: [] }`; `submit` sets `done: true` (no validation); `again` resets to empty. Topics: max 3, a click on a non-pressed chip when 3 are chosen does nothing, and the style switches to the "full" look.
- HTML validation hints: `type="url" required` on the link, `required` on Organization and Title, `type="date"` on Deadline. But the helper text says the link may be empty for "Mailing list", which contradicts `required`.
- Field to column: URL `apply_url` (also `source_url`), Organization `organization` (1..200), Title `title` (1..300), City `city` (<=120), Country `country` (<=80), Stipend `stipend_text` (<=200), Deadline `deadline`, Start `start_text` (<=200), Duration `duration_text` (<=120), Work mode `work_mode`, Topics `topics` (<=3 in UI, DB allows 5), Anything else `notes` (<=2000).
- "Where you found it" has **no column**: the trigger forces `source_type = 'user_submitted'`. See 7.11.
- There is **no Reference field**, yet the helper says "We check for duplicates by link and reference".
- The trigger also forces `slug` (random uuid), `verified=false`, `status` in (`open`,`unknown`) else `unknown`, `status_checked`, `first_seen`.

### 5.8 Legal

Static, no script logic.

---

## 6. Behavior at 390px

Content width at 390px viewport: 390 - 2 x 24 = **342px**.

- Header: brand (about 240px) and nav (about 210px) do not fit on one line (16px gap), so the nav wraps under the brand. OK, but the header becomes about 110px tall.
- Warning note: wraps, icon on its own line start. OK.
- Board title row: h1 32px wraps to 2 lines; stat tiles wrap to 2 rows of 2 (each about 110 to 160px). OK.
- Filters vs results: both wrap to full width (basis 260 and 560; results shrink to 342 thanks to `min-width: 0`). **The whole filter panel sits above the first result**: about 700px of search, toggles, select, 12 chips and the button (more with 23 chips). Needs a collapsible "Filters" disclosure under the 892px breakpoint (not in the design).
- Results bar: "668 offers" (about 90px) + sort (about 240px) + gap 8 = 338px, fits barely; it wraps cleanly if not.
- Card: inner width 342 - 2 - 40 = 300px; left column (basis 380) shrinks to 300, right column wraps below and stacks pill, stipend, deadline vertically, adding about 130px per card. Consider a 2-column mini grid (Stipend | Deadline) for the right column on mobile.
- Long strings in cards: longest title 134 chars, longest org 69 chars (mono uppercase, about 500px, wraps at spaces), longest city 84 chars (`Zurich / Berlin / ...`, wraps), longest reference 36 chars of a uuid (about 260px at 12px mono, fits but only just). Add `overflow-wrap: anywhere` on titles, org, ref and meta.
- Offer header card: inner 342 - 2 - 56 = 284px. h1 30px: a word like `spatio-temporelles` (about 18 chars at 30px, close to 290px) **can overflow**. Fix: `font-size: clamp(24px, 6vw, 30px)` and `overflow-wrap: anywhere` with `hyphens: auto` (`lang` on the title from the posting language is not stored; `hyphens` needs `lang`, so rely on `overflow-wrap`).
- Offer buttons: "Open the original posting" is about 250px wide, fits 284. Buttons stack. OK.
- Field grid: `minmax(200px, 1fr)` at 342 gives 1 column. OK.
- Report kinds: 4 buttons wrap to 2 rows. OK.
- Aside (provenance, similar) goes under the article, after the report form. Fine, but the provenance disclaimer comes after the report form; acceptable.
- Submit: form inner 342 - 58 = 284; grid `minmax(240px, 1fr)` gives 1 column. OK at 390, but **overflows below 346px viewport** (for example 320px: inner 214 < 240). Fix: `minmax(min(240px, 100%), 1fr)`. Same pattern for the offer grid (`min(200px, 100%)`).
- `input type="date"` on iOS Safari can exceed its container width; set `width: 100%` and `min-width: 0` on all inputs, plus `appearance: none` care for the date input.
- Legal dl: 120 + 20 + 144px for the value column; works but cramped. Stack `dt`/`dd` under 480px.
- Footer: wraps. OK.

---

## 7. What the design does not solve, with recommendations

### 7.1 Loading state
Recommend: board shows the stat tiles with a placeholder value (`...`), the results count as `Loading offers...` (in the same `aria-live` region), and 5 skeleton cards with the card shape and `--color-track` bars; set `aria-busy="true"` on the results section. Offer page: skeleton of the header card and the field grid. Respect `prefers-reduced-motion` (no shimmer animation in that case).

### 7.2 Network or Supabase error
Recommend: a box in the results column using the warn palette (`#FBEADB` / `#5C2B06`, no new red token): **`Could not load the offers.`** `Check your connection and try again.` with an outline `Try again` button that refetches. For a missing env var (misconfigured deploy) show the same box with `The board is not configured.` For form errors: inline message under the submit button, `Could not send. Try again in a moment.`, keeping the user's input.

### 7.3 Offer 404 / unknown slug
Recommend: keep the header, show a white card: h1 `This offer is not on the board`, text `It may have been removed, or the link is wrong.`, primary link `All offers`. Set `<meta name="robots" content="noindex">` and the title `MVA Stages: offer not found`. Same screen for an invalid slug and for a query that returns no row; distinguish network errors (7.2) from not found.

### 7.4 Very long titles and values
`overflow-wrap: anywhere` on h1/h2/titles/org/ref/city; clamp the offer h1 (6). Do not truncate titles on cards (they are the main information); optional `line-clamp: 3` is not recommended. Description and notes are capped at 2000 chars by the DB; keep `max-width: 70ch` and preserve line breaks (`white-space: pre-line`).

### 7.5 Offers with nearly every field null
Many offers have 12 to 15 null fields. Recommend, per the build brief: on the offer page, hide each field block whose value is null or `unknown`, except Stipend, Start and Deadline which always show (`Not stated` / `Rolling or not stated`). Hide the About section if both `description` and `notes` are null. If there is no `apply_url` and no `source_url` (158 offers, mostly MVA Drive and mailing lists), replace the primary button with muted text `No public link. Source: {source label}.` and keep "Something is wrong". On cards, omit duration and the work mode when unknown.

### 7.6 600+ cards
668 offers; about 583 pass the default filter. Each card is about 40 to 60 DOM nodes, so rendering all is 25k to 35k nodes, heavy on mobile and risky for the Lighthouse performance >= 90 target. Recommend: fetch all rows once (decision), filter and sort in memory, **render the first 50 and a `Show 50 more` button** (`Show more offers ({n} left)`) under the list, reset to 50 when filters change; count always shows the total. Add `content-visibility: auto; contain-intrinsic-size: auto 180px` on cards. No virtualization (bad for find-in-page and accessibility).

### 7.7 "Last sweep" date
Hardcoded `06 Nov` in the mock. Recommend (as decided): `max(status_checked)` over all offers, formatted `DD Mon` (add the year if it is not the current year). Today it is `2026-11-06`. Note that it reflects re-checks, not discovery; the label stays `Last sweep`.

### 7.8 Country list
The design builds it from distinct values. Real values are messy: `USA` and `United States`, `France or United Kingdom`, `Germany or France (remote)`, `Multiple (EMEA)`, `Italy, Belgium, Germany, Netherlands or Spain`, 22 nulls. Recommend: split each `country` on `,`, ` or `, and strip parentheses to get atomic countries; the select lists atomic countries sorted by number of offers (France first with 439), label `{Country} ({n})`; matching = the selected country is in the offer's atomic set. Normalize `USA` to `United States` in the data (a data fix for the next sweep, not in the UI). Countries that only appear inside "Multiple (EMEA)" style strings are not listed. Submit's free-text Country gets a `<datalist>` of the existing atomic countries.

### 7.9 Contact form on /legal
Not in the design, required by the build brief (new `contact_requests` table). Recommend: put it inside the first section "Remove or correct an offer", replacing `write to [CONTACT EMAIL]` with `use this form`. Fields in the existing visual language: choice group `What do you need` with `Remove an offer`, `Correct an offer`, `My personal data`, `Other`; `Link to the offer on this board (optional)`; `Message *` (textarea, <= 2000); `Email for a reply (optional)` with helper `Only used to answer you, never published.`; dark button `Send`; success box `Thanks, we got your request.` Add `#contact` id so the footer link `Report a mistake` can go to `/legal#contact` (today it points to the offer mock, meaningless on the real site). Also add to "Personal data": `Anonymous, cookieless usage statistics by Vercel Web Analytics.` and adjust `Offers and reports are stored without any information about who sent them.` to mention that the contact form stores the reply email only if given.

### 7.10 Accessibility gaps (contrast computed)

Text pairs, WCAG AA needs 4.5:1 (3:1 for >= 24px or >= 18.66px bold):

| Pair | Ratio | Result |
|---|---|---|
| ink `#16181D` on paper / on white | 16.28 / 17.76 | pass |
| ink-2 `#3E424B` on white | 10.07 | pass |
| muted `#5A5F69` on white / on paper / on track | 6.41 / 5.88 / 5.33 | pass |
| link `#2747C7` on white / on paper | 7.47 / 6.84 | pass |
| link hover `#1A3296` on white | 10.82 | pass |
| header text `#F6F5F1` on `#16181D` | 16.28 | pass |
| tagline `#B9BCC4` on `#16181D` | 9.35 | pass |
| warn ink `#5C2B06` on `#FBEADB` | 9.92 | pass |
| urgent `#A94A0A` on white / on paper | 5.72 / 5.24 | pass |
| topic tag `#2747C7` on `#E7EBFA` | 6.28 | pass |
| open pill `#1D5A34` on `#E2F0E6` | 6.96 | pass |
| expected pill / info note `#1A3296` on `#E7EBFA` | 9.10 | pass |
| neutral pill `#4A4F57` on `#ECECEA` | 6.97 | pass |
| sort unpressed `#3E424B` on `#ECEAE3` | 8.36 | pass |
| white on accent `#2747C7` / on ink | 7.47 / 17.76 | pass |
| disabled chip `#767B84` on paper | 3.90 | exempt (disabled), acceptable |
| **dimmed card** (opacity .62, effective bg `#FCFBFA`): title | 5.09 | pass |
| **dimmed card**: org and meta (`#3E424B` effective `#84868A`) | 3.53 | **fail** (12 to 14px) |
| **dimmed card**: muted text | 2.80 | **fail** |
| **dimmed card**: urgent, topic tag, closed pill | 2.79 / 2.89 / 2.86 | **fail** |

Non-text (WCAG 1.4.11 needs 3:1 for UI component boundaries and focus indicators):

| Pair | Ratio | Result |
|---|---|---|
| focus ring `#2747C7` on paper / white | 6.84 / 7.47 | pass |
| **focus ring `#2747C7` on header `#16181D`** | 2.38 | **fail** |
| **input border `#C9C6BD` on white** | 1.71 | **fail** (inputs, select, chips, outline buttons) |
| card border `#E2E0D9` | 1.32 | decorative, fine |
| active nav underline | 16.28 | pass |

Fixes: (a) dim closed/removed cards with opacity 0.9 at most (muted reaches 5.07, urgent 4.75), or better without opacity: keep the card at full opacity, use the paper background for the card and the neutral pill, which already says Closed; (b) focus ring in the header `#A9BBFF` (9.5:1) or `#F6F5F1`; (c) input and chip borders `#858178` (3.88:1 on white, 3.56:1 on paper), keep `#C9C6BD` for decorative borders only.

Other gaps:
- Report kind and work mode are single-choice groups built from `aria-pressed` buttons: use native radio inputs styled as those buttons (`fieldset` + `legend` already exist), so arrow keys and form semantics work.
- Topic chips on Submit when "full" need `aria-disabled="true"` and a reason (`Up to 3.` is already there; link it with `aria-describedby`).
- `aria-current="page"` on the active nav link; give "+ Add an offer" `aria-current` on /submit.
- Results count `aria-live="polite"` will announce on every keystroke: debounce search (200 to 300ms).
- Required fields: the red asterisk is visual only; keep `required` and add `aria-required` plus a line `* required` above the form.
- Validation errors must be tied with `aria-describedby` and `aria-invalid`; move focus to the first invalid field.
- Hover is invisible on most links because inline colors win over `a:hover`: define hovers (title underline, primary `#1A3296`, dark `#2B2E36`, outline buttons bg paper).
- Targets: chips 32px and sort 36px are below the 44px of the build brief but pass WCAG 2.2 AA (24px). Keep the design sizes; 44px for main controls only.
- External link: open in the same tab, or if `target="_blank"`, add `rel="noopener noreferrer"` and a visually hidden `(opens in a new tab)`.
- Add a "Skip to offers" link before the filter panel (the panel is long on mobile).
- The card title is the only link; the "via" link in the mock also goes to the offer page: make "via" plain text so each card has one tab stop.

### 7.11 Submit form gaps
- "Where you found it" cannot be stored (`source_type` is forced). Recommend: keep the select for UX, store it as the first line of `notes` (`Found on: LinkedIn.`), and use it to make the URL optional for `Mailing list` and `MVA Drive`. Never accept a Drive link: reject URLs on `drive.google.com` / `docs.google.com` with `Drive links cannot be published. Leave the link empty.`
- Add an optional `Reference, if the posting has one` field (`reference`, <= 120) since duplicates are checked by reference.
- Duplicate check before insert: normalize the URL (lowercase host, drop `utm_*` params, trailing slash, fragment) and query `apply_url`/`source_url` equality, plus `reference` equality within the same organization (case-insensitive). On a hit, block and show `This offer is already on the board.` with a link to it.
- Personal emails: public inserts bypass `build_seed.py`, so nothing stops a personal address in `notes` or `apply_contact`. Recommend a client check (any email whose local part is not a role word: jobs, job, careers, recrutement, recruitment, rh, hr, internships, stages, contact, info) blocking with `Remove personal email addresses. Only role addresses like jobs@ are allowed.`, and flag to the plan a DB check or trigger in a new migration as defense in depth.
- Insert `status: 'open'` (the trigger accepts it) and use `.select('slug').single()` (anon can select) so the thank-you state can add `See your offer` linking to `/offer/{slug}`.
- Validation messages (mirroring the DB): `Paste a link that starts with http:// or https://.`, `Organization is required.`, `Title is required.`, `Keep it under {n} characters.`

### 7.12 Verified badge vs data reality
`data/offers.json` has no `verified` key, and the seed never sets it, so **all 668 swept offers will load with `verified = false`**. With the design's rule (`unverified: !o.verified`) every card shows `Unverified · added by a student`, which is false for swept offers, and "Verified only" empties the board. Recommend: show the badge only when `source_type = 'user_submitted' AND NOT verified`; make "Verified only" hide exactly those offers (relabel `Hide unverified submissions`), or keep the label and the strict meaning only once maintainers have verified swept offers. In provenance, `Verified` shows `Yes, against the posting` (green) when true, `Not yet` (muted) otherwise.

### 7.13 Topic chips on the board
The design shows 12 of 23 and omits frequent topics: `physics-sim` (80 offers), `robotics` (48), `3d-vision` (43), `bio-chem` (35), `generative-models` (33), `efficiency` (26). Counts today: other 133, computer-vision 128, health 101, llm 84, physics-sim 80, time-series 68, agents 49, robotics 48, climate-energy 46, 3d-vision 43, earth-observation 40, bio-chem 35, foundation-models 34, generative-models 33, efficiency 26, neuro 22, optimization 21, theory 19, rl 17, speech-audio 12, graphs 12, nlp 6, recsys-ir 6. Recommend: show **all topics that have at least one offer**, sorted by count descending, `other` last, computed from the data (so the list stays honest after sweeps). 23 chips wrap to about 9 rows in the 260px panel; acceptable, and the panel is collapsible on mobile.

### 7.14 Other
- **Effective status:** 5 offers are `open` with a past deadline. Per the rule "closed when the deadline passed", treat `status === 'open' && deadline < today` as `closed` for label, dimming, stats, sort and the "open or expected" filter. Do not write back to the DB.
- **Countdown wording:** `Closes today` (0), `Closes in 1 day` (1), `Closes in N days` (2 to 21). "Today" = the current calendar date in Europe/Paris, compared as UTC dates (`Date.UTC(y, m, d)`), so the count does not shift by time zone.
- **Count wording:** `1 offer` vs `N offers`.
- **URL state:** filters in the query string: `q`, `topics` (comma list), `country`, `april=1`, `paid=1`, `open=0` (default on, so only the off value is written), `verified=1`, `sort` (`deadline` default, `stipend`, `az`). Use `replace` while typing.
- **Back link:** "All offers" should return to the board with the previous query string (history back when the referrer is the board, else `/`).
- **Sort ties:** add tiebreakers (stipend: then deadline; A to Z: then title; deadline: then organization) so the order is stable.
- **Search:** fold accents (`normalize('NFD').replace(/\p{Diacritic}/gu, '')`) on both sides and include `title_en` and `country`.
- **Footer on all pages:** the design only has it on the board; reuse it everywhere (the legal link must be reachable from every page).
- **First seen:** the JSON has no `first_seen`, so the seed sets `current_date` at load time: every swept offer will show the same "First seen". Acceptable but note it; the next sweep should carry real dates.
- **Report counts:** `offer_report_counts` is public but unused by the design. Recommend a muted line in provenance when > 0: `{n} open report(s) from students`.
- **Page titles:** offer `MVA Stages: {organization}, {title}`; not found `MVA Stages: offer not found`.

---

## 8. Decisions for the plan

- Use the tokens of section 1.5 in a Tailwind v4 `@theme`, plus two added tokens: `--color-input-line: #858178` for input, select, chip and outline-button borders and `--color-focus-on-dark: #A9BBFF` for focus inside the header.
- Load fonts with the exact Google Fonts URL from 1.2, and add a preconnect to `fonts.gstatic.com` with `crossorigin`.
- Base font size 15px. Line height 1.5 everywhere and 1.6 on Legal prose. Drop the board's 1.45: the difference is too small to see and one less special case.
- Closed and removed cards: drop `opacity: 0.62` (it fails AA). Use full-opacity text on a paper background and let the neutral pill say the status.
- Badge `Unverified · added by a student` only when `source_type = 'user_submitted' && !verified`. Relabel the "Verified only" toggle to `Hide unverified submissions` and give it that meaning. Raise this with the maintainer, since all 668 seeded offers are unverified.
- Effective status: `open` with `deadline < today` (Paris date) is treated as `closed` in the UI. Countdown: `Closes today` / `Closes in 1 day` / `Closes in N days`, inclusive 21-day window, `open` only.
- Dates use a fixed English month array (`03 Dec 2026`, short form `03 Dec`), not `toLocaleDateString`.
- Stats are computed on all offers with effective status. "Last sweep" is `max(status_checked)`.
- Fetch all offers once, then filter and sort in memory. Render 50 cards plus `Show more offers ({n} left)`, and add `content-visibility: auto` on cards.
- Filters live in the query string with the keys from 7.14. Search is debounced, accent-folded, and covers org, title, title_en, city and country.
- Topic chips: every topic with at least one offer, sorted by count, `other` last. OR semantics, as in the design.
- Country select: atomic countries parsed from `country`, sorted by count, with counts in the label. Matching is on the atomic set.
- Below 892px the filter panel becomes a disclosure (`Filters` button showing the active count), and a "Skip to offers" link goes before it.
- Mobile fixes: `minmax(min(240px,100%),1fr)` and `min(200px,100%)` in the grids, `overflow-wrap:anywhere` on titles, org, ref and city, offer h1 `clamp(24px,6vw,30px)`, Legal dl stacked under 480px.
- Card: the title is the only link and "via {source}" is plain text. Source label from `ats`, otherwise from `source_type`, otherwise the URL host (5.5). Hide work mode when unknown and duration when null.
- Offer page: hide null or `unknown` fields except Stipend, Start and Deadline. Show `title_en` when it differs from the title. Primary button goes to `apply_url ?? source_url`, with the "No public link" fallback text. Add `org_type` to the meta row, `requirements` under Eligibility, and a Posted field when `posted_date` is set.
- Similar offers: exclude the current offer, keep effective `open`/`expected`, score by shared topics ignoring `other` (at least 1), break ties by soonest deadline with nulls last, show at most 3, and hide the section when there are none. The line reads `Closes DD Mon` (urgent color only within 21 days), otherwise the status label.
- Report form: native radios styled as the design's buttons, default `closed`, insert into `offer_reports`, button disabled while sending, success box as designed, inline error in the warn palette.
- Submit: real validation mirroring the DB lengths. URL is optional for Mailing list and MVA Drive, and Drive URLs are rejected. Add an optional Reference field, and store "Where you found it" in `notes`. Before inserting, check duplicates by normalized URL and by org plus reference. Block personal emails on the client. Insert `status: 'open'`, then show the thank-you state with a `See your offer` link.
- Legal: put the contact form (7.9) in the first section with `id="contact"`, fill host and database, and add the Vercel Web Analytics sentence. Footer on every page, with `Report a mistake` pointing to `/legal#contact`.
- New states, designed with existing tokens: loading skeletons, an error box with `Try again`, an offer-not-found card with `noindex`, and form error and sending states.
- Accessibility: `aria-current` on nav, radios for single-choice groups, `aria-disabled` on full chips, `aria-invalid`/`aria-describedby` on errors, defined hover styles, and chips (32px) and sort (36px) kept at the design sizes, which pass WCAG 2.2 AA.
