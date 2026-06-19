import Image from "next/image";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import WaitlistEffects from "./waitlist/WaitlistEffects";
import "./marketing.css";

const PROBLEMS = [
  "Export the beat",
  "Render a video file",
  "Write a searchable title",
  "Write the description",
  "Paste BeatStars links",
  "Tags + hashtags",
  "Design a thumbnail",
  "Pinned comment",
  "Schedule the post",
];

const STEPS = [
  {
    n: "1",
    t: "Drop in your beats",
    b: "Upload finished files. BPM and key auto-detect. Tag the target artist, genre, and mood once.",
  },
  {
    n: "2",
    t: "Generate the upload pack",
    b: "Titles, description, tags, hashtags, pinned comment, thumbnail, rendered MP4 — produced in a single pass.",
  },
  {
    n: "3",
    t: "Schedule the month",
    b: "Pick a posting rhythm. Beats auto-spread across the calendar and publish to your channel.",
  },
];

const FEATURES = [
  {
    eyebrow: "SEO",
    title: "Type-beat titles that rank",
    body: "Title structures tuned to ranking artists — artist keywords, beat name, genre tag — built to get found in search.",
  },
  {
    eyebrow: "Description",
    title: "Your links, auto-filled",
    body: "BeatStars / Airbit links, license info, contact email, socials, and CTA — pulled from your producer profile.",
  },
  {
    eyebrow: "Discovery",
    title: "Tags + hashtags",
    body: "Searchable tags from artist, genre, mood, BPM, key, related artists, and the right “type beat” variations.",
  },
  {
    eyebrow: "Visuals",
    title: "Thumbnail builder",
    body: "Pick a background, drop your text and producer name — on-brand thumbnails for every upload.",
  },
  {
    eyebrow: "Engagement",
    title: "Pinned comments",
    body: "The purchase-link pinned comment written and ready the moment the video goes live.",
  },
  {
    eyebrow: "Cadence",
    title: "Upload calendar",
    body: "Batch a month of beats and auto-spread them across a posting schedule. One session = a month of content.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cycle: "/mo",
    perks: ["3 upload packs / mo", "Titles + descriptions", "Manual export"],
    featured: false,
  },
  {
    name: "Starter",
    price: "$9",
    cycle: "/mo",
    perks: ["20 upload packs / mo", "SEO titles + tags", "Thumbnail builder", "Upload calendar"],
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    cycle: "/mo",
    perks: ["60 upload packs / mo", "Batch upload queue", "Direct YouTube publish", "Custom templates"],
    featured: true,
  },
  {
    name: "Serious",
    price: "$29",
    cycle: "/mo",
    perks: ["150 upload packs / mo", "Multiple channels", "Analytics + keyword insights", "Advanced templates"],
    featured: false,
  },
];

export default async function Landing() {
  const user = await getUser();
  const ctaHref = user ? "/dashboard" : "/signup";
  const ctaLabel = user ? "Open dashboard" : "Get started free";

  return (
    <div className="tb-page" data-testid="landing-page">
      {/* ambient red glow + grain */}
      <div className="tb-glow-layer" aria-hidden="true">
        <div className="tb-glow tb-glow-left" />
        <div className="tb-glow tb-glow-right" />
      </div>
      <div className="tb-grain" aria-hidden="true" />

      {/* NAV — floating glass pill */}
      <nav className="tb-nav" data-testid="landing-nav">
        <Link href="/" className="tb-brand" aria-label="TypeBeatOS home">
          <span className="tb-badge">
            <Image src="/logo.svg" alt="" width={28} height={28} priority />
          </span>
          <span className="tb-wordmark">
            TYPEBEAT<span>OS</span>
          </span>
        </Link>
        <div className="tb-nav-links">
          <a href="#workflow" className="tb-nav-link">How it works</a>
          <a href="#features" className="tb-nav-link">Features</a>
          <a href="#pricing" className="tb-nav-link">Pricing</a>
        </div>
        {user ? (
          <Link href="/dashboard" className="tb-nav-cta">Open app</Link>
        ) : (
          <Link href="/login" className="tb-nav-cta">Log in</Link>
        )}
      </nav>

      {/* HERO */}
      <section className="tb-hero">
        <div className="tb-eyebrow">
          <span className="tb-eyebrow-dot" aria-hidden="true" />
          Upload ops for type-beat producers
        </div>

        <h1 className="tb-h1">
          <span className="tb-line"><span>Batch a month</span></span>
          <span className="tb-line"><span>of type-beat</span></span>
          <span className="tb-line"><span>uploads <span className="tb-red">without</span></span></span>
          <span className="tb-line"><span>the busywork.</span></span>
        </h1>

        <div className="tb-hero-grid">
          <p className="tb-hero-sub">
            TypeBeatOS writes the SEO pack, builds the thumbnail, renders the video,
            and schedules everything to your channel. Built for producers who&apos;d
            rather make beats than chase metadata.
          </p>

          <div className="tb-hero-actions">
            <Link href={ctaHref} className="tb-final-btn">{ctaLabel}</Link>
            <a href="#workflow" className="tb-cta-ghost">See the workflow</a>
          </div>
        </div>

        <div className="tb-stats tb-reveal">
          <div className="tb-stat">
            <div className="tb-stat-num">10x</div>
            <div className="tb-stat-label">Faster uploads</div>
          </div>
          <div className="tb-stat">
            <div className="tb-stat-num">1-click</div>
            <div className="tb-stat-label">SEO pack</div>
          </div>
          <div className="tb-stat">
            <div className="tb-stat-num">Auto</div>
            <div className="tb-stat-label">BPM + key</div>
          </div>
          <div className="tb-stat">
            <div className="tb-stat-num">Direct</div>
            <div className="tb-stat-label">YouTube publish</div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="tb-section">
        <div className="tb-section-head tb-reveal">
          <h2 className="tb-h2">
            Consistency wins. <br />
            The <span className="tb-red">upload admin</span> is what kills it.
          </h2>
          <p className="tb-section-sub">
            Every upload means doing all of this — again. Then doing it three more
            times next week. Channels stall here.
          </p>
        </div>

        <div className="tb-problem-grid tb-reveal" data-delay="1">
          {PROBLEMS.map((p) => (
            <span key={p} className="tb-chip">{p}</span>
          ))}
          <span className="tb-chip tb-chip-repeat">…then repeat 3× a week</span>
        </div>

        <p className="tb-problem-punch tb-reveal" data-delay="2">
          Most producers would rather make music than do upload admin. So uploads
          slip — and the channel stalls.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section id="workflow" className="tb-section">
        <div className="tb-section-head tb-reveal">
          <h2 className="tb-h2">
            From raw beat to <br />
            <span className="tb-red">scheduled upload.</span>
          </h2>
          <p className="tb-section-sub">
            Three steps. Under three minutes. No editor. No spreadsheet. No copy-paste.
          </p>
        </div>

        <div className="tb-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="tb-step tb-reveal"
              data-delay={String(i + 1)}
            >
              <div className="tb-step-num">{s.n}</div>
              <div className="tb-step-content">
                <h3 className="tb-step-title">{s.t}</h3>
                <p className="tb-step-body">{s.b}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="tb-section">
        <div className="tb-section-head tb-reveal">
          <h2 className="tb-h2">
            Built for the <br />
            <span className="tb-red">type-beat workflow.</span>
          </h2>
          <p className="tb-section-sub">
            Not generic scheduling. Every piece is tuned to how type-beat channels
            actually grow.
          </p>
        </div>

        <div className="tb-features">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="tb-feature tb-reveal" data-delay={String((i % 3) + 1)}>
              <div className="tb-feature-eyebrow">{f.eyebrow}</div>
              <h3 className="tb-feature-title">{f.title}</h3>
              <p className="tb-feature-body">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="tb-section">
        <div className="tb-section-head tb-reveal">
          <h2 className="tb-h2">
            Founding member <br />
            <span className="tb-red">pricing.</span>
          </h2>
          <p className="tb-section-sub">
            Start free. Upgrade when the uploads start stacking.
          </p>
        </div>

        <div className="tb-pricing">
          {PLANS.map((p, i) => (
            <div
              key={p.name}
              className={`tb-plan tb-reveal${p.featured ? " tb-plan-featured" : ""}`}
              data-delay={String((i % 4) + 1)}
            >
              {p.featured && <div className="tb-plan-badge">Most popular</div>}
              <div className="tb-plan-name">{p.name}</div>
              <div className="tb-plan-price">
                {p.price}
                <small>{p.cycle}</small>
              </div>
              <ul>
                {p.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <Link href={ctaHref} className={p.featured ? "tb-final-btn" : "tb-cta-ghost"}>
                Start free
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="tb-final tb-reveal">
        <h2 className="tb-final-h2">
          Make the beats. <br />
          <span className="tb-red">We handle YouTube.</span>
        </h2>
        <Link href={ctaHref} className="tb-final-btn">{ctaLabel}</Link>
      </section>

      <footer className="tb-footer">
        <div className="tb-footer-inner">
          <span className="tb-wordmark tb-footer-mark">
            TYPEBEAT<span>OS</span>
          </span>
          <span className="tb-footer-copy">
            © 2026 TypeBeatOS. Not affiliated with YouTube, BeatStars, or any artist
            mentioned.
          </span>
        </div>
      </footer>

      <WaitlistEffects />
    </div>
  );
}
