# TypeBeatOS

The YouTube growth system for type-beat producers.

> Upload a month of type beats in one sitting. TypeBeatOS handles the SEO, visuals, descriptions, tags, and schedule.

## What's built (Stages 2–5 of the roadmap)

- **Landing page** at `/` — the validation page, now driving signups
- **Auth** — email/password accounts with cookie sessions
- **Producer profile** — store links, license text, description footer, default posting schedule
- **Beat upload** — beat details + optional audio file
- **Upload package generation** — SEO title options (type-beat structures), description with your links, tags (capped at YouTube's 500-char limit), hashtags, pinned comment
- **Thumbnail builder** — canvas-based: gradient/image backgrounds, title text, producer name, parental advisory sticker; save or download as PNG
- **Upload calendar** — set posting days/time once, ⚡ auto-schedule spreads the queue across your next free slots
- **Export** — download a `.txt` upload pack + thumbnail PNG, with copy buttons for every field (paste into YouTube Studio)
- **Video generation (Stage 3)** — render YouTube-ready MP4s (1280×720 h264 + AAC) from the saved thumbnail + beat audio via bundled ffmpeg. Two styles: static image (fast) or waveform visualizer overlay. Renders run in a background queue with live status on the package page.
- **YouTube direct upload (Stage 4)** — connect a channel via Google OAuth (profile page), then upload any rendered package straight from the editor. Uploads go up private with `publishAt` set from the package schedule, including title/description/tags metadata (category: Music) and the custom thumbnail (best-effort). Status tracked per package with links to YouTube Studio when done. Verified end to end against the live API.
- **Analytics (Stage 5)** — views, likes, and comments per upload pulled from the YouTube Data API on demand (1 quota unit per 50 videos), plus aggregations: best performing artist keywords and best upload days. CTR/impressions need the YouTube Analytics API scope — future work.

### Optional AI enhancement

Template generation works offline. Set `ANTHROPIC_API_KEY` in `.env` to get 4 extra Claude-written title options per beat.

### Enabling YouTube upload

1. In [Google Cloud Console](https://console.cloud.google.com): create a project, enable **YouTube Data API v3**, configure the OAuth consent screen (scopes: `youtube.upload`, `youtube.readonly`), and create an **OAuth client ID** (web application) with authorized redirect URI `{APP_URL}/api/youtube/callback`.
2. Set `APP_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in `.env` and restart.
3. Connect your channel from the profile page.

Quota note: `videos.insert` costs ~1600 units of the default 10,000/day quota — roughly **6 uploads/day** per Google Cloud project until you request a quota increase. Unverified OAuth apps are limited to test users and show a warning screen; plan for Google's app verification before opening this to real users.

## Run it

```bash
npm install
npx prisma db push   # creates prisma/dev.db (SQLite)
npm run dev          # → http://localhost:3000
```

## Stack

Next.js 15 (App Router, server actions) · TypeScript · Prisma + SQLite · plain CSS (no Tailwind). Beat audio and thumbnails are stored on disk under `uploads/` and served via `/api/files/*`.

Swapping SQLite for Postgres later is a one-line change in `prisma/schema.prisma` plus a new `DATABASE_URL`.

## Roadmap (from the product report)

- Plan limits + Stripe billing for the Free/$9/$19/$29 tiers
- Google OAuth app verification + quota increase before public launch
- CTR/impressions via the YouTube Analytics API (needs an extra OAuth scope)
- Beat store click tracking (link redirect service)
