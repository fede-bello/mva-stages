#!/usr/bin/env python3
"""Merge sweep results into data/offers.json.

Each input is a JSON array of offers in the format of data/offers.json (see CLAUDE.md).
Matching, in order: same slug, same (organization, reference), same organization and
normalized title. On a match, non-null incoming fields overwrite the stored ones, except
`first_seen`, which keeps the earliest date. Unmatched offers are appended.

Before matching, `organization` is rewritten to its canonical form from data/organizations.json
(aliases), `org_type` is taken from that file, `country` is normalized, and `other` is dropped
from `topics` when another topic is present. Names that are not in organizations.json are
listed at the end: add them there (with their type) and run again.

Inputs are applied in the order given, so pass older files first.

Files named `*.coverage.json` are not offers but one line per organization a subagent looked at:
  {"name": "Valeo", "result": "nothing open", "careers_url": "https://...",
   "type": "company", "group": "corporates"}
They update `last_checked` (the date in the file's folder name, else today), `last_result` and,
when it was empty, `careers_url` in data/organizations.json. An entry for an organization that
is not there yet is added only if it has `type` and `group`; review those in the diff.

Usage: python3 -I scripts/merge.py data/incoming/2026-11-20/*.json
       python3 -I scripts/merge.py --dry-run FILES...
"""

from __future__ import annotations

import copy
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "offers.json"
sys.path.insert(0, str(ROOT / "scripts"))
from build_seed import (  # noqa: E402
    COLUMNS, EMAIL, ENUMS, ORGS, canonical_country, canonical_org, is_generic_email, load_orgs,
    slugify, validate,
)

SECONDHAND = {"linkedin", "aggregator"}
GROUPS = {"big_tech", "corporates", "startups_fr", "startups_eu", "research_fr", "health_fr",
          "research_eu", "international"}


def apply_coverage(paths: list[str], orgs: dict[str, dict]) -> tuple[int, list[str]]:
    """Record which organizations were checked and what was found. Returns (updated, added)."""
    updated, added = 0, []
    sources: list[str] = []
    for path in paths:
        folder = Path(path).parent.name
        try:
            day = date.fromisoformat(folder).isoformat()
        except ValueError:
            day = date.today().isoformat()
        for c in json.loads(Path(path).read_text()):
            if c.get("source"):  # a board or list, not an organization: reported, not stored
                sources.append(f"{c['name']}: {c.get('result', '')}")
                continue
            full = canonical_org(c["name"], orgs)
            name, _, unit = full.partition(" (")
            unit = unit.rstrip(")")
            o = orgs.get(name)
            if o is None:
                if c.get("type") not in ENUMS["org_type"] - {None} or c.get("group") not in GROUPS:
                    print(f"coverage: unknown organization {c['name']!r} without a valid type and group, skipped")
                    continue
                o = orgs[name] = {"name": name, "type": c["type"], "group": c["group"]}
                added.append(name)
            # Several lines for one organization in one sweep (units, or two groups) add up
            # instead of overwriting each other: "NeuroSpin: nothing open; List: 3 offers".
            result = f"{unit}: {c['result']}" if unit and c.get("result") else c.get("result")
            if result:
                same_day = o.get("last_checked") == day and o.get("last_result")
                o["last_result"] = f"{o['last_result']}; {result}" if same_day and result not in o["last_result"] else result
            o["last_checked"] = day
            if c.get("careers_url") and not o.get("careers_url") and re.match(r"^https?://", c["careers_url"]):
                o["careers_url"] = c["careers_url"]
            updated += 1
    if sources:
        print("Sources read (not stored):")
        for line in sources:
            print(f"  {line}")
    return updated, added

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
    org = norm((o.get("organization") or "").split(" (")[0])  # canonical name, without the unit
    out = []
    if o.get("slug"):
        out.append(("slug", o["slug"]))
    if o.get("reference"):
        out.append(("ref", org, norm(o["reference"])))
    for t in (o.get("title"), o.get("title_en")):
        if t:
            out.append(("title", org, norm(t)))
    return out


def own_link(o: dict) -> str | None:
    u = o.get("apply_url") or o.get("source_url")
    return None if not u or "linkedin.com" in u or o.get("source_type") in SECONDHAND else u.split("?")[0].rstrip("/")


def compatible(key: tuple, inc: dict, hit: dict) -> bool:
    """A title match is not a match when both offers point to different postings of the employer.

    Two postings can share a title (the same role in Paris and in Palo Alto). Slug and
    reference matches are always trusted.
    """
    if key[0] != "title":
        return True
    a, b = own_link(inc), own_link(hit)
    return not (a and b and a != b)


def main() -> int:
    # Only group files (`01-drive.json`, `05a-startups.coverage.json`...) are sweep results.
    # Anything else in the folder (status-precheck.json, remote/ dumps) is a work file.
    all_args = []
    for a in (a for a in sys.argv[1:] if not a.startswith("--")):
        if re.match(r"^\d\d[a-z]?-", Path(a).name):
            all_args.append(a)
        else:
            print(f"skipped {a}: not a group file (NN-name.json)")
    coverage = [a for a in all_args if a.endswith(".coverage.json")]
    args = [a for a in all_args if not a.endswith(".coverage.json")]
    dry = "--dry-run" in sys.argv
    offers: list[dict] = json.loads(DATA.read_text()) if DATA.exists() else []
    index: dict[tuple, dict] = {}
    for o in offers:
        for k in keys(o):
            index[k] = o

    takedowns_file = ROOT / "data" / "takedowns.txt"
    takedowns = {l.strip() for l in takedowns_file.read_text().splitlines() if l.strip() and not l.startswith("#")} if takedowns_file.exists() else set()

    orgs = load_orgs()
    unknown_orgs: set[str] = set()
    fixes: list[str] = []  # what the merge corrected on its own, so nobody re-does it by hand
    added = updated = skipped = 0
    for path in args:
        for inc in json.loads(Path(path).read_text()):
            guess = inc.get("slug") or slugify(inc.get("organization", ""), inc.get("title_en") or inc.get("title", ""), inc.get("reference") or "")
            if guess in takedowns:
                skipped += 1
                fixes.append(f"{inc.get('organization')} / {inc.get('title')}: slug {guess} is in takedowns.txt, skipped")
                continue
            inc = {k: v for k, v in inc.items() if k in COLUMNS}
            label = f"{inc.get('organization') or inc.get('slug')!s} / {inc.get('title') or inc.get('slug')!s}"[:90]
            before = json.dumps(inc, ensure_ascii=False)
            scrub_personal_emails(inc)
            if json.dumps(inc, ensure_ascii=False) != before:
                fixes.append(f"{label}: personal email removed")
            if inc.get("organization"):
                raw = inc["organization"]
                inc["organization"] = canonical_org(inc["organization"], orgs)
                if inc["organization"] != raw:
                    fixes.append(f"{label}: organization {raw!r} -> {inc['organization']!r}")
                known = orgs.get(inc["organization"].split(" (")[0])
                if known:
                    inc["org_type"] = known["type"]
                else:
                    unknown_orgs.add(inc["organization"])
            if inc.get("country"):
                raw = inc["country"]
                inc["country"] = canonical_country(inc["country"])
                if inc["country"] != raw:
                    fixes.append(f"{label}: country {raw!r} -> {inc['country']!r}")
            if inc.get("topics") and len(inc["topics"]) > 1 and "other" in inc["topics"]:
                inc["topics"] = [t for t in inc["topics"] if t != "other"]
                fixes.append(f"{label}: dropped `other` from topics")
            if not inc.get("source_type"):
                inc.pop("source_type", None)  # never overwrite a known source with nothing
            hit = next((index[k] for k in keys(inc) if k in index and compatible(k, inc, index[k])), None)
            if hit is None and any(k in index and not compatible(k, inc, index[k]) for k in keys(inc)):
                fixes.append(f"{label}: same title as an offer on the board but another posting link, added as a separate offer")
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
                # A LinkedIn or aggregator copy never replaces the employer's own links.
                weaker = inc.get("source_type") in SECONDHAND and hit.get("source_type") not in SECONDHAND
                if weaker:
                    fixes.append(f"{label}: {inc.get('source_type')} copy merged into {hit['slug']}, its links kept")
                for k, v in inc.items():
                    if k == "slug" or (weaker and k in ("source_type", "source_url", "apply_url", "ats")):
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
    if fixes:
        print(f"Corrected automatically ({len(fixes)}), no need to fix these by hand:")
        for line in fixes:
            print(f"  {line}")
    if unknown_orgs:
        print("Not in data/organizations.json (add them, or map them as aliases):")
        for name in sorted(unknown_orgs):
            print(f"  {name}")
    checked, new_orgs = apply_coverage(coverage, orgs)
    # Same checks as build_seed.py, on the merged result, so problems surface before writing.
    problems = validate(copy.deepcopy(offers), orgs)
    if problems:
        print(f"{len(problems)} problems build_seed.py will refuse (fix them in the incoming files):")
        for line in problems[:40]:
            print(f"  {line}")
        if len(problems) > 40:
            print(f"  ... and {len(problems) - 40} more")
    if coverage:
        print(f"{checked} organizations checked, {len(new_orgs)} added to organizations.json: {', '.join(new_orgs) or '-'}")
    if not dry:
        DATA.parent.mkdir(exist_ok=True)
        DATA.write_text(json.dumps(offers, ensure_ascii=False, indent=2) + "\n")
        if coverage:
            rows = sorted(orgs.values(), key=lambda o: o["name"].lower())
            ORGS.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
