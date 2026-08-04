# Thumbnail editor persistence — implemented reference

**Status: implemented and deployed before the current batch release. Updated 4
August 2026.** This file is retained as a maintenance handoff; it is no longer a
to-do plan.

## Behaviour

When a producer saves and later reopens a package, the thumbnail editor restores
its saved title/subtitle, fonts, colours, sizes, enabled text layers, and source
background image. The composited thumbnail is still stored separately for
YouTube upload and preview.

Older packages with an empty `thumbnailConfig` open with current defaults while
their existing rendered thumbnail remains available.

## Data and files

- `Package.thumbnailConfig` is a JSON string in both Prisma schemas.
- Empty string means no saved editor configuration.
- Composited image: `uploads/thumbs/<packageId>.png`.
- Optional source background: `uploads/thumbs/<packageId>-bg.<ext>`.
- URLs are served through `/api/files/thumbs/...`.
- Development uses local disk; production persists `/app/uploads` on Azure
  Files.

The PostgreSQL column was added by
`prisma/migrations/20260627120000_add_thumbnail_config/migration.sql`.

## Main implementation

| File | Responsibility |
| --- | --- |
| `lib/actions/packages.ts` | validates and stores composite, configuration JSON, and optional source background |
| `app/(app)/packages/[id]/page.tsx` | loads `thumbnailConfig` with the package |
| `app/(app)/packages/[id]/PackageEditor.tsx` | threads saved state into the builder |
| `app/(app)/packages/[id]/ThumbnailBuilder.tsx` | hydrates controls/background and submits updated state |
| `app/api/files/[...path]/route.ts` | serves persisted media safely |

## Maintenance rules

- Mirror any `Package` model change in both Prisma schemas.
- Keep configuration parsing backward compatible; unknown/missing keys should
  fall back without breaking the editor.
- Validate image magic bytes and size on the server; never trust browser MIME
  metadata alone.
- Keep source-image URLs same-origin so Canvas export is not tainted.
- Preserve existing `bgPath` when a save does not include a new background.
- Avoid deleting old media during a schema-only migration.

## Regression check

1. Create/open a package with audio.
2. Change both text layers, fonts, colours, and sizes.
3. Upload a background and save the thumbnail.
4. Navigate away, reopen the package, and confirm every control and the canvas
   are restored.
5. Save again without uploading another background.
6. Restart/redeploy the application and confirm both source and composite remain
   available.
7. Run `npm test`, `npx tsc --noEmit`, `npm run db:validate-postgres`, and a
   clean `npm run build`.

The current product stage and next priorities live in
`docs/core-workflow-roadmap.md`; release commands live in
`docs/azure-deployment.md`.
