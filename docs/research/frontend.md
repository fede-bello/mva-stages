# Frontend research (2026-11-09)

Scope: the static SPA for MVA Stages (Vite + React + TypeScript + Tailwind CSS + React Router + `@supabase/supabase-js`, on Vercel with Web Analytics). Everything below was checked today against the npm registry, the official docs and a throwaway probe project built in the session scratchpad (`fe-probe/`). context7 was not usable in this session (its MCP server only exposed an authentication tool), so the docs were read directly from the official sites.

## Sources

- https://reactrouter.com/start/modes (read 2026-11-09)
- https://reactrouter.com/start/data/installation (read 2026-11-09)
- https://reactrouter.com/upgrading/v7 (read 2026-11-09)
- https://reactrouter.com/api/hooks/useSearchParams (read 2026-11-09)
- https://reactrouter.com/api/components/ScrollRestoration (read 2026-11-09)
- https://react.dev/reference/react-dom/components/title (read 2026-11-09)
- https://vite.dev/guide/env-and-mode (read 2026-11-09)
- https://tailwindcss.com/docs/installation/using-vite (read 2026-11-09)
- https://tailwindcss.com/docs/theme (read 2026-11-09)
- https://supabase.com/docs/guides/api/api-keys (read 2026-11-09)
- https://supabase.com/docs/guides/getting-started/quickstarts/reactjs (read 2026-11-09)
- https://supabase.com/docs/reference/javascript/insert (read 2026-11-09)
- https://supabase.com/docs/reference/javascript/select (read 2026-11-09)
- https://supabase.com/docs/guides/api/rest/generating-types (read 2026-11-09)
- https://supabase.com/docs/reference/cli/supabase-gen-types (read 2026-11-09)
- https://vercel.com/docs/analytics/quickstart (read 2026-11-09)
- https://vercel.com/docs/analytics/package (read 2026-11-09)
- https://vercel.com/docs/analytics/custom-events (read 2026-11-09)
- https://vercel.com/docs/analytics/limits-and-pricing (read 2026-11-09)
- https://vercel.com/docs/analytics/privacy-policy (read 2026-11-09)
- https://vercel.com/docs/frameworks/frontend/vite (read 2026-11-09)
- https://fontsource.org/fonts/ibm-plex-sans/install (read 2026-11-09)
- Source code read locally: `create-vite@9.3.4` `dist/index.js` (CLI flags, non-empty dir handling), `@vercel/analytics@2.0.1` `dist/react/index.mjs` (route props), `react-router@8.5.1` type definitions (`SetURLSearchParams`, `NavigateOptions`, package exports).
- Repo files: `supabase/config.toml` (`max_rows = 1000`), `supabase/migrations/20261109120000_init.sql` (RLS policies), `design/*.dc.html` (Google Fonts URL).

## Versions

| Package | Version | How verified |
|---|---|---|
| create-vite | 9.3.4 | `npm view create-vite dist-tags` (latest); used to scaffold the probe |
| vite | 8.3.7 | `npm view vite dist-tags`; template pins `^8.3.6`, installed 8.3.7 |
| @vitejs/plugin-react | 6.3.0 | npm latest; installed in probe |
| react, react-dom | 19.3.1 | npm latest; template pins `^19.3.1` |
| @types/react, @types/react-dom | 19.3.0 | template |
| typescript | 7.0.2 | npm latest; template pins `~7.0.2` (the native compiler). `tsc -b` works in the probe |
| oxlint | 1.92.0 | template default linter (`^1.90.0`) |
| eslint (if `--eslint`) | 10.14.0 | npm latest; `--eslint` template uses `eslint ^10.14.0`, `typescript-eslint ^8.72.1`, `eslint-plugin-react-hooks ^7.1.1`, `eslint-plugin-react-refresh ^0.5.7` |
| tailwindcss, @tailwindcss/vite | 4.3.5 | npm latest; built in probe |
| react-router | 8.5.1 | npm latest (published 2026-10-27); built in probe. Requires node >=22.22.0, react >=19.2.7 |
| react-router-dom | 7.18.5 (do not use) | npm latest is still 7.x: the package was removed in v8 |
| @supabase/supabase-js | 2.119.0 | npm latest (`next` is 3.0.0-next.29, not stable); built in probe |
| supabase (CLI) | 3.0.0 on npm, 2.117.0 installed locally | `npm view supabase dist-tags`, `supabase --version` |
| @vercel/analytics | 2.0.1 | npm latest; built in probe |
| @fontsource/ibm-plex-sans | 5.3.0 | npm latest; built in probe |
| @fontsource/ibm-plex-mono | 5.3.0 | npm latest; built in probe |
| vitest | 5.1.0 | npm latest, peer `vite ^6.4.0 \|\| ^7.0.0 \|\| ^8.0.0`; one test run in probe |

Node on this machine is 22.23 and npm 10.9, which satisfies React Router 8 (`node >=22.22.0`).

## 1. Vite

### Scaffold non-interactively

Verified in the probe:

```bash
npm create vite@9.3.4 <dir> -- --template react-ts --no-interactive
```

CLI flags (from the `create-vite@9.3.4` source): `-t, --template`, `-i, --immediate` (install and start dev), `--eslint` (use ESLint instead of Oxlint, React templates only), `--overwrite` (removes existing files), `--interactive / --no-interactive`.

**Existing non-empty directory.** Verified behavior:
- Without a TTY and without `--overwrite`, a non-empty target prints `Operation cancelled` and writes nothing (tested on a dir with a `README.md`).
- `--overwrite` **deletes everything in the target** before scaffolding. Never use it on the repo root.
- The "Ignore files and continue" option only exists in interactive mode.

Safe procedure for this repo: scaffold into a temp dir, then copy only the frontend files into the root, without touching `README.md` or `.gitignore`:

```bash
TMP=$(mktemp -d)
npm create vite@9.3.4 "$TMP/web" -- --template react-ts --no-interactive
rsync -a --exclude README.md --exclude .gitignore "$TMP/web/" ./
# then fix "name" in package.json (the scaffold uses the dir name) and merge .gitignore by hand
```

The repo `.gitignore` already ignores `node_modules/`, `dist/`, `.env` and `.env.*`, so `.env.local` is covered. Worth adding from the template: `*.local`, `*.log`, `dist-ssr`.

### What the react-ts template ships (9.3.4)

Files: `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `.oxlintrc.json`, `.gitignore`, `public/favicon.svg`, `public/icons.svg`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`, `src/assets/*`.

Scripts: `"dev": "vite"`, `"build": "tsc -b && vite build"`, `"lint": "oxlint"`, `"preview": "vite preview"`.

There is **no `src/vite-env.d.ts`** any more: the template puts `"types": ["vite/client"]` in `tsconfig.app.json` instead.

### Lint: Oxlint by default, not ESLint

The default template no longer uses ESLint flat config. It ships `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

`npm run lint` runs `oxlint` (probe: `Found 0 warnings and 0 errors`, 18 ms). With `--eslint` you get `eslint.config.js` (flat config) and `"lint": "eslint ."` instead. Oxlint is enough for this project.

### Env vars

Only `VITE_*` variables reach client code, and they are inlined into the bundle at build time (verified: the probe bundle contains the URL and key from `.env.local`). Load order: `.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local`; existing process env wins. Restart the dev server after edits. Vite's docs warn that `VITE_*` values must not be secrets: fine for the Supabase URL and publishable key, never for the service role or DB password.

Typing them (verified in the probe; works alongside `"types": ["vite/client"]`): create `src/vite-env.d.ts` with no `import` statements (imports break the augmentation):

```ts
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### Gotcha: chunk size warning

With supabase-js the probe's single JS chunk is 540 kB minified (157 kB gzip) and Vite 8 prints `(!) Some chunks are larger than 500 kB`. It is a warning, not an error. Options: lazy-load `/submit` and `/legal` with `import()`, or raise `build.chunkSizeWarningLimit`. The board needs supabase-js on first load anyway.

## 2. React

React 19.3.1 (`react`, `react-dom`), `@types/react` 19.3.0. The template's `src/main.tsx` uses `createRoot(...).render(<StrictMode><App /></StrictMode>)` and `"jsx": "react-jsx"`. React 19 hoists `<title>` and `<meta>` rendered anywhere into `<head>` (see section 5).

## 3. TypeScript

TypeScript 7.0.2 (the native compiler). `tsc -b` with the template's project references works unchanged (probe build passes).

- `tsconfig.json`: `"files": []` plus references to `tsconfig.app.json` and `tsconfig.node.json`.
- `tsconfig.app.json`: `target es2023`, `lib ["ES2023", "DOM"]`, `module esnext`, `moduleResolution bundler`, `types ["vite/client"]`, `jsx react-jsx`, `noEmit`, `verbatimModuleSyntax`, `allowImportingTsExtensions`, `erasableSyntaxOnly`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `include ["src"]`. Note: `strict` is not listed in the template; add `"strict": true` explicitly.
- `tsconfig.node.json`: for `vite.config.ts` only, `module nodenext`, `types ["node"]`.

Gotchas: `verbatimModuleSyntax` means type-only imports must use `import type` (the probe does `import type { Database } from './database.types'`). `erasableSyntaxOnly` forbids `enum` and parameter properties: use union types and `as const` objects.

## 4. Tailwind CSS v4

Install (verified):

```bash
npm install tailwindcss@4.3.5 @tailwindcss/vite@4.3.5
```

`vite.config.ts` (verified):

```ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`src/index.css` with design tokens (verified: the probe's built CSS contains `.rounded-card`, `.shadow-card`, `.text-ink`, `.bg-paper`, `.text-accent`, `.font-sans`, `.font-mono`, and `--font-sans` resolves to IBM Plex Sans):

```css
@import "tailwindcss";

@theme {
  --font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --color-ink: #16181d;
  --color-paper: #fbfaf7;
  --color-accent: #2f5bd3;
  --radius-card: 10px;
  --shadow-card: 0 1px 2px rgb(0 0 0 / 0.06), 0 2px 8px rgb(0 0 0 / 0.04);
}
```

(The colors above are placeholders: take the real values from `design/*.dc.html`.)

Namespaces that generate utilities: `--color-*`, `--font-*`, `--text-*`, `--font-weight-*`, `--tracking-*`, `--leading-*`, `--breakpoint-*`, `--container-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--inset-shadow-*`, `--drop-shadow-*`, `--blur-*`, `--ease-*`, `--animate-*`, and others. Redefining `--font-sans` overrides the default `font-sans` (and the base `html` font, since preflight uses `--font-sans`).

- Clear a whole default namespace with `--color-*: initial;` then define only yours. Clear everything with `--*: initial;`.
- Use `@theme inline { ... }` when a token references another CSS variable (for example `--font-sans: var(--font-plex);`), otherwise the variable may resolve at the wrong scope.
- **No `tailwind.config.js` is needed** (none in the probe). `@config` exists only to load a legacy v3 JS config.
- Custom fonts: `@theme` only declares the family name; loading the files is separate (section 8).

## 5. React Router

Version 8.5.1. **Import everything from `react-router`, except `RouterProvider`, which comes from `react-router/dom`.** `react-router-dom` was removed in v8 (its npm `latest` is still 7.18.5: do not install it). Package exports in 8.5.1: `.`, `./dom`, `./route-pattern`, `./internal`.

Modes: Declarative (`<BrowserRouter>` + `<Routes>`), Data (`createBrowserRouter` + `<RouterProvider>`, adds loaders/actions/pending UI), Framework (Vite plugin, SSR/SPA). For us it is Declarative or Data.

### Scroll restoration decides it: use Data mode

The docs mark `<ScrollRestoration>` as **"Not available with Declarative"**: it only works in Data and Framework mode. On a board where users open an offer and come back, losing the scroll position is a real UX bug, and reimplementing it by hand in declarative mode is fiddly. Data mode costs nothing extra: no loaders are required, components still fetch however we like.

Verified in the probe (`main.tsx`):

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import Root from './Root'
import Board from './pages/Board'
import Offer from './pages/Offer'

const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Board },
      { path: 'offer/:slug', Component: Offer },
      { path: '*', element: <p>Not found</p> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

`Root.tsx` (verified):

```tsx
import { Outlet, ScrollRestoration } from 'react-router'
import { Analytics } from '@vercel/analytics/react'

export default function Root() {
  return (<><Outlet /><ScrollRestoration /><Analytics /></>)
}
```

Create the router once at module level, never in React state (docs). Add `errorElement` (or `ErrorBoundary`) on the root route for a friendly crash page. `ScrollRestoration` accepts `getKey={(location) => location.pathname}` if we want "back to board" to restore by path rather than by history entry; the default (`location.key`) is right for us.

### Filters in the query string

`setSearchParams(nextInit, navigateOpts)` where `navigateOpts` is `NavigateOptions` (`replace`, `preventScrollReset`, `state`, `relative`, `flushSync`, `viewTransition`, ...), confirmed in the 8.5.1 types. Use `replace: true` so typing in the search box does not push one history entry per keystroke, and `preventScrollReset: true` so `<ScrollRestoration>` does not jump to top on filter changes. Verified in the probe:

```tsx
const [params, setParams] = useSearchParams()
const q = params.get('q') ?? ''

setParams(
  (prev) => {
    const next = new URLSearchParams(prev)
    if (value) next.set('q', value)
    else next.delete('q')
    return next
  },
  { replace: true, preventScrollReset: true },
)
```

Gotchas from the docs: the functional form does not queue, so several `setSearchParams` calls in the same tick do not build on each other (compute all changes in one call). `searchParams` is mutable: never mutate it without calling the setter; copy it as above. Multi-value params: `params.getAll('topic')` and `next.append('topic', t)`.

### useParams and 404

`const { slug } = useParams<{ slug: string }>()` (verified). Catch-all route `{ path: '*', ... }` for unknown paths; for `/offer/:slug` with a slug that does not exist, render the same Not Found component from the page after the fetch. Vercel needs a rewrite so deep links reach `index.html` (see section 10).

### Title and meta per route

React 19 native, no library needed (verified in the probe build):

```tsx
<title>{`${offer.title} | MVA Stages`}</title>
<meta name="description" content={summary} />
```

Caveats from react.dev: the `<title>` child must be a single string, so use a template literal (`<title>Results {n}</title>` is an error); render only one `<title>` at a time (put it in the page components, not also in `Root`). This only changes the live document: crawlers that do not run JS and all social previewers see only the static `index.html`, so the default title, description and Open Graph tags must live in `index.html` (section 10). `react-helmet-async` is unnecessary.

## 6. @supabase/supabase-js

Version 2.119.0.

### Keys and env var names

- The docs recommend the **publishable key** (`sb_publishable_...`) for any code on users' devices, and say to pass it directly to `createClient`. Without a signed-in user it resolves to the `anon` role, so the existing RLS policies (written `to anon, authenticated`) apply unchanged.
- Legacy `anon` / `service_role` JWT keys are being deprecated "by the end of 2026" (today is 2026-11-09, so roughly weeks away). They keep working until disabled in the dashboard.
- Publishable/secret keys are not JWTs: they go in the `apikey` header (supabase-js handles this).
- Env var names in the official React quickstart: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, in `.env.local`. These match the plan.
- Local stack: `supabase status` prints a publishable key for the local instance on recent CLI versions; if the installed CLI (2.117.0) only shows the legacy anon key, that also works locally.

### Typed client

Generate types (CLI docs: flags `--local`, `--linked`, `--project-id`, `--db-url`, `--schema`, `--lang`):

```bash
supabase gen types typescript --local --schema public > src/lib/database.types.ts
# or against the remote project once linked:
supabase gen types typescript --linked --schema public > src/lib/database.types.ts
```

Requires `supabase start` (Docker) for `--local`. The generated file exports `Database`, `Tables<'offers'>`, `TablesInsert<'offers'>`, `TablesUpdate`, `Enums`. In the probe I hand-wrote a file of the same shape (Docker was not started) and the typed client below compiles.

`src/lib/supabase.ts` (verified build):

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database, Tables, TablesInsert } from './database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
)

export type Offer = Tables<'offers'>
```

The `auth` options are optional; with no sign-in they avoid touching `localStorage` and URL parsing.

### Reading all offers: the 1000-row cap

`supabase/config.toml` has `max_rows = 1000` and the hosted default is also 1000 (the dashboard Data API setting "Max rows"). PostgREST silently truncates to that cap; asking `.range(0, 1999)` does not raise it. ~700 rows fits, but the board would silently lose offers past 1000. Recommended:

```ts
const { data, error, count } = await supabase
  .from('offers')
  .select('*', { count: 'exact' })
  .order('organization')
  .order('slug')

if (error) throw error
if (count !== null && count > data.length) console.warn(`offers truncated: ${data.length}/${count}`)
```

and paginate with `.range(from, from + 999)` in a loop (with a stable `order`) if the table ever crosses 1000. `offer_report_counts` is a separate small query (or join it client-side by `offer_id`).

### Inserts under RLS

The docs: "By default, inserted rows are not returned." Returning them requires chaining `.select()`, which makes PostgREST send `Prefer: return=representation` and the returned row must pass a SELECT policy. In supabase-js v2 there is no `returning: 'minimal'` option any more: minimal is the default, you simply do not chain `.select()`.

- `offer_reports` and the new `contact_requests`: anon has INSERT, no SELECT. **Never chain `.select()`** (it fails with an RLS error even though the insert itself is allowed). Also do not use `upsert` (needs SELECT/UPDATE). Verified pattern (compiles in the probe):

```ts
const { error } = await supabase.from('offer_reports').insert({ offer_id, kind: 'closed', message })
if (error) throw error
```

- `offers`: INSERT and SELECT (`using (true)`) are both allowed, so `.insert(row).select('slug').single()` would work, but the `guard_public_insert` trigger replaces the slug with a random one and the row is unverified. Plain `.insert(row)` without `.select()` is simpler and enough for the "thanks" screen.
- Client-side duplicate check before inserting: `.select('slug', { count: 'exact', head: true }).or(...)` on `apply_url` / `reference` (head avoids fetching rows). Beware of `.or()` string escaping: commas and parentheses in URLs must be quoted (`apply_url.eq."https://..."`). Simpler: two `.eq()` queries.

## 7. @vercel/analytics

Version 2.0.1 (MIT since 2.x, uses "Resilient Intake": randomized script and intake paths configured by Vercel at build time).

```bash
npm i @vercel/analytics@2.0.1
```

Placement: render `<Analytics />` from `@vercel/analytics/react` once, in the root layout (verified in the probe's `Root.tsx` above, inside the router so it can sit next to `<ScrollRestoration />`). Enable Web Analytics in the Vercel project (dashboard **Analytics > Enable**, adds the `/_vercel/insights/*` and `/<unique-path>/*` routes on the next deploy). It does nothing in local dev beyond debug logging (debug is auto-on when `NODE_ENV` is development).

### Route changes in an SPA

No props needed. The Vercel privacy doc says "All page views will automatically be tracked ... including both fresh page loads and client-side page transitions." From the 2.0.1 source: passing a `route` prop sets `disableAutoTrack`, and then a pageview is only sent when both `route` and `path` are given. The quickstart's "no route support" note for plain React means pageviews are grouped by concrete URL (`/offer/abc`, `/offer/xyz`) rather than by pattern (`/offer/[slug]`). Acceptable for us; with Data mode we could compute the pattern from `useMatches()` and pass `route`/`path`, but that is optional.

Other props: `mode` ('auto' | 'development' | 'production'), `debug`, `beforeSend(event)` (return `null` to drop, or rewrite `event.url`), `scriptSrc`, `eventEndpoint`, `viewEndpoint`. Page view URLs include query params "(Filtered)". Our filter params contain no personal data, so no `beforeSend` needed.

### Custom events: `track(name, props)`

```ts
import { track } from '@vercel/analytics/react'   // also exported from '@vercel/analytics'

track('open_posting', { slug: offer.slug, country: offer.country })
```

Verified to compile. Limits (custom events doc): values must be string, number, boolean or null; no nested objects; event name, keys and values at most 255 characters each; the number of properties depends on the plan.

**Plan limits (contradicts the plan as written):** "Custom Events are available on Enterprise and Pro plans." Pricing table: Hobby has 50,000 events/month (page views), a 1-month reporting window, **no custom events**; Pro allows 2 properties per custom event, Pro + Web Analytics Plus ($10/month) allows 8. On Hobby, once the 50k limit is exceeded, collection pauses after a 3-day grace period. So on a Hobby account the `track()` calls will not show up in the dashboard. The docs do not say whether Hobby `track()` calls count against the 50k; I could not verify it. On Pro, keep each event to 2 properties (for example `slug` + `country`, or `slug` + `topic`).

### Cookies

"without using any third-party cookies, instead end users are identified by a hash created from the incoming request", and the session hash is discarded after 24 hours. Recording is anonymous and not tied to IP. This supports "anonymous, cookieless usage statistics by Vercel Web Analytics" on `/legal`.

## 8. Fonts: IBM Plex Sans (400, 500, 600, 700) and IBM Plex Mono (400, 500)

The design uses Google Fonts: `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap`.

**Option A, Google Fonts:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" />
```

Costs: a render-blocking stylesheet from a third origin plus a second origin for the files (two extra DNS + TLS connections, partly hidden by `preconnect`), and since browsers partition the HTTP cache per site there is no cross-site cache benefit. It also sends visitors' IPs to Google, which in the EU has been ruled a GDPR problem (LG München, January 2022; from memory, not re-checked today): awkward for a site whose `/legal` page promises minimal tracking.

**Option B, self-host with Fontsource (verified in the probe):**

```bash
npm i @fontsource/ibm-plex-sans@5.3.0 @fontsource/ibm-plex-mono@5.3.0
```

```ts
// src/main.tsx
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
```

Each CSS file declares `font-display: swap` and one `@font-face` per subset with `unicode-range` (cyrillic, cyrillic-ext, greek, vietnamese, latin-ext, latin), so the browser only downloads the subsets the page uses (latin, plus latin-ext for names with Polish or Czech characters). Vite copies the woff2/woff files into `dist/assets/` with content hashes; Vercel serves hashed assets with long cache. Latin woff2 sizes: Sans 400 22.6 kB, 500 24.2 kB, 600 24.3 kB, 700 22.8 kB; Mono 400 14.7 kB, 500 14.9 kB. The fonts load from the same origin as the page, no extra connections, no third party. To shave the build output, import `latin-400.css` etc. only (also exists for each weight), at the cost of falling back for latin-ext glyphs.

Optional: `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the Sans 400 latin file only. With hashed filenames this needs a Vite plugin or a manual import with `?url`; skip it unless Lighthouse flags the font as LCP-critical.

**Recommendation: Option B (Fontsource)**, for Lighthouse (no third-party render-blocking request) and for privacy consistency with `/legal`. A `@fontsource-variable/ibm-plex-sans` package also exists (5.3.0); one variable file can replace four static weights, but the static weights match the design exactly and are small, so either works.

## 9. Testing

Vitest 5.1.0 works with Vite 8 (peer range includes `^8.0.0`). Probe: `npm i -D vitest@5.1.0`, one test in `src/lib/filter.test.ts`, `npx vitest run` passed in 87 ms, and `tsc -b` still builds with the test file under `src/`.

```ts
import { describe, expect, it } from 'vitest'
```

Recommendation: add Vitest only for the pure logic (filter predicates, sorting, "closes in N days", query-string parse/serialize, submit validation that mirrors the migration checks). No component tests, no jsdom. Script: `"test": "vitest run"`. Cheap and catches the bugs that matter on this board.

## 10. Favicon, robots.txt, Open Graph, SPA rewrite

Everything in `public/` is copied as-is to the site root (the template already ships `public/favicon.svg`, referenced as `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`). Replace it with our own simple SVG and delete `public/icons.svg` if unused.

`public/robots.txt`:

```
User-agent: *
Allow: /
```

(Add `Sitemap: https://<domain>/sitemap.xml` only if we generate one.)

Open Graph in `index.html` (static, because social scrapers do not run JS). `og:image` must be an absolute URL and a raster image (PNG or JPG, 1200x630 is the usual size); most scrapers ignore SVG. Since the domain is the default `*.vercel.app`, write the final production URL once it is known:

```html
<title>MVA Stages: research internships for M2 MVA students</title>
<meta name="description" content="A filterable board of research internship offers for M2 MVA students." />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="MVA Stages" />
<meta property="og:title" content="MVA Stages" />
<meta property="og:description" content="A filterable board of research internship offers for M2 MVA students." />
<meta property="og:url" content="https://<domain>/" />
<meta property="og:image" content="https://<domain>/og.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="theme-color" content="#..." />
```

Per-route `<title>` / `<meta name="description">` from React (section 5) then override title and description in the live page. Note that React 19 adds new `<meta>` tags rather than replacing the static ones in `index.html`, so keep the static description generic or omit per-route description duplication if it bothers Lighthouse (Lighthouse only checks presence).

SPA deep links on Vercel (Vercel's Vite docs), `vercel.json` at the repo root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Static files in `dist/` (assets, `robots.txt`, `favicon.svg`) are served before rewrites apply (Vercel filesystem precedence, from memory: confirm on the first preview deploy).

## Decisions for the plan

1. **Pin versions** (exact in `package.json`, no caret, for a reproducible build): `vite 8.3.7`, `@vitejs/plugin-react 6.3.0`, `react 19.3.1`, `react-dom 19.3.1`, `@types/react 19.3.0`, `@types/react-dom 19.3.0`, `typescript 7.0.2`, `oxlint 1.92.0`, `tailwindcss 4.3.5`, `@tailwindcss/vite 4.3.5`, `react-router 8.5.1`, `@supabase/supabase-js 2.119.0`, `@vercel/analytics 2.0.1`, `@fontsource/ibm-plex-sans 5.3.0`, `@fontsource/ibm-plex-mono 5.3.0`, `vitest 5.1.0` (dev). Keep `@types/node` from the template. Do not install `react-router-dom`.
2. **Scaffold** with `npm create vite@9.3.4 "$TMP/web" -- --template react-ts --no-interactive` into a temp dir and `rsync` into the repo excluding `README.md` and `.gitignore`. Never `--overwrite` on the repo root. Keep Oxlint (`npm run lint`), add `"strict": true` to `tsconfig.app.json`, add `"test": "vitest run"`.
3. **Router: Data mode** (`createBrowserRouter` from `react-router`, `RouterProvider` from `react-router/dom`), no loaders, a `Root` layout with `<Outlet />`, `<ScrollRestoration />` and `<Analytics />`, `errorElement` on the root, `*` catch-all. Filters via `useSearchParams` with `{ replace: true, preventScrollReset: true }`, one setter call per change.
4. **Tailwind v4** with `@tailwindcss/vite`, tokens in `@theme` inside `src/index.css` (values copied from `design/*.dc.html`), no `tailwind.config.js`.
5. **Fonts: self-host with Fontsource** (six static weight imports in `main.tsx`), no Google Fonts links, no preconnect.
6. **Supabase key: publishable key** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` and in Vercel), typed client via `supabase gen types typescript --local --schema public > src/lib/database.types.ts`. Inserts into `offer_reports`, `contact_requests` and `offers` never chain `.select()`. Fetch offers with `count: 'exact'` and warn if truncated by the 1000 `max_rows` cap.
7. **Analytics:** `<Analytics />` with no props; auto page views cover client-side navigation. Keep `track()` calls with at most 2 non-personal properties (Pro limit), but **check the Vercel plan first**: on Hobby custom events are not available, so either accept that only page views are collected or move the project to a Pro team.
8. **Meta:** React 19 native `<title>`/`<meta>` per page component (template literal strings, one title at a time), static defaults and Open Graph in `index.html`, own `public/favicon.svg`, `public/robots.txt` allowing all, a 1200x630 `public/og.png`, `vercel.json` SPA rewrite.
9. **Tests:** Vitest for pure logic only.
10. **File layout under `src/`:**

```
src/
  main.tsx              router + font and CSS imports
  index.css             @import "tailwindcss" + @theme tokens
  vite-env.d.ts         ImportMetaEnv typing
  routes.tsx            createBrowserRouter config (optional, or inline in main.tsx)
  Root.tsx              layout: header, <Outlet/>, footer, <ScrollRestoration/>, <Analytics/>
  pages/
    Board.tsx           /
    Offer.tsx           /offer/:slug
    Submit.tsx          /submit
    Legal.tsx           /legal
    NotFound.tsx        * and unknown slugs
  components/           OfferCard, FilterBar, Toggle, StatsRow, ReportForm, ContactForm, Disclaimer...
  lib/
    supabase.ts         typed client
    database.types.ts   generated, never edited by hand
    offers.ts           fetchOffers, insertOffer, reportOffer, findDuplicate
    filters.ts          query-string <-> filter state, predicates, sorting (+ filters.test.ts)
    dates.ts            daysUntil, formatting (+ dates.test.ts)
    analytics.ts        thin typed wrappers around track()
```
