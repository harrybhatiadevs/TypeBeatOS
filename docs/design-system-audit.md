# Design system audit — rolling out the waitlist look across the app

The waitlist page is the source of truth for the new visual identity:
pure black, glass nav pill, Bebas Neue display headlines, red `#ed072c`
accent, single-glyph numerals, `min-height: 100vh` sections that own a
screen.

Tokens + patterns live in [app/marketing.css](../app/marketing.css)
under the `tb-*` namespace. The brand mark is at
[public/logo.svg](../public/logo.svg).

## Status

### Phase 1 — Public surface (done)
- [x] `/waitlist` — the source of truth
- [x] `/` (landing) — same hero / sections / nav / footer
- [x] TB logo asset wired into both navs
- [x] Shared `marketing.css` (was `waitlist.css`); landing + waitlist
      import the same stylesheet

### Phase 2 — Auth surface (not yet)
- [ ] `app/login/page.tsx` — currently uses `.login-auth` / `.auth-card`
      classes from `globals.css`
- [ ] `app/signup/page.tsx` — currently uses `.signup-auth` classes from
      `globals.css`
- [ ] `app/waitlist/WaitlistForm.tsx` — already aligned, leave as-is

Plan: extract a small `<AuthShell>` that renders the same glass nav +
hero treatment with the form panel on the right. Re-use `.tb-form`,
`.tb-final-btn`, `.tb-eyebrow`. Drop `.signup-auth` / `.login-auth` from
globals once both pages have migrated.

### Phase 3 — Authenticated app (not yet)
The app pages live under `app/(app)/` and currently inherit `.app-page`
styles from `globals.css` — cards on a dark gradient, sticky non-glass
nav, large red accent on stat numerals. Pages:

- [ ] `app/(app)/layout.tsx` + `app/(app)/NavLinks.tsx` (the app nav)
- [ ] `app/(app)/dashboard/page.tsx`
- [ ] `app/(app)/onboarding/page.tsx`
- [ ] `app/(app)/beats/page.tsx` + `beats/new/page.tsx` + `beats/[id]/edit/page.tsx`
- [ ] `app/(app)/calendar/page.tsx`
- [ ] `app/(app)/analytics/page.tsx`
- [ ] `app/(app)/profile/page.tsx`
- [ ] `app/(app)/packages/[id]/page.tsx` and its four sub-components
      (PackageEditor, ThumbnailBuilder, VideoGenerator, YouTubeUploader)

The app pages are dense data UIs — they shouldn't get full `min-height:
100vh` per section (that's marketing only). The takeaways for the app
are:

1. **Nav** — replace the sticky `.nav` with the floating glass pill from
   the waitlist (no scroll-shrink, just a permanent compact pill).
2. **Page header** — eyebrow + Bebas Neue page title, same treatment as
   `.tb-h2`.
3. **Cards** — keep the rounded card pattern, but recolour the border,
   background, and hover state to match `.tb-feature` / `.tb-plan`.
4. **Buttons** — `.tb-final-btn` (primary) + `.tb-cta-ghost` (secondary).
   Same shapes as today, just different gradient and red.
5. **Inputs / forms** — the waitlist pill form is too marketing-y for a
   data form; keep the existing input/select/textarea look but recolour
   the focus ring to `#ed072c`.
6. **Stat tiles / tables / badges** — use Bebas Neue for the big numerals
   and the red `#ed072c` for accents; everything else can stay.

Bulk of the legwork is the dashboard + packages flow. Once those are
done, the rest of the app can copy the same patterns.

### Phase 4 — Cleanup (after Phase 3)
- [ ] Delete the legacy marketing / app block from `app/globals.css`
      (lines ~140–1300) — that whole stretch becomes dead code once every
      page has migrated.
- [ ] Replace the placeholder logo at `public/logo.svg` with an exported
      vector from the brand source if one exists. The current SVG is a
      recreation based on the supplied image.
- [ ] Consider promoting `WaitlistEffects.tsx` to a generic
      `<TbPageEffects />` and importing from both `/` and `/waitlist`.
      Today it's imported by relative path; that works but reads wrong.

## Design tokens

| Token | Value | Used by |
| --- | --- | --- |
| `--accent` (legacy) | `#e50914` | globals.css (`.app-page`, `.marketing-page`) |
| New accent | `#ed072c` | marketing.css (waitlist + landing) |
| Page background (waitlist/landing) | `#000` | marketing.css |
| Page background (app/globals) | `#050506` + radial reds | globals.css |
| Display font | `Bebas Neue` | both — already imported in `app/layout.tsx` |
| Body font | `Inter` | both |

Phase 4 collapses the duplicated tokens.
