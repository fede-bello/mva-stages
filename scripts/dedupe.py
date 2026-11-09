#!/usr/bin/env python3
"""Collapse duplicate offers in data/offers.json.

Input: a JSON list of [keep_slug, drop_slug] pairs (confirmed duplicates).
For each pair, fields missing in `keep` are filled from `drop`. Status fields come from
whichever record has the later `status_checked`. `first_seen` keeps the earliest date.
`drop` is then removed. Chains (a<-b, b<-c) are resolved.

Usage: python3 -I scripts/dedupe.py pairs.json [--dry-run]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "offers.json"
STATUS_FIELDS = ("status", "status_checked", "deadline")


def empty(v) -> bool:
    return v in (None, "", [], "unknown")


def main() -> int:
    pairs = json.loads(Path(sys.argv[1]).read_text())
    dry = "--dry-run" in sys.argv
    offers = json.loads(DATA.read_text())
    by = {o["slug"]: o for o in offers}

    parent: dict[str, str] = {}

    def root(s: str) -> str:
        while s in parent:
            s = parent[s]
        return s

    merged = missing = 0
    for keep, drop in pairs:
        keep, drop = root(keep), root(drop)
        if keep == drop:
            continue
        if keep not in by or drop not in by:
            missing += 1
            print(f"skip, unknown slug: {keep if keep not in by else drop}", file=sys.stderr)
            continue
        k, d = by[keep], by[drop]
        newer = d if (d.get("status_checked") or "") > (k.get("status_checked") or "") else k
        for f, v in d.items():
            if f == "slug":
                continue
            if f in STATUS_FIELDS:
                continue
            if empty(k.get(f)) and not empty(v):
                k[f] = v
        for f in STATUS_FIELDS:
            if not empty(newer.get(f)):
                k[f] = newer[f]
        if d.get("topics"):
            k["topics"] = list(dict.fromkeys((k.get("topics") or []) + d["topics"]))[:5]
        firsts = [x for x in (k.get("first_seen"), d.get("first_seen")) if x]
        if firsts:
            k["first_seen"] = min(firsts)
        parent[drop] = keep
        del by[drop]
        merged += 1

    out = [o for o in offers if o["slug"] in by]
    print(f"{merged} merged, {missing} skipped, {len(out)} offers left")
    if not dry:
        DATA.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
