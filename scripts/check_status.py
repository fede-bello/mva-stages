#!/usr/bin/env python3
"""Pre-check the status of known offers, so the re-check subagent only looks at the hard cases.

For every offer with status open, expected or unknown (in data/offers.json, plus the rows of
data/incoming/<day>/remote/user_submitted.json when that file exists), it reads the posting the
cheapest reliable way:

  * Greenhouse, Lever, Ashby, SmartRecruiters and Workday links: the ATS's public JSON API.
  * Other links: a plain GET, then the HTTP status, "no longer available" wording, and the
    schema.org JobPosting `validThrough` date when the page has one.
  * LinkedIn links are not fetched (its terms forbid automated access): they are listed so the
    re-check can look for the same posting on the employer's own site.

Verdicts, one per offer, in data/incoming/<day>/checks/status-precheck.json:

  live            the posting answers and looks open
  deadline_passed `deadline` is before today
  expired         JobPosting.validThrough is before today (a hint only, see below)
  gone            404 or 410, an ATS API says it does not exist, or the page says it is closed
  unreachable     403, 429, 5xx, timeout, JS-only page: needs a browser
  listing         the link is a careers or listing page, not one posting: it proves nothing
  no_url          nothing to fetch (MVA Drive offers, offers without links)
  linkedin        only a LinkedIn link

Only the safe conclusions are written as a sweep file, data/incoming/<day>/02-status-auto.json:
`live` refreshes `status_checked`, `deadline_passed` sets `status: closed`. `gone` and
`expired` are never applied automatically: some sites answer 404 to scripts, and some ATS
(Workday) put a rolling `validThrough` a few days after `datePosted` that is not a real
deadline. The re-check subagent confirms each one before it becomes `removed` or `closed`.

Workday HTML job pages answer 200 even for postings that do not exist (they are app shells),
so Workday links are always checked through the cxs JSON API.

Read-only and polite: one request at a time per host, a pause between them (robots.txt
Crawl-delay when longer), a descriptive User-Agent, and robots.txt is honoured for every
request, API calls included (SmartRecruiters' API disallows crawlers, so its links come out
`unreachable` and go to the re-check subagent).

Usage: python3 -I scripts/check_status.py [--day YYYY-MM-DD] [--groups g1,g2] [--limit N] [--only SLUG ...]
"""

from __future__ import annotations

import json
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "offers.json"
UA = "Mozilla/5.0 (compatible; mva-stages-status-check/1.0; non-commercial internship board)"
TIMEOUT = 25
PAUSE = 1.5  # seconds between two requests to the same host
WORKERS = 8
MAX_BYTES = 30_000_000
CHECK = {"open", "expected", "unknown"}

# Wording that job pages use once a posting is closed. Lowercase, matched on the page text.
GONE_TEXT = [
    "no longer accepting applications", "no longer available", "job not found",
    "this job has expired", "position has been filled", "the job you are looking for",
    "posting is closed", "job is closed", "this position is closed", "job posting has expired",
    "n'est plus disponible", "offre expirée", "offre n'est plus", "offre pourvue",
    "cette offre a expiré", "annonce n'est plus", "candidatures sont closes",
    "nicht mehr verfügbar", "stelle ist bereits besetzt",
]

_host_locks: dict[str, threading.Lock] = defaultdict(threading.Lock)
_host_last: dict[str, float] = {}
_robots: dict[str, urllib.robotparser.RobotFileParser | None] = {}


def fetch(url: str, data: bytes | None = None, headers: dict | None = None, delay: float = PAUSE) -> tuple[int, str, str]:
    """(status, final_url, body). Status 0 means a network error or timeout."""
    host = urllib.parse.urlsplit(url).netloc
    with _host_locks[host]:
        wait = delay - (time.monotonic() - _host_last.get(host, 0))
        if wait > 0:
            time.sleep(wait)
        req = urllib.request.Request(url, data=data, headers={"User-Agent": UA, "Accept-Language": "en,fr;q=0.8", **(headers or {})})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                # Job pages are small; some ATS board APIs return every posting in one answer.
                body = r.read(MAX_BYTES).decode("utf-8", "replace")
                return r.status, r.geturl(), body
        except urllib.error.HTTPError as e:
            return e.code, url, ""
        except Exception:  # noqa: BLE001 - any network failure means "could not read"
            return 0, url, ""
        finally:
            _host_last[host] = time.monotonic()


def polite_fetch(url: str, data: bytes | None = None, headers: dict | None = None) -> tuple[int, str, str] | None:
    """fetch() that honours robots.txt (None when disallowed) and its Crawl-delay."""
    if not allowed(url):
        return None
    rp = _robots.get(_base(url))
    delay = max(PAUSE, float(rp.crawl_delay(UA) or 0)) if rp else PAUSE
    return fetch(url, data, headers, delay)


def _base(url: str) -> str:
    parts = urllib.parse.urlsplit(url)
    return f"{parts.scheme}://{parts.netloc}"


def allowed(url: str) -> bool:
    parts = urllib.parse.urlsplit(url)
    base = f"{parts.scheme}://{parts.netloc}"
    if base not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        status, _, body = fetch(base + "/robots.txt", delay=0)
        if status == 200:
            rp.parse(body.splitlines())
            _robots[base] = rp
        else:
            _robots[base] = None
    rp = _robots[base]
    return rp is None or rp.can_fetch(UA, url)


def json_ld_valid_through(body: str) -> str | None:
    for block in re.findall(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', body, re.S | re.I):
        try:
            data = json.loads(block.strip())
        except ValueError:
            continue
        for item in data if isinstance(data, list) else [data, *data.get("@graph", [])] if isinstance(data, dict) else []:
            if isinstance(item, dict) and item.get("@type") == "JobPosting" and item.get("validThrough"):
                return str(item["validThrough"])[:10]
    return None


def via_ats(url: str) -> tuple[str, str] | None:
    """Ask the ATS's public API whether the posting exists. None when the URL is not an ATS link."""
    p = urllib.parse.urlsplit(url)
    host, parts = p.netloc.lower(), [x for x in p.path.split("/") if x]

    def exists(api: str, method_data: bytes | None = None, headers: dict | None = None) -> tuple[str, str]:
        got = polite_fetch(api, method_data, headers)
        if got is None:
            return "unreachable", f"robots.txt of {_base(api)} disallows its API"
        status = got[0]
        if status == 200:
            return "live", f"{api} answered 200"
        if status in (404, 410):
            return "gone", f"{api} answered {status}"
        return "unreachable", f"{api} answered {status or 'nothing'}"

    if "greenhouse.io" in host and "jobs" in parts:
        board, job = parts[parts.index("jobs") - 1], parts[parts.index("jobs") + 1]
        return exists(f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{job}")
    if host in ("jobs.lever.co", "jobs.eu.lever.co") and len(parts) >= 2:
        api = "api.eu.lever.co" if ".eu." in host else "api.lever.co"
        verdict = exists(f"https://{api}/v0/postings/{parts[0]}/{parts[1]}")
        if verdict[0] != "gone":
            return verdict
        # The API hides unlisted postings that are still open: ask the hosted page too.
        got = polite_fetch(f"https://{host}/{parts[0]}/{parts[1]}")
        if got and got[0] == 200 and "apply for this job" in got[2].lower():
            return "live", "unlisted on Lever (API 404) but the posting page still takes applications"
        return verdict
    if host == "jobs.ashbyhq.com" and len(parts) >= 2:
        got = polite_fetch(f"https://api.ashbyhq.com/posting-api/job-board/{parts[0]}")
        if got is None:
            return "unreachable", "robots.txt disallows the Ashby API"
        status, _, body = got
        if status != 200:
            return "unreachable", f"Ashby board {parts[0]} answered {status or 'nothing'}"
        try:
            ids = {j.get("id") for j in json.loads(body).get("jobs", [])}
        except ValueError:
            return "unreachable", f"Ashby board {parts[0]} did not return JSON"
        return ("live", "listed on the Ashby board") if parts[1] in ids else ("gone", "not on the Ashby board any more")
    if host == "jobs.smartrecruiters.com" and len(parts) >= 2:
        job = parts[1].split("-")[0]
        return exists(f"https://api.smartrecruiters.com/v1/companies/{parts[0]}/postings/{job}")
    m = re.match(r"^([\w-]+)\.(wd\d+)\.myworkdayjobs\.com$", host)
    if m and "job" in parts:
        tenant = m.group(1)
        if re.fullmatch(r"[a-z]{2}-[A-Z]{2}", parts[0]):
            parts = parts[1:]
        site, rest = parts[0], "/".join(parts[1:])
        return exists(f"https://{host}/wday/cxs/{tenant}/{site}/{rest}", headers={"Accept": "application/json"})
    return None


def is_listing(url: str) -> bool:
    """A careers home or search page rather than one posting (no id-like segment in the path)."""
    p = urllib.parse.urlsplit(url)
    parts = [x for x in p.path.split("/") if x]
    if "myworkdayjobs.com" in p.netloc:
        return "job" not in parts
    if p.path.lower().endswith(".pdf"):
        return False
    has_id = any(re.search(r"\d{3,}|[0-9a-f]{8}-[0-9a-f]{4}", x) for x in parts) or bool(re.search(r"\d{3,}", p.query))
    long_slug = any(x.count("-") >= 3 for x in parts)
    return not has_id and not long_slug


def check(o: dict, today: str) -> dict:
    out = {"slug": o["slug"], "organization": o.get("organization"), "status": o.get("status")}
    if o.get("deadline") and o["deadline"] < today and o.get("status") != "expected":
        return {**out, "verdict": "deadline_passed", "evidence": f"deadline {o['deadline']}"}
    urls = [u for u in (o.get("apply_url"), o.get("source_url")) if u]
    if not urls:
        return {**out, "verdict": "no_url", "evidence": o.get("source_type")}
    own = [u for u in urls if "linkedin.com" not in u]
    if not own:
        return {**out, "verdict": "linkedin", "url": urls[0], "evidence": "only a LinkedIn link"}
    url = own[0]
    out["url"] = url
    if is_listing(url):
        return {**out, "verdict": "listing", "evidence": "careers or listing page, not one posting"}
    ats = via_ats(url)
    if ats:
        return {**out, "verdict": ats[0], "evidence": ats[1]}
    got = polite_fetch(url)
    if got is None:
        return {**out, "verdict": "unreachable", "evidence": "robots.txt disallows it"}
    status, final, body = got
    if status in (404, 410):
        return {**out, "verdict": "gone", "evidence": f"HTTP {status}"}
    if status != 200:
        return {**out, "verdict": "unreachable", "evidence": f"HTTP {status or 'timeout or network error'}"}
    vt = json_ld_valid_through(body)
    if vt and vt < today:
        return {**out, "verdict": "expired", "evidence": f"JobPosting.validThrough {vt}"}
    text = re.sub(r"<[^>]+>", " ", body).lower()
    hit = next((g for g in GONE_TEXT if g in text), None)
    if hit:
        return {**out, "verdict": "gone", "evidence": f"page says {hit!r}"}
    if len(text.split()) < 80:
        return {**out, "verdict": "unreachable", "evidence": "almost no text: JS-only page"}
    if final.rstrip("/") != url.rstrip("/") and urllib.parse.urlsplit(final).path.count("/") < urllib.parse.urlsplit(url).path.count("/"):
        return {**out, "verdict": "gone", "evidence": f"redirected to a shorter page {final}"}
    return {**out, "verdict": "live", "evidence": "HTTP 200" + (f", validThrough {vt}" if vt else "")}


def main() -> int:
    args = sys.argv[1:]
    day = args[args.index("--day") + 1] if "--day" in args else date.today().isoformat()
    only = set(args[args.index("--only") + 1:]) if "--only" in args else set()
    # --groups health_fr,research_fr: only offers of organizations in those groups (partial sweeps).
    groups = set(args[args.index("--groups") + 1].split(",")) if "--groups" in args else set()
    limit = int(args[args.index("--limit") + 1]) if "--limit" in args else None
    today = date.today().isoformat()
    out_dir = ROOT / "data" / "incoming" / day
    out_dir.mkdir(parents=True, exist_ok=True)

    offers = [o for o in json.loads(DATA.read_text()) if o.get("status") in CHECK]
    submitted = out_dir / "remote" / "user_submitted.json"
    if submitted.exists():
        known = {o["slug"] for o in offers}
        offers += [o for o in json.loads(submitted.read_text()) if o["slug"] not in known and o.get("status") in CHECK]
    if groups:
        orgs = {o["name"]: o.get("group") for o in json.loads((ROOT / "data" / "organizations.json").read_text())}
        offers = [o for o in offers if orgs.get((o.get("organization") or "").split(" (")[0]) in groups]
    if only:
        offers = [o for o in offers if o["slug"] in only]
    offers = offers[:limit] if limit else offers

    with ThreadPoolExecutor(WORKERS) as pool:
        results = list(pool.map(lambda o: check(o, today), offers))

    (out_dir / "checks").mkdir(exist_ok=True)
    (out_dir / "checks" / "status-precheck.json").write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n")
    auto = []
    for r in results:
        if r["verdict"] == "live":
            auto.append({"slug": r["slug"], "status_checked": today})
        elif r["verdict"] == "deadline_passed":
            auto.append({"slug": r["slug"], "status": "closed", "status_checked": today})
    (out_dir / "02-status-auto.json").write_text(json.dumps(auto, ensure_ascii=False, indent=2) + "\n")

    counts: dict[str, int] = defaultdict(int)
    for r in results:
        counts[r["verdict"]] += 1
    print(f"{len(results)} offers checked: " + ", ".join(f"{v} {k}" for k, v in sorted(counts.items(), key=lambda kv: -kv[1])))
    print(f"{len(auto)} safe updates in {(out_dir / '02-status-auto.json').relative_to(ROOT)}; "
          f"the rest (gone, unreachable, listing, no_url, linkedin) go to the re-check subagent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
