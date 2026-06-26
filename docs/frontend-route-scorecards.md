# Frontend Route Scorecards

Every user-facing route needs an explicit experience contract. Agents MUST update this file
whenever a route is added, removed, or materially redesigned.

The scorecard is not marketing copy. It is an implementation constraint that keeps each
screen focused, testable, and intentional on desktop and mobile.

## Scorecard Contract

Each route MUST define:

1. `Job`: the user decision or task the screen exists to support.
2. `Primary action`: the one action that should visually win.
3. `Desktop`: the desktop layout intent.
4. `Mobile`: the mobile layout intent.
5. `Copy budget`: the maximum amount of explanatory copy the screen should need.
6. `States`: the states that must be visually distinct.
7. `QA focus`: the highest-risk details to verify before handoff.

Run the route checker after editing this file:

```bash
npm run ui:routes
```

## Public and Account Routes

### `/`

- Job: Explain the product and route qualified users to account creation.
- Primary action: Get started.
- Desktop: Literal product promise first, then old workflow versus TypeBeatOS and exact upload outputs.
- Mobile: Type-beat upload promise, primary action, and output proof must appear without decorative cards.
- Copy budget: One headline, one output sentence, two workflow lists, eight output labels.
- States: default, authenticated redirect affordance, reduced-motion rendering.
- QA focus: First viewport restraint, hero text fit, no decorative clutter.

### `/waitlist`

- Job: Capture beta interest from producers who are not ready to create an account.
- Primary action: Join waitlist.
- Desktop: Centered hero with concise workflow proof and email capture.
- Mobile: Form should be reachable without scrolling past repeated value copy.
- Copy budget: One hero paragraph, three workflow steps, compact beta terms.
- States: empty email, submitting, success, duplicate/error response.
- QA focus: Form wrapping, keyboard focus, mobile nav fit.

### `/login`

- Job: Return a producer to their upload workspace.
- Primary action: Log in.
- Desktop: Calm authentication panel with minimal surrounding chrome.
- Mobile: Single-column form with large touch targets and visible recovery link.
- Copy budget: One short subtitle and two account utility links.
- States: default, reset-success, auth error, loading/submitting.
- QA focus: Password manager compatibility, error readability, focus order.

### `/signup`

- Job: Create the producer workspace with the minimum viable credentials.
- Primary action: Create account.
- Desktop: Account form should feel quiet and trustworthy, not promotional.
- Mobile: Fields must fit without compressed labels or clipped submit text.
- Copy budget: One subtitle, one short alternate-account link.
- States: default, validation error, submitting.
- QA focus: Label clarity, password hint, legal footer visibility if added.

### `/forgot`

- Job: Let a producer request a password reset without support.
- Primary action: Send reset link.
- Desktop: Same auth-panel rhythm as login for confidence.
- Mobile: Email field and submit must stay above the fold on common phones.
- Copy budget: One recovery sentence and one return link.
- States: default, sent, auth/error response.
- QA focus: Success copy, keyboard flow, no dead-end state.

### `/reset`

- Job: Let a producer set a new password from a valid reset token.
- Primary action: Update password.
- Desktop: Focus on token outcome, not implementation details.
- Mobile: Password fields and submit should remain comfortable with keyboard open.
- Copy budget: One short instruction line and one expired-token recovery line.
- States: valid token, expired token, validation error, submitting.
- QA focus: Error path, password manager behavior, small-screen spacing.

### `/verify`

- Job: Confirm email verification outcome and move the user forward.
- Primary action: Open dashboard.
- Desktop: Confirmation panel should look final and calm.
- Mobile: Success/error state must be understandable without extra explanation.
- Copy budget: One sentence per success or expired state.
- States: verified, expired/invalid link.
- QA focus: Redirect clarity, link target, contrast on success/error copy.

### `/privacy`

- Job: Provide readable privacy terms without breaking brand trust.
- Primary action: Back home.
- Desktop: Narrow legal column with clear section rhythm.
- Mobile: Long-form text must wrap cleanly without placeholder overflow.
- Copy budget: Legal content can be complete; surrounding chrome must stay minimal.
- States: draft callout, standard legal content.
- QA focus: Placeholder wrapping, heading hierarchy, readable line length.

### `/terms`

- Job: State service terms and user responsibilities clearly.
- Primary action: Back home.
- Desktop: Legal prose should remain scan-friendly and sober.
- Mobile: Section headers and list items must not feel like a marketing page.
- Copy budget: Legal content can be complete; labels and headings should avoid robotic terms.
- States: draft callout, standard legal content.
- QA focus: Long-list spacing, link contrast, legal placeholder wrapping.

## Authenticated Product Routes

### `/dashboard`

- Job: Decide what to do next.
- Primary action: New beat.
- Desktop: Action-led workbench with next-up module, queue snapshot, and compact metrics.
- Mobile: Cockpit view with next action first, then queue cards and bottom navigation.
- Copy budget: One subtitle, one empty-state sentence, compact metric labels.
- States: empty workspace, scheduled queue, processing package, uploaded package, verify-email banner.
- QA focus: First viewport hierarchy, mobile bottom-nav clearance, no table dependency.

### `/beats`

- Job: Find, review, or manage an existing beat.
- Primary action: New beat.
- Desktop: Dense catalog with status, package link, and edit affordances.
- Mobile: Beat cards with clear package/edit actions and no horizontal table dependency.
- Copy budget: One subtitle, one empty-state sentence, concise status labels.
- States: empty catalog, beat without package, beat with package, generated/ready status.
- QA focus: Action density, card tap targets, long beat names.

### `/beats/new`

- Job: Add the minimum viable beat and create the package.
- Primary action: Generate pack.
- Desktop: Essential fields first with advanced metadata clearly secondary.
- Mobile: Audio and required fields first, sticky submit clear of bottom navigation.
- Copy budget: One page subtitle, one dropzone hint, one advanced-section hint.
- States: empty form, file selected, validation error, submitting.
- QA focus: File input usability, required labels, mobile keyboard spacing.

### `/beats/[id]/edit`

- Job: Correct beat metadata after creation.
- Primary action: Save changes.
- Desktop: Compact edit form with selling details separated from core metadata.
- Mobile: Single-column fields with save action after the edited content.
- Copy budget: One subtitle and field labels only unless an error appears.
- States: existing beat, validation error, beat with package link.
- QA focus: File replacement affordance, long store links, package back-link.

### `/packages/[id]`

- Job: Prepare one upload package for publishing.
- Primary action: Complete the next blocker.
- Desktop: Staged editor with readiness panel and persistent preview/publish context.
- Mobile: One active section at a time with readiness and action modules stacked.
- Copy budget: One readiness summary, one helper line per incomplete module.
- States: draft, ready, scheduled, rendering, upload failed, uploaded.
- QA focus: Readiness accuracy, sticky actions, thumbnail/video/upload module state.

### `/calendar`

- Job: Place packages into a consistent publishing rhythm.
- Primary action: Auto-schedule.
- Desktop: Weekly rhythm view with queue and schedule controls visible.
- Mobile: Day cards and package actions without relying on a wide calendar table.
- Copy budget: One subtitle, compact day labels, one empty-state sentence.
- States: empty queue, scheduled days, uploaded packages, scheduling error.
- QA focus: Timezone clarity, mobile day-card spacing, drag/selection alternatives.

### `/analytics`

- Job: Decide what to make or publish next from channel performance.
- Primary action: Refresh stats.
- Desktop: Insight cards first, raw data secondary.
- Mobile: Top insight stack before tables or dense comparison.
- Copy budget: One subtitle, one empty-state sentence, concise insight explanations.
- States: no uploads, connected channel, disconnected channel, refreshed stats, API error.
- QA focus: Empty-state path, metric overflow, chart/table fallback on mobile.

### `/profile`

- Job: Set producer defaults once and manage account/channel settings.
- Primary action: Save profile.
- Desktop: Settings grouped by channel, identity, defaults, schedule, and account.
- Mobile: Single-column groups with direct save path and readable connected state.
- Copy budget: One subtitle, short labels, no developer setup instructions.
- States: saved, validation error, YouTube connected, YouTube unavailable, signed-in account.
- QA focus: Textarea sizing, connected/disconnect state, account logout placement.

### `/onboarding`

- Job: Complete the minimum first-run setup.
- Primary action: Continue.
- Desktop: Three-step setup with clear current progress and minimal optionality.
- Mobile: Current step and submit action must dominate over progress decoration.
- Copy budget: One subtitle, one helper line per step.
- States: brand step, schedule step, YouTube connected, YouTube unavailable, finish.
- QA focus: Step indicator fit, skip path, YouTube connection fallback.
