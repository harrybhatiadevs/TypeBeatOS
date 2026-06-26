# TypeBeatOS Frontend Experience Redesign Plan

This document is the strict execution plan for improving the TypeBeatOS frontend on the
`ui-scaling-fix` branch. Agents working on this effort must treat this as the source of
truth unless the user explicitly supersedes it.

The objective is not cosmetic cleanup. The objective is to make TypeBeatOS feel like a
sharp, handcrafted, professional product across desktop and mobile: minimal without
feeling empty, informative without being verbose, and premium without sacrificing speed
or usability.

## 0. Agent Operating Contract

### 0.1 Branch and Worktree Rules

Agents MUST:

1. Work only on `ui-scaling-fix` for this effort.
2. Run this before any edits:

   ```bash
   git status --short --branch
   ```

3. Confirm the output starts with:

   ```text
   ## ui-scaling-fix...origin/ui-scaling-fix
   ```

4. Inspect pre-existing dirty files before editing them.
5. Preserve all user or pre-existing changes unless explicitly asked to revert them.
6. Keep PRs scoped to the phase being implemented.
7. Avoid broad rewrites that mix visual system changes with unrelated backend or data
   behavior.

Agents MUST NOT:

1. Work on `main` for this initiative.
2. Revert unrelated worktree changes.
3. Use destructive git commands such as `git reset --hard` or `git checkout --` unless
   the user explicitly requests them.
4. Introduce new major UI libraries without a clear phase-level reason.
5. Use screenshots or generated artifacts as committed source files unless explicitly
   requested.

### 0.2 Required Preflight

Before making implementation changes, agents MUST run:

```bash
git status --short --branch
find app -maxdepth 4 -type f \( -name '*.tsx' -o -name '*.css' \) | sort
rg -n "style=\{\{|Auto-schedule|Download|Upload to YouTube|Generate video|Copied|Saved" app || true
```

Also run a targeted phrase scan when working on copy-heavy or button-heavy changes:

```bash
rg -n "style=\{\{|Auto-schedule|Download|Upload to YouTube|Generate video|Copied|Saved" app || true
```

Agents MUST record the main files touched in their final response.

### 0.3 Definition of Done for Every Phase

Every implementation phase MUST satisfy all of the following:

1. `npm run build` succeeds, or the agent clearly reports why it could not be run.
2. `npm test` succeeds, or the agent clearly reports why it could not be run.
3. Desktop and mobile visual checks are performed for every affected route.
4. Keyboard focus remains visible and logical.
5. No new horizontal overflow is introduced at 390px viewport width.
6. No new inline styles are introduced in React page/component files.
7. No new emoji or decorative symbols are introduced inside product buttons.
8. The final response lists changed files and verification results.

For visual checks, agents SHOULD use a local dev server and browser automation when
possible. Minimum target widths:

```text
Desktop: 1440 x 1000
Tablet:  820 x 1180
Mobile:  390 x 844
Small:   360 x 740
```

## 1. Current Frontend Surface Map

### 1.1 Public and Marketing

Primary files:

```text
app/page.tsx
app/waitlist/page.tsx
app/waitlist/WaitlistForm.tsx
app/marketing.css
app/TbPageEffects.tsx
```

Current issues:

1. Marketing sections are oversized and theatrical.
2. The landing hero has weak mobile hierarchy and too much empty black space.
3. Claims and features are text-heavy.
4. Red, glow, grain, motion, all-caps headings, and display typography compete in the
   same viewport.
5. The page describes the product more than it demonstrates the workflow.

### 1.2 Auth and Account Entry

Primary files:

```text
app/login/page.tsx
app/signup/page.tsx
app/forgot/page.tsx
app/reset/page.tsx
app/verify/page.tsx
app/marketing.css
```

Current issues:

1. Auth pages inherit too much marketing drama.
2. Eyebrow pills and pulsing dots do not add trust or speed.
3. Forms are visually clean but not yet calm, secure, and mature.
4. Inline styling appears in several auth/error/legal surfaces.

### 1.3 Authenticated App Shell

Primary files:

```text
app/(app)/layout.tsx
app/(app)/NavLinks.tsx
app/(app)/VerifyEmailBanner.tsx
app/(app)/app-chrome.css
```

Current issues:

1. The app shell is a marketing-style floating pill, not a production workspace.
2. Mobile nav hides core routes instead of replacing them with a mobile-native model.
3. Logout occupies valuable top-level space.
4. The `+ New beat` button uses text-symbol composition instead of an icon/button system.
5. App chrome relies too heavily on red, glow, glass, pill shapes, and display type.

### 1.4 Core Product Routes

Primary files:

```text
app/(app)/dashboard/page.tsx
app/(app)/beats/page.tsx
app/(app)/beats/new/page.tsx
app/(app)/beats/[id]/edit/page.tsx
app/(app)/packages/[id]/page.tsx
app/(app)/packages/[id]/PackageEditor.tsx
app/(app)/packages/[id]/ThumbnailBuilder.tsx
app/(app)/packages/[id]/VideoGenerator.tsx
app/(app)/packages/[id]/YouTubeUploader.tsx
app/(app)/calendar/page.tsx
app/(app)/analytics/page.tsx
app/(app)/profile/page.tsx
app/(app)/onboarding/page.tsx
```

Current issues:

1. The app is structured around data fields and tables rather than user workflow.
2. Many screens have the same hierarchy grammar: eyebrow, poster title, subtitle, cards.
3. The package editor exposes the entire machine at once.
4. The thumbnail builder exposes low-level controls before outcomes.
5. Mobile screens are mostly stacked desktop layouts.
6. The dashboard, calendar, and analytics present data but not enough interpretation.

### 1.5 Legal and Error Surfaces

Primary files:

```text
app/legal/LegalShell.tsx
app/legal/legal.css
app/privacy/page.tsx
app/terms/page.tsx
app/not-found.tsx
app/error.tsx
```

Current issues:

1. Legal readability should be calm and content-first.
2. Error pages use marketing styling and inline styles.
3. Legal and error pages should remain polished but must not block core product work.

## 2. Product Experience Principles

Agents MUST apply these principles to every frontend decision.

### 2.1 Product First, Brand Second

TypeBeatOS is a tool for producers to prepare and publish uploads. The signed-in app
must feel like a precise production environment. Brand expression may frame the
experience, but it must not dominate operational screens.

Implementation consequences:

1. Keep the black/red identity.
2. Reduce glow, pulse, shine, and oversized display type inside authenticated screens.
3. Use red primarily for brand and primary actions.
4. Use semantic colors for status.
5. Avoid decorative motion in dense workflow areas.

### 2.2 One Screen, One Job

Every route MUST have one primary user job:

```text
/dashboard       Decide what to do next.
/beats           Find or manage a beat.
/beats/new       Add the minimum viable beat.
/packages/[id]   Prepare one package for publishing.
/calendar        Place packages into time.
/analytics       Decide what to make or publish next.
/profile         Set defaults once.
/onboarding      Complete first-run setup.
```

If a proposed UI element does not support the screen job, agents MUST remove it,
collapse it, or move it to a secondary surface.

### 2.3 Replace Explanation With Affordance

Agents MUST NOT use paragraphs to explain controls when the interface can show state.

Bad:

```text
BPM - auto-detected from audio if left blank
```

Good:

```text
Label: BPM
Placeholder: Auto
State after detection: Detected - 142 BPM
```

### 2.4 Progressive Disclosure

Primary actions and essential information MUST appear first. Advanced options MUST be
collapsed, placed in an inspector, or moved to a secondary panel.

Examples:

1. `New beat` starts with audio, beat name, and target artist.
2. Genre, mood, BPM, key, store link, and prices are advanced details.
3. Thumbnail controls start with presets, not font/color/size controls.
4. Package editor starts with readiness and active section, not every field expanded.

### 2.5 Desktop Is a Workbench, Mobile Is a Cockpit

Desktop MUST optimize for throughput, scanning, and multi-panel review.

Mobile MUST optimize for short sessions, quick decisions, and single-task flow.

Agents MUST NOT treat mobile as only stacked desktop.

## 3. Technical Design System Target

### 3.1 Token Architecture

Create or evolve a semantic token layer. Tokens MAY live in `app/globals.css` if shared
between public and app surfaces, or in scoped CSS files if the app remains split.

Required token groups:

```css
:root {
  /* Color */
  --tb-color-bg: #000000;
  --tb-color-surface-1: ...;
  --tb-color-surface-2: ...;
  --tb-color-border-subtle: ...;
  --tb-color-text: ...;
  --tb-color-text-muted: ...;
  --tb-color-brand: ...;
  --tb-color-brand-strong: ...;
  --tb-color-success: ...;
  --tb-color-warning: ...;
  --tb-color-info: ...;
  --tb-color-danger: ...;

  /* Typography */
  --tb-font-product: "Inter", system-ui, sans-serif;
  --tb-font-display: "Bebas Neue", Impact, sans-serif;
  --tb-text-xs: ...;
  --tb-text-sm: ...;
  --tb-text-md: ...;
  --tb-text-lg: ...;
  --tb-text-xl: ...;

  /* Spacing */
  --tb-space-1: ...;
  --tb-space-2: ...;
  --tb-space-3: ...;
  --tb-space-4: ...;
  --tb-space-5: ...;
  --tb-space-6: ...;

  /* Radius */
  --tb-radius-sm: 6px;
  --tb-radius-md: 8px;
  --tb-radius-lg: 12px;
  --tb-radius-pill: 9999px;

  /* Motion */
  --tb-motion-fast: 120ms;
  --tb-motion-base: 180ms;
  --tb-motion-slow: 260ms;
  --tb-ease-standard: cubic-bezier(0.2, 0.7, 0.2, 1);

  /* Layout */
  --tb-shell-nav-h: ...;
  --tb-mobile-bottom-nav-h: ...;
}
```

Rules:

1. Component CSS MUST use semantic tokens where practical.
2. Hard-coded red values MUST be reduced and centralized.
3. New colors MUST be named semantically, not by visual description.
4. App card radius SHOULD be 8px unless a specific surface needs larger treatment.
5. Page sections MUST NOT be styled as nested cards.

### 3.2 Typography Rules

Agents MUST:

1. Reserve `Bebas Neue` for logo, marketing hero, and rare brand moments.
2. Use `Inter` for authenticated app titles, dense product UI, tables, and forms.
3. Avoid viewport-width font sizing for compact product components.
4. Use zero or positive letter spacing only.
5. Reduce all-caps usage in signed-in screens.
6. Use text hierarchy through size, weight, opacity, layout, and proximity.

Authenticated app target:

```text
Page title: Inter, 24-36px, 650-750 weight, normal case where appropriate.
Section title: Inter, 13-15px, 650-750 weight.
Card title: Inter, 13-14px, 650-750 weight, not wide-tracked all caps.
Body: Inter, 14-16px.
Helper: Inter, 12-14px, muted.
```

Marketing target:

```text
Hero display may use Bebas Neue.
Subcopy must be readable and limited.
Body sections should use Inter-led editorial rhythm.
```

### 3.3 Component and Class Contracts

Agents SHOULD introduce reusable primitives incrementally. Avoid a giant abstraction pass
that delays visible improvements.

Required primitives or class patterns:

```text
PageHeader
SectionHeader
Button
IconButton
Card
Panel
StatusBadge
MetricTile
EmptyState
Field
FormGroup
ActionBar
BottomNav
MobileListItem
ReadinessItem
PreviewPanel
```

If implemented as React components, keep them local and simple. If implemented as CSS
classes first, ensure naming is semantic and reusable.

Required behavior:

1. `Button` supports `primary`, `secondary`, `ghost`, `danger`, and `quiet`.
2. `StatusBadge` supports `draft`, `ready`, `scheduled`, `uploaded`, `error`, and
   `processing`.
3. `EmptyState` includes title, optional one-line body, and one primary action.
4. `ActionBar` supports sticky mobile actions.
5. `BottomNav` is visible on mobile authenticated routes.
6. `Card` is for repeated items, panels, and modal-like surfaces, not every page section.

### 3.4 Icon Rules

Agents MUST:

1. Remove emoji and decorative symbols from product button labels.
2. Prefer a proper icon library for buttons where an icon is useful.
3. If adding icons, use `lucide-react` unless the project adopts another explicit icon
   system.
4. Keep accessible text labels for icon-only buttons.
5. Use tooltips for unfamiliar icon-only controls on desktop.

Bad:

```tsx
<button>[symbol] Auto-schedule the queue</button>
<button>[symbol] Download PNG</button>
<button>[symbol] Upload to YouTube</button>
```

Good:

```tsx
<Button icon={<CalendarClock />} label="Auto-schedule" />
<Button icon={<Download />} label="Download PNG" />
<Button icon={<Upload />} label="Upload to YouTube" />
```

### 3.5 Copy Contract

Agents MUST rewrite interface copy according to these rules:

1. One primary idea per screen.
2. One primary action per screen.
3. No more than one short explanatory paragraph above the primary action.
4. Button labels SHOULD be 1-3 words.
5. Labels SHOULD be nouns, not instructions.
6. Helper text SHOULD be state-specific and one line.
7. Avoid "AI", "generated", "full YouTube upload package", and similar mechanical
   phrasing in end-user surfaces unless required for transparency or legal reasons.
8. Avoid jokey, generic, or overly familiar greetings.
9. Prefer producer-native terms: beat, pack, queue, schedule, publish, thumbnail, title,
   tags, description, channel.
10. Empty states MUST lead to a direct action.
11. Error states MUST explain what happened and what to do next.
12. Developer setup details MUST NOT appear in normal user surfaces.

Examples:

```text
Bad: Fill in the beat details - TypeBeatOS generates the full YouTube upload package from them.
Good: Add the beat. Review the pack next.

Bad: No upload packages yet. Add your first beat and TypeBeatOS will generate the full YouTube package.
Good: Start with a beat.

Bad: Direct upload needs Google API credentials...
Good: YouTube upload is not available in this environment.
```

### 3.6 Inline Style Rules

Agents MUST remove inline layout and styling from core UI over time.

Allowed exceptions:

1. Dynamic canvas/image values where CSS variables are not practical.
2. Framework-required metadata image generation in `app/opengraph-image.tsx`.
3. Temporary style values only if removed before phase completion.

Disallowed in page/component UI:

```tsx
style={{ marginTop: 14 }}
style={{ display: "flex", gap: 10 }}
style={{ fontWeight: 600 }}
style={{ color: "#..." }}
```

Replacement:

```tsx
className="stack stack-sm"
className="toolbar"
className="text-strong"
className="status-success"
```

## 4. Mobile and Desktop Contracts

### 4.1 Desktop Contract

Authenticated desktop screens MUST support:

1. Persistent access to Dashboard, Beats, Calendar, Analytics, Profile.
2. Clear primary creation action: `New beat`.
3. Calm navigation without excessive glow or large pills.
4. Workbench layouts where useful, especially package editor and analytics.
5. Tables where dense comparison matters.
6. Sticky or persistent next action only where it improves workflow.
7. Keyboard-visible focus.
8. No content hidden behind fixed nav.

### 4.2 Mobile Contract

Authenticated mobile screens MUST support:

1. Bottom navigation for core routes.
2. Top context bar with current screen or object name.
3. Sticky bottom action for the current primary action where appropriate.
4. Mobile card/list alternatives for tables.
5. Collapsed advanced sections by default.
6. Bottom sheets or accordions for secondary controls.
7. Minimum 24px pointer targets, with practical target sizes closer to 40-44px for
   frequent actions.
8. No horizontal overflow at 390px or 360px.
9. No hidden core navigation.

### 4.3 Table-to-Mobile List Rules

Any route with `.table` MUST provide a mobile alternative if the table is part of the
core workflow.

Desktop:

```text
Title | Artist | Status | Scheduled | Action
```

Mobile:

```text
Late Night
Drake type beat
Ready - Fri 6:00 PM
[Review]
```

Agents MUST NOT rely only on horizontal table scrolling for:

```text
Dashboard recent packages
Beats list
Calendar queue/upcoming
Analytics summary
```

Horizontal table scrolling is acceptable only for secondary deep-detail tables.

## 5. Core Product Redesign Specifications

### 5.1 App Shell

Target behavior:

Desktop:

```text
Brand / nav routes / primary action / account menu
```

Mobile:

```text
Top: brand or current context + primary object/action
Bottom: Dashboard, Beats, Calendar, Analytics, Profile
```

Required changes:

1. Remove top-level mobile logout.
2. Move logout into Profile or account menu.
3. Replace hidden mobile nav links with bottom nav.
4. Keep `New beat` reachable on mobile.
5. Ensure the email verification banner does not collide with fixed nav.
6. Use active states that do not rely only on red.

Acceptance criteria:

1. At 390px, all authenticated routes expose core nav.
2. At 390px, no nav text overlaps or overflows.
3. The active route is clear.
4. Keyboard focus is visible on nav items.

### 5.2 Landing Page

Target behavior:

1. Hero communicates the product in one strong first viewport.
2. Mobile hero does not create a long black void.
3. Supporting sections demonstrate workflow, not just claims.
4. Feature copy is reduced and specific.
5. Red accents are limited per viewport.

Required changes:

1. Redesign hero mobile line breaks.
2. Add or simulate product/workflow preview.
3. Reduce reliance on full-height sections after the hero.
4. Replace problem chips with before/after or workflow visualization.
5. Remove unsupported broad metrics unless product evidence exists.
6. Keep final CTA but reduce repeated CTA pressure.

Acceptance criteria:

1. Mobile first viewport shows brand, headline, clear CTA, and enough context.
2. Desktop first viewport does not feel empty or unfinished.
3. Section count and copy density are reduced.
4. No text overlaps at 390px.

### 5.3 Auth Pages

Target behavior:

1. Calm, secure, direct.
2. No pulsing dots in form cards.
3. Minimal copy.
4. Clear alternate path.

Required changes:

1. Remove or calm auth eyebrow treatment.
2. Use product typography instead of hero typography where appropriate.
3. Remove inline styles.
4. Standardize auth message/error/success components.
5. Preserve accessible labels and autocomplete attributes.

Acceptance criteria:

1. Login and signup look mature on desktop and mobile.
2. Form actions are obvious.
3. Error/success states are consistent.
4. No local hydration mismatch caused by app code.

### 5.4 Dashboard

Target behavior:

Dashboard answers: "What should I do next?"

Required modules:

1. Next action.
2. Setup/readiness strip if incomplete.
3. Weekly or queue summary.
4. Recent packages as actionable rows/cards.

Required changes:

1. Replace generic greeting with task-oriented header.
2. Collapse setup checklist into compact readiness module.
3. Avoid equal-weight stat cards if they do not guide action.
4. Add mobile package cards.
5. Rewrite empty state to start with `New beat`.

Acceptance criteria:

1. User can identify next action within 3 seconds.
2. Empty account state has one primary action.
3. Mobile dashboard does not use horizontal table scrolling for primary content.

### 5.5 New Beat Flow

Target behavior:

New beat asks for the minimum viable input first.

Default fields:

```text
Audio file
Beat name
Target artist
```

Advanced fields:

```text
Secondary artist
Genre
Mood
BPM
Key
Store link override
Lease price
Exclusive price
```

Required changes:

1. Create premium audio dropzone.
2. Collapse advanced details.
3. Move auto-detect language into placeholders or detection states.
4. Add sticky mobile action bar.
5. Rewrite submit action as `Generate pack` or similar.
6. Preserve validation and server action behavior.

Acceptance criteria:

1. Required inputs are visible without scanning a long form.
2. Advanced fields are reachable but visually secondary.
3. Mobile flow can be completed comfortably with one thumb.
4. Form submission behavior remains unchanged.

### 5.6 Package Editor

Target behavior:

Package editor becomes the central quality-control workflow.

Required model:

```text
Package readiness
Title        Ready | Needs review | Edited
Description Ready | Needs review | Edited
Tags         Ready | Over limit | Needs review
Thumbnail   Missing | Ready
Video        Missing audio | Ready | Rendering | Done | Error
Schedule     Not set | Scheduled
YouTube      Not connected | Ready | Uploaded | Error
```

Desktop layout:

```text
Header: package name, artist, readiness, primary action
Left: readiness rail
Center: active editor section
Right: preview and publish actions
```

Mobile layout:

```text
Header: package name, readiness
Body: one active section
Bottom: sticky action bar
Secondary: bottom sheets/accordions
```

Required changes:

1. Add readiness computation.
2. Make one section active at a time.
3. Collapse completed sections into compact rows.
4. Replace repeated visible copy buttons with section-level and package-level actions.
5. Add package-level export/copy.
6. Clarify save behavior: autosave or persistent save status.
7. Keep thumbnail, video, and YouTube states visible through readiness.
8. Remove low-value helper paragraphs.

Acceptance criteria:

1. User can see what blocks publishing.
2. User can move section by section.
3. Desktop is efficient for review.
4. Mobile is not a long two-column collapse.
5. Existing package update, video generation, thumbnail save, and YouTube upload actions
   remain functional.

### 5.7 Thumbnail Builder

Target behavior:

Thumbnail builder starts with outcome selection, not raw controls.

Default view:

```text
Choose a look
Clean dark
Red accent
Minimal label
No text
```

Advanced view:

```text
Text
Typography
Color
Image
Layout
```

Required changes:

1. Add preset layer.
2. Keep canvas preview first.
3. Move font/color/size controls into advanced inspector.
4. Add brand defaults where available.
5. Preserve save and download behavior.
6. Ensure canvas remains responsive and non-distorted.

Acceptance criteria:

1. First-time user can create a reasonable thumbnail without touching advanced controls.
2. Advanced controls remain available.
3. Mobile controls do not overwhelm the screen.

### 5.8 Calendar

Target behavior:

Calendar shows rhythm and capacity, not just a list.

Required changes:

1. Keep queue visible.
2. Add visual weekly rhythm.
3. Make auto-schedule primary when queue exists.
4. Use mobile day cards.
5. Avoid long explanatory page subtitle.

Acceptance criteria:

1. User can understand what is scheduled this week.
2. User can schedule queue items quickly.
3. Mobile calendar is list/card-first.

### 5.9 Analytics

Target behavior:

Analytics answers: "What should I make or publish next?"

Required changes:

1. Add insight cards before raw tables.
2. Keep tables as details.
3. Remove roadmap/developer notes from user-facing surfaces.
4. Show empty state with action.
5. Use mobile cards for key uploaded videos or insights.

Acceptance criteria:

1. Top of page contains interpreted insights when data exists.
2. Empty state directs setup/upload path.
3. Raw tables remain accessible.

### 5.10 Profile

Target behavior:

Profile is a calm settings surface with previews.

Required changes:

1. Group into Brand, Links, Description, Schedule, YouTube.
2. Hide developer setup instructions from normal user view.
3. Add preview of generated description defaults if practical.
4. Replace long labels with concise labels and helper metadata.
5. Remove inline styles.

Acceptance criteria:

1. User can understand what each default affects.
2. Technical config copy does not leak to normal users.
3. Save state is clear.

## 6. Implementation Roadmap

Agents MUST follow this order unless the user explicitly changes priority.

### Phase 0 - Baseline and Guardrails

Purpose: capture current state and make quality measurable.

Tasks:

1. Verify branch.
2. Inventory routes.
3. Capture baseline desktop/mobile screenshots for:

   ```text
   /
   /login
   /signup
   /dashboard
   /beats
   /beats/new
   /calendar
   /analytics
   /profile
   /packages/[id] if seed data exists
   ```

4. Add a lightweight UI quality checklist in docs or PR description.
5. Identify seed/auth needs for screenshoting authenticated routes.

Exit criteria:

1. Baseline screenshots exist locally or are summarized.
2. Agent knows which routes can be visually tested.
3. No code changes are required in Phase 0 unless the user requests them.

### Phase 1 - Foundation and App Chrome

Purpose: improve every signed-in screen through shared styling and shell behavior.

Tasks:

1. Introduce semantic tokens.
2. Calm authenticated app background, glow, card radius, button shadow, and display type.
3. Build or class-define Button, Card, StatusBadge, PageHeader, EmptyState, ActionBar.
4. Replace mobile hidden nav with bottom nav.
5. Move logout out of the top mobile nav.
6. Remove emoji/symbol button labels in shared app surfaces.
7. Add global focus-visible styles.
8. Start removing inline styles from dashboard, beats, calendar, profile, and package
   action areas.

Exit criteria:

1. Authenticated routes feel calmer and more product-like.
2. Mobile has persistent core navigation.
3. No new horizontal overflow.
4. Build and tests pass.

### Phase 2 - Landing and Auth First Impression

Purpose: fix the first impression and account entry experience.

Tasks:

1. Redesign landing hero for desktop and mobile.
2. Reduce black void in first viewport.
3. Add workflow/product preview or a strong visual workflow abstraction.
4. Compress marketing sections.
5. Calm auth cards.
6. Remove auth inline styles.

Exit criteria:

1. Landing mobile first viewport is polished.
2. Login/signup feel calm and professional.
3. Marketing copy is shorter and more specific.

### Phase 3 - New Beat Flow

Purpose: make the first core product action feel premium.

Tasks:

1. Create essential-first layout.
2. Add audio dropzone.
3. Collapse advanced details.
4. Add sticky mobile action.
5. Rewrite labels and helper text.
6. Preserve server action contract.

Exit criteria:

1. New beat can be completed with minimal input.
2. Advanced inputs are reachable.
3. Mobile form is comfortable.

### Phase 4 - Package Readiness Editor

Purpose: redesign the core product surface.

Tasks:

1. Add readiness computation and UI.
2. Create staged editor layout.
3. Add active section behavior.
4. Collapse completed sections.
5. Add preview/publish panel.
6. Convert thumbnail/video/YouTube/export into readiness modules.
7. Add package-level copy/export.
8. Clarify save/autosave state.

Exit criteria:

1. User can see blockers and next action.
2. Core package actions still work.
3. Desktop and mobile layouts are intentionally different.

### Phase 5 - Thumbnail Builder Premium Pass

Purpose: make creative tooling outcome-first.

Tasks:

1. Add presets.
2. Move raw controls into advanced inspector.
3. Improve canvas framing.
4. Add brand-aware defaults.
5. Verify canvas rendering on desktop and mobile.

Exit criteria:

1. Useful thumbnail can be produced quickly.
2. Advanced control remains available.
3. No layout breakage.

### Phase 6 - Dashboard, Calendar, Analytics

Purpose: make operational screens guide action.

Tasks:

1. Dashboard next-action module.
2. Dashboard mobile package cards.
3. Calendar weekly rhythm visualization.
4. Calendar mobile day cards.
5. Analytics insight cards.
6. Move raw analytics tables lower or behind detail affordance.

Exit criteria:

1. Dashboard gives a clear next action.
2. Calendar shows rhythm.
3. Analytics provides interpretation.

### Phase 7 - Copy Lint and Regression Hardening

Purpose: keep the product from drifting back into verbose generic UI.

Tasks:

1. Add a lightweight script that flags:

   ```text
   button labels over 24 characters
   helper strings over 120 characters
   labels containing long explanatory clauses
   emoji/symbols inside product buttons
   repeated phrases like "full YouTube upload package"
   inline styles in app UI files
   ```

2. Run the script as an optional check first.
3. Add visual QA checklist for every PR.
4. Add accessibility checklist.

Implementation artifacts:

```text
scripts/ui-quality-check.ts
docs/frontend-ui-quality-checklist.md
```

Required commands:

```bash
npm run ui:check
npm run ui:check:strict
```

`npm run ui:check` is advisory and exits 0 with warnings. `npm run ui:check:strict`
is the blocking version agents SHOULD run before handoff. The Phase 7 baseline is zero
warnings, so any new warning is regression debt and MUST be resolved or explicitly
justified in the final report.

Exit criteria:

1. Drift is measurable.
2. Lint warnings are actionable.
3. Strict mode passes locally before handoff.

### Phase 8 - Route Scorecards and Experience Ownership

Purpose: prevent the redesign from becoming tribal knowledge. Every route must have a
declared user job, primary action, desktop intent, mobile intent, copy budget, state
coverage, and QA focus.

Tasks:

1. Add a route-level scorecard document that covers every rendered `page.tsx` route.
2. Define route contracts for public, auth, legal, onboarding, and authenticated product
   screens.
3. Add a static checker that compares the scorecard document against the actual Next.js
   route tree.
4. Require scorecard updates when routes are added, removed, or materially redesigned.
5. Use scorecards to decide whether future UI changes are simplifying the screen job or
   adding noise.

Implementation artifacts:

```text
docs/frontend-route-scorecards.md
scripts/ui-route-scorecard-check.ts
```

Required command:

```bash
npm run ui:routes
```

Exit criteria:

1. Every route has an explicit experience contract.
2. Route scorecards and the app route tree are in sync.
3. Scorecards include desktop and mobile intent, not only generic responsive behavior.
4. Future route additions fail the checker until the experience contract is documented.

## 7. Verification Protocol

### 7.1 Required Commands

For code changes:

```bash
npm run ui:check:strict
npm run ui:routes
npm run build
npm test
```

For route scanning:

```bash
rg -n "style=\{\{" app || true
rg -n "Auto-schedule|Generate video|Download PNG|Upload to YouTube|Copied|Saved" app || true
rg -n "full YouTube upload package|auto-detected from audio if left blank|Direct upload needs Google API credentials" app || true
```

If symbol search is unreliable:

```bash
rg -n "Auto-schedule|Generate video|Download PNG|Upload to YouTube|Copied|Saved" app || true
```

### 7.2 Visual QA

Agents SHOULD start a local server:

```bash
npm run dev
```

Then inspect affected routes at:

```text
1440 x 1000
820 x 1180
390 x 844
360 x 740
```

Visual QA checklist:

1. No text overlap.
2. No horizontal scroll.
3. Primary action is visible.
4. Mobile nav is available on app routes.
5. Buttons have readable labels.
6. Cards are not nested inside cards.
7. Empty states include direct action.
8. Focus states are visible.
9. Reduced-motion mode remains usable.
10. Loading, saved, error, processing, and empty states are visually distinct.

### 7.3 Accessibility QA

Agents MUST check:

1. Form fields have labels.
2. Icon-only buttons have accessible names.
3. Keyboard focus order is logical.
4. Focus indicator is visible against dark background.
5. Touch targets are at least 24 x 24 CSS pixels, with common actions closer to 40 x
   44px.
6. Color is not the only way to distinguish state.
7. Motion respects `prefers-reduced-motion`.

### 7.4 Performance QA

Agents MUST avoid performance regressions from visual polish.

Watch areas:

1. `backdrop-filter` on large fixed elements.
2. Large fixed glow layers.
3. Infinite animations.
4. Full-page grain overlays.
5. Canvas redraw loops.
6. Expensive box shadows on long lists.

Required behavior:

1. No infinite pulse in dense app screens unless indicating live processing.
2. No animated decorative effects inside long scrolling lists.
3. Canvas rendering should update only when controls change.

## 8. Strict Copy Examples by Surface

### 8.1 Dashboard

Bad:

```text
Your upload pipeline at a glance.
No upload packages yet. Add your first beat and TypeBeatOS will generate the full YouTube package.
```

Better:

```text
Next up
Start with a beat.
```

### 8.2 New Beat

Bad:

```text
Fill in the beat details - TypeBeatOS generates the full YouTube upload package from them.
BPM - auto-detected from audio if left blank
Generate upload package
```

Better:

```text
Add a beat
BPM
Generate pack
```

### 8.3 Package Editor

Bad:

```text
Or leave blank and use auto-schedule on the calendar page.
Download upload pack (.txt)
Save & mark ready
```

Better:

```text
Schedule later
Export pack
Mark ready
```

### 8.4 Profile

Bad:

```text
Set this once - every generated description, pinned comment, and schedule uses it.
Direct upload needs Google API credentials...
```

Better:

```text
Defaults
Used in descriptions and publishing.
YouTube upload is not available in this environment.
```

## 9. File-Level Priorities

### Highest Priority

```text
app/(app)/app-chrome.css
app/(app)/layout.tsx
app/(app)/NavLinks.tsx
app/(app)/packages/[id]/PackageEditor.tsx
app/(app)/packages/[id]/ThumbnailBuilder.tsx
app/(app)/beats/new/page.tsx
app/page.tsx
app/marketing.css
```

### Medium Priority

```text
app/(app)/dashboard/page.tsx
app/(app)/calendar/page.tsx
app/(app)/analytics/page.tsx
app/(app)/profile/page.tsx
app/(app)/beats/page.tsx
app/(app)/beats/[id]/edit/page.tsx
app/login/page.tsx
app/signup/page.tsx
```

### Lower Priority

```text
app/privacy/page.tsx
app/terms/page.tsx
app/legal/LegalShell.tsx
app/legal/legal.css
app/not-found.tsx
app/error.tsx
```

Lower priority does not mean low quality. It means these should not delay the core
product experience redesign.

## 10. Risks and Constraints

### 10.1 Risk: Redesign Becomes Too Broad

Mitigation:

1. Keep phases small.
2. Do not redesign every route in one PR.
3. Verify after each phase.
4. Prefer visible product improvements over abstract refactors.

### 10.2 Risk: Component Abstraction Slows Delivery

Mitigation:

1. Introduce primitives only when used by at least two surfaces or needed for consistency.
2. Keep component APIs small.
3. CSS class patterns are acceptable before full React primitives.

### 10.3 Risk: Brand Loses Energy

Mitigation:

1. Keep brand drama on landing hero, final CTA, and selected empty-state moments.
2. Keep app UI calmer.
3. Use brand color intentionally.

### 10.4 Risk: Mobile Gets Worse During Desktop Cleanup

Mitigation:

1. Test mobile in every phase.
2. Implement mobile patterns explicitly.
3. Do not rely on table scrolling for primary workflows.

### 10.5 Risk: Copy Gets Too Minimal

Mitigation:

1. Keep labels explicit.
2. Keep error recovery clear.
3. Keep legal and irreversible-action copy complete.
4. Use progressive disclosure rather than deleting necessary guidance.

## 11. PR Template for Agents

Every implementation PR or final report SHOULD include:

```markdown
## Scope

What phase or surface this implements.

## Changed Files

- file
- file

## UX Changes

- What became simpler
- What became clearer
- What moved behind progressive disclosure

## Technical Changes

- Tokens/classes/components added
- Layout behavior changed
- Mobile behavior changed

## Verification

- npm run build: pass/fail/not run
- npm test: pass/fail/not run
- Desktop visual check: routes checked
- Mobile visual check: routes checked
- Accessibility notes

## Known Follow-ups

- Remaining debt
- Deferred surfaces
```

## 12. Non-Negotiable Quality Bar

Agents MUST NOT consider a frontend phase complete if any of the following are true:

1. The primary action is unclear.
2. Mobile navigation to core app routes is unavailable.
3. Primary mobile content requires horizontal table scrolling.
4. New copy sounds generic, robotic, or explanatory when the UI could show state.
5. Buttons use emoji or decorative symbols as part of the label.
6. Text overlaps, clips, or causes horizontal overflow.
7. Focus state is invisible.
8. A dense app screen uses marketing-level glow, pulse, or hero typography.
9. Developer configuration instructions are shown to normal users.
10. The phase lacks build/test/visual verification notes.

This plan is intentionally strict. The product should feel designed, not merely styled.
