# Better-Auth migration

The legacy custom session/cookie path (`createSession` / token-as-PK
`Session.token`) has been retired in favour of [Better-Auth](https://better-auth.com).

## What changed

### Prisma schema
- **`User`** gained `name`, `image`, `emailVerified`, `updatedAt`.
  `passwordHash` stays as a `@default("")` column for the migration
  window — it's no longer read, and will be dropped in a follow-up.
- **`Session`** primary key is now `id`; `token` becomes a `@unique`
  column. `ipAddress`, `userAgent`, `createdAt`, `updatedAt` added.
- **`Account`** (new) — credential + future OAuth provider accounts.
  Passwords for email/password sign-in live in `Account.password` for
  records with `providerId = "credential"`.
- **`Verification`** (new) — email-verify and password-reset tokens.

The Postgres mirror in `prisma/schema.postgres.prisma` is kept in
lockstep; CI's `db:validate-postgres` step covers drift.

### Server modules
- **`lib/auth-server.ts`** — the Better-Auth instance. Email + password
  enabled, sessions live 30 days, cookie is named `tbos_session` so any
  in-flight legacy session still works. `nextCookies()` plugin ensures
  cookies issued from a server action persist into the response.
- **`app/api/auth/[...all]/route.ts`** — mounts Better-Auth's REST
  endpoints (`/api/auth/sign-up/email`, `/api/auth/sign-in/email`,
  `/api/auth/sign-out`, `/api/auth/get-session`, …).
- **`lib/auth.ts`** — thin compat shim. The public surface is unchanged:
  `getUser()`, `requireUser()`, `destroySession()`. Each one now
  delegates to Better-Auth under the hood; the rest of the app didn't
  need to change.
- **`lib/actions/auth.ts`** — `signup` and `login` now call
  `auth.api.signUpEmail` / `auth.api.signInEmail`. Rate-limit gate +
  the producer-name profile attach are unchanged. Errors are mapped
  back to the `?error=` URL pattern the auth pages already render.

### Seed
- **`scripts/seed-dev.ts`** — uses `auth.api.signUpEmail` to create the
  test account so password hashes match production sign-in. Profile is
  attached separately (Better-Auth doesn't know about `Profile`).
- **`scripts/cleanup-test-data.ts`** — bumped TEST_EMAILS to include
  every test-account email we've ever issued.

## What's still TODO

- **Email verification + password reset flows.** Better-Auth supports
  both, but they're disabled today. Wiring them needs a `lib/email.ts`
  (Resend or SES) and a couple of new pages. Tracked separately.
- **OAuth social sign-in.** YouTube is its own integration; we may add
  Google as a sign-in provider too once Better-Auth is bedded in.
- **Drop `User.passwordHash`.** Make sure no production sessions still
  reference it (they shouldn't — the new login path doesn't touch it),
  then a follow-up migration drops the column.

## Verifying

```bash
npm run seed:dev          # creates test@typebeatos.local / review123!
npm run dev               # then log in at http://localhost:3000/login
```

Or run end-to-end: sign up at `/signup`, get redirected to `/onboarding`;
sign out from the nav, get redirected to `/`; sign in again, get
redirected to `/dashboard`.
