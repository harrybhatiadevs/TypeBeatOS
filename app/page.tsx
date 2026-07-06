import Link from "next/link";
import { getUser } from "@/lib/auth";
import LpEffects from "./LpEffects";
import "./landing.css";

const PROBLEMS = [
  "Export the beat",
  "Render a video",
  "Write a searchable title",
  "Write the description",
  "Paste BeatStars links",
  "Tags + hashtags",
  "Design a thumbnail",
  "Pinned comment",
  "Schedule the post",
];

const STEPS = [
  { n: "1", t: "Drop in your beats", b: "Upload finished files. BPM and key auto-detect. Tag the target artist, genre, and mood once." },
  { n: "2", t: "Generate the pack", b: "Titles, description, tags, hashtags, pinned comment, thumbnail, and a rendered MP4 — in a single pass." },
  { n: "3", t: "Schedule the month", b: "Pick a posting rhythm. Beats auto-spread across the calendar and publish straight to your channel." },
];

// Two spotlight features carry the weight; the rest read as a tight list —
// deliberately not six identical cards.
const SPOTLIGHT = [
  { t: "Titles tuned to rank", b: "Structures modelled on the artists actually charting in search — keyword-first, beat name in quotes, the right genre tag." },
  { t: "On-brand thumbnails", b: "Pick a background, drop your text and producer name. A consistent thumbnail for every upload, no design tool." },
];

const FEATURE_LIST = [
  { t: "Descriptions, auto-filled", b: "BeatStars / Airbit links, license info, contact, socials, and your CTA — pulled from your producer profile." },
  { t: "Tags + hashtags", b: "Searchable tags from artist, genre, mood, BPM, key, and the right “type beat” variations." },
  { t: "Pinned comment ready", b: "The purchase-link comment written and queued the moment the video goes live." },
  { t: "Upload calendar", b: "Batch a month of beats and auto-spread them across your schedule. One session, a month of content." },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cycle: "/mo",
    annual: "",
    perks: ["3 upload packs / mo", "Titles + descriptions", "Direct YouTube publish"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    cycle: "/mo",
    annual: "or $190/yr — 2 months free",
    perks: ["60 upload packs / mo", "Batch upload queue", "Direct YouTube publish", "Custom templates"],
    cta: "Upgrade to Pro",
    featured: true,
  },
  {
    name: "Serious",
    price: "$29",
    cycle: "/mo",
    annual: "or $290/yr — 2 months free",
    perks: ["150 upload packs / mo", "Multiple channels", "Analytics + keyword insights", "Advanced templates"],
    cta: "Upgrade to Serious",
    featured: false,
  },
];

const PROOF = [
  { n: "10×", l: "Faster uploads" },
  { n: "1-click", l: "SEO pack" },
  { n: "Auto", l: "BPM + key" },
  { n: "Direct", l: "YouTube publish" },
];

export default async function Landing() {
  const user = await getUser();
  const ctaHref = user ? "/dashboard" : "/signup";
  const ctaLabel = user ? "Open dashboard" : "Get started free";

  return (
    <div className="lp" data-testid="landing-page">
      <div className="lp-glow" aria-hidden="true" />

      {/* NAV */}
      <nav className="lp-nav" data-testid="landing-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-brand" aria-label="TypeBeatOS home">
            <span className="lp-wordmark">TYPEBEAT<span>OS</span></span>
          </Link>
          <div className="lp-nav-links">
            <a href="#home" className="lp-nav-link" data-section-link="home">Home</a>
            <a href="#workflow" className="lp-nav-link" data-section-link="workflow">How it works</a>
            <a href="#features" className="lp-nav-link" data-section-link="features">Features</a>
            <a href="#pricing" className="lp-nav-link" data-section-link="pricing">Pricing</a>
          </div>
          <Link href={user ? "/dashboard" : "/login"} className="lp-btn lp-btn-ghost lp-btn-sm">
            {user ? "Open app" : "Log in"}
          </Link>
        </div>
        <span className="lp-nav-progress" aria-hidden="true" />
      </nav>

      {/* HERO */}
      <header id="home" className="lp-wrap lp-hero">
        <div className="lp-hero-grid">
          <div>
            <h1 className="lp-display lp-h1">
              Scale your channel{" "}
              <span className="lp-red">without the busywork.</span>
            </h1>
            <p className="lp-hero-sub">
              TypeBeatOS turns a finished beat into a complete YouTube upload —
              SEO title, description, tags, thumbnail, and a rendered video — then
              publishes it straight to your connected YouTube channel on the
              schedule you set.
            </p>
            <div className="lp-hero-actions">
              <Link href={ctaHref} className="lp-btn lp-btn-primary">{ctaLabel}</Link>
              <a href="#workflow" className="lp-btn lp-btn-ghost">See the workflow</a>
            </div>
          </div>

          {/* Product visual: a generated upload package */}
          <div className="lp-package" aria-hidden="true">
            <span className="lp-package-tag">Auto-generated</span>
            <div className="lp-thumb">
              <img src="/sample-beat-thumb.webp" alt="" />
            </div>
            <p className="lp-pkg-title">[FREE] Drake Type Beat 2026 &ldquo;After Hours&rdquo;</p>
            <div className="lp-pkg-tags">
              {["drake type beat", "r&b type beat", "142 bpm", "g minor", "melodic"].map((t) => (
                <span key={t} className="lp-pill">{t}</span>
              ))}
            </div>
            <div className="lp-pkg-foot">
              <span className="lp-pkg-meta"><strong>142 BPM</strong> · G minor · Fri 6:00 PM</span>
              <span className="lp-status">Scheduled</span>
            </div>
          </div>
        </div>

        {/* PROOF STRIP */}
        <div className="lp-proof lp-proof-hero">
          <div className="lp-wrap lp-proof-inner">
            {PROOF.map((p) => (
              <span key={p.l} className="lp-proof-item">
                <span className="lp-display lp-proof-num">{p.n}</span>
                <span className="lp-proof-label">{p.l}</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* PROBLEM */}
      <section className="lp-wrap lp-section">
        <div className="lp-reveal">
          <h2 className="lp-display lp-h2 lp-h2-typewriter">
            <span className="lp-red">Consistency wins.</span>{" "}
            <span>The upload admin kills it.</span>
          </h2>
        </div>
        <div className="lp-chips lp-reveal">
          {PROBLEMS.map((p) => (
            <span key={p} className="lp-chip">{p}</span>
          ))}
          <span className="lp-chip lp-chip-repeat">…then repeat 3× a week</span>
        </div>
        <p className="lp-punch lp-reveal">
          Most producers would rather make music than do upload admin. So uploads slip
          — and <b>the channel stalls right here.</b>
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section id="workflow" className="lp-wrap lp-section">
        <div className="lp-reveal">
          <h2 className="lp-display lp-h2 lp-h2-swipe">
            Raw beat to <span className="lp-red">scheduled upload.</span>
          </h2>
          <p className="lp-lead">Three steps, under three minutes. No editor, no spreadsheet, no copy-paste.</p>
        </div>
        <div className="lp-steps lp-reveal">
          {STEPS.map((s) => (
            <div key={s.n} className="lp-step">
              <div className="lp-display lp-step-n">{s.n}</div>
              <h3 className="lp-step-t">{s.t}</h3>
              <p className="lp-step-b">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="lp-wrap lp-section">
        <div className="lp-reveal">
          <h2 className="lp-display lp-h2">Not generic scheduling.</h2>
          <p className="lp-lead">Every piece is tuned to how type-beat channels actually get found and grow.</p>
        </div>
        <div className="lp-spot lp-reveal">
          {SPOTLIGHT.map((f) => (
            <div key={f.t} className="lp-spot-card">
              <h3 className="lp-spot-t">{f.t}</h3>
              <p className="lp-spot-b">{f.b}</p>
            </div>
          ))}
        </div>
        <div className="lp-list lp-reveal">
          {FEATURE_LIST.map((f) => (
            <div key={f.t} className="lp-list-row">
              <div className="lp-list-t">{f.t}</div>
              <div className="lp-list-b">{f.b}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="lp-wrap lp-section">
        <div className="lp-reveal">
          <h2 className="lp-display lp-h2 lp-h2-swipe">
            <span className="lp-red">Start free.</span> Upgrade when uploads stack.
          </h2>
        </div>
        <div className="lp-plans lp-reveal">
          {PLANS.map((p) => (
            <div key={p.name} className={`lp-plan${p.featured ? " lp-plan-featured" : ""}`}>
              {p.featured && <span className="lp-plan-flag">Most popular</span>}
              <div className="lp-plan-name">{p.name}</div>
              <div className="lp-display lp-plan-price">{p.price}<small>{p.cycle}</small></div>
              {p.annual && <div className="lp-plan-annual">{p.annual}</div>}
              <ul className="lp-plan-perks">
                {p.perks.map((perk) => <li key={perk}>{perk}</li>)}
              </ul>
              <Link href={ctaHref} className={`lp-btn ${p.featured ? "lp-btn-primary" : "lp-btn-ghost"}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="lp-wrap lp-final">
        <h2 className="lp-display lp-final-h2 lp-reveal">Make the beats.<br /><span className="lp-red">We handle YouTube.</span></h2>
        <Link href={ctaHref} className="lp-btn lp-btn-primary lp-reveal">{ctaLabel}</Link>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-grid">
          <div className="lp-footer-brand lp-reveal">
            <span className="lp-wordmark">TYPEBEAT<span>OS</span></span>
            <p>YouTube upload automation for type-beat producers.</p>
          </div>
          <div className="lp-footer-col lp-reveal">
            <h3>Product</h3>
            <a href="#workflow">Workflow</a>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="lp-footer-col lp-reveal">
            <h3>Tools</h3>
            <span>AI metadata</span>
            <span>Thumbnail builder</span>
            <span>Upload calendar</span>
          </div>
          <div className="lp-footer-col lp-reveal">
            <h3>Company</h3>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href={ctaHref}>Open app</Link>
          </div>
          <div className="lp-footer-bottom lp-reveal">
            <span>© 2026 TypeBeatOS.</span>
            <span>Not affiliated with YouTube, BeatStars, or any artist mentioned.</span>
          </div>
        </div>
      </footer>

      <LpEffects />
    </div>
  );
}
