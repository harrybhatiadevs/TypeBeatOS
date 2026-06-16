import type { Metadata } from "next";
import Link from "next/link";
import WaitlistForm from "./WaitlistForm";
import Reveal from "./Reveal";
import "./waitlist.css";

export const metadata: Metadata = {
  title: "TypeBeatOS — Join the waitlist",
  description:
    "The YouTube upload system for type-beat producers. Turn finished beats into SEO-optimised, scheduled YouTube uploads. Join the waitlist for early access.",
};

const STEPS = [
  { n: "1", t: "Drop in your beats", b: "Add finished beats with target artist, genre, and mood. BPM and key auto-detect from the audio." },
  { n: "2", t: "Generate the package", b: "SEO titles, description, tags, thumbnail, and video — produced in one pass." },
  { n: "3", t: "Schedule & publish", b: "Spread uploads across your calendar and publish straight to YouTube on schedule." },
];

const BENEFITS = [
  { icon: "🎯", t: "SEO titles that rank", b: "Real type-beat title structures with artist keywords, built to get found in search." },
  { icon: "🎹", t: "Auto BPM & key detection", b: "Drop in a beat and its tempo and key flow into your tags and description." },
  { icon: "🎬", t: "Video rendered for you", b: "Your beat and thumbnail become a YouTube-ready MP4 — no editor needed." },
  { icon: "▶️", t: "Direct scheduled upload", b: "Connect once and publish straight to your channel, scheduled to your rhythm." },
];

export default function WaitlistPage() {
  return (
    <div className="marketing-page wl-page">
      <div className="wl-aurora" aria-hidden="true" />

      <nav className="nav">
        <div className="nav-inner">
          <Link href="/waitlist" className="logo marketing-logo" aria-label="TypeBeatOS home">
            <span className="logo-mark" aria-hidden="true">TB</span>
            <span className="logo-word">TypeBeat<span>OS</span></span>
          </Link>
          <div className="nav-links">
            <a href="#how" className="nav-link nav-link-public">How it works</a>
            <a href="#benefits" className="nav-link nav-link-public">Benefits</a>
            <a href="#join" className="btn btn-primary btn-sm">Join waitlist</a>
          </div>
        </div>
      </nav>

      {/* HERO — the one and only email capture */}
      <header className="wl-hero" id="join">
        <div className="container wl-hero-inner">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Early access waitlist
          </p>
          <h1 className="wl-h1">
            The YouTube upload system
            <br />
            <span className="accent">for type-beat producers.</span>
          </h1>
          <p className="wl-sub">
            Turn finished beats into SEO-optimised, scheduled YouTube uploads — titles, tags,
            thumbnails, video, and publishing handled.
          </p>

          <div className="wl-hero-form">
            <WaitlistForm cta="Join waitlist" />
          </div>

          <p className="wl-secondary">
            <a href="#how">See how it works</a>
          </p>
          <p className="wl-proof-text">
            Built for producers who want to stay consistent on YouTube.
          </p>

          {/* Compact product preview — a single contained card */}
          <div className="wl-preview" aria-hidden="true">
            <div className="wl-card">
              <div className="wl-card-head">
                <span className="wl-card-kicker">Upload package</span>
                <span className="wl-badge-ready">Ready</span>
              </div>
              <div className="wl-card-title">Drake Type Beat — &quot;Midnight Run&quot;</div>
              <div className="wl-wave">
                {Array.from({ length: 32 }).map((_, i) => (
                  <span key={i} style={{ animationDelay: `${(i % 16) * 80}ms` }} />
                ))}
              </div>
              <div className="wl-chips">
                <span>142 BPM</span><span>A minor</span><span>R&amp;B Trap</span>
              </div>
              <div className="wl-card-stats">
                <div>
                  <span className="wl-stat-label">Scheduled</span>
                  <strong className="wl-stat-val">Fri · 6:00 PM</strong>
                </div>
                <div>
                  <span className="wl-stat-label">SEO score</span>
                  <strong className="wl-stat-val">94<small>/100</small></strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section className="wl-section" id="how">
        <div className="container">
          <Reveal className="wl-head">
            <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />Three steps</p>
            <h2 className="wl-h2">From beat file to scheduled upload.</h2>
          </Reveal>
          <div className="wl-steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 80} className="wl-step">
                <div className="wl-step-num">{s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="wl-section wl-section-alt" id="benefits">
        <div className="container">
          <Reveal className="wl-head">
            <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />Why producers want it</p>
            <h2 className="wl-h2">Built for the type-beat workflow.</h2>
          </Reveal>
          <div className="wl-benefits">
            {BENEFITS.map((f, i) => (
              <Reveal key={f.t} delay={i * 60} className="wl-benefit">
                <div className="wl-benefit-icon">{f.icon}</div>
                <h3>{f.t}</h3>
                <p>{f.b}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA — scrolls back to the hero form, no second input */}
      <section className="wl-final">
        <div className="container">
          <Reveal className="wl-final-card">
            <h2 className="wl-h2">Make the beats.<br /><span className="accent">We handle YouTube.</span></h2>
            <p className="wl-sub">Join the waitlist and be first through the door.</p>
            <a href="#join" className="btn btn-primary wl-final-btn">Join waitlist</a>
          </Reveal>
        </div>
      </section>

      <footer className="footer wl-footer">
        <div className="container">
          <span className="logo marketing-logo">
            <span className="logo-mark" aria-hidden="true">TB</span>
            <span className="logo-word">TypeBeat<span>OS</span></span>
          </span>
          <p>© 2026 TypeBeatOS. Not affiliated with YouTube, BeatStars, or any artist mentioned.</p>
        </div>
      </footer>
    </div>
  );
}
