# SQLite → Postgres cutover runbook

We currently run on SQLite (file at `prisma/dev.db`). This is fine for one
machine and one developer, but it cannot survive a production deploy: no
concurrent writes from worker + web, no point-in-time recovery, no managed
backups. The cutover moves us to Neon (managed Postgres).

The committed `prisma/schema.prisma` stays on SQLite until the cutover.
`prisma/schema.postgres.prisma` mirrors it with `provider = "postgresql"`
and is validated on every CI run (`npm run db:validate-postgres`) so the
two schemas can't silently drift.

## Pre-cutover (already done)

- [x] Schema audited for SQLite-isms (none found)
- [x] `prisma/schema.postgres.prisma` checked in
- [x] CI validates the Postgres variant on every PR
- [x] `scripts/cleanup-test-data.ts` exists for purging the dev test account

## The cutover (~30 min)

1. **Provision Neon**
   - Create a new Neon project in the `aws-ap-southeast-2` region (closest
     to our Fly.io syd region — keep RTT low)
   - Create a `production` branch and a `dev` branch on it
   - Grab the pooled connection string from `production`. It should end in
     `?sslmode=require&pgbouncer=true&connection_limit=1`
   - Store as `DATABASE_URL` in the Fly.io app secrets:
     ```
     fly secrets set DATABASE_URL="postgresql://..."
     ```

2. **Flip the local schema**
   ```bash
   cp prisma/schema.postgres.prisma prisma/schema.prisma
   ```
   (Keep `schema.postgres.prisma` until the cutover is verified; delete
   after.)

3. **Create the first migration**
   ```bash
   DATABASE_URL="<neon-dev-branch-url>" npx prisma migrate dev --name init_postgres
   ```
   This writes `prisma/migrations/<timestamp>_init_postgres/migration.sql`.
   Commit the generated migration.

4. **Copy production-ish data from SQLite**

   The waitlist signups are the only data we genuinely need to preserve
   from the dev DB. Run the cleanup first to drop the test account:
   ```bash
   CONFIRM_CLEANUP=yes npx ts-node scripts/cleanup-test-data.ts
   ```
   Then export and import:
   ```bash
   sqlite3 prisma/dev.db ".dump WaitlistSignup" > /tmp/waitlist.sql
   # Hand-edit /tmp/waitlist.sql to:
   #  - drop the CREATE TABLE line (Prisma already created it on Postgres)
   #  - rewrite INSERT values to match Postgres types (datetimes, etc)
   # then:
   psql "$DATABASE_URL" -f /tmp/waitlist.sql
   ```

5. **Smoke test against Neon**
   ```bash
   DATABASE_URL="<neon-prod-url>" npm run dev
   ```
   Manually verify:
   - [ ] Sign up a new account
   - [ ] Log in / log out
   - [ ] Join the waitlist (idempotent)
   - [ ] Upload a beat (small mp3)
   - [ ] Generate a package
   - [ ] Render a video
   - [ ] (Skip YouTube upload smoke until OAuth verification is complete)

6. **Deploy**
   ```bash
   fly deploy
   ```

## Post-cutover

- [ ] Delete `prisma/schema.postgres.prisma`
- [ ] Delete `db:validate-postgres` from `package.json`
- [ ] Delete the "Validate Postgres schema variant" step from CI
- [ ] Set up Neon point-in-time-recovery retention to 7 days
- [ ] Add a daily `fly logs` review to the morning check

## Rollback

Neon keeps a 7-day PITR on the production branch by default. If the
cutover wedges:

1. `fly secrets unset DATABASE_URL` (web/worker boots will fail-fast on
   the missing env)
2. Set `DATABASE_URL` back to the SQLite path
3. Revert the `prisma/schema.prisma` change
4. Redeploy

This rollback is destructive — any data written to Postgres between
cutover and rollback is left behind. Take a manual `psql -c "COPY ... TO
STDOUT"` snapshot of the waitlist table before rolling back if you care
about that data.
