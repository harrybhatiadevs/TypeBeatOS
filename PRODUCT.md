# Product

## Register

product

## Users

Independent music producers and beatmakers — the "type beat" scene — who make
instrumentals (trap, R&B, drill, hip-hop, etc.) and sell/promote them on
YouTube and beat marketplaces (BeatStars and similar).

Their context: working session-to-session, often juggling many beats. The job
to be done is turning a finished beat into a *complete, ready-to-publish YouTube
upload* — without hand-writing titles, descriptions, tags, and thumbnails for
every track, and without manually wrestling YouTube's scheduler. They want to
spend time making beats, not doing marketing busywork.

## Product Purpose

TypeBeatOS turns a beat into a full YouTube upload package and gets it live.
From an uploaded audio file it auto-detects BPM and key, generates title
options, a description, tags, hashtags, and a pinned comment, builds a thumbnail
and a render-ready video, then schedules and uploads directly to the producer's
connected YouTube channel and tracks performance afterward.

Success = a producer goes from "beat done" to "scheduled/uploaded on YouTube"
in a couple of minutes, with metadata good enough to ship as-is, and a clear
view of what's queued and how past uploads performed.

## Brand Personality

Studio-grade and professional — a serious tool, not a toy. Precise,
trustworthy, and fast; it should feel like reliable studio gear that gets out of
the producer's way. Voice is confident and plainspoken in producer language
(beats, type beats, BPM, key, lease/exclusive), never corporate or cutesy.

Visual signature already established and worth preserving: a dark, near-black
surface with a single decisive red accent (`#ed072c`) and condensed display
type (Bebas Neue) over Inter body — high-contrast, music-industry energy used
with restraint, not as decoration.

## Anti-references

Explicitly NOT cluttered or busy — no overloaded, multi-panel dashboards with no
breathing room. Density of information (lots of metadata per beat/package) must
never become visual noise: one clear primary action per screen, generous space,
nothing competing for attention.

## Design Principles

- **The workflow is the product.** Every screen should make the next step in
  the pipeline (beat → package → schedule → upload → analytics) obvious. Reduce
  decisions; lead the producer forward.
- **Studio-grade trust over flash.** Accuracy and reliability are the brand —
  detection that's right, uploads that actually land, status you can believe.
  Never let polish hide whether something worked.
- **Speed to publish.** Minimize clicks from finished beat to scheduled upload.
  Defaults should be good enough to ship without editing.
- **Calm under density.** There's a lot of metadata; present it with hierarchy
  and space so it reads as control, not clutter.
- **Speak the producer's language.** Beats, type beats, BPM, key, lease vs.
  exclusive — domain terms, not generic "items" and "records".

## Accessibility & Inclusion

Target WCAG 2.1 AA: body text ≥4.5:1 contrast (watch low-opacity white-on-dark
muted text), large text ≥3:1, visible focus states, full keyboard operability.
Honor `prefers-reduced-motion` on every animation with a crossfade/instant
fallback. The dark, red-accented theme must keep status colors (uploaded/failed/
scheduled) distinguishable for color-blind users via more than hue alone.
