# Precise birthplace geocoding (#70) — setup steps

**Goal:** give every birthplace real lat/lon so the **Lagna (ascendant)** is
accurate, instead of falling back to a state centroid (which can be 3–5° of
longitude off — enough to push the ascendant into the wrong sign).

**What this covers:** the *server* half — adding `lat`/`lon` to the `places`
collection and back-filling ~558k rows from GeoNames. The *app* half (reading
those coordinates during chart calc) is **not** wired yet, by design — do it in
a later build once coverage looks good. Nothing here changes app behaviour: rows
without coordinates just keep using today's city/state lookup.

Everything runs on your PocketBase server. Python 3 standard library only — no
`pip install`.

---

## Step 1 — Add the `lat` and `lon` fields to `places`

Pick either path (both give the same result):

**A. Admin UI (fastest, ~30s)**
Collections → `places` → **New field** → **Number** → name `lat` → Create.
Repeat for `lon`. Leave both optional. Save.

**B. Migration (reproducible)**
Copy `pocketbase/pb_migrations/1788400000_add_places_latlon.js` into your
server's `pb_data/../pb_migrations/` folder and restart PocketBase. It runs once
and is recorded in `_migrations`. (`./pocketbase migrate down 1` reverses it.)

> The `List`/`View` API rules on `places` should stay **public** (they already
> are, for autocomplete). `Create/Update/Delete` stay locked.

---

## Step 2 — Download the GeoNames India data

Free, CC-BY. On the server:

```bash
cd /tmp
wget https://download.geonames.org/export/dump/IN.zip
unzip IN.zip                # -> IN.txt  (~90 MB, all India places)
wget https://download.geonames.org/export/dump/admin1CodesASCII.txt   # state names
wget https://download.geonames.org/export/dump/admin2Codes.txt        # district names (sharper matches)
```

*(These `wget`s are you fetching an open dataset onto your own server — fine.)*

---

## Step 3 — Dry-run the match (writes a CSV, touches nothing)

Point `--db` at your live PocketBase SQLite file (find it with
`ls /opt/pocketbase/pb_data/data.db` or wherever you run PocketBase):

```bash
cd /path/to/repo/scripts/geocode_places
python3 geocode_places.py \
  --geonames /tmp/IN.txt \
  --admin1  /tmp/admin1CodesASCII.txt \
  --admin2  /tmp/admin2Codes.txt \
  --db /opt/pocketbase/pb_data/data.db
```

It prints a coverage line like `Matched 431204 / 558000 places (77.3%)` and
writes `place_coords.csv` (`id,lat,lon`). Open a few rows and sanity-check them
against Google Maps before applying. Unmatched rows (rare/tiny villages GeoNames
doesn't list) simply stay empty and keep the old fallback.

**How matches are chosen:** exact place-name match **within the same state**
(so a "Rampur" in UP never grabs a "Rampur" in another state); ties broken by
district match, then populated-place over admin boundary, then population.

---

## Step 4 — Apply the coordinates

Fastest path writes straight into SQLite, so **stop PocketBase first** (a running
server can lock the DB):

```bash
sudo systemctl stop pocketbase

python3 geocode_places.py \
  --geonames /tmp/IN.txt \
  --admin1  /tmp/admin1CodesASCII.txt \
  --admin2  /tmp/admin2Codes.txt \
  --db /opt/pocketbase/pb_data/data.db \
  --apply db

sudo systemctl start pocketbase
```

It only fills rows whose `lat` is still empty, so it's **safe to re-run** and
resume if interrupted. Use `--overwrite` only if you want to redo everything.

**No shell/DB access?** Keep PocketBase running and apply over the API instead
(slower — one request per row):

```bash
python3 geocode_places.py \
  --geonames /tmp/IN.txt --admin1 /tmp/admin1CodesASCII.txt --admin2 /tmp/admin2Codes.txt \
  --api-url https://api.astropanth.com \
  --admin-email you@astropanth.com --admin-pass '<superuser password>' \
  --apply api --sleep 0.02
```

---

## Step 5 — Verify

```bash
# how many now have coordinates
curl -s "https://api.astropanth.com/api/collections/places/records?perPage=1&filter=lat!=null" \
  | python3 -c "import sys,json;print('with coords:',json.load(sys.stdin)['totalItems'])"

# spot-check a known city
curl -s "https://api.astropanth.com/api/collections/places/records?perPage=3&filter=$(python3 -c 'import urllib.parse;print(urllib.parse.quote("name=\"Pune\""))')"
```

Pune should read ~`18.52, 73.86`.

---

## Step 6 — Later (next app build): use the coordinates

Not done yet, on purpose. When you're ready:
- extend `utils/places.ts` `searchPlaces` to also return each place's `lat`/`lon`,
- capture them on the profile when a place is picked (`BirthDetailsForm`),
- in `utils/astrology.ts`, prefer the stored coordinates in
  `getCoordinatesForPlace`, keeping the current city/state table as the offline
  fallback.

That's the point where exact Lagna actually reaches users — say the word and
I'll wire it into a build.
