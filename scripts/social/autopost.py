#!/usr/bin/env python3
"""
autopost.py — auto-post the next queued image to Instagram on a schedule.

Reads a queue (queue.json: base_url + a list of {image, caption}), remembers
what it already posted (in state.json next to the queue), and publishes the NEXT
item via the Instagram Graph API. Run it daily from cron / a PocketBase scheduled
task and it walks the queue one post at a time.

Env (never hard-code):
    IG_USER_ID       Instagram Business account id
    IG_ACCESS_TOKEN  long-lived token with instagram_content_publish

Usage:
    python3 autopost.py --queue queue.json          # post the next item
    python3 autopost.py --queue queue.json --loop    # wrap around at the end
    python3 autopost.py --queue queue.json --dry-run # show what would post

Images must be reachable at  <base_url><image>  as a public https URL.
"""
import argparse
import json
import os
import ssl
import sys
import time
import urllib.parse
import urllib.request

# graph.facebook.com (Facebook-login, needs a Page) or graph.instagram.com
# (Instagram-login, no Page). Override via IG_GRAPH_BASE.
API = os.environ.get("IG_GRAPH_BASE", "https://graph.facebook.com/v21.0")
_CTX = None  # SSL context; unverified when --insecure (macOS cert issue)


def _post(path, params):
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(API + path, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=60, context=_CTX) as r:
        return json.loads(r.read().decode())


def _get(path, params):
    with urllib.request.urlopen(API + path + "?" + urllib.parse.urlencode(params), timeout=60, context=_CTX) as r:
        return json.loads(r.read().decode())


def publish(ig_id, token, image_url, caption):
    created = _post("/%s/media" % ig_id, {"image_url": image_url, "caption": caption, "access_token": token})
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
    ap.add_argument("--queue", required=True)
    ap.add_argument("--loop", action="store_true", help="restart at the top when the queue ends")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--insecure", action="store_true",
                    help="skip TLS verification (fixes macOS CERTIFICATE_VERIFY_FAILED)")
    args = ap.parse_args()

    if args.insecure:
        global _CTX
        _CTX = ssl._create_unverified_context()

    q = json.load(open(args.queue, encoding="utf-8"))
    posts = q.get("posts", [])
    base = q.get("base_url", "")
    state_path = os.path.join(os.path.dirname(os.path.abspath(args.queue)), "state.json")
    idx = 0
    if os.path.exists(state_path):
        idx = json.load(open(state_path)).get("next", 0)

    if idx >= len(posts):
        if not args.loop:
            print("Queue finished (%d posts). Use --loop to cycle, or add more." % len(posts))
            return
        idx = 0

    item = posts[idx]
    image_url = item["image"] if item["image"].startswith("http") else base.rstrip("/") + "/" + item["image"]
    caption = item.get("caption", "")
    print("Next [%d/%d]: %s" % (idx + 1, len(posts), image_url))

    if args.dry_run:
        print("--- caption ---\n" + caption)
        return

    ig_id = os.environ.get("IG_USER_ID")
    token = os.environ.get("IG_ACCESS_TOKEN")
    if not ig_id or not token:
        sys.exit("Set IG_USER_ID and IG_ACCESS_TOKEN in the environment.")

    mid = publish(ig_id, token, image_url, caption)
    print("Published. Media id:", mid)
    json.dump({"next": idx + 1}, open(state_path, "w"))


if __name__ == "__main__":
    main()
