# Deployment Guide

Self-hosted backend for the Astrology app on a single DigitalOcean droplet:
Postgres + GoTrue (auth) + PostgREST + Storage + Kong (the official Supabase
self-hosting stack), plus our overlay of **Ollama** (local LLM) and **Caddy**
(automatic HTTPS reverse proxy).

## Prerequisites

1. A DigitalOcean droplet (Ubuntu 22.04+). App + DB run fine on a small/basic
   droplet. Enabling the local LLM needs more RAM — see the callout below.
2. Docker + Docker Compose plugin installed on the droplet.
3. A domain with a DNS **A record** pointing at the droplet IP (recommended for
   HTTPS). You can start with the bare droplet IP, but Caddy needs a domain to
   issue a Let's Encrypt cert.

## 1. Clone the official Supabase self-hosting compose

```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
```

Then copy our placeholders over the relevant keys and generate secrets:

```bash
# from this repo: merge infra/.env.example values into supabase/docker/.env
openssl rand -hex 24   # -> POSTGRES_PASSWORD
openssl rand -hex 32   # -> JWT_SECRET
```

Generate `ANON_KEY` and `SERVICE_ROLE_KEY` (JWTs signed with `JWT_SECRET`)
using the generator in the Supabase self-hosting docs:
https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys
Set `SITE_URL`/`DOMAIN` to your domain.

## 2. Add our overlay (Ollama + Caddy)

Copy this repo's `infra/docker-compose.yml` and `infra/Caddyfile` next to the
Supabase compose (or reference by absolute path). Edit `Caddyfile`: replace
`your-domain.com` with your domain. Confirm the network name in our compose
file matches the Supabase network (`docker network ls`, often
`supabase_default`).

## 3. Bring everything up

```bash
# from supabase/docker, layering our overlay on top
docker compose up -d
docker compose -f docker-compose.yml -f /path/to/infra/docker-compose.yml up -d
```

Pull the LLM model once Ollama is running:

```bash
docker exec -it ollama ollama pull llama3.2:3b
```

## 4. Run the schema migration

```bash
# DB container name from the supabase compose is usually "supabase-db"
docker exec -i supabase-db \
  psql -U postgres -d postgres \
  < supabase/migrations/20250105120000_initial_schema.sql
```

The migration is idempotent, so it is safe to re-run.

## 5. Point the Expo app at the droplet

Set in the app's env (`.env` / EAS secrets):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-domain.com
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from step 1>
```

Build and serve the **web** app via Caddy:

```bash
npx expo export --platform web      # outputs ./dist
# copy ./dist to the path mounted in infra/docker-compose.yml (e.g. web-build/)
# then enable the static-file block in infra/Caddyfile and reload Caddy
```

Build **mobile** via EAS:

```bash
npx eas build --platform ios       # or android
```

## ⚠️ RAM callout: the local LLM (Ollama)

Ollama needs **~8GB+ RAM** even for a small 3B model. The app + Postgres +
Supabase services run comfortably on a small droplet, but the LLM does not.
Options:

- **Resize the droplet** up only when you enable AI features, then resize back.
- **Run Ollama on a separate droplet** that you power off when not in use
  (keeps the always-on droplet small and cheap).

Do not try to run `llama3.2:3b` on a 1–2GB droplet; it will OOM.

## Note: Apple Developer account

An **Apple Developer account ($99/yr)** is required **only** for iOS
distribution (TestFlight / App Store). It is not needed for the web build,
Android, or the backend itself.
