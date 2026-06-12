import Link from "next/link";
import { signup } from "@/lib/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="auth-wrap signup-auth">
      <div className="auth-shell">
        <Link href="/" className="logo marketing-logo auth-logo" aria-label="TypeBeatOS home">
          <span className="logo-mark" aria-hidden="true">
            TB
          </span>
          <span className="logo-word">
            TypeBeat<span>OS</span>
          </span>
        </Link>

        <div className="auth-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            Producer workflow system
          </p>
          <h2>
            Turn every finished beat into a ready-to-upload YouTube package.
          </h2>
          <div className="auth-preview">
            <div>
              <span>Generated assets</span>
              <strong>Title, tags, thumbnail, pinned comment</strong>
            </div>
            <div>
              <span>Schedule</span>
              <strong>Mon / Wed / Fri at 6 PM</strong>
            </div>
            <div>
              <span>First run</span>
              <strong>No card required</strong>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="card">
            <h1>
              Join TypeBeat<span>OS</span>
            </h1>
            <p className="page-sub">Free account. First upload package in minutes.</p>
            {error && <div className="form-error">{error}</div>}
            <form action={signup}>
              <div className="form-field">
                <label htmlFor="producerName">Producer name</label>
                <input id="producerName" name="producerName" type="text" placeholder="prod. yourname" />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required placeholder="you@email.com" />
              </div>
              <div className="form-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="8+ characters"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Create account
              </button>
            </form>
            <p className="auth-alt">
              Already have an account? <Link href="/login">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
