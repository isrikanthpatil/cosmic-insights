#!/usr/bin/env python3
"""
ig_post.py — publish a single image post to an Instagram Business account via the
official Instagram Graph API (2 steps: create media container -> publish).

Standard library only. Credentials come from the environment (never hard-code):
    IG_USER_ID       your Instagram Business account id
    IG_ACCESS_TOKEN  a long-lived Page access token with instagram_content_publish

Usage:
    export IG_USER_ID=1784xxxxxxxxxxx
    export IG_ACCESS_TOKEN=EAAG...
    python3 ig_post.py --image "https://astropanth.com/social/panchang.jpg" \
                       --caption "Today's Panchang ✦ ..."

Notes:
- --image must be a PUBLIC https URL to a JPG/PNG (host it on your site).
- Caption max ~2200 chars, max 30 hashtags.
- Instagram allows ~25 API-published posts per 24h.
"""
import argparse
import json
import os
import ssl
import sys
import time
import urllib.parse
import urllib.request

# Facebook-login (Graph API, needs a Page) uses graph.facebook.com; the newer
# Instagram-login path uses graph.instagram.com. Override via IG_GRAPH_BASE.
API = os.environ.get("IG_GRAPH_BASE", "https://graph.facebook.com/v21.0")
_CTX = None  # SSL context; set to unverified when --insecure (macOS cert issue)


def _post(path, params):
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(API + path, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=60, context=_CTX) as r:
        return json.loads(r.read().decode())


def _get(path, params):
    url = API + path + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=60, context=_CTX) as r:
        return json.loads(r.read().decode())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", required=True, help="public https URL to the image")
    ap.add_argument("--caption", default="")
    ap.add_argument("--insecure", action="store_true",
                    help="skip TLS verification (fixes macOS CERTIFICATE_VERIFY_FAILED)")
    args = ap.parse_args()

    if args.insecure:
        global _CTX
        _CTX = ssl._create_unverified_context()

    ig_id = os.environ.get("IG_USER_ID")
    token = os.environ.get("IG_ACCESS_TOKEN")
    if not ig_id or not token:
        sys.exit("Set IG_USER_ID and IG_ACCESS_TOKEN in the environment.")

    # 1) Create a media container.
    print("Creating media container ...")
    created = _post("/%s/media" % ig_id, {
        "image_url": args.image,
        "caption": args.caption,
        "access_token": token,
    })
    if "id" not in created:
        sys.exit("Container error: " + json.dumps(created))
    creation_id = created["id"]

    # 2) Wait until Instagram has fetched/processed the image.
    for _ in range(20):
        st = _get("/%s" % creation_id, {"fields": "status_code", "access_token": token})
        code = st.get("status_code")
        if code == "FINISHED":
            break
        if code == "ERROR":
            sys.exit("Media processing error: " + json.dumps(st))
        time.sleep(3)

    # 3) Publish.
    print("Publishing ...")
    pub = _post("/%s/media_publish" % ig_id, {
        "creation_id": creation_id,
        "access_token": token,
    })
    if "id" not in pub:
        sys.exit("Publish error: " + json.dumps(pub))
    print("Published. Media id:", pub["id"])


if __name__ == "__main__":
    main()
