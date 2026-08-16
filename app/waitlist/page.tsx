import type { Metadata } from "next";
import Link from "next/link";
import WaitlistForm from "./WaitlistForm";
import TbPageEffects from "../TbPageEffects";
import PublicNav from "../PublicNav";
import "../marketing.css";

export const metadata: Metadata = {
  title: "TypeBeatOS — The YouTube Upload System for Type-Beat Producers",
  description:
    "Turn finished beats into SEO-optimised, scheduled YouTube uploads. Join the waitlist for early access to TypeBeatOS.",
  alternates: { canonical: "/waitlist" },
};

const STEPS = [
  { n: "1", t: "Drop your beat", b: "Upload the finished file. BPM and key auto-detect. Tag the target artist, genre and mood." },
  { n: "2", t: "Generate the upload pack", b: "SEO title, description, tags, thumbnail and rendered MP4 — produced in a single pass." },
  { n: "3", t: "Schedule to YouTube", b: "Connect your channel once. Space uploads across the week and publish on autopilot." },
];

const PERKS = [
  "Unlimited beats + SEO packs",
  "Auto-rendered MP4 with your thumbnail",
  "Direct scheduled YouTube publishing",
  "Auto BPM & key detection",
  "Title structures tuned to ranking artists",
];

const MARQUEE = [
  "Drake type beat",
  "Travis Scott type beat",
  "SEO-ready uploads",
  "Auto BPM + key",
  "Schedule the month",
  "Make beats, not metadata",
];

export default function WaitlistPage() {
  return (
    <div className="tb-page" data-testid="waitlist-page">
      {/* ambient red glow + grain */}
      <div className="tb-glow-layer" aria-hidden="true">
        <div className="tb-glow tb-glow-left" />
        <div className="tb-glow tb-glow-right" />
      </div>
      <div className="tb-grain" aria-hidden="true" />

      <PublicNav
        testId="waitlist-nav"
        homeHref="/"
        trackSections
        links={[
          {
            href: "#how",
            label: "How it works",
            sectionId: "how",
            testId: "nav-link-how",
          },
          {
            href: "#beta",
            label: "Beta access",
            sectionId: "beta",
            testId: "nav-link-beta",
          },
        ]}
        action={{
          href: "#join",
          label: "Join waitlist",
          tone: "primary",
          testId: "nav-cta-join",
        }}
      />

      {/* HERO */}
      <section className="tb-hero tb-hero-center">

        <h1 className="tb-h1" data-testid="waitlist-hero-title">
          <span className="tb-line"><span>The YouTube</span></span>
          <span className="tb-line"><span>upload system</span></span>
          <span className="tb-line"><span>for <span className="tb-red">type-beat</span></span></span>
          <span className="tb-line"><span>producers.</span></span>
        </h1>

        <div className="tb-hero-grid">
          <p className="tb-hero-sub">
            Drop in a finished beat. TypeBeatOS writes the SEO pack, renders the video and
            schedules it to your channel. Built for producers who&apos;d rather make beats than
            chase metadata.
          </p>

          <WaitlistForm id="join" cta="Join waitlist" />
        </div>

        {/* stats strip */}
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

      {/* MARQUEE STRIP */}
      <div className="tb-marquee" aria-hidden="true">
        <div className="tb-marquee-track">
          {[0, 1].map((dup) => (
            <div key={dup} className="tb-marquee-text">
              {MARQUEE.map((m) => (
                <span key={`${dup}-${m}`}>{m}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" className="tb-section">
        <div className="tb-section-head tb-reveal">
          <h2 className="tb-h2">
            How it <span className="tb-red">works</span>
          </h2>
          <p className="tb-section-sub">
            From raw beat to scheduled YouTube upload in under three minutes. No editor. No
            spreadsheet. No copy-paste.
          </p>
        </div>

        <div className="tb-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="tb-step tb-reveal"
              data-delay={String(i + 1)}
              data-testid={`waitlist-step-${s.n}`}
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

      {/* BETA */}
      <section id="beta" className="tb-section">
        <div className="tb-beta-grid">
          <div className="tb-reveal">
            <div className="tb-kicker">Beta access</div>
            <h2 className="tb-h2 tb-h2-left">
              Free during <br />
              <span className="tb-red">private beta.</span>
            </h2>
            <p className="tb-beta-sub">
              First 200 producers off the waitlist get the full app at no cost while we build.
              Locked in at half price for life when we launch.
            </p>
          </div>

          <ul className="tb-perks tb-reveal" data-delay="1">
            {PERKS.map((p) => (
              <li key={p} className="tb-perk">
                <span className="tb-perk-dot" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="tb-final tb-reveal">
        <h2 className="tb-final-h2">
          Upload less. <br />
          <span className="tb-red">Release more.</span>
        </h2>
        <a href="#join" className="tb-final-btn" data-testid="waitlist-final-cta">
          Join the waitlist
        </a>
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
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </span>
          <span className="tb-footer-copy">© 2026 — Built for producers, by producers.</span>
        </div>
      </footer>

      <TbPageEffects />
    </div>
  );
}
