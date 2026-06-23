# Core producer workflow — roadmap to "real-user testable"

The eight pieces below already exist as working scaffolding from earlier
sprints. This roadmap audits what's there, calls out the gaps that
block a real producer from completing the loop end-to-end, and
sequences the work to close them on the shortest path.

**Definition of done for "real-user testable":** a producer who isn't us
can sign up, connect their own YouTube channel, upload a real beat,
generate the SEO pack, render the video, schedule it, see it publish on
YouTube, and see analytics — without operator intervention. When
something fails, they get a clear actionable error.

## Where each piece stands today

| # | Piece | Current state | Files |
| --- | --- | --- | --- |
| 1 | Connect YouTube via Google OAuth | ✅ Works against a test-mode OAuth app | `app/api/youtube/connect/route.ts`, `app/api/youtube/callback/route.ts` |
| 2 | Store + refresh YouTube tokens | ✅ Tokens persisted on `YouTubeAccount`. `validAccessToken()` refreshes when <2 min from expiry | `lib/youtube.ts`, schema `YouTubeAccount` |
| 3 | Producer profile + channel settings | ✅ `Profile` model + `/profile` page (brand, store URLs, schedule defaults, license footer) | `app/(app)/profile/page.tsx`, `lib/actions/profile.ts` |
| 4 | Upload a beat | ✅ `/beats/new` accepts mp3/wav/m4a/ogg/flac/aiff up to 50MB, auto-detects BPM + key from audio | `app/(app)/beats/new/page.tsx`, `lib/actions/beats.ts`, `lib/audio-analysis.ts` |
| 5 | Generate upload package | ✅ AI-generated titles / description / tags / hashtags / pinned comment via Anthropic; thumbnail builder; preview MP4 render | `lib/actions/packages.ts`, `app/(app)/packages/[id]/PackageEditor.tsx` |
| 6 | Schedule / publish to YouTube | ✅ Resumable upload via `videos.insert`, supports `publishAt` for scheduled publish, defaults to private | `lib/youtube.ts uploadPackage()`, `Package.scheduledAt`, `YouTubeUploader.tsx` |
| 7 | Track upload status + failures | ✅ `Package.uploadStatus` (`none`/`uploading`/`uploaded`/`failed`) + `uploadError` text; `videoStatus` mirror for render | schema `Package`, `lib/youtube.ts`, `lib/video.ts` |
| 8 | DB models + UI screens | ✅ Beats, Packages, YouTubeAccount, Sessions all wired; dashboard / beats list / beats edit / packages / calendar / analytics / profile / onboarding all rendered on the `tb-*` design system | — |

So the workflow exists. What's missing is the **hardening** that turns
a happy-path demo into something a real producer can use without
hand-holding.

## Gap analysis — what blocks "real-user testable"

| Gap | Severity | Blocking? | Workstream |
| --- | --- | --- | --- |
| OAuth still in test mode — only allowlisted Google emails can connect | Critical | **Yes** | A1 — Google verification (calendar-wait, user side) |
| Refresh-token failure isn't surfaced — silent breakage if producer revokes in Google account settings | High | **Yes** | B1 — Token refresh hardening |
| No retry on YouTube 5xx / 429 — single transient failure marks the package failed | High | **Yes** | B2 — Upload retry with backoff |
| No notification when an upload fails — producer doesn't know until they look | High | **Yes** | B3 — Failure email |
| Failure UX is just an inline error string — no clear next step ("retry" / "reconnect" / "see logs") | Medium | Soft | B4 — Failure UX polish |
| Files live on local filesystem — multi-machine deploy will lose them | Medium | Not blocking for v1 (single Fly machine) | C1 — Object storage abstraction |
| In-process render queue — restarts drop in-flight renders | Medium | Not blocking for v1 | C2 — Durable queue |
| Stats refresh is manual click — producer gets stale numbers | Low | Soft | C3 — Stats cron |
| AI generation has no retry — Anthropic 5xx surfaces as "generation failed" | Low | Soft | C4 — AI retry + fallback |
| No integration tests for the upload pipeline | Medium | Not blocking but high-leverage | A2 — End-to-end smoke test |
| Producer education on YouTube prerequisites (phone-verified channel for custom thumbnails, monetization status) | Low | Soft | D1 — In-app guidance |

## Sequenced implementation plan

Phases are ordered shortest-path-first: every item in earlier phases is
strictly required to claim "real producer can complete the loop."
Later phases are quality-of-life and scale work.

### Phase A — Audit + smoke (1 commit, no code shipped from me)

**A1. Google OAuth verification submission** *(user action)*
- You: submit the existing OAuth client for verification with the
  scopes `youtube.upload` + `youtube.readonly`. SLA is 4–6 weeks.
  Until verified, only test-allowlisted Google accounts can connect.
- Once verified, real producer channels work; nothing on my side
  needs to change.

**A2. End-to-end smoke test** *(my work)*
- A vitest integration test that mocks the YouTube Data API + Anthropic
  + ffmpeg, exercises: signup → connect (mocked) → upload beat →
  generate package → render → schedule → upload → verify status. Lives
  in `lib/__tests__/workflow.test.ts`.
- Acceptance: one command (`npm test`) covers the happy path so we
  notice regressions before producers do.

### Phase B — Production readiness for the existing flow (4 commits)

**B1. Token refresh hardening** *(touches `lib/youtube.ts`, `lib/actions/youtube.ts`, `/profile`)*
- Detect Google's `invalid_grant` (revoked / expired refresh token).
  Delete the `YouTubeAccount` row + redirect the producer through a
  fresh `/api/youtube/connect` flow.
- Add a `reconnectRequired: boolean` derived state in the profile UI.
- Acceptance: revoke access from Google account settings → the next
  upload-attempt button shows "Reconnect required" with a button, not
  a cryptic 401.

**B2. Upload retry with exponential backoff** *(touches `lib/youtube.ts`)*
- Wrap the resumable upload init + chunked PUT in a retry helper:
  3 attempts, exponential backoff (1s / 4s / 16s), retry on 5xx and
  429, give up immediately on 4xx other than 429.
- Same for thumbnail upload (still best-effort, but stops blaming a
  blip for a permanent failure).
- Acceptance: simulate a 503 → upload eventually succeeds. Simulate a
  401 → fails fast with reconnect-required signal.

**B3. Failure email notifications** *(touches `lib/youtube.ts`, `lib/email-templates.ts`)*
- New `uploadFailedEmail` template (uses the existing email service —
  console stub in dev, Resend in prod once the key is set).
- Inside the catch block in `uploadPackage`, after the DB updates
  to `failed`, send the email to the producer with the package title,
  the error message (sanitised), and a deep link back into
  `/packages/[id]`.
- Same pattern for render failure in `lib/video.ts`.
- Acceptance: force an upload failure → email arrives in dev console
  with the right link and message.

**B4. Failure UX polish** *(touches `YouTubeUploader.tsx`, `VideoGenerator.tsx`)*
- Replace the bare `<div className="form-error">` with a card that
  shows the error, a "Retry" button, a "Disconnect + reconnect"
  link when `reconnectRequired`, and a "Copy error" button so the
  producer can paste it into a support reply.
- Acceptance: visual diff at 1440×900; producer can recover from a
  failure without leaving the package page.

### Phase C — Scale + reliability (3 commits, only when needed)

**C1. Object storage abstraction** *(touches `lib/storage.ts` (new), `lib/actions/beats.ts`, `lib/actions/packages.ts`, `lib/video.ts`, `lib/youtube.ts`)*
- `Storage` interface with two implementations: `LocalDiskStorage`
  (current behaviour, default in dev) and `S3Storage` (R2-compatible,
  active when `S3_ENDPOINT` env var is set).
- Audio files, thumbnails, rendered MP4s all go through it.
- Acceptance: dev behaviour identical; setting the env flips the prod
  binary to R2 with zero other code changes. Switch when multi-machine.

**C2. Durable render + upload queue** *(touches `lib/video.ts`, `lib/youtube.ts`, new `lib/queue.ts`)*
- BullMQ + Upstash Redis. Two named queues (`video-render`,
  `youtube-upload`). Workers can run in the same process today, get
  split into a separate Fly machine group later.
- Acceptance: restart the server mid-render → the job resumes (or
  fails over to retry) instead of being silently lost.

**C3. Scheduled stats refresh** *(touches new `app/api/cron/refresh-stats/route.ts`)*
- A cron-callable route (Fly cron or upstash cron-trigger) that hits
  YouTube Data API for every package with `uploadStatus = "uploaded"`
  and updates `viewCount` / `likeCount` / `commentCount` /
  `statsUpdatedAt`. Rate-limited internally so we don't burn the
  daily quota.
- Acceptance: cron fires daily; analytics page shows numbers from
  within the last 24h.

### Phase D — Quality of life (post-launch)

D1. Producer onboarding wizard improvements
D2. Quota dashboard
D3. AI generation retry + output validation
D4. Disconnect-from-Google deep link

## What I'm NOT planning here

- New core flows (live streaming, multi-channel uploads, collab uploads, etc.) — out of v1 scope.
- Billing — separate Sprint (Stripe). Not blocking the producer-loop test.
- Better-Auth follow-ups (OAuth sign-in, dropping `passwordHash`) — separate, not blocking.

## Recommended execution order

If you accept this plan, I propose shipping in this order on a fresh
branch `feat/workflow-hardening`:

1. **A2** (smoke test) — first, so we notice regressions in everything that follows
2. **B1** (token refresh) — biggest reliability win; producers revoke
3. **B2** (upload retry) — second biggest; turns transients into successes
4. **B3** (failure email) — closes the "ghosted producer" gap
5. **B4** (failure UX) — visible polish; cheap once B1–B3 land

Phase C waits until you ask for it (multi-instance scale) or until the
first user feedback says "the upload broke and I lost my work."

Total Phase A + B estimated effort: **5 commits, ~1 day of work.** Each
commit ships independently and can be reviewed in isolation.
