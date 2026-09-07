#!/usr/bin/env python3
"""
gen_content_bundle.py — build the offline generated-content translation bundle.

Reads a list of finite English strings (astro-keys.json) and translates each into
hi/mr/kn/ta/te by calling the app's OWN public /api/translate endpoint (which uses
the server's Groq + translation_cache). No API key is needed on this side. Writes
the result into i18n/generatedContent.json, MERGING with whatever is already there
(so hand-tuned entries and previously-generated langs are preserved).

Run it once (or whenever astro-keys.json changes). It's idempotent and resumable —
strings already present in the bundle are skipped, so re-running only fills gaps.

Usage:
    python3 scripts/i18n/gen_content_bundle.py
    python3 scripts/i18n/gen_content_bundle.py --keys scripts/i18n/astro-keys.json \
        --out i18n/generatedContent.json --base https://api.astropanth.com --insecure
"""
import argparse
import json
import os
import ssl
import time
import urllib.parse
import urllib.request

LANGS = ["hi", "mr", "kn", "ta", "te"]
_CTX = None


def translate_chunk(base, texts, lang):
    body = json.dumps({"texts": texts, "lang": lang}).encode()
    req = urllib.request.Request(
        base.rstrip("/") + "/api/translate",
        data=body,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120, context=_CTX) as r:
        res = json.loads(r.read().decode())
    return res.get("translations", [])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--keys", default="scripts/i18n/astro-keys.json")
    ap.add_argument("--out", default="i18n/generatedContent.json")
    ap.add_argument("--base", default="https://api.astropanth.com")
    ap.add_argument("--chunk", type=int, default=10,
                    help="strings per request (smaller = fewer rate-limit nulls)")
    ap.add_argument("--sleep", type=float, default=0.5,
                    help="seconds between requests (raise if Groq rate-limits)")
    ap.add_argument("--passes", type=int, default=4,
                    help="retry passes; each only fills what's still missing")
    ap.add_argument("--langs", default="",
                    help="comma list to target only some languages (e.g. ta,te)")
    ap.add_argument("--insecure", action="store_true",
                    help="skip TLS verification (macOS cert issue)")
    args = ap.parse_args()

    if args.insecure:
        global _CTX
        _CTX = ssl._create_unverified_context()

    keys = json.load(open(args.keys, encoding="utf-8"))
    bundle = {}
    if os.path.exists(args.out):
        bundle = json.load(open(args.out, encoding="utf-8"))
    bundle.setdefault("_meta", {
        "note": "Bundled offline translations of FINITE generated-content strings.",
        "langs": LANGS,
    })

    langs = [l.strip() for l in args.langs.split(",")] if args.langs else list(LANGS)

    for p in range(1, args.passes + 1):
        still_missing = 0
        # Prioritize the LEAST-complete languages so they get the fresh per-minute
        # rate budget each pass instead of starving last.
        order = sorted(langs, key=lambda l: sum(1 for k in keys if bundle.get(l, {}).get(k)))
        for lang in order:
            have = bundle.setdefault(lang, {})
            todo = [k for k in keys if k not in have or not have[k]]
            still_missing += len(todo)
            if not todo:
                continue
            print(f"[pass {p}][{lang}] {len(keys) - len(todo)}/{len(keys)} done, {len(todo)} to go")
            for i in range(0, len(todo), args.chunk):
                chunk = todo[i:i + args.chunk]
                try:
                    arr = translate_chunk(args.base, chunk, lang)
                except Exception as e:
                    print(f"  chunk {i} failed ({e}); will retry next pass")
                    continue
                for src, tr in zip(chunk, arr):
                    if isinstance(tr, str) and tr.strip():
                        have[src] = tr
                # Save after every chunk so a crash never loses work.
                json.dump(bundle, open(args.out, "w", encoding="utf-8"),
                          ensure_ascii=False, indent=0)
                time.sleep(args.sleep)
        filled = {l: sum(1 for k in keys if bundle.get(l, {}).get(k)) for l in langs}
        print(f"-- after pass {p}: " + ", ".join(f"{l}={filled[l]}/{len(keys)}" for l in langs))
        if still_missing == 0:
            break

    total = sum(sum(1 for k in keys if bundle.get(l, {}).get(k)) for l in langs)
    print(f"DONE. {total}/{len(keys) * len(langs)} translations -> {args.out}")


if __name__ == "__main__":
    main()
