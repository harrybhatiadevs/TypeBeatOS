import Link from "next/link";
import { login } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="card">
          <h1>Welcome back</h1>
          <p className="page-sub">Log in to your TypeBeatOS account.</p>
          {error && <div className="form-error">{error}</div>}
          <form action={login}>
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required placeholder="you@email.com" />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required />
            </div>
            <button type="submit" className="btn btn-primary">
              Log in
            </button>
          </form>
          <p className="auth-alt">
            New here? <Link href="/signup">Create a free account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
