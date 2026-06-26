import Link from "next/link";
import { getUser } from "@/lib/auth";
import TbPageEffects from "./TbPageEffects";
import "./marketing.css";

const STEPS = [
  {
    n: "01",
    t: "Upload the beat",
    b: "Drop the WAV or MP3 and choose the artist lane.",
  },
  {
    n: "02",
    t: "Review the draft",
    b: "Check the title, tags, description, visuals, and video.",
  },
  {
    n: "03",
    t: "Schedule it",
    b: "Send it to YouTube as a private draft or scheduled upload.",
  },
];

const OLD_WORKFLOW = [
  "Thumbnail",
  "Visualizer",
  "Key + BPM",
  "Tags",
  "YouTube upload",
];

const NEW_WORKFLOW = [
  "Upload beat",
  "Review output",
  "Schedule upload",
];

const OUTPUTS = [
  ["Key + BPM", "F minor / 142 BPM", "Detected from the beat before the copy is written."],
  ["Title", "search-ready", "[FREE] Future Type Beat - \"No Mercy\" | Dark Trap Instrumental 2026"],
  ["Tags", "editable", "metro boomin type beat, dark trap beat, 142 bpm, f minor"],
  ["Description", "profile links", "BeatStars, license notes, BPM, key, email, and socials included."],
  ["Visuals", "thumbnail + MP4", "Cover image and video render stay with the same upload."],
  ["YouTube", "draft", "Private draft waits for your approval before publish."],
];

const RECEIPT_LINES = [
  ["Title", "[FREE] Future Type Beat - \"No Mercy\" | Dark Trap Instrumental 2026"],
  ["Key / BPM", "F minor · 142 BPM"],
  [
    "Description",
    [
      "Purchase / lease: BeatStars link from producer profile",
      "BPM: 142 | Key: F minor",
      "Contact: email and socials from profile",
    ],
  ],
  [
    "Tags",
    "future type beat, metro boomin type beat, dark trap beat, trap instrumental, 142 bpm, f minor beat, melodic trap type beat",
  ],
  ["Schedule", "Tuesday · 7:00 PM · YouTube draft"],
];

const PACK_PROOF = [
  "approve before posting",
  "links included",
  "private YouTube draft",
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    cycle: "/mo",
    perks: ["3 packs / mo", "Titles + descriptions", "Manual export"],
    featured: false,
  },
  {
    name: "Starter",
    price: "$9",
    cycle: "/mo",
    perks: ["20 packs / mo", "Titles + tags", "Thumbnail builder", "Calendar"],
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    cycle: "/mo",
    perks: ["60 packs / mo", "Batch queue", "YouTube publish", "Templates"],
    featured: true,
  },
  {
    name: "Serious",
    price: "$29",
    cycle: "/mo",
    perks: ["150 packs / mo", "Multiple channels", "Analytics", "Advanced templates"],
    featured: false,
  },
];

export default async function Landing() {
  const user = await getUser();
  const ctaHref = user ? "/dashboard" : "/signup";
  const ctaLabel = user ? "Open dashboard" : "Start free";

  return (
    <div className="tb-page" data-testid="landing-page">
      {/* ambient red glow + grain */}
      <div className="tb-glow-layer" aria-hidden="true">
        <div className="tb-glow tb-glow-left" />
        <div className="tb-glow tb-glow-right" />
      </div>
      <div className="tb-grain" aria-hidden="true" />

      <nav className="tb-nav" data-testid="landing-nav">
        <Link href="/" className="tb-brand" aria-label="TypeBeatOS home">
          <span className="tb-badge" aria-hidden="true" />
          <span className="tb-wordmark">
            TYPEBEAT<span>OS</span>
          </span>
        </Link>
        <div className="tb-nav-links">
          <a href="#outputs" className="tb-nav-link">Outputs</a>
          <a href="#workflow" className="tb-nav-link">Flow</a>
          <a href="#pricing" className="tb-nav-link">Pricing</a>
        </div>
        {user ? (
          <Link href="/dashboard" className="tb-nav-cta">Open app</Link>
        ) : (
          <Link href="/login" className="tb-nav-cta">Log in</Link>
        )}
      </nav>

      <section className="tb-hero tb-hero-product">
        <div className="tb-hero-copy">
          <h1 className="tb-h1" aria-label="Beats in. Uploads out.">
            <span className="tb-line"><span>Beats in. </span></span>
            <span className="tb-line">
              <span className="tb-red">Uploads out.</span>
            </span>
          </h1>

          <p className="tb-hero-sub">
            One beat becomes a thumbnail, MP4, SEO pack, and scheduled YouTube draft.
          </p>

          <div className="tb-transport" data-transport aria-label="Upload flow controls">
            <button
              type="button"
              className="tb-transport-btn"
              data-transport-toggle
              aria-label="Pause upload flow"
              aria-pressed="false"
            >
              <span className="tb-transport-pause" aria-hidden="true" />
              <span className="tb-transport-play" aria-hidden="true" />
            </button>
            <span className="tb-record-dot" aria-hidden="true" />
            <span className="tb-transport-label">beat to YouTube</span>
            <span className="tb-transport-track" aria-hidden="true">
              <span className="tb-transport-progress" />
            </span>
            <span className="tb-transport-time">00:42</span>
          </div>

          <div className="tb-hero-actions">
            <Link href={ctaHref} className="tb-final-btn">{ctaLabel}</Link>
            <a href="#outputs" className="tb-cta-ghost">See outputs</a>
          </div>
        </div>
      </section>

      <section id="outputs" className="tb-section tb-proof">
        <div className="tb-proof-copy tb-reveal">
          <p className="tb-kicker">Output preview</p>
          <h2 className="tb-proof-title">
            Your upload draft.
          </h2>
          <p className="tb-section-sub">
            Title, tags, description, key, BPM, visuals, and schedule in one place.
          </p>
        </div>

        <div className="tb-receipt tb-reveal" data-receipt data-delay="1" aria-label="Generated upload draft">
          <div className="tb-receipt-top">
            <span>TYPEBEATOS / OUTPUT</span>
            <span data-generating-status>waiting</span>
          </div>

          <div className="tb-receipt-list">
            {RECEIPT_LINES.map(([label, value]) => (
              <div key={label} className="tb-receipt-row" data-receipt-row>
                <span>{label}</span>
                {Array.isArray(value) ? (
                  <div className="tb-receipt-stack">
                    {value.map((line) => (
                      <p key={line}>
                        <span data-type-target data-type-text={line}>{line}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p>
                    <span data-type-target data-type-text={value}>{value}</span>
                  </p>
                )}
              </div>
            ))}
            <div className="tb-receipt-row tb-receipt-muted" data-receipt-row>
              <span>Visuals</span>
              <p>
                <span
                  data-type-target
                  data-type-text="Cover image and MP4 render ready to review."
                >
                  Cover image and MP4 render ready to review.
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="tb-proof-strip tb-reveal" data-delay="2">
          {PACK_PROOF.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="tb-section tb-shift">
        <div className="tb-section-head tb-reveal">
          <h2 className="tb-h2 tb-h2-tight">
            Five jobs. One flow.
          </h2>
          <p className="tb-section-sub">
            Thumbnail, visualizer, key, tags, and YouTube upload stay together.
          </p>
        </div>

        <div className="tb-shift-grid tb-reveal" data-delay="1">
          <div className="tb-shift-list">
            <span>Before</span>
            {OLD_WORKFLOW.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          <div className="tb-shift-list tb-shift-list-active">
            <span>TypeBeatOS</span>
            {NEW_WORKFLOW.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="tb-section">
        <div className="tb-section-head tb-reveal">
          <h2 className="tb-h2 tb-h2-quiet">
            Everything you need to post.
          </h2>
          <p className="tb-section-sub">
            The useful parts stay visible, editable, and ready to approve.
          </p>
        </div>

        <div className="tb-output-grid">
          {OUTPUTS.map(([file, status, body], i) => (
            <div key={file} className="tb-output-item tb-reveal" data-delay={String((i % 4) + 1)}>
              <span>{file}</span>
              <strong>{status}</strong>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="tb-section">
        <div className="tb-section-head tb-reveal">
          <h2 className="tb-h2">
            The upload path.
          </h2>
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

      <section id="pricing" className="tb-section">
        <div className="tb-section-head tb-reveal">
          <h2 className="tb-h2">
            Founding member <br />
            <span className="tb-red">pricing.</span>
          </h2>
          <p className="tb-section-sub">
            Start free. Upgrade when uploads start stacking.
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

      <section className="tb-final tb-reveal">
        <h2 className="tb-final-h2">
          Ship the next <br />
          <span className="tb-red">upload.</span>
        </h2>
        <Link href={ctaHref} className="tb-final-btn">{ctaLabel}</Link>
      </section>

      <footer className="tb-footer">
        <div className="tb-footer-inner">
          <span className="tb-footer-brand">
            <span className="tb-badge" aria-hidden="true" />
            <span className="tb-wordmark tb-footer-mark">
              TYPEBEAT<span>OS</span>
            </span>
          </span>
          <span className="tb-footer-legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </span>
          <span className="tb-footer-copy">
            &copy; 2026 TypeBeatOS. Not affiliated with YouTube, BeatStars, or any artist
            mentioned.
          </span>
        </div>
      </footer>

      <TbPageEffects />
    </div>
  );
}
