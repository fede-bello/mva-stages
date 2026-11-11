#!/usr/bin/env python3
"""Pull the live database before a sweep, so the seed never overwrites what changed there.

Read-only on the remote. Two ways to reach it, no password needed for the second:

  * $SUPABASE_DB_URL set: a few SELECTs with psql.
  * Otherwise: the Supabase REST API, with the project's secret key fetched at run time from the
    logged-in, linked Supabase CLI (`supabase projects api-keys`). The key stays in memory; it is
    never printed or written anywhere.

It writes, under data/incoming/YYYY-MM-DD/remote/ (gitignored):

  offers.json          every row of public.offers
  user_submitted.json  rows with source_type = 'user_submitted', for the status re-check
  reports.json         unresolved rows of public.offer_reports, with the offer slug.
                       Messages are free text from the public: never commit them or paste them
                       anywhere, and never copy them into data/offers.json

Then it compares the remote with data/offers.json and prints:

  * swept offers edited in the dashboard (field by field). With --apply the remote values are
    written into data/offers.json, because the next seed would otherwise undo them.
  * swept offers deleted from the database. Never re-added automatically: decide whether the
    slug belongs in data/takedowns.txt.
  * verified user submissions. With --apply they are added to data/offers.json (same slug,
    source_type user_submitted) so later sweeps re-check them like any other offer.

Run it right after the last seed was loaded and before merging anything new: a local change
to data/offers.json that never reached the database would show up as a remote edit.

Usage: python3 -I scripts/pull_remote.py [--apply]
       SUPABASE_DB_URL=postgresql://... python3 -I scripts/pull_remote.py   (psql instead of REST)
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "offers.json"
sys.path.insert(0, str(ROOT / "scripts"))
from build_seed import COLUMNS, canonical_org, load_orgs  # noqa: E402

OFFERS_SQL = f"""
select coalesce(json_agg(t order by t.slug), '[]'::json) from (
  select {', '.join(COLUMNS)}, verified, created_at, updated_at from public.offers
) t
"""
REPORTS_SQL = """
select coalesce(json_agg(t order by t.created_at), '[]'::json) from (
  select o.slug, o.organization, o.title, r.kind, r.message, r.created_at
  from public.offer_reports r join public.offers o on o.id = r.offer_id
  where not r.resolved
) t
"""


def query(url: str, sql: str) -> list[dict]:
    out = subprocess.run(
        ["psql", url, "-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", sql],
        check=True, capture_output=True, text=True,
    ).stdout
    return json.loads(out)


def project_ref() -> str:
    ref = ROOT / "supabase" / ".temp" / "project-ref"
    if not ref.exists():
        raise SystemExit("No SUPABASE_DB_URL and the project is not linked: run `supabase link --project-ref <ref>`.")
    return ref.read_text().strip()


def secret_key(ref: str) -> str:
    out = subprocess.run(
        ["supabase", "projects", "api-keys", "--project-ref", ref, "-o", "json"],
        capture_output=True, text=True,
    )
    if out.returncode != 0:
        raise SystemExit("Could not read the API keys with the Supabase CLI (run `supabase login`).")
    keys = json.loads(out.stdout)
    # The CLI masks the new `sb_secret_` keys but returns the legacy service_role JWT in full.
    usable = [k["api_key"] for k in keys if k.get("api_key") and "·" not in k["api_key"]
              and (k.get("type") == "secret" or k.get("name") == "service_role")]
    if not usable:
        raise SystemExit("The Supabase CLI returned no usable secret key for this project.")
    return usable[0]


def rest(ref: str, key: str, path: str) -> list[dict]:
    """GET every row of a PostgREST query, 1000 at a time."""
    rows: list[dict] = []
    while True:
        req = urllib.request.Request(
            f"https://{ref}.supabase.co/rest/v1/{path}",
            headers={"apikey": key, "Range": f"{len(rows)}-{len(rows) + 999}", "Accept": "application/json",
                     **({"Authorization": f"Bearer {key}"} if key.startswith("eyJ") else {})},
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            page = json.load(r)
        rows += page
        if len(page) < 1000:
            return rows


def fetch_remote() -> tuple[list[dict], list[dict], str]:
    url = os.environ.get("SUPABASE_DB_URL")
    if url:
        return query(url, OFFERS_SQL), query(url, REPORTS_SQL), "psql (SUPABASE_DB_URL)"
    ref = project_ref()
    key = secret_key(ref)
    cols = ",".join([*COLUMNS, "verified", "created_at", "updated_at"])
    offers = sorted(rest(ref, key, f"offers?select={cols}"), key=lambda o: o["slug"])
    raw = rest(ref, key, "offer_reports?select=kind,message,created_at,offers(slug,organization,title)&resolved=eq.false&order=created_at")
    reports = [{**(r.pop("offers") or {}), **r} for r in raw]
    return offers, reports, f"REST API of project {ref} (key from the Supabase CLI)"


def same(a, b) -> bool:
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return float(a) == float(b)
    return (a if a not in ("", []) else None) == (b if b not in ("", []) else None)


def main() -> int:
    apply = "--apply" in sys.argv
    out_dir = ROOT / "data" / "incoming" / date.today().isoformat() / "remote"
    out_dir.mkdir(parents=True, exist_ok=True)

    remote, reports, via = fetch_remote()
    print(f"Read the live database through {via}.")
    submitted = [r for r in remote if r["source_type"] == "user_submitted"]
    for name, rows in (("offers", remote), ("user_submitted", submitted), ("reports", reports)):
        (out_dir / f"{name}.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")

    local = json.loads(DATA.read_text())
    by_slug = {o["slug"]: o for o in local}
    remote_by_slug = {r["slug"]: r for r in remote}

    edited = 0
    for slug, o in by_slug.items():
        r = remote_by_slug.get(slug)
        if r is None:
            continue
        # The seed fills a missing first_seen with the load date: adopt it quietly.
        if not o.get("first_seen") and r.get("first_seen") and apply:
            o["first_seen"] = r["first_seen"]
        diffs = [c for c in COLUMNS if c not in ("slug", "first_seen") and not same(o.get(c), r.get(c))]
        if not diffs:
            continue
        edited += 1
        print(f"edited remotely: {slug}")
        for c in diffs:
            print(f"    {c}: {o.get(c)!r} -> {r.get(c)!r}")
            if apply:
                o[c] = r.get(c)

    deleted = sorted(set(by_slug) - set(remote_by_slug))
    for slug in deleted:
        print(f"deleted remotely: {slug}  (add to data/takedowns.txt if it was a takedown, else let the seed restore it)")

    orgs = load_orgs()
    imported = 0
    unknown: set[str] = set()
    for r in submitted:
        if not r.get("verified") or r["slug"] in by_slug:
            continue
        row = {c: r.get(c) for c in COLUMNS if r.get(c) not in (None, "", [])}
        row["organization"] = canonical_org(str(row["organization"]), orgs)
        known = orgs.get(row["organization"].split(" (")[0])
        if known:
            row["org_type"] = known["type"]
        else:
            unknown.add(row["organization"])
        if apply:
            local.append(row)
        imported += 1

    pending = sum(1 for r in submitted if not r.get("verified"))
    per_offer: dict[str, int] = {}
    for rep in reports:
        per_offer[rep["slug"]] = per_offer.get(rep["slug"], 0) + 1

    if apply:
        DATA.write_text(json.dumps(local, ensure_ascii=False, indent=2) + "\n")
    verb = "applied" if apply else "found (run with --apply to write them)"
    print(
        f"\n{len(remote)} remote offers. {edited} swept offers edited remotely, {len(deleted)} deleted, "
        f"{imported} verified submissions to import: {verb}.\n"
        f"{pending} submissions waiting for verification, {len(reports)} unresolved reports on "
        f"{len(per_offer)} offers. Files in {out_dir.relative_to(ROOT)}/"
    )
    if unknown:
        print("Submitted organizations not in data/organizations.json:")
        for name in sorted(unknown):
            print(f"  {name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
