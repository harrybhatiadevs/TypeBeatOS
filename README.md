# TypeBeatOS

The YouTube growth system for type-beat producers.

> Upload a month of type beats in one sitting. TypeBeatOS handles the SEO, visuals, descriptions, tags, and schedule.

## What's built (Stages 2–3 of the roadmap)

- **Landing page** at `/` — the validation page, now driving signups
- **Auth** — email/password accounts with cookie sessions
- **Producer profile** — store links, license text, description footer, default posting schedule
- **Beat upload** — beat details + optional audio file
- **Upload package generation** — SEO title options (type-beat structures), description with your links, tags (capped at YouTube's 500-char limit), hashtags, pinned comment
- **Thumbnail builder** — canvas-based: gradient/image backgrounds, title text, producer name, parental advisory sticker; save or download as PNG
- **Upload calendar** — set posting days/time once, ⚡ auto-schedule spreads the queue across your next free slots
- **Export** — download a `.txt` upload pack + thumbnail PNG, with copy buttons for every field (paste into YouTube Studio)
- **Video generation (Stage 3)** — render YouTube-ready MP4s (1280×720 h264 + AAC) from the saved thumbnail + beat audio via bundled ffmpeg. Two styles: static image (fast) or waveform visualizer overlay. Renders run in a background queue with live status on the package page.

### Optional AI enhancement

Template generation works offline. Set `ANTHROPIC_API_KEY` in `.env` to get 4 extra Claude-written title options per beat.

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

- **Stage 4** — YouTube OAuth + direct scheduled upload via `videos.insert` (verify upload quota in Google Cloud first)
- **Stage 5** — analytics: views, CTR, keyword performance
- Plan limits + Stripe billing for the Free/$9/$19/$29 tiers
