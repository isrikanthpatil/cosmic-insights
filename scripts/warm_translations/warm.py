#!/usr/bin/env python3
"""
warm.py — pre-warm the /api/translate cache for all generated-content strings so
users' first views are instant cache hits (no live Groq wait).

Reads strings.json (extracted from the app's knowledge/content modules) and POSTs
them to the translate endpoint in batches for each language. Every string gets
translated once and stored in the translation_cache collection; re-running is
cheap (cache hits).

Run on the SERVER (fastest, hits localhost) or anywhere that can reach the API:

    python3 warm.py                         # uses https://api.astropanth.com
    python3 warm.py --base http://127.0.0.1:8090   # if PocketBase is local
    python3 warm.py --langs hi,kn           # only some languages

Stdlib only. Safe to re-run.
"""
import argparse
import json
import os
import ssl
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
_CTX = None  # optional SSL context (set when --insecure)


def post(base, lang, texts):
    body = json.dumps({"lang": lang, "texts": texts}).encode()
    req = urllib.request.Request(
        base.rstrip("/") + "/api/translate",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=90, context=_CTX) as r:
        return json.loads(r.read().decode()).get("translations", [])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="https://api.astropanth.com")
    ap.add_argument("--langs", default="hi,mr,kn,ta,te")
    ap.add_argument("--batch", type=int, default=50)
    ap.add_argument("--strings", default=os.path.join(HERE, "strings.json"))
    ap.add_argument("--insecure", action="store_true",
                    help="skip TLS cert verification (fixes macOS 'CERTIFICATE_VERIFY_FAILED')")
    args = ap.parse_args()

    if args.insecure:
        global _CTX
        _CTX = ssl._create_unverified_context()
        print("(TLS verification disabled)")

    strings = json.load(open(args.strings, encoding="utf-8"))
    langs = [l.strip() for l in args.langs.split(",") if l.strip()]
    print("Warming %d strings x %d languages via %s" % (len(strings), len(langs), args.base))

    for lang in langs:
        done = ok = 0
        t0 = time.time()
        for i in range(0, len(strings), args.batch):
            chunk = strings[i:i + args.batch]
            try:
                out = post(args.base, lang, chunk)
                ok += sum(1 for x in out if isinstance(x, str) and x.strip())
            except Exception as ex:  # noqa: BLE001
                print("\n  ! batch %d failed: %s" % (i, str(ex)[:120]))
            done += len(chunk)
            print("\r  %s: %d/%d" % (lang, done, len(strings)), end="", flush=True)
        print("  (%.0fs, %d translated)" % (time.time() - t0, ok))

    print("Done. Re-runs are cache hits (near-instant).")


if __name__ == "__main__":
    main()
