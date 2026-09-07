# Instagram auto-posting — setup

Fully automated posting: a scheduled job publishes the next queued post to
`@astropanth.app` with no manual step. The **only** thing you must create is an
Instagram access token (I can't do that for you).

Pieces (all built):
- `scripts/social/autopost.py` — posts the next item in a queue, remembers progress.
- `Growth Kit/content-queue/queue.json` — the queue (image + caption list).
- `scripts/social/ig_post.py` — post a single image on demand.
- `scripts/social/panchang_card.py` — generate a daily Panchang graphic.
- Images are hosted at `marketing-site/social/…` → public at `https://astropanth.com/social/…` once you redeploy the marketing site.

---

## 1. Host the images (once)

The queue images live in `marketing-site/social/`. **Redeploy the marketing
site** (same drag-drop/git step as astropanth.com) so they're live at, e.g.,
`https://astropanth.com/social/post-askastro.png`. Confirm one opens in a browser.

## 2. Get an Instagram access token — Instagram-login path (no Facebook Page)

You need a free Meta developer account. It logs in with a **personal Facebook
account** (separate from the `@astropanth.app` Instagram account); if you don't
have one, create it first. No Facebook **Page** is required on this path.

1. **developers.facebook.com** → log in with your personal Facebook account →
   complete the one-time developer registration (verify phone/email, accept terms).
2. **My Apps → Create app** → for "What do you want to do?" pick **Other** → app
   type **Business** → name it e.g. "Astropanth Social".
3. In the app: **Add product → Instagram**, and choose **"Instagram API with
   Instagram login"** (NOT the Facebook-login option).
4. Open **API setup with Instagram login → Generate access tokens** → **Add
   account** → log in with **@astropanth.app** and authorize. This issues a token
   with `instagram_business_basic` + `instagram_business_content_publish`.
   (For your OWN account this works without full App Review.)
5. That token is short-lived — **exchange for a long-lived one (~60 days):**
   `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret={APP_SECRET}&access_token={SHORT_TOKEN}`
6. Get your **IG user id:**
   `GET https://graph.instagram.com/me?fields=user_id,username&access_token={TOKEN}`

This path uses `graph.instagram.com`, so set the base when running the scripts:
```bash
export IG_GRAPH_BASE=https://graph.instagram.com/v21.0
```

> Older **Facebook-login** path instead? Then you DO need a Facebook Page linked
> to the IG account (Instagram → Settings → Linked accounts). Create a token in
> the Graph API Explorer with `instagram_basic, instagram_content_publish,
> pages_show_list`, get the IG id via `GET /me/accounts →
> instagram_business_account.id`, and leave `IG_GRAPH_BASE` unset (defaults to
> graph.facebook.com).

## 3. Put the secrets in the environment (never in code/chat)

On whatever machine runs the schedule (your server is fine):
```bash
export IG_USER_ID=1784xxxxxxxxxxx
export IG_ACCESS_TOKEN=EAAG...          # long-lived; keep secret
```
(Or add them to the PocketBase systemd env like GROQ_KEY, and run from there.)

## 4. Test, then schedule

```bash
cd scripts/social
python3 autopost.py --queue "../../..//Growth Kit/content-queue/queue.json" --dry-run   # shows next post
python3 autopost.py --queue "../../..//Growth Kit/content-queue/queue.json"             # posts it for real
```
Schedule it — e.g. post every 2 days at 9am via cron:
```
0 9 */2 * *  cd /path/scripts/social && IG_USER_ID=... IG_ACCESS_TOKEN=... python3 autopost.py --queue "/path/Growth Kit/content-queue/queue.json" --loop >> /var/log/astropanth-social.log 2>&1
```
`--loop` restarts the queue when it ends (or just add more items to queue.json).

## 5. Daily Panchang automation — BUILT

A fresh daily Panchang card auto-posts every morning. 365 cards (6 Sep 2026 →
5 Sep 2027) are pre-rendered from the app's Jyotish engine and posted by date via
`scripts/social/panchang_post.py`. Full steps in **`Growth Kit/PANCHANG-DAILY-SETUP.md`**.

## Adding more posts
Append `{ "image": "file.png", "caption": "..." }` to `queue.json`, drop the PNG
in `marketing-site/social/`, redeploy. New brand posts: `scripts/social/`… (the
carousel/evergreen generators produce 1080×1080 in brand style).

> Security: the token is a secret — env var only, never committed or pasted in
> chat. It expires ~every 60 days; refresh (step 2.4) before then. If a run fails,
> `state.json` isn't advanced, so it retries the same post next time.
