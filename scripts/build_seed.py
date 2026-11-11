#!/usr/bin/env python3
"""Validate data/offers.json and write supabase/seed.sql as idempotent upserts.

The same SQL seeds a local database (`supabase db reset`) and updates the remote one
(`psql "$SUPABASE_DB_URL" -f supabase/seed.sql`). Upserts key on `slug` and never touch
`verified`, `created_by` or `created_at`, so edits made on the site by admins survive a sweep
except for the offer fields the sweep re-states.

Usage: python3 -I scripts/build_seed.py [--check]
"""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "offers.json"
SEED = ROOT / "supabase" / "seed.sql"
PRIVACY = ROOT / "data" / "privacy-denylist.txt"
ORGS = ROOT / "data" / "organizations.json"

ENUMS = {
    "org_type": {"company", "startup", "big_tech", "academic_lab", "public_agency", None},
    "work_mode": {"onsite", "hybrid", "remote", "unknown"},
    "april_start": {"yes", "no", "flexible", "unknown"},
    "status": {"open", "closed", "removed", "expected", "unknown"},
    "msc_eligible": {"yes", "no", "unknown"},
    "apply_method": {"portal", "email", "form", "spontaneous", "unknown"},
    "source_type": {
        "official_posting", "mva_drive", "linkedin", "aggregator",
        "lab_website", "mailing_list", "user_submitted", "other",
    },
}
TOPICS = {
    "computer-vision", "3d-vision", "llm", "agents", "nlp", "rl", "time-series",
    "foundation-models", "generative-models", "health", "neuro", "bio-chem", "robotics",
    "earth-observation", "climate-energy", "physics-sim", "speech-audio", "graphs",
    "optimization", "theory", "recsys-ir", "efficiency", "trustworthy-ai", "signal-processing",
    "other",
}
# English short names. `country` holds one of these, or several joined by ", " when the
# posting lets the intern pick the site.
COUNTRIES = {
    "Austria", "Belgium", "Canada", "Czech Republic", "Denmark", "Estonia", "Finland", "France",
    "Germany", "Ghana", "Greece", "Hungary", "Iceland", "Ireland", "Israel", "Italy", "Japan",
    "Luxembourg", "Monaco", "Netherlands", "Norway", "Poland", "Portugal", "Romania", "Singapore",
    "South Korea", "Spain", "Sweden", "Switzerland", "United Arab Emirates", "United Kingdom",
    "United States",
}
COUNTRY_ALIASES = {"USA": "United States", "US": "United States", "UK": "United Kingdom",
                   "Holland": "Netherlands", "The Netherlands": "Netherlands", "Deutschland": "Germany"}
DEFAULTS = {"work_mode": "unknown", "april_start": "unknown", "status": "unknown",
            "msc_eligible": "unknown", "apply_method": "unknown"}
TEXT = ["organization", "title", "title_en", "org_type", "city", "country", "work_mode",
        "stipend_text", "start_text", "april_start", "duration_text", "status", "requirements",
        "msc_eligible", "reference", "apply_url", "apply_method", "ats", "apply_contact",
        "source_type", "source_url", "description", "notes"]
NUM = ["stipend_min_eur_month", "stipend_max_eur_month", "duration_months_min", "duration_months_max"]
DATES = ["posted_date", "deadline", "status_checked", "first_seen"]
COLUMNS = ["slug", *TEXT, "topics", *NUM, *DATES]


def slugify(*parts: str) -> str:
    s = "-".join(p for p in parts if p).lower()
    s = re.sub(r"[àáâä]", "a", s)
    s = re.sub(r"[èéêë]", "e", s)
    s = re.sub(r"[ìíîï]", "i", s)
    s = re.sub(r"[òóôö]", "o", s)
    s = re.sub(r"[ùúûü]", "u", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:90].rstrip("-")


def sql(v) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, list):
        return "array[" + ", ".join(sql(x) for x in v) + "]::text[]"
    return "'" + str(v).replace("'", "''") + "'"


def load_orgs() -> dict[str, dict]:
    """Canonical organizations by name. Aliases are raw spellings seen in past sweeps."""
    return {o["name"]: o for o in json.loads(ORGS.read_text())}


def canonical_org(raw: str, orgs: dict[str, dict]) -> str:
    """Rewrite a raw organization string to `Canonical name (unit, site or partner)`.

    `aliases` in data/organizations.json maps raw spellings seen in past sweeps to their
    canonical form, e.g. `CEA List` -> `CEA (List)`. A new variant of a known alias keeps its
    parenthesis: `CEA List (Grenoble)` -> `CEA (List, Grenoble)`. Unknown names come back
    unchanged and validate() rejects them.
    """
    lead, _, tail = raw.partition(" (")
    if lead in orgs:
        return raw
    aliases = {a: c for o in orgs.values() for a, c in o.get("aliases", {}).items()}
    if raw in aliases:
        return aliases[raw]
    if lead in aliases and tail.endswith(")"):
        base = aliases[lead]
        extra = tail[:-1]
        return f"{base[:-1]}, {extra})" if base.endswith(")") else f"{base} ({extra})"
    return raw


def canonical_country(raw: str | None) -> str | None:
    if not raw:
        return raw
    parts = [p.strip() for p in re.split(r",|\bor\b|/|;", raw) if p.strip()]
    return ", ".join(dict.fromkeys(COUNTRY_ALIASES.get(p, p) for p in parts))


def load_denylist() -> list[re.Pattern]:
    # The committed list holds generic patterns (application status words). The .local list is
    # gitignored and holds the maintainer's own names and identifiers.
    pats = []
    for path in (PRIVACY, PRIVACY.with_suffix(".local.txt")):
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                pats.append(re.compile(line, re.IGNORECASE))
    return pats


EMAIL = re.compile(r"[\w.+-]+@[\w-]+(\.[\w-]+)+")
# Role addresses (jobs@, recrutement@, ...) are fine to publish. A person's address is personal
# data under the GDPR and must not be republished, even if the posting shows it.
GENERIC_LOCAL = re.compile(
    r"^(jobs?|careers?|recrut\w*|recruit\w*|recruiting|hiring|talents?|rh|hr|stages?|internships?|"
    r"interns?|apply|applications?|candidat\w*|contact|info|admin|secretariat\w*|"
    r"[\w-]*-?recrut\w*|[\w-]*-?recruit\w*|[\w-]*-?jobs|[\w-]*-?stages?|[\w-]*-?internships?|predoc|"
    r"philab|trainees?|[\w-]*-trainees)$",
    re.IGNORECASE,
)


def is_generic_email(addr: str) -> bool:
    return bool(GENERIC_LOCAL.match(addr.split("@", 1)[0]))


def validate(offers: list[dict], orgs: dict[str, dict] | None = None) -> list[str]:
    errors: list[str] = []
    seen: set[str] = set()
    deny = load_denylist()
    orgs = orgs if orgs is not None else load_orgs()
    for i, o in enumerate(offers):
        where = f"#{i} {o.get('organization')!r} / {o.get('title')!r}"
        for k, v in DEFAULTS.items():
            if o.get(k) is None:  # missing or null: the database would store the default anyway
                o[k] = v
        o.setdefault("slug", slugify(o.get("organization", ""), o.get("title_en") or o.get("title", ""), o.get("reference") or ""))
        o.setdefault("topics", [])
        unknown = set(o) - set(COLUMNS) - {"origin_file"}
        if unknown:
            errors.append(f"{where}: unknown fields {sorted(unknown)}")
        for k in ("organization", "title", "source_type"):
            if not o.get(k):
                errors.append(f"{where}: missing {k}")
        for k, allowed in ENUMS.items():
            if k in o and o[k] not in allowed:
                errors.append(f"{where}: {k}={o[k]!r} not in {sorted(a for a in allowed if a)}")
        org = orgs.get((o.get("organization") or "").split(" (")[0])
        if org is None:
            errors.append(f"{where}: organization not in data/organizations.json (add it, or use its canonical name)")
        elif o.get("org_type") != org["type"]:
            errors.append(f"{where}: org_type={o.get('org_type')!r}, organizations.json says {org['type']!r}")
        for c in (o.get("country") or "").split(", ") if o.get("country") else []:
            if c not in COUNTRIES:
                errors.append(f"{where}: country {c!r} is not a canonical name (see COUNTRIES)")
        bad = set(o["topics"]) - TOPICS
        if bad:
            errors.append(f"{where}: unknown topics {sorted(bad)}")
        for k in DATES:
            if o.get(k):
                try:
                    date.fromisoformat(o[k])
                except ValueError:
                    errors.append(f"{where}: {k}={o[k]!r} is not ISO")
        for k in ("apply_url", "source_url"):
            if o.get(k) and not re.match(r"^https?://", o[k]):
                errors.append(f"{where}: {k} is not a URL")
        lo, hi = o.get("stipend_min_eur_month"), o.get("stipend_max_eur_month")
        if lo is not None and hi is not None and hi < lo:
            errors.append(f"{where}: stipend max < min")
        if "other" in o["topics"] and len(o["topics"]) > 1:
            errors.append(f"{where}: `other` only goes alone, drop it when another topic fits")
        if o["slug"] in seen:
            errors.append(f"{where}: duplicate slug {o['slug']}")
        seen.add(o["slug"])
        blob = json.dumps(o, ensure_ascii=False)
        for m in EMAIL.finditer(blob):
            if not is_generic_email(m.group(0)):
                errors.append(f"{where}: personal email {m.group(0)} (only role addresses are allowed)")
        for p in deny:
            if p.search(blob):
                errors.append(f"{where}: matches privacy denylist /{p.pattern}/")
    return errors


def build(offers: list[dict]) -> str:
    update_cols = [c for c in COLUMNS if c not in ("slug", "first_seen")]
    lines = [
        "-- Generated by scripts/build_seed.py from data/offers.json. Do not edit by hand.",
        f"-- {len(offers)} offers.",
        "",
    ]
    for o in sorted(offers, key=lambda x: x["slug"]):
        vals = [sql(o.get(c)) if c != "first_seen" or o.get(c) else "current_date" for c in COLUMNS]
        lines.append(
            f"insert into public.offers ({', '.join(COLUMNS)})\nvalues ({', '.join(vals)})\n"
            f"on conflict (slug) do update set {', '.join(f'{c} = excluded.{c}' for c in update_cols)};\n"
        )
    return "\n".join(lines)


def main() -> int:
    offers = json.loads(DATA.read_text())
    errors = validate(offers)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"\n{len(errors)} problems, seed not written.", file=sys.stderr)
        return 1
    if "--check" in sys.argv:
        print(f"{len(offers)} offers OK")
        return 0
    SEED.write_text(build(offers))
    print(f"Wrote {SEED.relative_to(ROOT)} with {len(offers)} offers")
    return 0


if __name__ == "__main__":
    sys.exit(main())
