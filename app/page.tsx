import Link from "next/link";
import { getUser } from "@/lib/auth";

export default async function Landing() {
  const user = await getUser();
  const cta = user ? "/dashboard" : "/signup";
  const ctaLabel = user ? "Open dashboard" : "Get started free";

  return (
    <div className="marketing-page">
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
            <a href="#workflow" className="nav-link nav-link-public">
              Workflow
            </a>
            <a href="#features" className="nav-link nav-link-public">
              Features
            </a>
            <a href="#pricing" className="nav-link nav-link-public">
              Pricing
            </a>
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
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="container hero-shell">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              For type-beat producers on YouTube
            </p>
            <h1>
              Upload a month of type beats
              <br />
              <span className="accent">in one sitting.</span>
            </h1>
            <p className="sub">
              TypeBeatOS generates SEO titles, descriptions, tags, thumbnails, pinned comments, and
              upload schedules so you can focus on making beats.
            </p>
            <div className="hero-actions">
              <Link href={cta} className="btn btn-primary">
                {ctaLabel}
              </Link>
              <a href="#workflow" className="btn btn-ghost">
                See workflow
              </a>
            </div>
            <p className="form-note">Free plan included. No card required.</p>
          </div>

          <div className="hero-preview" aria-label="TypeBeatOS upload package preview">
            <div className="preview-window">
              <div className="preview-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="preview-body">
                <div className="preview-main">
                  <div className="preview-kicker">Upload package</div>
                  <h3>Dark Dreams - Drake Type Beat</h3>
                  <p>SEO title, description, tags, thumbnail, pinned comment, and schedule.</p>
                  <div className="preview-tags">
                    <span>Drake type beat</span>
                    <span>melodic trap</span>
                    <span>92 BPM</span>
                  </div>
                </div>
                <div className="preview-side">
                  <div className="mini-stat">
                    <strong>12</strong>
                    <span>ready posts</span>
                  </div>
                  <div className="thumbnail-card">
                    <span>TYPE BEAT</span>
                    <strong>DARK DREAMS</strong>
                  </div>
                </div>
              </div>
              <div className="preview-schedule">
                <div>
                  <span>Mon</span>
                  <strong>6:00 PM</strong>
                </div>
                <div>
                  <span>Wed</span>
                  <strong>6:00 PM</strong>
                </div>
                <div>
                  <span>Fri</span>
                  <strong>6:00 PM</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-proof" aria-label="TypeBeatOS workflow stats">
            <div>
              <strong>SEO</strong>
              <span>Titles, tags, descriptions</span>
            </div>
            <div>
              <strong>Batch</strong>
              <span>Queue a full calendar</span>
            </div>
            <div>
              <strong>Brand</strong>
              <span>Reusable thumbnail style</span>
            </div>
          </div>
        </div>
      </header>

      <section className="problem" id="workflow">
        <div className="container">
          <h2>
            You know consistency wins.
            <br />
            The upload admin is what kills it.
          </h2>
          <p className="section-sub">Every single upload means doing all of this — again:</p>
          <div className="problem-grid">
            <div className="chip">Export the beat</div>
            <div className="chip">Make a video file</div>
            <div className="chip">Write a searchable title</div>
            <div className="chip">Write the description</div>
            <div className="chip">Paste BeatStars links</div>
            <div className="chip">Add tags &amp; hashtags</div>
            <div className="chip">Design a thumbnail</div>
            <div className="chip">Write the pinned comment</div>
            <div className="chip">Schedule the post</div>
            <div className="chip chip-repeat">…then repeat 3× a week</div>
          </div>
          <p className="problem-punch">
            Most producers would rather make music than do upload admin.
            <br />
            So uploads slip — and the channel stalls.
          </p>
        </div>
      </section>

      <section className="how section-panel">
        <div className="container">
          <h2>
            From beat file to scheduled upload
            <br />
            in three steps
          </h2>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <h3>Drop in your beats</h3>
              <p>
                Add your finished beats. Pick the target artist, genre, mood, BPM, and key for each
                one.
              </p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h3>Generate the upload package</h3>
              <p>
                TypeBeatOS writes the SEO title options, description with your store links, tags,
                hashtags, pinned comment — and builds the thumbnail.
              </p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h3>Schedule the month</h3>
              <p>
                Pick your posting rhythm — Mon/Wed/Fri at 6PM, daily, whatever — and your beats get
                spread across a full upload calendar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="container">
          <h2>
            Built for the type-beat workflow.
            <br />
            Not generic scheduling.
          </h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">SEO</div>
              <h3>Type-beat SEO titles</h3>
              <p>
                Multiple title options using real type-beat structures: artist keywords, beat name,
                genre tag — built to get found in search.
              </p>
            </div>
            <div className="feature">
              <div className="feature-icon">TXT</div>
              <h3>Descriptions with your links</h3>
              <p>
                Your BeatStars/Airbit links, license info, contact email, socials, and
                call-to-action — auto-filled from your producer profile.
              </p>
            </div>
            <div className="feature">
              <div className="feature-icon">#</div>
              <h3>Tags &amp; hashtags</h3>
              <p>
                Searchable tags from artist, genre, mood, BPM, key, related artists, and &quot;type
                beat&quot; variations.
              </p>
            </div>
            <div className="feature">
              <div className="feature-icon">IMG</div>
              <h3>Thumbnail builder</h3>
              <p>
                Pick a background, drop your text and producer name — get consistent, on-brand
                thumbnails for every upload.
              </p>
            </div>
            <div className="feature">
              <div className="feature-icon">PIN</div>
              <h3>Pinned comments</h3>
              <p>
                The purchase-link pinned comment, written and ready to paste the moment your video
                goes live.
              </p>
            </div>
            <div className="feature">
              <div className="feature-icon">CAL</div>
              <h3>Upload calendar</h3>
              <p>
                Batch your beats and auto-spread them across a posting schedule. One session = a
                month of content.
              </p>
            </div>
          </div>
        </div>
      </section>

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
                <li>3 upload packages / month</li>
                <li>Titles &amp; descriptions</li>
                <li>Manual export</li>
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
                <li>20 upload packages / month</li>
                <li>SEO titles, tags &amp; hashtags</li>
                <li>Thumbnail builder</li>
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
                <li>60 upload packages / month</li>
                <li>Batch upload queue</li>
                <li>YouTube integration (soon)</li>
                <li>Custom templates</li>
              </ul>
              <Link href={cta} className="btn btn-primary">
                Start free
              </Link>
            </div>
            <div className="plan">
              <h3>Serious Producer</h3>
              <div className="price">
                $29<span>/mo</span>
              </div>
              <ul>
                <li>150 upload packages / month</li>
                <li>Multiple channels</li>
                <li>Analytics &amp; keyword insights</li>
                <li>Advanced templates</li>
              </ul>
              <Link href={cta} className="btn btn-ghost">
                Start free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta" id="signup">
        <div className="container">
          <h2>
            Make the beats.
            <br />
            <span className="accent">We handle YouTube.</span>
          </h2>
          <p className="sub">Create your free account and generate your first upload package in minutes.</p>
          <Link href={cta} className="btn btn-primary">
            {ctaLabel}
          </Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <span className="logo">
            TypeBeat<span>OS</span>
          </span>
          <p>© 2026 TypeBeatOS. Not affiliated with YouTube, BeatStars, or any artist mentioned.</p>
        </div>
      </footer>
    </div>
  );
}
