# TypeBeatOS

The YouTube growth system for type-beat producers.

> Upload a month of type beats in one sitting. TypeBeatOS handles the SEO, visuals, descriptions, tags, and schedule.

## What's built (Stages 2–5 of the roadmap)

- **Landing page** at `/` — the validation page, now driving signups
- **Auth** — email/password accounts via [Better-Auth](https://better-auth.com); email verification on signup (soft gate + in-app resend banner) and a full password-reset flow (`/forgot` → email → `/reset`)
- **Producer profile** — store links, license text, description footer, default posting schedule
- **Beat upload** — beat details + optional audio file
- **Batch upload queue** — Pro/Serious users can pair 2–5 audio files with artwork, apply shared metadata and publishing defaults, automatically schedule the next open slots, render every video, and optionally send the completed queue directly to YouTube from one progress screen
- **Upload package generation** — SEO title options (type-beat structures), description with your links, tags (capped at YouTube's 500-char limit), hashtags, pinned comment
- **Thumbnail builder** — canvas-based: gradient/image backgrounds, title text, producer name, parental advisory sticker; save or download as PNG
- **Upload calendar** — set posting days/time once, ⚡ auto-schedule spreads the queue across your next free slots
- **Export** — download a `.txt` upload pack + thumbnail PNG, with copy buttons for every field (paste into YouTube Studio)
- **Video generation (Stage 3)** — render YouTube-ready MP4s (1280×720 h264 + AAC) from the saved thumbnail + beat audio via bundled ffmpeg. Renders use a clean static artwork visual and run in a background queue with live status on the package page.
- **YouTube direct upload (Stage 4)** — connect a channel via Google OAuth (profile page), then upload any rendered package straight from the editor. Uploads go up private with `publishAt` set from the package schedule, including title/description/tags metadata (category: Music) and the custom thumbnail (best-effort). Status tracked per package with links to YouTube Studio when done. Verified end to end against the live API.
- **Analytics (Stage 5)** — views, likes, and comments per upload pulled from the YouTube Data API on demand (1 quota unit per 50 videos), plus aggregations: best performing artist keywords and best upload days. CTR/impressions need the YouTube Analytics API scope — future work.
- **Onboarding** — new signups land in a 3-step wizard (brand & store link → posting schedule → connect YouTube), every step skippable. The dashboard shows a setup checklist until the core steps are done.
- **Auto BPM & key detection** — leave BPM/key blank when adding a beat with audio and TypeBeatOS detects them from the file (ffmpeg decode → onset-based tempo via music-tempo → Krumhansl-Schmuckler chromagram key matching). Detected values flow into titles, tags, and the description.

### Optional AI enhancement

Metadata generation works offline. Set an AI key in `.env.local` to unlock AI features — 4 extra title options per beat, and AI-generated SEO upload templates (Settings → Templates). Provider is auto-selected: `GEMINI_API_KEY` (Google Gemini, has a free tier — checked first) or `ANTHROPIC_API_KEY` (Claude). Defaults to `gemini-2.5-flash` / `claude-haiku-4-5`; override with `GEMINI_MODEL` / `ANTHROPIC_MODEL`.

### Enabling YouTube upload

1. In [Google Cloud Console](https://console.cloud.google.com): create a project, enable **YouTube Data API v3**, configure the OAuth consent screen (scopes: `youtube.upload`, `youtube.readonly`), and create an **OAuth client ID** (web application) with authorized redirect URI `{APP_URL}/api/youtube/callback`.
2. Set `APP_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in `.env` and restart.
3. Connect your channel from the profile page.

Quota note: `videos.insert` costs ~1600 units of the default 10,000/day quota — roughly **6 uploads/day** per Google Cloud project until you request a quota increase. Unverified OAuth apps are limited to test users and show a warning screen; plan for Google's app verification before opening this to real users.

## Run it

```bash
npm install
npm run db:push      # creates prisma/dev.db (SQLite)
npm run dev          # → http://localhost:3000
```

## Stack

Next.js 15 (App Router, server actions) · TypeScript · Prisma with SQLite locally and Neon PostgreSQL in production · plain CSS (no Tailwind). Beat audio and thumbnails are stored on disk under `uploads/` and served via `/api/files/*`.

Production database setup, migration, and verification instructions are in
[`docs/postgres-cutover.md`](docs/postgres-cutover.md). Production uses a pooled
`DATABASE_URL` for application traffic and a direct `DIRECT_URL` for migrations;
neither credential belongs in git.

## Deployment

Production runs on **Azure Container Apps** (single replica), built from the
[`Dockerfile`](Dockerfile) as a Next.js standalone server.

- **Database** — Neon PostgreSQL (pooled `DATABASE_URL` for the app, direct `DIRECT_URL` for migrations)
- **File storage** — Azure Files share mounted at `/app/uploads` (audio, thumbnails, rendered MP4s persist across restarts)
- **Email** — Resend (`RESEND_API_KEY`); falls back to a console stub when unset
- **Registry / build** — Azure Container Registry; image built locally for `linux/amd64` and pushed (ACR Tasks is unavailable on credit subscriptions)
- **Ingress** — external HTTPS on the auto-provisioned `*.azurecontainerapps.io` FQDN; health probed at `/api/health`
- **Secrets** — held in the Container App secret store, never in git (a local `containerapp.filled.yaml` is gitignored)

Full runbook (exact `az` commands, cost budget, probe design, smoke-test checklist):
[`docs/azure-deployment.md`](docs/azure-deployment.md). The declarative app spec
is [`infra/azure/containerapp.yaml`](infra/azure/containerapp.yaml). The retired
Fly.io files (`fly.toml`, `docs/deploy-runbook.md`) are kept as a fallback.

## Roadmap (from the product report)

- Plan limits + Stripe billing for the Free/$9/$19/$29 tiers
- Google OAuth app verification + quota increase before public launch
- CTR/impressions via the YouTube Analytics API (needs an extra OAuth scope)
- Beat store click tracking (link redirect service)
