import type { Metadata } from "next";
import Link from "next/link";
import { waitlistCount } from "@/lib/actions/waitlist";
import WaitlistForm from "./WaitlistForm";
import Reveal from "./Reveal";
import CountUp from "./CountUp";
import "./waitlist.css";

export const metadata: Metadata = {
  title: "TypeBeatOS — Join the waitlist",
  description:
    "The YouTube upload system for type-beat producers. Batch your beats into SEO-optimised, scheduled uploads. Join the waitlist for early access and beta invites.",
};

const ARTISTS = [
  "Drake type beat",
  "Travis Scott type beat",
  "Lil Baby type beat",
  "Brent Faiyaz type beat",
  "Gunna type beat",
  "PARTYNEXTDOOR type beat",
  "Future type beat",
  "Central Cee type beat",
  "Rod Wave type beat",
  "Metro Boomin type beat",
];

const FEATURES = [
  {
    icon: "🎯",
    title: "SEO titles that rank",
    body: "Real type-beat title structures — artist keywords, beat name, genre tag — generated in seconds and built to get found in search.",
  },
  {
    icon: "🎹",
    title: "Auto BPM & key detection",
    body: "Drop in your beat and TypeBeatOS detects the tempo and key from the audio, straight into your description and tags.",
  },
  {
    icon: "🖼️",
    title: "On-brand thumbnails",
    body: "Generate consistent, click-worthy thumbnails with your producer tag and the parental-advisory look the niche expects.",
  },
  {
    icon: "🎬",
    title: "Video rendered for you",
    body: "Your beat + thumbnail become a YouTube-ready MP4 — static or animated waveform — without touching an editor.",
  },
  {
    icon: "▶️",
    title: "Direct scheduled upload",
    body: "Connect your channel once. Push finished packages straight to YouTube, scheduled to publish on your posting rhythm.",
  },
  {
    icon: "📈",
    title: "Know what's working",
    body: "Views, keywords, and best upload days per beat — so you double down on the artists that actually move.",
  },
];

const STEPS = [
  { n: "1", t: "Drop in your beats", b: "Batch-add finished beats with target artist, genre, and mood. BPM and key auto-detect." },
  { n: "2", t: "Generate the package", b: "SEO titles, description with your links, tags, pinned comment, thumbnail, and video — all at once." },
  { n: "3", t: "Schedule the month", b: "Auto-spread uploads across your calendar and publish straight to YouTube on schedule." },
];

const PERKS = [
  "Free founding-member access during beta",
  "Locked-in pricing when we launch",
  "Direct line to shape the roadmap",
  "First to get YouTube auto-upload",
];

export default async function WaitlistPage() {
  let count = 0;
  try {
    count = await waitlistCount();
  } catch {
    count = 0;
  }
  const displayCount = 250 + count; // seed so early signups don't see "1"

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
            <a href="#features" className="nav-link nav-link-public">Features</a>
            <a href="#how" className="nav-link nav-link-public">How it works</a>
            <a href="#beta" className="nav-link nav-link-public">Beta</a>
            <a href="#join" className="btn btn-primary btn-sm">Join waitlist</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="wl-hero" id="join">
        <div className="container wl-hero-inner">
          <p className="eyebrow wl-eyebrow">
            <span className="eyebrow-dot live" aria-hidden="true" />
            Now accepting beta testers
          </p>
          <h1 className="wl-h1">
            The YouTube upload system
            <br />
            <span className="accent wl-shimmer">for type-beat producers.</span>
          </h1>
          <p className="wl-sub">
            Turn finished beats into SEO-optimised, scheduled YouTube uploads — titles, tags,
            thumbnails, video, and direct publishing. Make the beats. We handle the upload grind.
          </p>

          <div className="wl-hero-form">
            <WaitlistForm variant="hero" role="producer" cta="Get early access" />
          </div>

          <div className="wl-proof">
            <div className="wl-avatars" aria-hidden="true">
              <span>JD</span><span>RW</span><span>TS</span><span>BF</span>
            </div>
            <span className="wl-proof-text">
              Join <strong><CountUp to={displayCount} />+</strong> producers on the waitlist
            </span>
          </div>

          {/* Floating animated product cards */}
          <div className="wl-stage" aria-hidden="true">
            <div className="wl-card wl-card-pkg float-a">
              <div className="wl-card-head">
                <span>Upload package</span>
                <span className="wl-badge-ready">Ready</span>
              </div>
              <div className="wl-card-title">Drake Type Beat — &quot;Midnight Run&quot;</div>
              <div className="wl-wave">
                {Array.from({ length: 28 }).map((_, i) => (
                  <span key={i} style={{ animationDelay: `${(i % 14) * 90}ms` }} />
                ))}
              </div>
              <div className="wl-chips">
                <span>142 BPM</span><span>A minor</span><span>R&amp;B Trap</span>
              </div>
            </div>

            <div className="wl-card wl-card-mini float-b">
              <span className="wl-mini-label">Scheduled</span>
              <strong className="wl-mini-val">Fri · 6:00 PM</strong>
            </div>

            <div className="wl-card wl-card-mini float-c">
              <span className="wl-mini-label">SEO score</span>
              <strong className="wl-mini-val">94<small>/100</small></strong>
            </div>
          </div>
        </div>
      </header>

      {/* MARQUEE */}
      <div className="wl-marquee" aria-hidden="true">
        <div className="wl-marquee-track">
          {[...ARTISTS, ...ARTISTS].map((a, i) => (
            <span key={i} className="wl-marquee-item">{a}<i>✦</i></span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="wl-section" id="features">
        <div className="container">
          <Reveal>
            <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />Everything in one place</p>
            <h2 className="wl-h2">Built for the type-beat workflow.<br />Not generic scheduling.</h2>
          </Reveal>
          <div className="wl-features">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 70} className="wl-feature">
                <div className="wl-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="wl-section wl-section-alt" id="how">
        <div className="container">
          <Reveal>
            <p className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />Three steps</p>
            <h2 className="wl-h2">From beat file to scheduled upload.</h2>
          </Reveal>
          <div className="wl-steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 90} className="wl-step">
                <div className="wl-step-num">{s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BETA */}
      <section className="wl-section" id="beta">
        <div className="container">
          <Reveal className="wl-beta">
            <div className="wl-beta-copy">
              <p className="eyebrow"><span className="eyebrow-dot live" aria-hidden="true" />Limited beta</p>
              <h2 className="wl-h2 left">Become a founding beta tester.</h2>
              <p className="wl-sub left">
                We&apos;re onboarding a small group of producers before launch. Get in early, shape
                what gets built, and lock in founding pricing for life.
              </p>
              <ul className="wl-perks">
                {PERKS.map((p) => (
                  <li key={p}><span aria-hidden="true">✓</span>{p}</li>
                ))}
              </ul>
            </div>
            <div className="wl-beta-form">
              <h3>Apply for beta access</h3>
              <p>Drop your email — invites go out in waves.</p>
              <WaitlistForm role="beta" cta="Request beta invite" placeholder="you@email.com" />
              <p className="wl-fineprint">No spam. Just your invite and launch updates.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="wl-section wl-final">
        <div className="container">
          <Reveal className="wl-final-card">
            <h2 className="wl-h2">Make the beats.<br /><span className="accent wl-shimmer">We handle YouTube.</span></h2>
            <p className="wl-sub">Join the waitlist and be first through the door.</p>
            <div className="wl-hero-form center">
              <WaitlistForm variant="hero" role="producer" cta="Join the waitlist" />
            </div>
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
