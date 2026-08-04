# Core producer workflow — current status and roadmap

**Updated 4 August 2026. This is the authoritative stage handoff.**

## Current stage

Roadmap stages 2–5 are implemented and in production. TypeBeatOS is now in
**post-MVP production hardening and publishing-speed optimisation**.

The newest feature is the paid batch workflow: Pro and Serious producers can
pair 2–5 audio files with 2–5 artworks, apply shared beat/publishing defaults,
upload two files at a time, reserve plan quota, schedule the next open slots,
render static-artwork videos, and optionally queue YouTube uploads. Progress is
persisted so the batch screen can reconcile after a process restart.

Waveform rendering has been removed. Static artwork is the sole supported video
visual. Free users keep single upload within the Free plan quota; every batch
entry point and the API enforce the paid plan gate.

## Implemented workflow

| Step | Status | Main implementation |
| --- | --- | --- |
| Account, verification, reset | Complete | Better Auth, Resend, seven-day renewable inactivity session |
| Billing and quotas | Complete | Stripe Checkout/Portal/webhooks; Free 3, Pro 60, Serious 150 packs/month |
| Producer settings/templates | Complete | Profile folded into Settings; timezone, schedule, store links, template limits |
| Single beat intake | Complete | Audio upload, metadata fields, optional BPM/key detection |
| Batch beat intake | Complete | Paid 2–5 item pairing, shared settings, concurrent upload, quota reservation |
| Package generation | Complete | Offline metadata plus optional Gemini/Claude enhancements |
| Thumbnail editor | Complete | Saved composite and persisted editor/source-image configuration |
| Video rendering | Complete | 1280×720 H.264/AAC static artwork, in-process serial queue |
| Calendar scheduling | Complete | Timezone-aware next-open-slot allocation |
| YouTube publishing | Complete | OAuth, resumable upload, metadata, audience/privacy, thumbnail, `publishAt` |
| Analytics | Complete, manual refresh | Views, likes, comments, artist/day aggregates |
| Production platform | Complete | Azure Container Apps, Neon, Azure Files, Resend, ACR |
| CI | Complete | Unit tests, Postgres schema validation, Next build, high+ production audit |

## Definition of launch-ready for unrestricted users

A producer can sign up, connect their own YouTube channel, upload one or several
beats, generate packages, render, schedule, publish, and see analytics without
operator intervention. Failures must be recoverable and external account limits
must not surprise the producer.

## Remaining work, in priority order

### P0 — external launch blockers

1. **Google OAuth verification.** The current Google app is test-mode limited;
   submit `youtube.upload` and `youtube.readonly` for verification.
2. **YouTube quota increase.** `videos.insert` is expensive and the default
   project quota only permits a small number of daily uploads. Batch upload makes
   this constraint more important.

These require Google-side approval, not an application code change.

### P1 — reliability hardening

1. Detect refresh-token `invalid_grant`, disconnect the stale channel record,
   and show an explicit reconnect action.
2. Retry YouTube 429 and 5xx responses with bounded exponential backoff; fail
   fast on other 4xx responses.
3. Send render/upload failure email notifications with a package deep link.
4. Add recovery cards with Retry, Reconnect, and Copy error actions.
5. Add an integration test covering mocked signup → channel connection → beat →
   render → schedule → upload → final status, including a batch variant.

### P2 — scale and durability

1. Replace local-path writes with a storage abstraction backed by Azure Blob or
   compatible object storage.
2. Move render and YouTube work from in-process Promise queues to a durable job
   system. Only then raise Azure Container Apps above one replica.
3. Add idempotent job keys and explicit retry/dead-letter state.

### P3 — product iteration

1. Schedule automatic analytics refreshes.
2. Add a quota dashboard that explains YouTube API limits separately from
   TypeBeatOS plan limits.
3. Measure batch completion time and failure rate; the target is five paired
   beats queued within five minutes on a typical connection, excluding the
   duration of background video rendering/YouTube processing.
4. Consider more connected channels only after durable jobs and storage land.

## Important constraints for the next agent

- Keep Azure Container Apps at exactly one replica while queues are in-process.
- Batch upload belongs to Pro and Serious only; enforce this in both UI and API.
- Do not reintroduce waveform video options.
- Keep both Prisma schemas identical at the model level and create a reviewed
  PostgreSQL migration for production changes.
- Apply migrations before deploying code that expects new required schema.
- Preserve `BETTER_AUTH_SECRET`; active sessions renew daily and expire after
  seven days without renewal.
- Do not run a Next production build in the same checkout as a running dev
  server because both write `.next/`.
- Never commit databases, uploads, secrets, or filled Azure manifests.

## Out of scope unless requested

Live streaming, collaboration workflows, a public beat marketplace, and
multi-replica processing are not part of the current release. Social Google
login is also separate from connecting a YouTube channel.
