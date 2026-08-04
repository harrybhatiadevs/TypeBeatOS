# Better Auth — current authentication implementation

**Status: complete and live. Updated 4 August 2026.** The legacy custom
session/cookie implementation has been retired in favour of Better Auth.

## Current behaviour

- Email/password signup and login are enabled.
- Signup sends a verification email through the shared email service. This is a
  soft gate: an unverified producer can use the app while a banner prompts them
  to verify.
- Forgot-password and reset-password flows are implemented.
- The HTTP-only session cookie is named `tbos_session`, uses `SameSite=Lax`, and
  is `Secure` in production.
- Sessions have a seven-day inactivity window. Better Auth may renew an active
  session at most once every 24 hours; a producer who does not return within the
  renewed seven-day window must sign in again.
- Changing `BETTER_AUTH_SECRET` invalidates sessions. Keep the production value
  stable across every release.

## Data model

- `User` contains Better Auth identity fields plus the application relations.
- `Session.token` is unique; session metadata includes IP address, user agent,
  created time, updated time, and expiry.
- `Account` stores credential-provider records and password hashes.
- `Verification` stores email-verification and password-reset tokens.
- The legacy `User.passwordHash` field remains with an empty default for
  migration compatibility and is not used by the login path.

Both Prisma schemas must remain synchronized:

- `prisma/schema.prisma` — SQLite development;
- `prisma/schema.postgres.prisma` — Neon PostgreSQL production.

CI validates the PostgreSQL schema on every push and pull request.

## Main modules

- `lib/auth-server.ts` — Better Auth configuration, session policy, email
  callbacks, cookie settings, trusted origin, and Next.js cookie plugin.
- `app/api/auth/[...all]/route.ts` — Better Auth REST endpoints.
- `lib/auth.ts` — application-facing `getUser`, `requireUser`, and logout
  compatibility helpers.
- `lib/actions/auth.ts` — signup/login server actions and user-facing errors.
- `lib/actions/password-reset.ts` — reset request and password update flow.
- `scripts/seed-dev.ts` — creates local accounts through Better Auth so hashes
  match production behaviour.

## Remaining optional follow-ups

- Add Google as a social sign-in provider if product demand justifies it. This
  is separate from the YouTube channel OAuth connection.
- Drop `User.passwordHash` in a reviewed migration once production compatibility
  no longer requires it.
- Add session-management UI (view/revoke other devices) if requested.

## Verification

```bash
npm run seed:dev
npm run dev
```

Then verify signup, the verification banner/link, logout, login, forgot/reset,
and expiry/renewal behaviour. In production confirm the cookie is HTTP-only and
Secure, and that `APP_URL` exactly matches the public origin.
