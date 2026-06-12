import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/lib/auth";
import { Faq } from "./Faq";

export default async function Landing() {
  const user = await getUser();
  const cta = user ? "/dashboard" : "/signup";
  const ctaLabel = user ? "Open dashboard" : "Join the beta";

  return (
    <div className="marketing-page">
      {/* ---------------- Navbar ---------------- */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="marketing-logo" aria-label="TypeBeatOS home">
            <span className="logo-mark" aria-hidden="true">
              TB
            </span>
            <span className="logo-word">TypeBeatOS</span>
          </Link>
          <div className="nav-links">
            <a href="#product" className="nav-link nav-link-public">
              Product
            </a>
            <a href="#workflow" className="nav-link nav-link-public">
              Workflow
            </a>
            <a href="#pricing" className="nav-link nav-link-public">
              Pricing
            </a>
            <a href="#faq" className="nav-link nav-link-public">
              FAQ
            </a>
          </div>
          <div className="nav-actions">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="nav-link">
                  Log in
                </Link>
                <Link href="/signup" className="btn btn-primary btn-sm">
                  Join the beta
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
            For type-beat producers
          </p>
          <h1>
            Upload a month of type beats <span className="accent">in one sitting.</span>
          </h1>
          <p className="sub">
            TypeBeatOS turns a finished beat into a complete, SEO-ready YouTube upload — title,
            description, tags, thumbnail, pinned comment, and schedule — then queues a month of them
            at once.
          </p>
          <div className="hero-actions">
            <Link href={cta} className="btn btn-primary">
              {ctaLabel}
            </Link>
            <a href="#workflow" className="btn btn-ghost">
              See the workflow
            </a>
          </div>

          {/* Hero product mockup */}
          <div className="hero-mock" aria-label="TypeBeatOS upload pack preview">
            <div className="mock-window">
              <div className="mock-bar">
                <span className="mock-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="mock-url">app.typebeatos.com / upload-pack</span>
              </div>
              <div className="mock-grid">
                {/* Queue column */}
                <aside className="mock-queue">
                  <div className="mock-label">Beat queue</div>
                  <div className="queue-item active">
                    <span className="wave" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    <div>
                      <strong>late-night-rnb.wav</strong>
                      <small>142 BPM · F minor</small>
                    </div>
                  </div>
                  <div className="queue-item">
                    <span className="wave" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    <div>
                      <strong>midnight-drive.wav</strong>
                      <small>128 BPM · A minor</small>
                    </div>
                  </div>
                  <div className="queue-item">
                    <span className="wave" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    <div>
                      <strong>no-ceilings.wav</strong>
                      <small>150 BPM · G minor</small>
                    </div>
                  </div>
                </aside>

                {/* Center column */}
                <section className="mock-center">
                  <div className="mock-center-head">
                    <div>
                      <div className="mock-label">Generated title</div>
                      <h3>
                        Drake x Brent Faiyaz Type Beat — &quot;After Hours&quot;
                      </h3>
                    </div>
                    <div className="seo-score" title="SEO score">
                      <strong>92</strong>
                      <small>SEO</small>
                    </div>
                  </div>
                  <div className="mock-desc">
                    <div className="mock-label">Description</div>
                    <p>
                      Dark R&amp;B type beat for Drake &amp; Brent Faiyaz. Purchase / lease on
                      BeatStars — link below. Free for non-profit, must credit (prod. yourname)…
                    </p>
                  </div>
                  <div className="mock-tags">
                    <span>drake type beat</span>
                    <span>brent faiyaz type beat</span>
                    <span>dark r&amp;b type beat</span>
                  </div>
                </section>

                {/* Right column */}
                <aside className="mock-side">
                  <div className="thumb-preview">
                    <Image
                      src="/mockups/thumb-rnb.png"
                      alt="Generated YouTube thumbnail preview"
                      fill
                      sizes="240px"
                    />
                    <div className="thumb-text">
                      <span>TYPE BEAT</span>
                      <strong>AFTER HOURS</strong>
                    </div>
                  </div>
                  <div className="mock-schedule">
                    <div className="sched-row">
                      <span>Wed · 6:00 PM</span>
                      <span className="status-pill">Scheduled</span>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>

          <ul className="logo-row" aria-label="Works with">
            <li>YouTube</li>
            <li>BeatStars</li>
            <li>Airbit</li>
            <li>Drive</li>
            <li>Dropbox</li>
          </ul>
        </div>
      </header>

      {/* ---------------- Problem ---------------- */}
      <section className="problem">
        <div className="container">
          <div className="section-head">
            <h2>The beat is done. The upload admin isn&apos;t.</h2>
            <p className="section-sub">
              Every upload repeats the same six tasks. TypeBeatOS does them once, then reuses the
              system on every beat.
            </p>
          </div>
          <ul className="problem-list">
            <li>
              <span className="li-index">01</span>
              <div>
                <strong>Writing titles every time</strong>
                <p>Rewording the same artist keywords for each beat.</p>
              </div>
            </li>
            <li>
              <span className="li-index">02</span>
              <div>
                <strong>Rebuilding thumbnails</strong>
                <p>Reopening the editor and starting the layout from scratch.</p>
              </div>
            </li>
            <li>
              <span className="li-index">03</span>
              <div>
                <strong>Pasting links &amp; licensing</strong>
                <p>Dropping store and license terms into every description.</p>
              </div>
            </li>
            <li>
              <span className="li-index">04</span>
              <div>
                <strong>Finding tags &amp; hashtags</strong>
                <p>Hunting searchable tags for each artist and mood.</p>
              </div>
            </li>
            <li>
              <span className="li-index">05</span>
              <div>
                <strong>Spacing the schedule</strong>
                <p>Manually staggering posts to stay consistent.</p>
              </div>
            </li>
            <li>
              <span className="li-index">06</span>
              <div>
                <strong>Keeping the rhythm</strong>
                <p>Holding output up while admin eats your studio time.</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="how" id="workflow">
        <div className="container">
          <div className="section-head">
            <h2>From beat file to scheduled upload</h2>
            <p className="section-sub">Four steps, one sitting, a full month of content.</p>
          </div>
          <ol className="steps">
            <li className="step">
              <span className="step-num">01</span>
              <h3>Upload the beat</h3>
              <p>Add name, BPM, key, genre, mood, and target artist.</p>
            </li>
            <li className="step">
              <span className="step-num">02</span>
              <h3>Generate the pack</h3>
              <p>SEO title, description, tags, thumbnail, and pinned comment.</p>
            </li>
            <li className="step">
              <span className="step-num">03</span>
              <h3>Schedule the queue</h3>
              <p>Spread beats across your calendar automatically.</p>
            </li>
            <li className="step">
              <span className="step-num">04</span>
              <h3>Make more beats</h3>
              <p>Your channel stays consistent while you focus on music.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* ---------------- Main product mockup ---------------- */}
      <section className="product" id="product">
        <div className="container">
          <div className="section-head">
            <h2>One workspace for the whole upload pack</h2>
            <p className="section-sub">
              Everything for a beat&apos;s YouTube upload lives in a single, editable view.
            </p>
          </div>

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
                <span className="app-nav-item">Beat queue</span>
                <span className="app-nav-item">Upload packs</span>
                <span className="app-nav-item">Calendar</span>
                <span className="app-nav-item">Templates</span>
                <span className="app-nav-item">Analytics</span>
              </nav>
            </aside>

            {/* Main area */}
            <div className="app-main-area">
              <div className="app-topbar">
                <div>
                  <p className="app-eyebrow">New upload pack</p>
                  <h3>late-night-rnb.wav</h3>
                </div>
                <span className="btn btn-primary btn-sm">Generate pack</span>
              </div>

              <div className="app-fields">
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
                <div className="app-field">
                  <small>Length</small>
                  <strong>2:48</strong>
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
                  <p className="app-panel-label">SEO score</p>
                  <p className="seo-note">Strong keyword match</p>
                </div>
              </div>

              <div className="app-panel-section">
                <p className="app-panel-label">Title suggestion</p>
                <p className="app-title-sug">
                  Drake x Brent Faiyaz Type Beat — &quot;After Hours&quot; | Dark R&amp;B
                </p>
              </div>

              <div className="app-panel-section">
                <p className="app-panel-label">Tags</p>
                <div className="app-tags">
                  <span>drake type beat</span>
                  <span>brent faiyaz type beat</span>
                  <span>dark r&amp;b type beat</span>
                </div>
              </div>

              <div className="app-panel-section">
                <p className="app-panel-label">Schedule</p>
                <div className="app-sched">
                  <span>Wednesday · 6:00 PM</span>
                  <span className="status-pill">Scheduled</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ---------------- Feature list ---------------- */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-head">
            <h2>The full type-beat upload system</h2>
            <p className="section-sub">
              Not generic scheduling — every step a producer repeats, in one place.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature">
              <h3>SEO title generator</h3>
              <p>Titles built around artist keywords and real search intent.</p>
            </div>
            <div className="feature">
              <h3>Description templates</h3>
              <p>Save store, license, and social links once — reuse on every upload.</p>
            </div>
            <div className="feature">
              <h3>Tags &amp; hashtags</h3>
              <p>Generated from artist, genre, mood, BPM, and key.</p>
            </div>
            <div className="feature">
              <h3>Thumbnail builder</h3>
              <p>Clean, YouTube-ready beat thumbnails from saved templates.</p>
            </div>
            <div className="feature">
              <h3>Upload calendar</h3>
              <p>Batch schedule beats across weeks or months.</p>
            </div>
            <div className="feature">
              <h3>Pinned comments</h3>
              <p>CTA comments that route listeners to your beat store.</p>
            </div>
            <div className="feature">
              <h3>Producer profile</h3>
              <p>Default branding, links, license terms, and upload format.</p>
            </div>
            <div className="feature">
              <h3>Analytics ready</h3>
              <p>Track which keywords and styles perform best — coming soon.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Pricing ---------------- */}
      <section className="pricing" id="pricing">
        <div className="container">
          <div className="section-head">
            <h2>Founding-member pricing</h2>
            <p className="section-sub">Start free. Upgrade when the uploads stack up.</p>
          </div>
          <div className="pricing-grid">
            <div className="plan">
              <h3>Free</h3>
              <div className="price">
                $0<span>/mo</span>
              </div>
              <ul>
                <li>3 upload packs / month</li>
                <li>Basic SEO titles</li>
                <li>Manual export</li>
                <li>Basic templates</li>
              </ul>
              <Link href={cta} className="btn btn-ghost">
                Start free
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
                Start free
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
                Join the beta
              </Link>
            </div>
            <div className="plan">
              <h3>Serious</h3>
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
                Start free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section className="faq" id="faq">
        <div className="container container-narrow">
          <div className="section-head">
            <h2>Questions, answered straight</h2>
            <p className="section-sub">No overpromising — exactly what TypeBeatOS does.</p>
          </div>
          <Faq />
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="final-cta" id="signup">
        <div className="container container-narrow">
          <h2>Stop letting finished beats sit in folders.</h2>
          <p className="sub">
            Turn them into scheduled, SEO-ready YouTube uploads — without the admin every time.
          </p>
          <div className="hero-actions">
            <Link href={cta} className="btn btn-primary">
              {ctaLabel}
            </Link>
            <a href="#workflow" className="btn btn-ghost">
              See the workflow
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="marketing-logo">
                <span className="logo-mark" aria-hidden="true">
                  TB
                </span>
                <span className="logo-word">TypeBeatOS</span>
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
            <p>© 2026 TypeBeatOS</p>
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
