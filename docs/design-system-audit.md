# Design system — rollout map

> **Current status — 4 August 2026:** Rollout is complete and the system now
> also covers billing, settings sidebars, mobile navigation, batch upload, and
> batch progress. The current product phase is production hardening; new work
> should reuse these established patterns.

The waitlist page was the source of truth for the new visual identity:
pure black, glass nav pill, Bebas Neue display headlines, red `#ed072c`
accent, single-glyph numerals, `min-height: 100vh` sections that own a
screen.

The rollout shipped across the UI/UX-Mockup-1 branch between 2026-06-19
and 2026-06-20. Every public, auth, and authenticated surface now reads
from one of two stylesheets:

- **`app/marketing.css`** — `tb-*` design system. Loaded by every page
  that doesn't sit under `(app)` — landing, waitlist, login, signup, 404,
  route-error.
- **`app/(app)/app-chrome.css`** — re-skins the existing app class
  vocabulary (`.app-page`, `.nav`, `.card`, `.btn`, `.stat`, `.table`,
  `.badge`, etc.) on top of the same tokens.

Brand mark lives at [`public/logo.jpg`](../public/logo.jpg) (the
recreated SVG placeholder was retired in commit `a01d4bc`).

## Status

| Phase | Scope | Commit | Status |
| --- | --- | --- | --- |
| 1 | Foundation + landing page (`/`, `/waitlist`) | `697060d` | ✅ Done |
| 2 | Auth (`/login`, `/signup`) | `2f7a1dd` | ✅ Done |
| 3 | App chrome (`(app)/*` re-skinned via `app-chrome.css`) | `9d3f0bf` | ✅ Done |
| 4 | Legacy CSS purge in `globals.css` (1578 → 51 lines) | `2f7a1dd` | ✅ Done |
| — | Brand mark + nav badge + footer mark + final-CTA watermark | `a01d4bc` | ✅ Done |
| — | Custom 404 + route-error pages | `f04429f` | ✅ Done |

## Coverage

Every route in the app now flows through the unified system:

**Public:** `/`, `/waitlist`
**Auth:** `/login`, `/signup`
**Authenticated:** `/dashboard`, `/onboarding`, `/beats`, `/beats/new`,
`/beats/batch`, `/beats/batch/[id]`,
`/beats/[id]/edit`, `/calendar`, `/analytics`, `/profile`,
`/settings`, `/billing`, `/packages/[id]` (+ PackageEditor,
ThumbnailBuilder, VideoGenerator, YouTubeUploader components)
**Errors:** 404 (`app/not-found.tsx`), route error (`app/error.tsx`)

## Follow-ups

- ✅ **Inline `style={{ color: "var(--text-dim)" }}` patches** — retired
  in commit `fc6a7ca`. New `.tb-muted` / `.tb-helper` / `.tb-accent` /
  `.tb-row-end` utilities in `app-chrome.css` cover the affected app
  pages. `globals.css` `:root` token block dropped to zero variables.
- ✅ **`WaitlistEffects.tsx` rename** — done in commit `fc6a7ca`. The
  file now lives at `app/TbPageEffects.tsx` and is imported by both
  `/` and `/waitlist` as `import TbPageEffects from "../TbPageEffects"`.
- ⏳ **Brand mark format** — the current `logo.jpg` is a 2048×2048
  raster. Swap for a true SVG export if one becomes available so the
  badge stays crisp at every density. No urgency — JPG looks fine at the
  badge size today.
- ✅ **Mobile navigation lifecycle** — selecting a destination closes the
  drawer before/while navigation completes, so it never remains over the next
  screen.
- ✅ **Paid batch affordance** — `Batch upload` is shown as a paid action and
  resolves to an upgrade screen for Free users; the single action is `Upload`.
