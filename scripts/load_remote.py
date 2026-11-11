#!/usr/bin/env python3
"""Load data/offers.json into the remote database without a database password.

`supabase db push --include-seed` runs a seed file only once: when seed.sql changes, it just
records the new hash and does not run it again. This script does what the seed does, through
the REST API with the service key that the logged-in, linked Supabase CLI hands out (the same
key scripts/pull_remote.py uses; it stays in memory, never printed or saved):

- every offer is upserted on `slug` with the seed's columns (scripts/build_seed.py COLUMNS);
- `first_seen` is only written for offers the database does not have yet (as the seed's
  `on conflict` clause leaves it alone), set to the offer's own value or today;
- `--prune` also deletes swept offers that are in the database but no longer in
  data/offers.json (offers merged by scripts/dedupe.py, or removed by hand). Submissions
  (`source_type = 'user_submitted'`) are never touched.

Safety: it validates first (build_seed.validate) and refuses to run unless scripts/pull_remote.py
already pulled the database today (data/incoming/<today>/remote/offers.json), because loading
without that sync would overwrite dashboard edits. Writing is outward-facing: run --dry-run
first and ask the maintainer.

Usage:
  python3 -I scripts/load_remote.py --dry-run [--prune]
  python3 -I scripts/load_remote.py [--prune]
Afterwards run scripts/pull_remote.py again: it must report 0 offers edited and 0 deleted remotely.
"""

from __future__ import annotations

import datetime
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import build_seed as B  # noqa: E402
import pull_remote as P  # noqa: E402

BATCH = 200


def call(ref: str, key: str, method: str, path: str, body=None) -> None:
    req = urllib.request.Request(
        f"https://{ref}.supabase.co/rest/v1/{path}",
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
    )
    try:
        urllib.request.urlopen(req, timeout=60)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {path.split('?')[0]}: HTTP {e.code} {e.read()[:500]!r}")


def main() -> int:
    dry = "--dry-run" in sys.argv
    prune = "--prune" in sys.argv
    today = datetime.date.today().isoformat()

    if not (ROOT / "data" / "incoming" / today / "remote" / "offers.json").exists():
        raise SystemExit("Run scripts/pull_remote.py first (today): loading without the sync "
                         "would overwrite dashboard edits.")

    offers = json.loads(B.DATA.read_text())
    errors = B.validate(offers)  # also fills the column defaults, like the seed
    if errors:
        print("\n".join(errors), file=sys.stderr)
        raise SystemExit(f"{len(errors)} problems, nothing loaded.")

    ref = P.project_ref()
    key = P.secret_key(ref)
    remote = {r["slug"]: r for r in P.rest(ref, key, "offers?select=slug,source_type")}
    local = {o["slug"] for o in offers}

    cols = [c for c in B.COLUMNS if c != "first_seen"]
    update = [{c: o.get(c) for c in cols} for o in offers if o["slug"] in remote]
    insert = [{**{c: o.get(c) for c in cols}, "first_seen": o.get("first_seen") or today}
              for o in offers if o["slug"] not in remote]
    stale = sorted(s for s, r in remote.items()
                   if s not in local and r.get("source_type") != "user_submitted")

    print(f"{len(remote)} remote offers: {len(update)} to update, {len(insert)} to insert.")
    if stale:
        print(f"{len(stale)} swept offers in the database but not in data/offers.json"
              f"{' (deleted with --prune)' if prune else ' (kept; pass --prune to delete them)'}:")
        for s in stale:
            print(f"  {s}")
    if dry:
        print("Dry run: nothing written.")
        return 0

    # PostgREST needs the same keys in every row of a batch: updates and inserts go separately.
    for rows in (update, insert):
        for i in range(0, len(rows), BATCH):
            call(ref, key, "POST", "offers?on_conflict=slug", rows[i:i + BATCH])
    print(f"{len(update) + len(insert)} offers upserted.")

    if prune and stale:
        for i in range(0, len(stale), 50):
            chunk = ",".join(f'"{s}"' for s in stale[i:i + 50])
            call(ref, key, "DELETE", "offers?source_type=neq.user_submitted&slug="
                 + urllib.parse.quote(f"in.({chunk})"))
        print(f"{len(stale)} stale offers deleted.")
    print("Now run scripts/pull_remote.py: it must report 0 edited and 0 deleted remotely.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
