# TypeBeatOS

**A full-stack publishing operating system for type-beat producers.**

[![Live beta](https://img.shields.io/badge/live_beta-typebeatos.vercel.app-6C5CE7?style=for-the-badge)](https://typebeatos.vercel.app)
[![CI](https://github.com/harrybhatiadevs/TypeBeatOS/actions/workflows/ci.yml/badge.svg)](https://github.com/harrybhatiadevs/TypeBeatOS/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

TypeBeatOS turns a beat and its artwork into a ready-to-publish YouTube package. Producers can generate search-friendly metadata, build thumbnails, render videos, organise a release calendar, publish through the YouTube API, and review performance without stitching together several separate tools.

> Upload a month of beats in one sitting. TypeBeatOS handles the repetitive publishing work.

## Product overview

The product is designed around one end-to-end workflow:

```text
Beat + artwork
      ↓
Audio analysis (BPM and key)
      ↓
SEO metadata + thumbnail
      ↓
MP4 rendering queue
      ↓
Release calendar
      ↓
YouTube upload + analytics
```

### Core capabilities

| Area | What it does |
| --- | --- |
| Producer workspace | Stores brand details, beat-store links, licence copy, description footers, and default publishing schedules |
| Audio intelligence | Detects BPM and musical key from uploaded audio using onset analysis, FFT processing, and chromagram matching |
| Upload packages | Generates titles, descriptions, tags, hashtags, and pinned comments while respecting YouTube metadata limits |
| Thumbnail studio | Builds downloadable thumbnails from images or gradients with editable text, producer branding, and overlays |
| Video rendering | Produces 1280×720 H.264/AAC videos with static or waveform visual styles through a background FFmpeg queue |
| Scheduling | Distributes queued releases across the producer's next available posting slots in their own timezone |
| YouTube integration | Connects a channel with OAuth, uploads videos privately, applies metadata and thumbnails, and schedules publication |
| Analytics | Pulls views, likes, and comments and highlights the strongest artist keywords and upload days |
| SaaS foundation | Includes onboarding, verified email flows, password recovery, Stripe subscriptions, plan quotas, and paywalls |

## Engineering highlights

- Built a production-oriented Next.js application with server actions, typed domain logic, and persistent background-job state.
- Implemented audio feature extraction and media rendering locally with FFmpeg, FFT processing, tempo analysis, and key estimation.
- Designed around YouTube API constraints, including OAuth token handling, scheduled publishing, metadata limits, thumbnail upload, and quota-aware analytics refreshes.
- Maintained separate Prisma schemas for SQLite development and Neon PostgreSQL production, with CI validation to catch database drift.
- Deployed a containerised standalone Next.js server to Azure Container Apps with Azure Files for persistent media storage.
- Added CI gates for unit tests, production builds, PostgreSQL schema validation, and high-severity production dependency audits.
- Kept AI enhancement optional: deterministic templates work without an API key, while Claude can provide additional title variants when configured.

## Architecture

| Layer | Technology |
| --- | --- |
| Application | Next.js 15 App Router, React 19, TypeScript, server actions |
| Authentication | Better Auth, bcrypt, email verification, password reset |
| Data | Prisma; SQLite locally and Neon PostgreSQL in production |
| Media | FFmpeg, `fft.js`, `music-tempo`, Canvas-based thumbnail generation |
| Integrations | YouTube Data API v3, Google OAuth, Stripe, Resend, optional Anthropic API |
| Testing and delivery | Vitest, GitHub Actions, Docker, Azure Container Registry, Azure Container Apps |
| Production storage | Azure Files mounted at `/app/uploads` |

Production application traffic uses a pooled `DATABASE_URL`; Prisma migrations use a direct `DIRECT_URL`. Media files are served through authenticated application routes and persisted outside the container filesystem.

## Run locally

### Prerequisites

- Node.js 22
- npm
- FFmpeg support for video rendering (the app includes `ffmpeg-static`)

### Setup

```bash
git clone https://github.com/harrybhatiadevs/TypeBeatOS.git
cd TypeBeatOS
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The default local configuration uses SQLite, so the core product can run without provisioning cloud infrastructure.

### Environment

Required locally:

```dotenv
DATABASE_URL="file:./dev.db"
APP_URL="http://localhost:3000"
BETTER_AUTH_SECRET="replace-with-at-least-32-random-characters"
```

Optional integrations:

```dotenv
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
RESEND_API_KEY=""
EMAIL_FROM="TypeBeatOS <no-reply@example.com>"
ANTHROPIC_API_KEY=""
```

Never commit real credentials. Production secrets belong in the deployment platform's secret store.

## Quality checks

```bash
npm test                         # run the Vitest suite
npm run db:validate-postgres     # validate the production Prisma schema
npm run build                    # compile a production Next.js build
npm audit --audit-level=high --omit=dev
```

GitHub Actions runs these checks for pushes and pull requests.

## YouTube integration

To enable direct publishing:

1. Create a Google Cloud project and enable **YouTube Data API v3**.
2. Configure OAuth consent for `youtube.upload` and `youtube.readonly`.
3. Create a web OAuth client with `{APP_URL}/api/youtube/callback` as an authorised redirect URI.
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to the environment.
5. Connect a channel from the TypeBeatOS profile screen.

Uploads are created as private videos, then scheduled with `publishAt`. TypeBeatOS applies the title, description, tags, music category, and custom thumbnail and tracks the result against the originating package.

Google's default API quota permits only a small number of daily uploads because `videos.insert` is expensive. A public launch therefore requires OAuth verification and an approved quota increase.

## Deployment

The production design uses:

- **Azure Container Apps** for the standalone Next.js server
- **Azure Container Registry** for container images
- **Neon PostgreSQL** for application data
- **Azure Files** for uploaded audio, artwork, and rendered video
- **Resend** for transactional email
- **HTTPS ingress** with health checks at `/api/health`

Detailed operational notes live in [`docs/azure-deployment.md`](docs/azure-deployment.md), the database cutover guide is in [`docs/postgres-cutover.md`](docs/postgres-cutover.md), and the declarative Container App specification is in [`infra/azure/containerapp.yaml`](infra/azure/containerapp.yaml).

## Current status

TypeBeatOS is in beta. The core workflow—from account setup and beat analysis through package creation, video rendering, scheduling, direct upload, analytics, and subscription enforcement—is implemented. The next product milestones are:

- Google OAuth app verification and a YouTube quota increase
- YouTube Analytics API support for impressions and click-through rate
- Beat-store click tracking and attribution
- Production hardening for higher rendering concurrency

## What this project demonstrates

TypeBeatOS is my most complete product build: it combines product discovery, UX, authentication, billing, media processing, third-party APIs, background work, relational data modelling, cloud deployment, and operational documentation in one system.
