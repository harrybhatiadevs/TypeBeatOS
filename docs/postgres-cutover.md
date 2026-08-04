# Neon PostgreSQL production operations

**Status: production is already on Neon. Updated 4 August 2026.** This document
is now the migration-safety runbook, not an unfinished cutover plan.

## Dual-schema rule

TypeBeatOS deliberately has two Prisma schemas:

- `prisma/schema.prisma` — SQLite for local development;
- `prisma/schema.postgres.prisma` — PostgreSQL for Neon production.

Keep their application models synchronized. Production migrations live in
`prisma/migrations/` and must be executed with the PostgreSQL schema. CI runs
`npm run db:validate-postgres`, but an agent must still review every migration's
SQL for destructive changes.

## Connection roles

- `DATABASE_URL`: pooled Neon URL (hostname normally contains `-pooler`) used by
  the running application and Prisma verification.
- `DIRECT_URL`: non-pooled URL for Prisma migrations.

The two URLs must point to the same production branch/database/role and require
TLS. They belong in the Azure/Neon secret stores or a protected local shell,
never in git, Markdown, command output, or a committed `.env` file.

## Safe release procedure

1. Review pending migrations:

   ```bash
   git diff <production-commit>...HEAD -- prisma/migrations prisma/schema.postgres.prisma
   npm run db:validate-postgres
   DIRECT_URL="$DIRECT_URL" DATABASE_URL="$DATABASE_URL" npm run db:migrate:status
   ```

2. Back up or confirm Neon point-in-time recovery before any destructive
   migration. Additive tables/columns still require review.
3. Apply migrations **before** deploying code that reads required new schema:

   ```bash
   DIRECT_URL="$DIRECT_URL" DATABASE_URL="$DATABASE_URL" npm run db:migrate:deploy
   ```

4. Verify:

   ```bash
   DIRECT_URL="$DIRECT_URL" DATABASE_URL="$DATABASE_URL" npm run db:migrate:status
   DATABASE_URL="$DATABASE_URL" npm run db:verify:postgres
   ```

5. Restore the local SQLite client after production-oriented generation:

   ```bash
   npm run db:generate:sqlite
   ```

## Current batch migration

The batch-upload release introduces `UploadBatch` and `UploadBatchItem` through
`prisma/migrations/20260801000000_add_upload_batches/migration.sql`. It is an
additive migration. Apply it to Neon before deploying the batch API/pages. The
final schema intentionally has no `videoStyle` field because waveform rendering
was removed before release.

## Prohibited production operations

Never run any of these against the Neon production branch:

- `prisma migrate reset`;
- `prisma db push --force-reset`;
- `prisma migrate dev`;
- the development seed or cleanup scripts; or
- an ad-hoc reverse migration without a tested recovery plan.

## Local SQLite workflow

```bash
cp .env.example .env
npm install
npm run db:generate:sqlite
npm run db:push
npm run dev
```

`npm run seed:dev` is intentionally blocked in production and may overwrite its
fixed local test accounts. Point it only at disposable SQLite data.

## Rollback

- For a bad application image, reactivate the previous Azure Container Apps
  revision.
- For a bad database migration, stop writes and use Neon point-in-time restore
  or branch recovery. Coordinate application rollback with the restored schema.
- Do not improvise a production reset.

Application deployment and health verification are documented in
`docs/azure-deployment.md`.
