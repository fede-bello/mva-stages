# Platform research: Supabase, Vercel, legal host details

Researcher: docs-platform. Date: 2026-11-09. Installed: Supabase CLI 2.117.0 (3.0.0 available), Vercel CLI 60.1.3, psql 16.

Facts tagged **[verified locally]** come from read-only commands run on this machine today
(`--help` output, `supabase orgs list`, `supabase projects list`, `vercel teams ls`,
`vercel integration installations`, `vercel integration list --all`). Facts tagged **[docs]** come from
the sources below. Facts tagged **[unverified]** are inferences that must be checked during the run.

## Sources

All read 2026-11-09.

| URL | Used for |
|---|---|
| https://supabase.com/docs/guides/platform/billing-on-supabase | Free project quota, paused projects |
| https://supabase.com/docs/guides/integrations/vercel-marketplace | Vercel-managed orgs, synced env vars, limitations |
| https://supabase.com/docs/guides/database/connecting-to-postgres | Direct vs pooler hosts, IPv6, users, percent-encoding |
| https://supabase.com/docs/reference/api/v1-get-pooler-config | `GET /v1/projects/{ref}/config/database/pooler` |
| https://supabase.com/docs/guides/api/api-keys | Publishable vs legacy anon keys, deprecation by end of 2026 |
| https://supabase.com/docs/reference/cli/supabase-link | `link`, password prompt, `SUPABASE_DB_PASSWORD` |
| https://github.com/supabase/cli/releases/tag/v3.0.0 | v3 breaking changes |
| https://supabase.com/docs/guides/platform/regions | `eu-west-3` = West EU (Paris), regions are AWS regions |
| https://supabase.com/terms | Contracting entity (Supabase Pte. Ltd.) and address |
| https://supabase.com/legal/dpa | Processor entity and address |
| https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq | What stays in the selected region |
| https://supabase.com/legal/customer-resources/subprocessor-list | Subprocessor list (updated October 12, 2026) |
| https://community.vercel.com/t/project-creation-in-the-supabase-dashboard-is-disabled-for-this-vercel-managed-organization/1129 | Error text for Vercel-managed orgs |
| https://vercel.com/marketplace/supabase | Integration env vars, plans |
| https://vercel.com/docs/frameworks/frontend/vite | Vite on Vercel, SPA `vercel.json` |
| https://vercel.com/docs/project-configuration/vercel-json | Rewrites: filesystem precedence |
| https://vercel.com/docs/git | Git deploys, production branch, Hobby private repo rules |
| https://vercel.com/docs/analytics/quickstart | Enabling Web Analytics (dashboard), `@vercel/analytics` |
| https://vercel.com/docs/analytics/limits-and-pricing | Hobby: 50,000 events/month, no custom events |
| https://vercel.com/docs/plans/hobby | Hobby included usage, non-commercial rule |
| https://vercel.com/docs/limits | Deployments per day, projects |
| https://vercel.com/legal/terms | Contracting entity (Vercel Inc.), arbitration address |
| https://vercel.com/legal/privacy-policy | Vercel Inc. contact address ("Last Updated June 1, 2026") |
| `~/.claude/skills/vercel-cli/references/{environment-variables,integrations,projects-and-teams}.md` | CLI usage |

context7 was not usable in this session (only its authenticate tools were exposed), so all docs came from the official sites above.

## 1. Supabase CLI

### Account state at build time

The maintainer's Supabase account had several orgs, including a Vercel-managed one (id prefix `vercel_icfg_`) mapped to the Vercel Hobby team. Org and project names of other projects are left out of this public document.

In agent mode the CLI prints JSON by default (`supabase projects list` returned JSON without flags); `-o json` makes it explicit.

### `supabase projects create` [verified locally, v2.117.0]

```
supabase projects create [<name>] --org-id <org-id> --db-password <pw> --region eu-west-3 [--size micro] [--high-availability]
```

- `--region` choices include `eu-west-3` (Paris). `--size` choices include `micro`, `small`, ... (free plan projects are micro; leave `--size` out on free).
- Non-interactive when name, `--org-id`, `--db-password` and `--region` are all given. In v3 it additionally needs `--yes` for unattended runs.
- **Vercel-managed orgs:** the Supabase docs say "Projects can only be created from the Vercel dashboard" and "Projects can't be created directly in Supabase" for these orgs. The dashboard error is "Project creation in the Supabase dashboard is disabled for this Vercel-managed organization". The docs do not mention the CLI explicitly, but the CLI calls the same Management API, so expect `projects create --org-id vercel_icfg_...` to be refused **[unverified, not run because it would create a project if it worked]**. The Vercel CLI path (`vercel integration add supabase`, section 2) is the supported way to create in that org, and it is scriptable.
- Existing projects in Vercel-managed orgs **are** reachable by the Supabase CLI: `supabase projects api-keys --project-ref <ref>` worked on an existing project in that org [verified locally]. So `link`, `db push`, `gen types` and `api-keys` will work on a project created through Vercel.

### Free plan quota [docs]

- "Free Plan accounts get two projects." The limit is per user: "The project limit applies across all organizations where you are an Owner or Administrator."
- "Paused projects do not count towards your free project limit."
- Only free-plan orgs count. At build time one free slot was left.
- Whether Vercel-managed orgs share the same per-user quota is not stated in the docs. The Vercel Marketplace uses the same Supabase plans ("Pricing matches direct Supabase pricing"), so assume they do.
- If creation fails with a quota error: stop and ask the maintainer.

### `supabase link` [verified locally + docs]

```
supabase link --project-ref <ref> [--password <pw>] [--skip-pooler]
```

- The password is optional: "Optionally, database settings can be validated if you provide a password." Prompt text: "Enter your database password (or leave blank to skip):". To skip the prompt set `SUPABASE_DB_PASSWORD` in the environment (docs: useful in CI). Password is saved in the OS keychain when available.
- Link writes `supabase/.temp/` (gitignored here): `project-ref`, `pooler-url`, `postgres-version`, etc. **`supabase/.temp/pooler-url` holds the exact session pooler URL without password**, e.g. `postgresql://postgres.<ref>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres` [verified locally on another repo, ref redacted]. That is the easiest way to get the pooler host.
- v3: `link --password` is ignored; use `SUPABASE_DB_PASSWORD`. Using the env var already works in v2, so the runbook uses it.

### `supabase db push` [verified locally]

- Flags: `--dry-run` ("Print the migrations that would be applied"), `--linked` (v2 default when linked), `--db-url`, `--include-seed`, `--include-all`, `-p/--password`.
- v3 changes: pushes to the **local** stack by default, needs `--remote` for the linked project, and needs `--yes` in non-interactive runs (piped `y` no longer confirms).

### `supabase migration new` [verified locally]

`supabase migration new <name>` creates an empty `supabase/migrations/<timestamp>_<name>.sql`. Use it for the `contact_requests` migration.

### `supabase gen types` [verified locally]

- `supabase gen types typescript --local > web/src/lib/database.types.ts` (language as positional arg, or `--lang typescript`, default typescript). Also `--linked`, `--project-id <ref>`, `--db-url`, `--schema public`.
- v3: `--project-id` is deprecated; with no target it uses the local DB. Use `--local` (works in both).

### `supabase projects api-keys` [verified locally]

```
supabase projects api-keys --project-ref <ref> -o json
```

Returns a JSON array of objects with `name`, `type`, `prefix`, `api_key`. On a 2026 project it lists four entries:

| name | type | api_key |
|---|---|---|
| `anon` | `legacy` | JWT `eyJ...` |
| `service_role` | `legacy` | JWT `eyJ...` |
| `default` | `publishable` | `sb_publishable_...` |
| `default` | `secret` | masked unless `--reveal` (`sb_secret_...`) |

Select the publishable key with `type == "publishable"`. The legacy `anon` and `service_role` keys are being deprecated "by the end of 2026" [docs]: **use the publishable key** in the frontend. Keys can also be missing on a fresh project ("If your project has no publishable or secret key yet, create them in Settings > API Keys") [docs]; if the array has no `publishable` entry, create it in the dashboard.

### Postgres connection string for `psql` [docs]

| | Direct | Session pooler | Transaction pooler |
|---|---|---|---|
| Host | `db.<ref>.supabase.co` | `aws-<INDEX>-<region>.pooler.supabase.com` | same |
| Port | 5432 | 5432 | 6543 |
| User | `postgres` | `postgres.<ref>` | `postgres.<ref>` |
| Free plan | IPv6 only | IPv4 | IPv4 |

- "The `[INDEX]` part isn't derivable from your region": `aws-0-eu-west-3...` or `aws-1-eu-west-3...` must be read, not guessed. Sources, in order of preference: `supabase/.temp/pooler-url` after `link`; Management API `GET https://api.supabase.com/v1/projects/<ref>/config/database/pooler` (fields `db_host`, `db_port`, `db_user`, `connection_string`, `pool_mode`); dashboard **Connect** button.
- Use the **session pooler** (5432) for `psql -f seed.sql`: IPv4, supports everything the seed needs.
- Passwords must be percent-encoded in URLs ("percent-encoding any reserved characters such as `&`, `#`, `?`, or spaces"). Generating an alphanumeric password avoids the issue.
- Add `?sslmode=require`.

### Region

`eu-west-3` = "West EU (Paris)" [docs]. In the Vercel integration the same region is `cdg1` [verified locally, see section 2].

### Upgrade to v3.0.0: not now

v3 changes exactly the commands we use: `db push` targets local by default and requires `--remote --yes`, `link --password` is ignored, `gen types --project-id` deprecated, `projects create` needs `--yes`, flags and `SUPABASE_*` env vars now override `config.toml`. Our `config.toml` already uses `[local_smtp]` (no `[inbucket]` blocker) but still has `[experimental] orioledb_version = ""`, a key v3 removed. Nothing we need is v3-only. **Recommendation: do not `brew upgrade supabase` during this run**; upgrade later in its own `chore:` change (run `supabase stop` first, drop `orioledb_version`, then re-test `supabase start`).

## 2. Vercel Marketplace Supabase integration

### What it does [docs]

- You create and manage Supabase resources from Vercel; sign-in to Supabase uses the Vercel account and Vercel team roles. "Each Vercel team maps one-to-one to a Supabase organization", created on first install. For this account the org already existed on the Hobby team [verified locally].
- Billing goes through Vercel; same prices as Supabase. Free plan is available [verified locally: plans `free`, `pro`, `team`].
- Limitations: projects only created from Vercel; no custom domains; owners only via Vercel team roles; org removal only after deleting all projects and uninstalling.

### Creating a project through it (CLI) [verified locally from `vercel integration add supabase --help`]

```
vercel integration add supabase --name mva-stages --plan free \
  -m region=cdg1 -m publicEnvVarPrefix=VITE_ \
  -e production -e preview -e development
```

- Run from the directory linked to the Vercel project (`vercel link`), so the resource is connected to it; then it runs `vercel env pull` into `.env.local` (gitignored). `--no-env-pull` skips that.
- `region` options: `sfo1, ca-central-1, dub1, lhr1, fra1, eu-central-2, bom1, sin1, hnd1, icn1, syd1, gru1, cle1, iad1, cdg1, arn1`, default `iad1`. **`cdg1` = Paris**, which should map to AWS `eu-west-3` **[unverified: confirm `region` in `supabase projects list` after creation]**.
- `publicEnvVarPrefix`: "Prefix appended to environment variables that are available on the client side. eg. `NEXT_PUBLIC_` or `VITE_PUBLIC_`. Defaults to `NEXT_PUBLIC_`." With `VITE_` the client vars should come out as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` **[unverified: check with `vercel env ls`]**.
- The integration generates the DB password itself; it is delivered as `POSTGRES_PASSWORD`.
- Installing an integration the first time may need terms acceptance in a browser; here the installation already exists, so `add` should only provision a resource.

### Env vars it injects [docs]

```
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
SUPABASE_SECRET_KEY
SUPABASE_PUBLISHABLE_KEY
SUPABASE_URL
SUPABASE_JWT_SECRET
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   (renamed by publicEnvVarPrefix)
NEXT_PUBLIC_SUPABASE_URL               (renamed by publicEnvVarPrefix)
```

Note: no `*_ANON_KEY` and no `SUPABASE_SERVICE_ROLE_KEY` any more; the integration uses publishable and secret keys. Which pooler `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` point to is not documented; do not rely on them for `psql`, build `SUPABASE_DB_URL` from the pooler-url file instead.

Vite only exposes `VITE_*` vars to client code, so without the prefix option we would add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` ourselves. Server-only vars (`SUPABASE_SECRET_KEY`, `POSTGRES_PASSWORD`, `SUPABASE_JWT_SECRET`) end up in the Vercel project env but are never bundled by Vite, since the app has no server code. They also land in local `.env.local` via `env pull` (gitignored; never print it).

### CLI directly on Vercel-managed orgs

Creating: no (see section 1). Managing existing projects (link, push, keys, types): yes [verified locally with `api-keys`].

## 3. Vercel CLI

### Account [verified locally]

`vercel whoami` = `fede-bello`. Only team: `fede-bellos-projects` ("fede-bello's projects"), plan **hobby**. No `mva-stages` project yet. Use `--scope fede-bellos-projects` (or `--team` on `link`) if needed.

### Create, link, connect Git [verified locally from `--help`]

- `vercel project add mva-stages`: creates an empty project.
- `vercel link --yes --project mva-stages --team fede-bellos-projects`: links the cwd non-interactively (writes `.vercel/`; add `.vercel` to `.gitignore`, it is not there today).
- `vercel git connect https://github.com/fede-bello/mva-stages.git`: connects the linked project to the repo. Needs the Vercel GitHub App to have access to that repo; if the app is installed on "selected repositories", add `mva-stages` at https://github.com/settings/installations first (browser).
- Hobby and private repos: "You cannot deploy to a Hobby team from a private repository in a GitHub organization". `fede-bello/mva-stages` is a **personal** repo, so this does not apply; the commit author must be the Hobby team owner (it is: same GitHub login) [docs].

### Framework preset

Vercel detects Vite: build `npm run build` (`vite build`), output `dist`. To pin it, `vercel.json` accepts `"framework": "vite"`, `"buildCommand"`, `"outputDirectory": "dist"`. Not needed if the app is at the repo root; **if the web app lives in a subfolder (e.g. `web/`), set Root Directory in project settings** (dashboard, Settings > Build and Deployment) or put `vercel.json` and `package.json` at the root.

### Env vars [verified locally]

```
vercel env add NAME production --value "<value>" --yes
printf '%s' "<value>" | vercel env add NAME preview --yes
vercel env add NAME production,preview --value "<value>" --yes   # comma-separated targets
```

- `--git-branch <NAME>` is an **optional** flag for preview; without it the var applies to all preview branches. In non-interactive mode the CLI needs `--value` or stdin, else it exits with an `action_required` payload. `--force` overwrites an existing one.
- Use `printf '%s'` rather than `echo` to avoid a trailing newline in the value.
- The publishable key and URL are not secret, so `--no-sensitive` is fine (lets you read them back with `vercel env pull`).

### Deploys

- Git-connected: "Preview deployments for every push" to non-production branches (each gets its own URL; PRs get a Vercel bot comment); a production deployment "each time you merge to the production branch", which defaults to `main` [docs].
- Manual: `vercel deploy --prod` from the linked directory (builds on Vercel with the project env vars).
- Env var changes only apply to new builds: redeploy after adding them.

### Web Analytics

- **No CLI command and no documented REST endpoint to enable it** (the public Web Analytics API under `/v1/query/web-analytics/` is read-only). Enable in the dashboard: project > **Analytics** in the sidebar > **Enable** in the header (https://vercel.com/fede-bellos-projects/mva-stages/analytics). Routes `/_vercel/insights/*` are added "after your next deployment", so enable first, then deploy [docs].
- Client: `npm i @vercel/analytics`, React variant `import { Analytics } from '@vercel/analytics/react'` and render `<Analytics />` once; "With the plain React implementation, there is no route support" [docs] (frontend researcher owns the details, including `@vercel/analytics` v2 route handling).
- Check: a request to `/<unique-path>/view` in the Network tab on page load.

### `vercel.json` for SPA

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Static files win: "precedence is given to the filesystem prior to rewrites being applied", and `rewrites` "checks the filesystem by default" [docs]. So `/assets/*.js`, `/robots.txt`, `/favicon.svg` are served as files, everything else gets `index.html`. Side effect: unknown paths return `index.html` with **200**, so the 404 page is client-side (fine for us, but no real 404 status).

### Hobby limits relevant to us [docs]

| Item | Hobby |
|---|---|
| Use | "non-commercial, personal use only" (student board, fine) |
| Projects | 200 (10 used) |
| Deployments per day | 100 |
| Fast Data Transfer | first 100 GB / month |
| CDN requests | first 1,000,000 / month |
| Web Analytics events | 50,000 / month, **shared across all projects of the account**; then a 3-day grace, collection pauses, resumes after 7 days; no extra purchase |
| Web Analytics reporting window | 1 month |
| **Custom events (`track()`)** | **not available on Hobby** ("-" in the table; "Users on Pro and Enterprise plans can also add custom events") |
| Runtime logs | 1 hour |

## 4. Vercel host details for "mentions légales"

No dedicated imprint or "Legal Notice" page exists (`https://vercel.com/legal/legal-notice` returns 404). Company details come from Vercel's own legal pages:

- Privacy Policy, "Contact Us" section (https://vercel.com/legal/privacy-policy, "Last Updated June 1, 2026", read 2026-11-09): "Vercel Inc.", "440 N Barranca Avenue #4133", "Covina, CA 91723", "United States", email privacy@vercel.com. No phone number.
- Terms of Service (https://vercel.com/legal/terms, read 2026-11-09): the contracting party is "Vercel Inc."; the same address appears for arbitration requests ("440 N Barranca Ave #4133, Covina, CA 91723"); legal notices email legalnotices@vercel.com. **No separate EU entity**: EEA users get extra protections and the DPA, but the contracting party stays Vercel Inc. A Hobby user in the EU contracts with Vercel Inc.
- Legal form: "Inc.", a US corporation. An older (2021) Vercel privacy policy described it as a Delaware corporation; the current pages do not state the state, so do not write "Delaware" on the page.
- Phone: none published on these pages. LCEN art. 6 asks for the host's phone; since Vercel publishes none, give the contact URL instead.

Suggested host block for `/legal` (French):

> Hébergeur : Vercel Inc., société de droit américain, 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis. Contact : https://vercel.com/contact (privacy@vercel.com). Source : https://vercel.com/legal/privacy-policy

## 5. Supabase as data processor

- **The contracting entity is not Supabase Inc.** Terms section 1(j): default "Supabase Pte. Ltd., a Singapore corporate entity", place of business "65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513". "Supabase, Inc." (3500 S. DuPont Highway, Dover, Kent County, DE 19901) applies only to AWS Marketplace purchases. The DPA names the processor as "Supabase Pte. Ltd whose offices are located at 65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513" (Schedule 2, §1.7(c)). The Vercel Marketplace case is not addressed; the default entity applies **[inference]**. Notices: legal@supabase.io; privacy: privacy@supabase.com.
- Region: projects run in an AWS region chosen at creation; `eu-west-3` = Paris. The data residency FAQ: "Your PostgreSQL database, as well as Auth service and Storage objects are hosted in that region, alongside backups."
- Sources: https://supabase.com/terms, https://supabase.com/legal/dpa, https://supabase.com/docs/guides/platform/regions, https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq (all read 2026-11-09).

Suggested block (French):

> Base de données : Supabase Pte. Ltd., 65 Chulia Street #38-02/03, OCBC Centre, Singapour 049513, sur l'infrastructure Amazon Web Services, région eu-west-3 (Paris, France).

## Runbook

Order matters. Placeholders: `<ref>` (20-letter project ref), `<pooler-host>`. Never echo secrets; keep them in `.env.local` (gitignored). Outward-facing steps are marked (OUT); the build prompt pre-authorizes them for this run.

### 0. Preflight (read-only)

```bash
cd ~/develop/mva-stages
supabase --version            # 2.117.0, do not upgrade in this run
vercel whoami                 # fede-bello
supabase projects list -o json   # count ACTIVE_HEALTHY projects in free orgs (quota)
grep -q '^\.vercel' .gitignore || echo '.vercel' >> .gitignore   # local file edit, commit with the web PR
```

### 1. Vercel project + Git (OUT)

```bash
vercel project add mva-stages
vercel link --yes --project mva-stages --team fede-bellos-projects
vercel git connect https://github.com/fede-bello/mva-stages.git
```

If `git connect` says the repo is not accessible, grant the Vercel GitHub App access to `fede-bello/mva-stages` in https://github.com/settings/installations (browser) and retry.

### 2. Supabase project (OUT)

Path A (recommended): through the Vercel integration, from the linked directory.

```bash
vercel integration add supabase --name mva-stages --plan free \
  -m region=cdg1 -m publicEnvVarPrefix=VITE_ \
  -e production -e preview -e development
vercel env ls                 # expect VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, POSTGRES_PASSWORD, ...
```

Path B (fallback if Path A fails for a reason other than quota): a new Supabase-managed org via the Supabase CLI.

```bash
supabase orgs create mva-stages                       # (OUT) note the returned <org-id>
export SUPABASE_DB_PASSWORD="$(python3 -I -c 'import secrets,string; a=string.ascii_letters+string.digits; print("".join(secrets.choice(a) for _ in range(32)))')"
printf 'SUPABASE_DB_PASSWORD=%s\n' "$SUPABASE_DB_PASSWORD" >> .env.local
supabase projects create mva-stages --org-id <org-id> --db-password "$SUPABASE_DB_PASSWORD" --region eu-west-3
```

Then (Path B only) add the client env vars in step 6.

If either path returns a free-quota error: **stop and ask** the maintainer.

### 3. Wait until healthy

```bash
until supabase projects list -o json | python3 -I -c '
import json,sys
p=[x for x in json.load(sys.stdin)["projects"] if x["name"]=="mva-stages"]
sys.exit(0 if p and p[0]["status"]=="ACTIVE_HEALTHY" else 1)'; do sleep 15; done
supabase projects list -o json   # read <ref> and confirm "region": "eu-west-3"
```

(In Claude Code, run the loop through the Monitor tool or `run_in_background`, since foreground `sleep` is blocked.)

### 4. Keys

```bash
supabase projects api-keys --project-ref <ref> -o json | python3 -I -c 'import json,sys; print([x["type"] for x in json.load(sys.stdin)])'
# expect "publishable" in the list; the value itself is piped straight into `vercel env add` in step 6, never printed
```

Project URL: `https://<ref>.supabase.co`.

### 5. Link, push schema, seed

```bash
# Path A: password comes from the integration (POSTGRES_PASSWORD in .env.local)
export SUPABASE_DB_PASSWORD="$(grep '^POSTGRES_PASSWORD=' .env.local | cut -d= -f2- | tr -d '"')"
supabase link --project-ref <ref>                 # uses SUPABASE_DB_PASSWORD, writes supabase/.temp/pooler-url
supabase db push --dry-run                        # must list only our migrations
supabase db push                                  # (OUT)

export SUPABASE_DB_URL="$(python3 -I -c '
import os,urllib.parse
base=open("supabase/.temp/pooler-url").read().strip()        # postgresql://postgres.<ref>@<pooler-host>:5432/postgres
user,rest=base.split("://",1)[1].split("@",1)
pw=urllib.parse.quote(os.environ["SUPABASE_DB_PASSWORD"],safe="")
print(f"postgresql://{user}:{pw}@{rest}?sslmode=require")')"
python3 -I scripts/build_seed.py
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql      # (OUT)
psql "$SUPABASE_DB_URL" -Atc "select count(*) from public.offers"   # expect 668
```

If `supabase/.temp/pooler-url` is missing, get the host from `GET https://api.supabase.com/v1/projects/<ref>/config/database/pooler` (`db_host`) or the dashboard Connect button; never guess `aws-0` vs `aws-1`.

Types for the frontend: `supabase gen types typescript --local > <web>/src/lib/database.types.ts` (local stack running; same schema).

### 6. Client env vars on Vercel (skip the ones the integration already created)

```bash
printf '%s' "https://<ref>.supabase.co" | vercel env add VITE_SUPABASE_URL production --yes
printf '%s' "https://<ref>.supabase.co" | vercel env add VITE_SUPABASE_URL preview --yes
supabase projects api-keys --project-ref <ref> -o json | python3 -I -c 'import json,sys; print([x for x in json.load(sys.stdin) if x["type"]=="publishable"][0]["api_key"], end="")' | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production --yes
supabase projects api-keys --project-ref <ref> -o json | python3 -I -c 'import json,sys; print([x for x in json.load(sys.stdin) if x["type"]=="publishable"][0]["api_key"], end="")' | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY preview --yes
vercel env ls
```

### 7. Web Analytics (dashboard, OUT)

Open https://vercel.com/fede-bellos-projects/mva-stages/analytics and click **Enable** (Claude in Chrome, own tab). Do this before the production deploy.

### 8. Deploy (OUT)

```bash
vercel deploy --prod          # or merge the feat/web PR into main, which triggers production
vercel ls mva-stages          # production URL, expect https://mva-stages.vercel.app or a suffixed variant
```

Smoke test: `/`, `/offer/<slug>`, `/submit`, `/legal`, a deep link reload (rewrite), `/robots.txt` (served as file), and the `/<unique-path>/view` analytics request.

## Risks

1. **Free quota.** Two active free projects per user across orgs where you are owner/admin; paused ones do not count. If full, stop and ask; pausing another project is the maintainer's decision.
2. **Vercel-managed org.** Projects there can only be created through Vercel (docs). Use `vercel integration add supabase`. Billing and plan changes then live on the Vercel side; the org cannot hold custom domains.
3. **Region mapping.** `cdg1` should map to `eu-west-3`; confirm with `supabase projects list` before pushing data. If it is wrong, delete and recreate before any data goes in (region cannot be changed later).
4. **Env var names.** `publicEnvVarPrefix=VITE_` should produce `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; verify with `vercel env ls`, add them manually if not. The integration also puts server secrets (`SUPABASE_SECRET_KEY`, `POSTGRES_PASSWORD`, `SUPABASE_JWT_SECRET`) in the Vercel project: never reference them from client code, never prefix them with `VITE_`.
5. **IPv6.** `db.<ref>.supabase.co` is IPv6-only on free plans; many networks (and some Docker setups) are IPv4-only. Always use the session pooler for `psql`.
6. **Pooler host index.** `aws-0-` vs `aws-1-` is not derivable; read it from `supabase/.temp/pooler-url` or the API.
7. **Password characters.** `@ : / ? # & %` and spaces break URLs. Path B: generate a 32-char alphanumeric password. Path A: the integration chooses it, so always percent-encode (`urllib.parse.quote(..., safe="")`) as in the runbook.
8. **Supabase CLI v3.** Do not upgrade mid-run: `db push` would target local by default and `link --password` is ignored. Upgrade later in its own change.
9. **Legacy keys.** `anon`/`service_role` are deprecated by end of 2026: use the publishable key; maintenance scripts should use the secret key or the DB URL.
10. **Hobby analytics.** Custom events are not collected on Hobby; the 50,000 events/month cap is shared with the other projects of the account.
11. **Git access.** The Vercel GitHub App may not have access to the new repo; fix in GitHub settings.
12. **Secrets on disk.** `vercel env pull` writes all integration vars to `.env.local`; it is gitignored, but never `cat` it into the transcript or a commit.
13. **SPA 404s.** The catch-all rewrite returns 200 for unknown paths; the client must render the not-found page.

## Decisions for the plan

1. **Create the Supabase project through the Vercel integration** (Path A) in the existing Vercel-managed org `fede-bello's projects`: `vercel integration add supabase --name mva-stages --plan free -m region=cdg1 -m publicEnvVarPrefix=VITE_`, after `vercel project add` + `vercel link`. Do not try `supabase projects create` in that org. Path B (new Supabase-managed org via CLI) only if Path A fails for a non-quota reason.
2. **Stay on Supabase CLI 2.117.0** for this run; schedule the v3 upgrade as a separate `chore:`.
3. **Frontend uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`** (publishable `sb_publishable_...` key, not the legacy anon JWT).
4. **`SUPABASE_DB_URL` = session pooler** built from `supabase/.temp/pooler-url` plus the percent-encoded password and `?sslmode=require`; seed with `psql -v ON_ERROR_STOP=1`.
5. **Confirm `region = eu-west-3`** right after creation, before any push.
6. **Web Analytics: page views only.** Custom `track()` events are not available on Hobby. Either drop them from the plan or keep the calls (harmless, no data) and say so in `PLAN.md`; do not upgrade to Pro.
7. **`vercel.json`** with the SPA rewrite only (plus `$schema`); add `.vercel` to `.gitignore`. If the app lives in a subfolder, set Root Directory in project settings.
8. **Enable Web Analytics in the dashboard before** the first production deploy (no CLI/API for it).
9. **`/legal` host block**: Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, United States, contact URL instead of a phone (none published), source https://vercel.com/legal/privacy-policy. **Database block**: Supabase Pte. Ltd. (not Supabase Inc.), 65 Chulia Street #38-02/03, OCBC Centre, Singapore 049513, AWS eu-west-3 (Paris), sources https://supabase.com/terms and https://supabase.com/legal/dpa.
10. Production deploys come from merging the PR into `main`; `vercel deploy --prod` only for the first deploy or a manual retry.
