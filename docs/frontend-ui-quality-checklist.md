# Frontend UI Quality Checklist

Use this checklist for every frontend PR in the `ui-scaling-fix` effort.

## Automated Drift Check

Run the advisory checker:

```bash
npm run ui:check
```

Run strict mode before handoff:

```bash
npm run ui:check:strict
```

Confirm every rendered route still has an experience contract:

```bash
npm run ui:routes
```

The checker reports:

1. Inline `style={{ ... }}` in app UI files.
2. Button labels longer than 24 characters.
3. Decorative symbols or emoji inside button text.
4. Helper copy longer than 120 characters.
5. Verbose labels that contain explanatory clauses.
6. Banned mechanical phrases such as `full YouTube upload package`.

Current baseline: `npm run ui:check:strict` passes with zero warnings. Treat any new
warning as regression debt unless the final report explains the exception.

Route baseline: `npm run ui:routes` must pass whenever a page route is added, removed,
or materially redesigned.

## Copy Review

Pass criteria:

1. The screen has one primary job.
2. The primary action uses 1 to 3 words.
3. Labels are nouns, not instructions.
4. Helper text is state-specific and short.
5. Empty states lead to one direct action.
6. Error states say what happened and what to do next.
7. End-user screens do not mention developer setup details.
8. No emoji, decorative arrows, or symbolic prefixes appear in product button labels.

Reject examples:

```text
Fill in the beat details so TypeBeatOS can generate the full YouTube upload package.
Direct upload needs Google API credentials.
Download upload pack (.txt)
```

Accept examples:

```text
Add a beat.
YouTube upload is unavailable here.
Export pack
```

## Visual QA

Check affected routes at:

```text
1440 x 1000
820 x 1180
390 x 844
360 x 740
```

Pass criteria:

1. No text overlaps or clips.
2. No horizontal page overflow.
3. Primary action is visible without searching.
4. Mobile bottom navigation remains available on app routes.
5. Cards are not nested inside other cards.
6. Tables that drive primary workflows have mobile card/list alternatives.
7. Sticky actions do not cover form fields, save states, or bottom navigation.
8. Status states are visibly distinct without relying only on color.
9. Empty, loading, saved, processing, and error states have distinct treatments.
10. Generated screenshot artifacts are removed before final handoff.

Suggested browser overflow check:

```js
({
  width: window.innerWidth,
  scrollWidth: document.documentElement.scrollWidth,
  overflow: document.documentElement.scrollWidth > window.innerWidth,
})
```

## Accessibility QA

Pass criteria:

1. Form fields have visible labels.
2. Icon-only controls have accessible names.
3. Keyboard focus order follows the visual workflow.
4. Focus rings are visible against the dark theme.
5. Common touch targets are close to 40 x 44 CSS pixels or larger.
6. Minimum touch target size is at least 24 x 24 CSS pixels.
7. Color is not the only indicator for status.
8. Motion respects `prefers-reduced-motion`.
9. File inputs, custom buttons, and sticky actions are reachable by keyboard.
10. Canvas or media tools expose adjacent controls that make the workflow understandable.

## Release Handoff

Include in the final response:

1. Routes or components changed.
2. Commands run.
3. Browser viewports checked.
4. Any advisory checker warnings left unresolved.
5. Whether affected route scorecards were updated.
6. Any test, build, or visual QA that could not be completed.
