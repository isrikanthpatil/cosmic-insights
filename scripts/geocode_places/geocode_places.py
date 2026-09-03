#!/usr/bin/env python3
"""
geocode_places.py — back-fill lat/lon on the PocketBase `places` collection
from the free GeoNames India dataset, so birthplaces resolve to precise
coordinates (accurate Lagna / ascendant) instead of a state centroid.

Standard library only (no pip installs). Works in two independent stages so you
can inspect the match before touching the database:

  Stage 1  MATCH   read places + GeoNames, write place_coords.csv (id,lat,lon)
  Stage 2  APPLY   write those coords back into PocketBase

--------------------------------------------------------------------------------
INPUTS you download from GeoNames (https://download.geonames.org/export/dump/):
  IN.zip                -> unzip -> IN.txt          (all India place rows)
  admin1CodesASCII.txt  (maps state code  -> state name)     [required]
  admin2Codes.txt       (maps district code -> district name)[optional, sharper]

READING the places list (pick ONE):
  --db   pb_data/data.db          fastest; reads the SQLite file directly
  --api-url https://api.astropanth.com  + --admin-email/--admin-pass
                                  reads via the PocketBase list API (no DB access)

APPLYING coordinates (pick ONE, Stage 2):
  --apply db     UPDATE the SQLite file directly (STOP PocketBase first). Fast.
  --apply api    PATCH each record via the API (PocketBase can stay up). Slower.
  (default)      no apply — just writes place_coords.csv for review.

--------------------------------------------------------------------------------
TYPICAL RUN (on the server, PocketBase stopped, DB path adjusted):

  # 1. dry-run match, review coverage + coords.csv
  python3 geocode_places.py \
      --geonames IN.txt --admin1 admin1CodesASCII.txt --admin2 admin2Codes.txt \
      --db /opt/pocketbase/pb_data/data.db

  # 2. same command + write coords into the DB (PocketBase stopped)
  python3 geocode_places.py \
      --geonames IN.txt --admin1 admin1CodesASCII.txt --admin2 admin2Codes.txt \
      --db /opt/pocketbase/pb_data/data.db --apply db

Re-runnable: only fills rows whose lat is still empty unless --overwrite is set.
"""

import argparse
import csv
import json
import os
import sqlite3
import sys
import time
import unicodedata
import urllib.request
import urllib.error
import urllib.parse

# GeoNames main table column indexes (tab-separated, no header).
GN_NAME = 1
GN_ASCIINAME = 2
GN_LAT = 4
GN_LON = 5
GN_FCLASS = 6      # P = populated place, A = admin boundary
GN_CC = 8          # country code
GN_ADMIN1 = 10
GN_ADMIN2 = 11
GN_POP = 14


# ---------------------------------------------------------------- normalisation
def norm(s):
    """Lowercase, strip accents/punctuation, collapse whitespace."""
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", str(s))
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.lower()
    out = []
    for ch in s:
        out.append(ch if ch.isalnum() or ch.isspace() else " ")
    return " ".join("".join(out).split())


# ---------------------------------------------------------------- GeoNames load
def load_admin1(path):
    """admin1CodesASCII.txt: 'IN.36<TAB>State Name<TAB>...' -> {'IN.36': 'state'}"""
    m = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) >= 2 and parts[0].startswith("IN."):
                m[parts[0]] = norm(parts[1])
    return m


def load_admin2(path):
    """admin2Codes.txt: 'IN.36.001<TAB>District Name<TAB>...' -> {'IN.36.001': 'district'}"""
    m = {}
    if not path:
        return m
    with open(path, encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) >= 2 and parts[0].startswith("IN."):
                m[parts[0]] = norm(parts[1])
    return m


def build_index(geonames_path, admin1, admin2):
    """name_norm -> list of dicts {lat, lon, state, district, pop, fclass}."""
    index = {}
    rows = 0
    with open(geonames_path, encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE)
        for r in reader:
            if len(r) <= GN_POP:
                continue
            if r[GN_CC] != "IN":
                continue
            fclass = r[GN_FCLASS]
            if fclass not in ("P", "A"):
                continue
            try:
                lat = float(r[GN_LAT])
                lon = float(r[GN_LON])
            except (ValueError, IndexError):
                continue
            a1 = "IN." + r[GN_ADMIN1] if r[GN_ADMIN1] else ""
            a2 = a1 + "." + r[GN_ADMIN2] if (a1 and r[GN_ADMIN2]) else ""
            state = admin1.get(a1, "")
            district = admin2.get(a2, "")
            try:
                pop = int(r[GN_POP] or 0)
            except ValueError:
                pop = 0
            cand = {
                "lat": lat, "lon": lon, "state": state,
                "district": district, "pop": pop, "fclass": fclass,
            }
            for key in {norm(r[GN_NAME]), norm(r[GN_ASCIINAME])}:
                if key:
                    index.setdefault(key, []).append(cand)
            rows += 1
    return index, rows


# ------------------------------------------------------------------- matching
def best_match(name, state, district, index):
    """Return (lat, lon) or None. Requires a same-state name match; within that,
    prefers a district match, then populated places, then higher population."""
    nn, ns, nd = norm(name), norm(state), norm(district)
    cands = index.get(nn)
    if not cands:
        return None

    def score(c):
        s = 0
        if ns and c["state"] == ns:
            s += 1000
        if nd and c["district"] and c["district"] == nd:
            s += 500
        if c["fclass"] == "P":
            s += 100
        s += min(c["pop"], 90) / 100.0  # tiny population tie-breaker
        return s

    # If we know the state, only trust candidates in that state (avoids
    # same-name villages in other states). If none, we skip rather than guess.
    if ns:
        in_state = [c for c in cands if c["state"] == ns]
        if not in_state:
            return None
        cands = in_state

    best = max(cands, key=score)
    return round(best["lat"], 6), round(best["lon"], 6)


# ------------------------------------------------------------- places sources
def read_places_db(db_path, overwrite):
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    where = "" if overwrite else "WHERE lat IS NULL OR lat = ''"
    for row in cur.execute(
        "SELECT id, name, state, district FROM places " + where
    ):
        yield row["id"], row["name"], row["state"], row["district"]
    con.close()


def read_places_api(base, token, overwrite):
    page = 1
    flt = "" if overwrite else "&filter=" + urllib.parse.quote("lat = null")
    while True:
        url = (base.rstrip("/") +
               "/api/collections/places/records?perPage=500&page=%d"
               "&fields=id,name,state,district&skipTotal=1%s" % (page, flt))
        data = api_get(url, token)
        items = data.get("items", [])
        if not items:
            break
        for it in items:
            yield it["id"], it.get("name", ""), it.get("state", ""), it.get("district", "")
        page += 1


# ---------------------------------------------------------------- API helpers
def api_get(url, token):
    req = urllib.request.Request(url, headers={"Authorization": token})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def superuser_token(base, email, password):
    url = base.rstrip("/") + "/api/collections/_superusers/auth-with-password"
    body = json.dumps({"identity": email, "password": password}).encode()
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())["token"]


def api_patch(base, token, rec_id, lat, lon):
    url = base.rstrip("/") + "/api/collections/places/records/" + rec_id
    body = json.dumps({"lat": lat, "lon": lon}).encode()
    req = urllib.request.Request(
        url, data=body, method="PATCH",
        headers={"Content-Type": "application/json", "Authorization": token})
    urllib.request.urlopen(req, timeout=60).read()


# ------------------------------------------------------------------- apply
def apply_db(db_path, coords):
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    n = 0
    cur.execute("BEGIN")
    for rec_id, lat, lon in coords:
        cur.execute("UPDATE places SET lat=?, lon=? WHERE id=?", (lat, lon, rec_id))
        n += 1
    con.commit()
    con.close()
    return n


def apply_api(base, token, coords, sleep):
    n = 0
    for rec_id, lat, lon in coords:
        try:
            api_patch(base, token, rec_id, lat, lon)
            n += 1
        except urllib.error.HTTPError as ex:
            print("  ! PATCH %s failed: %s" % (rec_id, ex), file=sys.stderr)
        if sleep:
            time.sleep(sleep)
        if n % 1000 == 0 and n:
            print("  ... applied %d" % n)
    return n


# -------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--geonames", required=True, help="IN.txt from GeoNames")
    ap.add_argument("--admin1", required=True, help="admin1CodesASCII.txt")
    ap.add_argument("--admin2", default="", help="admin2Codes.txt (optional, sharper)")
    ap.add_argument("--db", default="", help="path to pb_data/data.db (read + apply db)")
    ap.add_argument("--api-url", default="", help="PocketBase base URL (read/apply via API)")
    ap.add_argument("--admin-email", default="")
    ap.add_argument("--admin-pass", default="")
    ap.add_argument("--apply", choices=["db", "api"], default="",
                    help="write coords back (default: dry-run, csv only)")
    ap.add_argument("--overwrite", action="store_true",
                    help="also fill rows that already have a lat")
    ap.add_argument("--out", default="place_coords.csv")
    ap.add_argument("--sleep", type=float, default=0.0, help="api apply throttle (s)")
    args = ap.parse_args()

    if not args.db and not args.api_url:
        ap.error("give --db  OR  --api-url (+ --admin-email/--admin-pass)")

    print("Loading GeoNames admin codes ...")
    admin1 = load_admin1(args.admin1)
    admin2 = load_admin2(args.admin2)
    print("  states: %d   districts: %d" % (len(admin1), len(admin2)))

    print("Indexing GeoNames places (%s) ..." % args.geonames)
    index, gn_rows = build_index(args.geonames, admin1, admin2)
    print("  indexed %d GeoNames rows under %d distinct names" % (gn_rows, len(index)))

    token = ""
    if args.api_url and (args.apply == "api" or not args.db):
        token = superuser_token(args.api_url, args.admin_email, args.admin_pass)

    if args.db:
        source = read_places_db(args.db, args.overwrite)
    else:
        source = read_places_api(args.api_url, token, args.overwrite)

    print("Matching places ...")
    matched, total = [], 0
    for rec_id, name, state, district in source:
        total += 1
        hit = best_match(name, state, district, index)
        if hit:
            matched.append((rec_id, hit[0], hit[1]))
        if total % 50000 == 0:
            print("  ... scanned %d, matched %d" % (total, len(matched)))

    pct = (100.0 * len(matched) / total) if total else 0.0
    print("Matched %d / %d places (%.1f%%)" % (len(matched), total, pct))

    with open(args.out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "lat", "lon"])
        w.writerows(matched)
    print("Wrote %s" % args.out)

    if not args.apply:
        print("Dry-run only. Re-run with --apply db (PocketBase stopped) "
              "or --apply api to write coordinates.")
        return

    print("Applying via %s ..." % args.apply)
    if args.apply == "db":
        if not args.db:
            ap.error("--apply db needs --db")
        n = apply_db(args.db, matched)
    else:
        if not args.api_url:
            ap.error("--apply api needs --api-url")
        if not token:
            token = superuser_token(args.api_url, args.admin_email, args.admin_pass)
        n = apply_api(args.api_url, token, matched, args.sleep)
    print("Updated %d rows. Done." % n)


if __name__ == "__main__":
    main()
