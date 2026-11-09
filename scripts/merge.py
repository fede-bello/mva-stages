#!/usr/bin/env python3
"""Merge sweep results into data/offers.json.

Each input is a JSON array of offers in the format of data/offers.json (see CLAUDE.md).
Matching, in order: same slug, same (organization, reference), same organization and
normalized title. On a match, non-null incoming fields overwrite the stored ones, except
`first_seen`, which keeps the earliest date. Unmatched offers are appended.

Inputs are applied in the order given, so pass older files first.

Usage: python3 -I scripts/merge.py data/incoming/2026-11-20/*.json
       python3 -I scripts/merge.py --dry-run FILES...
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "offers.json"
sys.path.insert(0, str(ROOT / "scripts"))
from build_seed import COLUMNS, EMAIL, is_generic_email, slugify  # noqa: E402

EMAIL_NOTE = "Apply by email to the address given in the posting."


def scrub_personal_emails(o: dict) -> None:
    """Drop personal addresses (GDPR): keep role addresses like jobs@ or recrutement@."""
    c = o.get("apply_contact")
    if c and not is_generic_email(c):
        o["apply_contact"] = None
        if o.get("apply_method") in (None, "unknown"):
            o["apply_method"] = "email"
        if EMAIL_NOTE not in (o.get("notes") or ""):
            o["notes"] = ((o.get("notes") or "") + " " + EMAIL_NOTE).strip()
    for k in ("description", "notes", "requirements", "start_text", "stipend_text"):
        if o.get(k):
            o[k] = EMAIL.sub(lambda m: m.group(0) if is_generic_email(m.group(0)) else "[email in the posting]", o[k])


def norm(s: str | None) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\b(stage|internship|intern|stagiaire|h/f|f/h|m/f|w/m|2027)\b", " ", s)
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def keys(o: dict) -> list[tuple]:
    org = norm(o.get("organization"))
    out = []
    if o.get("slug"):
        out.append(("slug", o["slug"]))
    if o.get("reference"):
        out.append(("ref", org, norm(o["reference"])))
    for t in (o.get("title"), o.get("title_en")):
        if t:
            out.append(("title", org, norm(t)))
    return out


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    offers: list[dict] = json.loads(DATA.read_text()) if DATA.exists() else []
    index: dict[tuple, dict] = {}
    for o in offers:
        for k in keys(o):
            index[k] = o

    takedowns_file = ROOT / "data" / "takedowns.txt"
    takedowns = {l.strip() for l in takedowns_file.read_text().splitlines() if l.strip() and not l.startswith("#")} if takedowns_file.exists() else set()

    added = updated = skipped = 0
    for path in args:
        for inc in json.loads(Path(path).read_text()):
            guess = inc.get("slug") or slugify(inc.get("organization", ""), inc.get("title_en") or inc.get("title", ""), inc.get("reference") or "")
            if guess in takedowns:
                skipped += 1
                continue
            inc = {k: v for k, v in inc.items() if k in COLUMNS}
            scrub_personal_emails(inc)
            if not inc.get("source_type"):
                inc.pop("source_type", None)  # never overwrite a known source with nothing
            hit = next((index[k] for k in keys(inc) if k in index), None)
            if hit is None:
                inc.setdefault("source_type", "other")
                inc.setdefault("slug", slugify(inc.get("organization", ""), inc.get("title_en") or inc.get("title", ""), inc.get("reference") or ""))
                base, n = inc["slug"], 2
                while ("slug", inc["slug"]) in index:
                    inc["slug"], n = f"{base}-{n}", n + 1
                offers.append(inc)
                hit = inc
                added += 1
            else:
                first = min(filter(None, [hit.get("first_seen"), inc.get("first_seen")]), default=None)
                for k, v in inc.items():
                    if k == "slug":
                        continue
                    if v not in (None, "", [], "unknown"):
                        hit[k] = v
                if first:
                    hit["first_seen"] = first
                updated += 1
            for k in keys(hit):
                index[k] = hit

    offers.sort(key=lambda o: (norm(o["organization"]), o["slug"]))
    offers = [o for o in offers if o["slug"] not in takedowns]
    print(f"{added} added, {updated} merged, {skipped} skipped (takedowns), {len(offers)} total")
    if not dry:
        DATA.parent.mkdir(exist_ok=True)
        DATA.write_text(json.dumps(offers, ensure_ascii=False, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
