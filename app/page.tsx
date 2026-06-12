import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/lib/auth";
import { Faq } from "./Faq";

export default async function Landing() {
  const user = await getUser();
  const cta = user ? "/dashboard" : "/signup";
  const ctaLabel = user ? "Open dashboard" : "Join the Beta";

  return (
    <div className="marketing-page">
      {/* ---------------- Navbar ---------------- */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="logo marketing-logo" aria-label="TypeBeatOS home">
            <span className="logo-mark" aria-hidden="true">
              TB
            </span>
            <span className="logo-word">
              TypeBeat<span>OS</span>
            </span>
          </Link>
          <div className="nav-links">
            <a href="#product" className="nav-link nav-link-public">
              Product
            </a>
            <a href="#workflow" className="nav-link nav-link-public">
              How it works
            </a>
            <a href="#pricing" className="nav-link nav-link-public">
              Pricing
            </a>
            <a href="#faq" className="nav-link nav-link-public">
              FAQ
            </a>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="nav-link">
                  Login
                </Link>
                <Link href="/signup" className="btn btn-primary btn-sm">
                  Join Waitlist
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ---------------- Hero ---------------- */}
      <header className="hero">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Built for type-beat producers
          </p>
          <h1>
            Upload a month of type beats
            <br />
            <span className="accent">in one sitting.</span>
          </h1>
          <p className="sub">
            TypeBeatOS turns finished beats into SEO-optimised YouTube uploads — titles,
            descriptions, tags, thumbnails, pinned comments, links, and schedules included.
          </p>
          <div className="hero-actions">
            <Link href={cta} className="btn btn-primary">
              {ctaLabel}
            </Link>
            <a href="#workflow" className="btn btn-ghost">
              See How It Works
            </a>
          </div>

          <div className="hero-badges">
            <span>Built for type-beat producers</span>
            <span>Batch upload workflow</span>
            <span>SEO-ready upload packs</span>
          </div>

          {/* Hero dashboard mockup */}
          <div className="hero-mock" aria-label="TypeBeatOS dashboard preview">
            <div className="mock-window">
              <div className="mock-bar">
                <span />
                <span />
                <span />
                <p className="mock-url">app.typebeatos.com / upload-pack</p>
              </div>
              <div className="mock-grid">
                {/* Queue column */}
                <aside className="mock-queue">
                  <div className="mock-label">Beat queue</div>
                  <div className="queue-item active">
                    <span className="wave" aria-hidden="true">
                      <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                    </span>
                    <div>
                      <strong>late-night-rnb-beat.wav</strong>
                      <small>142 BPM · F minor</small>
                    </div>
                  </div>
                  <div className="queue-item">
                    <span className="wave" aria-hidden="true">
                      <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                    </span>
                    <div>
                      <strong>midnight-drive.wav</strong>
                      <small>128 BPM · A minor</small>
                    </div>
                  </div>
                  <div className="queue-item">
                    <span className="wave" aria-hidden="true">
                      <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                    </span>
                    <div>
                      <strong>no-ceilings.wav</strong>
                      <small>150 BPM · G minor</small>
                    </div>
                  </div>
                  <div className="mock-select">
                    Target artist
                    <strong>Drake x Brent Faiyaz</strong>
                  </div>
                </aside>

                {/* Center column */}
                <section className="mock-center">
                  <div className="mock-center-head">
                    <div>
                      <div className="mock-label">Generated title</div>
                      <h3>
                        Drake x Brent Faiyaz Type Beat - &quot;After Hours&quot; | Dark R&amp;B
                        Instrumental
                      </h3>
                    </div>
                    <div className="seo-score">
                      <strong>92</strong>
                      <small>SEO</small>
                    </div>
                  </div>
                  <div className="mock-desc">
                    <div className="mock-label">Description</div>
                    <p>
                      🎧 Dark R&amp;B type beat for Drake &amp; Brent Faiyaz. Purchase / lease on
                      BeatStars → link below. Free for non-profit, must credit (prod. yourname)…
                    </p>
                  </div>
                  <div className="mock-tags">
                    <span>drake type beat</span>
                    <span>brent faiyaz type beat</span>
                    <span>dark r&amp;b type beat</span>
                    <span>r&amp;b instrumental</span>
                  </div>
                </section>

                {/* Right column */}
                <aside className="mock-side">
                  <div className="thumb-preview">
                    <Image
                      src="/mockups/thumb-rnb.png"
                      alt="Generated YouTube thumbnail preview"
                      fill
                      sizes="220px"
                    />
                    <div className="thumb-text">
                      <span>TYPE BEAT</span>
                      <strong>AFTER HOURS</strong>
                    </div>
                  </div>
                  <div className="mock-schedule">
                    <div className="mock-label">Scheduled</div>
                    <div className="sched-row">
                      <span>Wed</span>
                      <strong>6:00 PM</strong>
                    </div>
                    <div className="status-pill">Scheduled to YouTube</div>
                  </div>
                </aside>
              </div>
            </div>
            <div className="hero-glow" aria-hidden="true" />
          </div>
        </div>
      </header>

      {/* ---------------- Problem ---------------- */}
      <section className="problem">
        <div className="container">
          <h2>
            The beat is done.
            <br />
            The YouTube grind isn&apos;t.
          </h2>
          <p className="section-sub">
            Every upload means doing the same admin again — and again, and again.
          </p>
          <div className="problem-grid">
            <div className="prob-card">
              <span className="prob-num">01</span>
              <h3>Writing titles every time</h3>
              <p>Rewording the same artist keywords for every single beat.</p>
            </div>
            <div className="prob-card">
              <span className="prob-num">02</span>
              <h3>Making thumbnails</h3>
              <p>Opening the editor and rebuilding your layout from scratch.</p>
            </div>
            <div className="prob-card">
              <span className="prob-num">03</span>
              <h3>Adding links and license info</h3>
              <p>Pasting BeatStars, Airbit, and licensing terms into every description.</p>
            </div>
            <div className="prob-card">
              <span className="prob-num">04</span>
              <h3>Finding tags and hashtags</h3>
              <p>Hunting for the right searchable tags for each artist and mood.</p>
            </div>
            <div className="prob-card">
              <span className="prob-num">05</span>
              <h3>Scheduling uploads</h3>
              <p>Manually spacing posts so your channel stays consistent.</p>
            </div>
            <div className="prob-card">
              <span className="prob-num">06</span>
              <h3>Staying consistent</h3>
              <p>Keeping the rhythm up when the admin keeps eating your time.</p>
            </div>
          </div>
          <p className="problem-punch">
            TypeBeatOS turns that entire workflow into{" "}
            <span className="accent">one repeatable system.</span>
          </p>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="how" id="workflow">
        <div className="container">
          <h2>From beat file to scheduled upload</h2>
          <p className="section-sub">Four steps. One sitting. A full month of content.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <h3>Upload your beat</h3>
              <p>Add beat name, BPM, key, genre, mood, and target artist.</p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h3>Generate the upload pack</h3>
              <p>
                TypeBeatOS creates SEO titles, descriptions, tags, hashtags, thumbnails, and pinned
                comments.
              </p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h3>Schedule your content</h3>
              <p>Spread beats across your YouTube calendar automatically.</p>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <h3>Focus on making more beats</h3>
              <p>Your YouTube side stays consistent while you work on music.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Main product mockup ---------------- */}
      <section className="product" id="product">
        <div className="container">
          <h2>One workspace for the whole upload pack</h2>
          <p className="section-sub">
            Everything for a beat&apos;s YouTube upload lives in a single, editable view.
          </p>

          <div className="app-mock">
            {/* Sidebar */}
            <aside className="app-sidebar">
              <div className="app-logo">
                <span className="logo-mark" aria-hidden="true">
                  TB
                </span>
                TypeBeatOS
              </div>
              <nav className="app-nav">
                <span className="app-nav-item active">Dashboard</span>
                <span className="app-nav-item">Beat Queue</span>
                <span className="app-nav-item">Upload Packs</span>
                <span className="app-nav-item">Calendar</span>
                <span className="app-nav-item">Templates</span>
                <span className="app-nav-item">Analytics</span>
                <span className="app-nav-item">Settings</span>
              </nav>
            </aside>

            {/* Main area */}
            <div className="app-main-area">
              <div className="app-topbar">
                <h3>New Upload Pack</h3>
                <span className="btn btn-primary btn-sm">Generate pack</span>
              </div>

              <div className="app-fields">
                <div className="app-field">
                  <small>Audio file</small>
                  <strong>late-night-rnb-beat.wav</strong>
                </div>
                <div className="app-field">
                  <small>Target artist</small>
                  <strong>Drake x Brent Faiyaz</strong>
                </div>
                <div className="app-field">
                  <small>Mood</small>
                  <strong>Dark R&amp;B</strong>
                </div>
                <div className="app-field">
                  <small>BPM</small>
                  <strong>142</strong>
                </div>
                <div className="app-field">
                  <small>Key</small>
                  <strong>F minor</strong>
                </div>
                <div className="app-field">
                  <small>Genre</small>
                  <strong>R&amp;B / Soul</strong>
                </div>
              </div>

              <div className="app-thumb">
                <Image
                  src="/mockups/thumb-trap.png"
                  alt="Beat thumbnail preview inside dashboard"
                  fill
                  sizes="(max-width: 900px) 100vw, 520px"
                />
                <div className="thumb-text">
                  <span>DRAKE x BRENT FAIYAZ TYPE BEAT</span>
                  <strong>AFTER HOURS</strong>
                  <small>prod. yourname</small>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <aside className="app-panel">
              <div className="seo-block">
                <div className="seo-ring">
                  <strong>92</strong>
                  <small>/100</small>
                </div>
                <div>
                  <p className="app-panel-label">SEO Score</p>
                  <p className="seo-note">Strong keyword match</p>
                </div>
              </div>

              <div className="app-panel-section">
                <p className="app-panel-label">Title suggestion</p>
                <p className="app-title-sug">
                  Drake x Brent Faiyaz Type Beat - &quot;After Hours&quot; | Dark R&amp;B
                  Instrumental
                </p>
              </div>

              <div className="app-panel-section">
                <p className="app-panel-label">Tags</p>
                <div className="app-tags">
                  <span>drake type beat</span>
                  <span>brent faiyaz type beat</span>
                  <span>dark r&amp;b type beat</span>
                  <span>r&amp;b instrumental</span>
                </div>
              </div>

              <div className="app-panel-section">
                <p className="app-panel-label">Schedule</p>
                <div className="app-sched">
                  <span>Wednesday</span>
                  <strong>6:00 PM</strong>
                </div>
                <div className="status-pill">Scheduled to YouTube</div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ---------------- Feature grid ---------------- */}
      <section className="features" id="features">
        <div className="container">
          <h2>Everything producers repeat, automated into one workflow</h2>
          <p className="section-sub">The full type-beat upload system — not generic scheduling.</p>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">SEO</div>
              <h3>SEO Title Generator</h3>
              <p>Generate type-beat titles built around artist keywords and search intent.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">TXT</div>
              <h3>Description Templates</h3>
              <p>
                Save your BeatStars, Airbit, Instagram, email, licensing, and discount links once.
              </p>
            </div>
            <div className="feature">
              <div className="feature-icon">#</div>
              <h3>Tags &amp; Hashtags</h3>
              <p>Auto-generate relevant tags based on artist, genre, mood, BPM, and key.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">IMG</div>
              <h3>Thumbnail Builder</h3>
              <p>Create clean YouTube-ready beat thumbnails using saved visual templates.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">CAL</div>
              <h3>Upload Calendar</h3>
              <p>Batch schedule beats across weeks or months.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">PIN</div>
              <h3>Pinned Comment Generator</h3>
              <p>Create CTA comments that drive people to your beat store.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">PRO</div>
              <h3>Producer Profile</h3>
              <p>Save your default branding, links, license terms, and upload format.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">DTA</div>
              <h3>Analytics Ready</h3>
              <p>Later: track which artist keywords and upload styles perform best.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Integrations ---------------- */}
      <section className="integrations" id="integrations">
        <div className="container">
          <h2>Built around the platforms producers already use</h2>
          <p className="section-sub">
            TypeBeatOS slots into your existing setup — no rip-and-replace.
          </p>
          <div className="integrations-grid">
            <div className="integration">
              <span className="int-logo int-youtube">YouTube</span>
              <p>Upload packs formatted for YouTube Studio.</p>
            </div>
            <div className="integration">
              <span className="int-logo">BeatStars</span>
              <p>Drop your store and license links into every description.</p>
            </div>
            <div className="integration">
              <span className="int-logo">Airbit</span>
              <p>Add Airbit purchase links alongside your other stores.</p>
            </div>
            <div className="integration">
              <span className="int-logo">Drive / Dropbox</span>
              <p>Pull finished beat files straight from cloud storage.</p>
            </div>
            <div className="integration">
              <span className="int-logo">Stripe</span>
              <p>Optional later — manage your TypeBeatOS subscription.</p>
            </div>
          </div>
          <p className="disclaimer">
            Platform names and logos are used for identification only. TypeBeatOS is not affiliated
            with or endorsed by YouTube, BeatStars, or Airbit. All trademarks belong to their
            respective owners.
          </p>
        </div>
      </section>

      {/* ---------------- Beta / social proof ---------------- */}
      <section className="beta">
        <div className="container">
          <h2>Built with producers, not guessed in a boardroom</h2>
          <p className="section-sub">
            This is early. We&apos;d rather be honest about that than fake testimonials.
          </p>
          <div className="beta-grid">
            <div className="beta-card">
              <h3>Founder is a music producer</h3>
              <p>Built by someone who lives the same upload grind every week.</p>
            </div>
            <div className="beta-card">
              <h3>Designed around real workflows</h3>
              <p>Modelled on how type-beat producers actually publish to YouTube.</p>
            </div>
            <div className="beta-card">
              <h3>Beta users shape the system</h3>
              <p>Your feedback directly influences what gets built next.</p>
            </div>
            <div className="beta-card">
              <h3>Discounted lifetime pricing</h3>
              <p>Early users lock in founding-member rates for good.</p>
            </div>
          </div>
          <Link href={cta} className="btn btn-primary">
            Join the Producer Beta
          </Link>
        </div>
      </section>

      {/* ---------------- Pricing ---------------- */}
      <section className="pricing" id="pricing">
        <div className="container">
          <h2>Founding member pricing</h2>
          <p className="section-sub">Start free. Upgrade when the uploads start stacking.</p>
          <div className="pricing-grid">
            <div className="plan">
              <h3>Free</h3>
              <div className="price">
                $0<span>/mo</span>
              </div>
              <ul>
                <li>3 upload packs / month</li>
                <li>Basic SEO title generator</li>
                <li>Manual export</li>
                <li>Basic templates</li>
              </ul>
              <Link href={cta} className="btn btn-ghost">
                Start Free
              </Link>
            </div>
            <div className="plan">
              <h3>Starter</h3>
              <div className="price">
                $9<span>/mo</span>
              </div>
              <ul>
                <li>20 upload packs / month</li>
                <li>Titles, descriptions, tags</li>
                <li>Thumbnail templates</li>
                <li>Upload calendar</li>
              </ul>
              <Link href={cta} className="btn btn-ghost">
                Start Free
              </Link>
            </div>
            <div className="plan plan-featured">
              <div className="plan-badge">Most popular</div>
              <h3>Pro</h3>
              <div className="price">
                $19<span>/mo</span>
              </div>
              <ul>
                <li>60 upload packs / month</li>
                <li>Batch upload queue</li>
                <li>Saved templates</li>
                <li>YouTube integration when available</li>
              </ul>
              <Link href={cta} className="btn btn-primary">
                Join the Beta
              </Link>
            </div>
            <div className="plan">
              <h3>Serious Producer</h3>
              <div className="price">
                $29<span>/mo</span>
              </div>
              <ul>
                <li>150 upload packs / month</li>
                <li>Advanced templates</li>
                <li>Multi-channel support</li>
                <li>Analytics when available</li>
              </ul>
              <Link href={cta} className="btn btn-ghost">
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="faq" id="faq">
        <div className="container container-narrow">
          <h2>Questions, answered straight</h2>
          <p className="section-sub">No overpromising. Here&apos;s exactly what TypeBeatOS does.</p>
          <Faq />
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="final-cta" id="signup">
        <div className="container">
          <h2>
            Stop letting finished beats
            <br />
            <span className="accent">sit in folders.</span>
          </h2>
          <p className="sub">
            Turn them into scheduled, SEO-optimised YouTube uploads and stay consistent without
            doing the boring admin every time.
          </p>
          <div className="hero-actions">
            <Link href={cta} className="btn btn-primary">
              {ctaLabel}
            </Link>
            <a href="#workflow" className="btn btn-ghost">
              View Demo Workflow
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="logo marketing-logo">
                <span className="logo-mark" aria-hidden="true">
                  TB
                </span>
                <span className="logo-word">
                  TypeBeat<span>OS</span>
                </span>
              </span>
              <p>Make beats. TypeBeatOS handles the YouTube upload system.</p>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <strong>Product</strong>
                <a href="#product">Overview</a>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
              </div>
              <div className="footer-col">
                <strong>Company</strong>
                <a href="#faq">FAQ</a>
                <a href="mailto:hello@typebeatos.com">Contact</a>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 TypeBeatOS. All rights reserved.</p>
            <p className="footer-disclaimer">
              Platform names and logos are used for identification only. TypeBeatOS is not
              affiliated with or endorsed by YouTube, BeatStars, Airbit, or any artist mentioned.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
