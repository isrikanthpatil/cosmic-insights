#!/usr/bin/env python3
"""
panchang_post.py — post TODAY's pre-rendered Panchang card to Instagram.

Fully hands-off: a batch of daily cards (2026-09-06 .. 2027-09-05) is pre-rendered
from the app's own Jyotish engine and hosted publicly. This script just looks up
today's card by date in panchang-index.json and publishes it. Run it once a day
from cron; it de-dupes so a second run the same day does nothing.

Standard library only. Credentials come from the environment (never hard-code):
    IG_USER_ID       Instagram Business account id
    IG_ACCESS_TOKEN  long-lived token with instagram_business_content_publish
    IG_GRAPH_BASE    (optional) default https://graph.instagram.com/v21.0
    IG_PANCHANG_BASE (optional) overrides the base_url in the index

Usage:
    python3 panchang_post.py --index panchang-index.json            # post today
    python3 panchang_post.py --index panchang-index.json --dry-run  # show only
    python3 panchang_post.py --index panchang-index.json --date 2026-09-06
"""
import argparse
import datetime
import json
import os
import ssl
import sys
import time
import urllib.parse
import urllib.request

API = os.environ.get("IG_GRAPH_BASE", "https://graph.instagram.com/v21.0")
_CTX = None  # SSL context; unverified when --insecure (macOS cert issue)


def _post(path, params):
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(API + path, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=60, context=_CTX) as r:
        return json.loads(r.read().decode())


def _get(path, params):
    url = API + path + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=60, context=_CTX) as r:
        return json.loads(r.read().decode())


def publish(ig_id, token, image_url, caption):
    created = _post("/%s/media" % ig_id,
                    {"image_url": image_url, "caption": caption, "access_token": token})
    if "id" not in created:
        raise SystemExit("Container error: " + json.dumps(created))
    cid = created["id"]
    for _ in range(20):
        st = _get("/%s" % cid, {"fields": "status_code", "access_token": token})
        if st.get("status_code") == "FINISHED":
            break
        if st.get("status_code") == "ERROR":
            raise SystemExit("Processing error: " + json.dumps(st))
        time.sleep(3)
    pub = _post("/%s/media_publish" % ig_id, {"creation_id": cid, "access_token": token})
    if "id" not in pub:
        raise SystemExit("Publish error: " + json.dumps(pub))
    return pub["id"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", required=True, help="path to panchang-index.json")
    ap.add_argument("--date", help="YYYY-MM-DD override (default: today, IST)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--insecure", action="store_true",
                    help="skip TLS verification (fixes macOS CERTIFICATE_VERIFY_FAILED)")
    args = ap.parse_args()

    if args.insecure:
        global _CTX
        _CTX = ssl._create_unverified_context()

    idx = json.load(open(args.index, encoding="utf-8"))
    days = idx.get("days", {})
    base = os.environ.get("IG_PANCHANG_BASE", idx.get("base_url", "")).rstrip("/") + "/"

    # Today's date in IST (the calendar the cards are keyed to).
    today = args.date or (datetime.datetime.now(datetime.timezone.utc)
                          + datetime.timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d")
    entry = days.get(today)
    if not entry:
        print("No card for %s (batch may need regenerating). Nothing posted." % today)
        return

    image_url = entry["image"] if entry["image"].startswith("http") else base + entry["image"]
    # Cache-bust: Instagram caches a failed media fetch per-URL for ~1-2 days, so a
    # URL that once 404'd stays "unfetchable". A unique query each run avoids that.
    image_url += ("&" if "?" in image_url else "?") + "v=" + str(int(time.time()))
    caption = entry.get("caption", "")
    print("Today %s -> %s" % (today, image_url))

    if args.dry_run:
        print("--- caption ---\n" + caption)
        return

    # De-dupe: don't post the same day twice.
    state_path = os.path.join(os.path.dirname(os.path.abspath(args.index)), "panchang-state.json")
    if os.path.exists(state_path):
        if json.load(open(state_path)).get("last") == today:
            print("Already posted %s. Skipping." % today)
            return

    ig_id = os.environ.get("IG_USER_ID")
    token = os.environ.get("IG_ACCESS_TOKEN")
    if not ig_id or not token:
        sys.exit("Set IG_USER_ID and IG_ACCESS_TOKEN in the environment.")

    mid = publish(ig_id, token, image_url, caption)
    print("Published. Media id:", mid)
    json.dump({"last": today}, open(state_path, "w"))


if __name__ == "__main__":
    main()
