# Neon PostgreSQL production setup

TypeBeatOS uses two Prisma schemas intentionally:

- `prisma/schema.prisma` uses SQLite for local development (`prisma/dev.db`).
- `prisma/schema.postgres.prisma` uses PostgreSQL for production on Neon.

The model blocks must remain identical. Production migrations live under
`prisma/migrations/` and must always be run with the Postgres schema explicitly.
Never run `prisma migrate reset`, `prisma db push --force-reset`, or the dev seed
against the Neon production branch.

## 1. Copy the two Neon connection strings

In the Neon Console, open the production project and click **Connect**. Select
the production branch, database, and role, then copy both connection strings:

1. Enable **Connection pooling** and copy the URL to `DATABASE_URL`. Its hostname
   contains `-pooler`. The running app uses this URL.
2. Disable **Connection pooling** and copy the URL to `DIRECT_URL`. Its hostname
   does not contain `-pooler`. Prisma migrations use this direct URL.

Both URLs should use the same branch, database, and role and include
`sslmode=require`. Do not commit either value. Neon documents pooled runtime and
direct migration connections in its [Prisma guide](https://neon.com/docs/guides/prisma)
and [connection guide](https://neon.com/docs/get-started-with-neon/connect-neon).

For a one-off local migration command, export them only in the current shell:

```bash
export DATABASE_URL='postgresql://...-pooler.../neondb?sslmode=require'
export DIRECT_URL='postgresql://......../neondb?sslmode=require'
```

For deployment, store both values in the platform secret manager. Do not place
production credentials in `.env`.

## 2. Validate before changing Neon

```bash
npm ci
npm run db:validate-postgres
DIRECT_URL="$DIRECT_URL" DATABASE_URL="$DATABASE_URL" npm run db:migrate:status
```

Review the migration SQL in `prisma/migrations/` before deployment. `migrate
deploy` applies pending migrations and does not reset the database, but a new
migration can still contain destructive SQL and must be reviewed.

## 3. Apply committed migrations

```bash
DIRECT_URL="$DIRECT_URL" DATABASE_URL="$DATABASE_URL" npm run db:migrate:deploy
```

Do not use `prisma migrate dev` against production. New migrations should be
created and reviewed on a disposable Neon development branch, committed, and
then applied to production with `db:migrate:deploy`.

## 4. Verify connectivity and tables

```bash
DIRECT_URL="$DIRECT_URL" DATABASE_URL="$DATABASE_URL" npm run db:migrate:status
DATABASE_URL="$DATABASE_URL" npm run db:verify:postgres
```

The verification script runs `SELECT 1`, lists the `public` schema tables, and
fails if any application table or `_prisma_migrations` is missing. It does not
write application data.

After this command, restore the local SQLite Prisma client before local work:

```bash
npm run db:generate:sqlite
npm run db:push
```

## 5. Deploy

The Dockerfile explicitly generates Prisma Client from
`schema.postgres.prisma`. Set both secrets in Fly.io:

```bash
fly secrets set \
  DATABASE_URL="$DATABASE_URL" \
  DIRECT_URL="$DIRECT_URL"
fly deploy --remote-only
```

Then follow `docs/deploy-runbook.md` for application smoke tests.

## Local SQLite workflow

```bash
cp .env.example .env
npm install
npm run db:generate:sqlite
npm run db:push
npm run dev
```

The dev seed is intentionally destructive for its fixed test account and is
blocked when `NODE_ENV=production`. Run it only against local SQLite:

```bash
npm run seed:dev
```

## Data migration and rollback

This setup creates the production schema; it does not copy rows from
`prisma/dev.db`. Any data transfer must be planned separately, tested on a Neon
branch, and backed up before production import.

For a bad application release, roll back the application image. For a bad
database migration, stop writes and use Neon's restore/branch recovery workflow.
Do not attempt an ad-hoc reverse migration or reset on production.
