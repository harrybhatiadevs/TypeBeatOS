# Design system — rollout map

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
`/beats/[id]/edit`, `/calendar`, `/analytics`, `/profile`,
`/packages/[id]` (+ PackageEditor, ThumbnailBuilder, VideoGenerator,
YouTubeUploader components)
**Errors:** 404 (`app/not-found.tsx`), route error (`app/error.tsx`)

## Follow-ups

- **Inline `style={{ color: "var(--text-dim)" }}` patches** in a handful
  of app pages still read CSS variables from `globals.css`. Replace with
  classnames so the `:root` token block can shrink further. Low priority
  — works fine today.
- **Brand mark format** — the current `logo.jpg` is a 2048×2048 raster.
  Replace with a true SVG export if one becomes available so the badge
  stays crisp at every density.
- **`WaitlistEffects.tsx`** is imported by both `/` and `/waitlist` and
  the file name reads wrong from outside the waitlist folder. Either
  promote it to `app/TbPageEffects.tsx` or stop importing it from `/`.
