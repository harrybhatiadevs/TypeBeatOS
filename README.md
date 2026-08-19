# TypeBeatOS

TypeBeatOS is a full-stack publishing workspace for type-beat producers. It
turns beat audio and artwork into a complete YouTube upload package, schedules
the release, publishes it, and tracks performance.

## Current stage — production hardening and faster publishing

**Updated 4 August 2026.** The core producer journey (roadmap stages 2–5) is
live: package generation, video rendering, YouTube publishing, scheduling, and
analytics. The current work is post-MVP hardening and reducing the time from
files to a queued release.

The latest release adds:

- a Pro/Serious-only batch queue for **2–5 beats plus 2–5 artworks**;
- two concurrent browser uploads, automatic artwork pairing/cropping, shared
  metadata, automatic scheduling, static-artwork video rendering, optional
  YouTube upload, and a persisted progress screen;
- plan-aware batch paywalls and correct single-upload labels;
- mobile navigation that closes after route selection;
- a seven-day inactivity session window, renewed at most once per day while the
  producer remains active;
- simplified marketing CTAs (`Get Pro`, `Get Serious`); and
- removal of waveform rendering. All videos now use the producer's artwork as
  a clean static visual.

The next product priorities are Google OAuth verification/quota approval,
upload retry and reconnect UX, durable background jobs, and automated analytics
refreshes. See [the current workflow roadmap](docs/core-workflow-roadmap.md).

## Product capabilities

| Area | Current behaviour |
| --- | --- |
| Accounts | Better Auth email/password, verification, reset flow, seven-day renewable inactivity window |
| Plans | Stripe-backed Free, Pro, and Serious tiers with monthly package limits and feature gates |
| Single upload | Audio/details form, BPM/key analysis, metadata package, thumbnail, static video, schedule, YouTube upload |
| Batch upload | Pro/Serious users pair 2–5 audio files and images, apply shared settings, then queue the run |
| Metadata | Offline templates plus optional Gemini or Claude title/template enhancement |
| Thumbnails | Canvas editor with persisted editor state and source artwork |
| Video | 1280×720 H.264/AAC MP4 using static artwork; in-process render queue |
| Publishing | Google OAuth, YouTube Data API v3, custom thumbnail, privacy/audience settings, `publishAt` scheduling |
| Analytics | Manual refresh of views, likes, and comments plus artist/day summaries |
| Operations | CI tests/build/schema/audit gates; Azure Container Apps, Neon, Azure Files, Resend |

## Stack

| Layer | Technology |
| --- | --- |
| Web application | Next.js 15 App Router, React 19, TypeScript, server actions |
| UI | Plain CSS, Bebas Neue + Schibsted Grotesk, dark/light themes; no Tailwind |
| Authentication | Better Auth, HTTP-only `tbos_session` cookie, bcrypt credentials |
| Data | Prisma 6; SQLite locally, Neon PostgreSQL in production |
| Billing | Stripe Checkout, Billing Portal, webhooks, plan/quota enforcement |
| Media | `ffmpeg-static`, Canvas thumbnail generation, `music-tempo`, `fft.js` |
| Integrations | YouTube Data API v3, Google OAuth, Resend, optional Gemini/Anthropic |
| Tests and CI | Vitest, TypeScript, Prisma validation, Next.js build, `npm audit` in GitHub Actions |
| Production | Docker, Azure Container Registry, Azure Container Apps, Azure Files |

Production is intentionally pinned to one application replica because video
and YouTube jobs use in-process queues. Do not scale horizontally until durable
queues and shared object storage replace that assumption.

## Repository map

```text
app/                         Next.js routes, pages, API handlers, and UI
lib/                         auth, billing, generation, media, YouTube, queues
prisma/schema.prisma         SQLite development schema
prisma/schema.postgres.prisma PostgreSQL production schema
prisma/migrations/           reviewed production migrations
uploads/                     local media in development (gitignored)
infra/azure/                 Azure Container Apps declarative spec
docs/                        operational guides and implementation history
```

Any model change must be mirrored in both Prisma schemas and accompanied by a
reviewed PostgreSQL migration.

## Run locally

Requirements: Node.js 22 and npm.

```bash
npm install
cp .env.example .env
npm run db:generate:sqlite
npm run db:push
npm run dev
```

Open `http://localhost:3000`. The minimum local environment is:

```dotenv
DATABASE_URL="file:./dev.db"
APP_URL="http://localhost:3000"
BETTER_AUTH_SECRET="replace-with-at-least-32-random-characters"
```

Optional integrations are configured with `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `GEMINI_API_KEY`, and/or
`ANTHROPIC_API_KEY`. Never commit real credentials.

Useful local commands:

```bash
npm test
npx tsc --noEmit
npm run db:validate-postgres
npm audit --audit-level=high --omit=dev
npm run build
```

Do not run `npm run build` while `npm run dev` is using the same checkout; both
write `.next/`. Stop the development server first.

## Production architecture and release order

Production runs at `https://typebeatos.com` on Azure Container Apps:

- app: `ca-typebeatos` in resource group `rg-typebeatos-eastus`;
- current release: image `typebeatos:v48`, revision
  `ca-typebeatos--0000049`, deployed 16 August 2026;
- registry: `crtypebeatos5c46ce.azurecr.io`;
- database: Neon PostgreSQL (pooled runtime URL, direct migration URL);
- media: Azure Files mounted at `/app/uploads`;
- email: Resend; and
- health checks: `/api/ready` (platform probes, DB-free) and `/api/health`
  (DB-aware, for manual checks — do not poll it on a short interval).

Release order:

1. Run all checks and review migration SQL.
2. Merge the approved feature branch into `main` and push GitHub.
3. Apply pending Neon migrations with `npm run db:migrate:deploy`.
4. Build and push a new `linux/amd64` image tag.
5. Update the Container App to that immutable image.
6. Verify health, active revision/image, landing page, auth, uploads, batch gate,
   static rendering, and persisted media.

Exact commands and rollback steps are in
[docs/azure-deployment.md](docs/azure-deployment.md). Database safety rules are
in [docs/postgres-cutover.md](docs/postgres-cutover.md). The Fly.io runbook is a
retired fallback, not the current production path.

## Handoff rules for another agent

- Start with this README and `docs/core-workflow-roadmap.md`.
- Preserve unrelated changes and never stage local database/media files.
- Keep both Prisma schemas synchronized.
- Batch upload is paid-only (Pro and Serious); single upload remains available
  to Free users within quota.
- The single-upload button says `Upload`; the paid action says `Batch upload`.
- Do not restore waveform choices; static artwork is the only supported video
  format.
- Keep `BETTER_AUTH_SECRET` unchanged across releases or every user is logged
  out. Active sessions renew daily and expire after seven days without renewal.
- Keep Azure Container Apps at one replica until the render/upload queues become
  durable.
- Migrate Neon before deploying code that reads a new required table/column.
- Never commit `.env*`, filled Azure manifests, databases, uploads, or secrets.

## YouTube launch constraints

Google OAuth must be verified before arbitrary producer accounts can connect.
The default YouTube API quota only supports a small number of `videos.insert`
calls per day, so production growth also requires a quota increase. The exact
OAuth redirect is `{APP_URL}/api/youtube/callback`.
