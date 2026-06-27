# Implementation guide: persist the thumbnail editor state

**Goal:** When a producer reopens a beat package, the thumbnail builder should
reopen **exactly as they left it** — text, fonts, colours, sizes, which text
properties were added, **and the uploaded background image**. Today only the
final rendered PNG is saved, so the editor always resets to defaults.

This guide is self-contained. Follow it top to bottom. Code snippets are
illustrative — match the surrounding style and adjust names if the code has
moved since this was written.

---

## 0. Context a cold-start agent needs

- **Stack:** Next.js 15 (App Router, server actions), TypeScript, Prisma. Dev DB
  is SQLite; **production DB is Neon PostgreSQL**. Plain CSS (no Tailwind).
- **Dual Prisma schema:** `prisma/schema.prisma` (SQLite, dev) and
  `prisma/schema.postgres.prisma` (Postgres, prod). **Any model change must be
  made in BOTH files.**
- **Prod migrations are run manually from a laptop against Neon** (the container
  does NOT migrate on boot). See `docs/azure-deployment.md` §8. `DIRECT_URL`
  (Neon **direct**, no `-pooler`) is used only for migrations; `DATABASE_URL`
  (Neon **pooled**, has `-pooler`) for the app. Get both from the Container App
  secret store / the gitignored `containerapp*.filled.yaml`.
- **Local dev DB:** a gitignored `.env.local` sets
  `DATABASE_URL="file:./dev.db"` so `npm run dev` uses SQLite, and
  `APP_URL="http://localhost:3000"` so Better-Auth trusts the dev origin. Keep
  it. Run the dev server on **port 3000** so auth works (free the port first if
  taken).
- **Production deploy** = Azure Container Apps, East US:
  - Resource group `rg-typebeatos-eastus`, app `ca-typebeatos`, env
    `cae-typebeatos-eus`.
  - Registry `crtypebeatos5c46ce` (`crtypebeatos5c46ce.azurecr.io`). ACR Tasks
    are blocked on this subscription, so images are built **locally for
    `linux/amd64` and pushed** (QEMU emulation on Apple Silicon).
  - Current live tag is `typebeatos:v8`. **Use the next tag, `v9`.**
  - Single-revision mode; an `az containerapp update --image` rolls a new
    revision automatically.
- **File storage:** user files live under `uploads/` and are served by
  `app/api/files/[...path]/route.ts` at `/api/files/...`. Thumbnails are at
  `uploads/thumbs/<packageId>.png` → `/api/files/thumbs/<packageId>.png`. The
  route already serves `.png/.jpg/.jpeg`.
- **Gotchas (important):**
  - **Never run `npm run build` (or `next build`) while the dev server is
    running** — they share `.next/` and it corrupts the dev server. Stop the dev
    server first, or rely on the in-Docker build.
  - Static assets served via `typebeatos.com` go through **Cloudflare** (cached).
    Not relevant here unless you touch `public/`.
  - Don't commit secrets. `containerapp*.filled.yaml`, `.env*` are gitignored.

---

## 1. Files you will touch

| File | Change |
|---|---|
| `prisma/schema.prisma` | add `thumbnailConfig` to `Package` |
| `prisma/schema.postgres.prisma` | add `thumbnailConfig` to `Package` |
| `prisma/migrations/<ts>_add_thumbnail_config/migration.sql` | new migration (Postgres) |
| `lib/actions/packages.ts` | extend `saveThumbnail` to store config + source background |
| `app/(app)/packages/[id]/page.tsx` | pass `thumbnailConfig` to the editor |
| `app/(app)/packages/[id]/PackageEditor.tsx` | thread `thumbnailConfig` into `<ThumbnailBuilder>` |
| `app/(app)/packages/[id]/ThumbnailBuilder.tsx` | hydrate from saved config; send config + bg on save |

---

## 2. Schema change

Add this line to the `Package` model in **both** `prisma/schema.prisma` **and**
`prisma/schema.postgres.prisma`:

```prisma
  thumbnailConfig String @default("")
```

It stores a JSON blob of the builder settings (including the saved background
image path). Empty string = no saved config (fall back to defaults).

Regenerate the clients:

```bash
npm run db:generate:sqlite
npm run db:generate:postgres
```

---

## 3. Migrations

### Dev (SQLite)
```bash
npm run db:push      # applies the new column to prisma/dev.db
```

### Production (Neon Postgres) — additive, safe, no data loss
The column is additive with a default, so hand-write the migration (no shadow DB
needed). Create `prisma/migrations/<TIMESTAMP>_add_thumbnail_config/migration.sql`
(timestamp format `YYYYMMDDHHMMSS`, e.g. `20260627120000_add_thumbnail_config`):

```sql
-- AlterTable
ALTER TABLE "Package" ADD COLUMN "thumbnailConfig" TEXT NOT NULL DEFAULT '';
```

Apply it to Neon **before deploying the new code** (the new code reads the
column; deploying first would 500). Run from a laptop with prod creds:

```bash
DIRECT_URL="<neon DIRECT url, no -pooler>" \
DATABASE_URL="<neon POOLED url, has -pooler>" \
npm run db:migrate:deploy

# verify
DIRECT_URL="<...>" DATABASE_URL="<...>" npm run db:migrate:status
```

---

## 4. `saveThumbnail` — store config + source background

In `lib/actions/packages.ts`, `saveThumbnail(formData)` currently writes the
composited PNG and sets `thumbnailPath`. Extend it to also accept:

- `config` — a JSON string of builder settings (always sent).
- `bg` — the **source** background image File (only sent when the user uploaded
  a new background this session).

```ts
export async function saveThumbnail(formData: FormData) {
  const user = await requireUser();
  const packageId = String(formData.get("packageId") || "");
  await ownedPackage(packageId, user.id);

  // --- composited PNG (existing logic) ---
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Invalid image data");
  if (file.size > MAX_THUMB_BYTES) throw new Error("Thumbnail too large (max 8 MB)");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (sniff(bytes.subarray(0, 16), "image") !== ".png") throw new Error("Thumbnail must be a PNG");

  const dir = path.join(process.cwd(), "uploads", "thumbs");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${packageId}.png`), Buffer.from(bytes));
  const thumbnailPath = `/api/files/thumbs/${packageId}.png`;

  // --- parse the builder config ---
  let config: Record<string, unknown> = {};
  try { config = JSON.parse(String(formData.get("config") || "{}")); } catch { config = {}; }

  // --- optional NEW source background image ---
  const bg = formData.get("bg");
  if (bg instanceof File && bg.size > 0) {
    if (bg.size > MAX_THUMB_BYTES) throw new Error("Background too large (max 8 MB)");
    const bgBytes = new Uint8Array(await bg.arrayBuffer());
    const ext = sniff(bgBytes.subarray(0, 16), "image"); // ".png" | ".jpg" | ...
    if (![".png", ".jpg", ".jpeg"].includes(ext)) throw new Error("Background must be PNG or JPEG");
    const bgName = `${packageId}-bg${ext === ".jpeg" ? ".jpg" : ext}`;
    await writeFile(path.join(dir, bgName), Buffer.from(bgBytes));
    config.bgPath = `/api/files/thumbs/${bgName}`;
  }
  // else: keep whatever config.bgPath the client sent (preserves an existing bg)

  await db.package.update({
    where: { id: packageId },
    data: { thumbnailPath, thumbnailConfig: JSON.stringify(config) },
  });

  revalidatePath(`/packages/${packageId}`);
  return thumbnailPath;
}
```

Notes:
- `sniff` is from `@/lib/file-magic` (already imported) and validates by magic
  bytes, not the Content-Type header.
- Reuse the existing `MAX_THUMB_BYTES`.

---

## 5. Pass the saved config to the editor

`app/(app)/packages/[id]/page.tsx` builds the `pkg` object passed to
`PackageEditor`. Add the field:

```ts
        thumbnailConfig: pkg.thumbnailConfig,   // alongside thumbnailPath
```

`app/(app)/packages/[id]/PackageEditor.tsx`:
- Add `thumbnailConfig: string;` to the `PkgProps` type.
- Pass it down (the builder is invoked around line 223):

```tsx
<ThumbnailBuilder
  packageId={pkg.id}
  initialThumbnailPath={pkg.thumbnailPath}
  initialConfig={pkg.thumbnailConfig}
  defaultTitle={beat.name.toUpperCase()}
  defaultSubtitle={`${beat.targetArtist.toUpperCase()} TYPE BEAT`}
/>
```

---

## 6. `ThumbnailBuilder` — hydrate from config; send config + bg on save

`app/(app)/packages/[id]/ThumbnailBuilder.tsx` currently holds this state:
`title, subtitle, bgImage, mainAdded, secondaryAdded, titleFont, titleColor,
titleSize, subtitleFont, subtitleColor, subtitleSize`. Add:

```ts
const [bgPath, setBgPath] = useState("");          // saved source bg URL ("" = none)
const [bgFile, setBgFile] = useState<File | null>(null); // new upload this session
```

### a) Add the prop
```ts
initialConfig,            // add to the props destructuring + type: initialConfig: string
```

### b) Hydrate once on mount
```ts
useEffect(() => {
  if (!initialConfig) return;
  let c: any;
  try { c = JSON.parse(initialConfig); } catch { return; }
  if (typeof c.title === "string") setTitle(c.title);
  if (typeof c.subtitle === "string") setSubtitle(c.subtitle);
  if (typeof c.titleFont === "string") setTitleFont(c.titleFont);
  if (typeof c.titleColor === "string") setTitleColor(c.titleColor);
  if (typeof c.titleSize === "number") setTitleSize(c.titleSize);
  if (typeof c.subtitleFont === "string") setSubtitleFont(c.subtitleFont);
  if (typeof c.subtitleColor === "string") setSubtitleColor(c.subtitleColor);
  if (typeof c.subtitleSize === "number") setSubtitleSize(c.subtitleSize);
  setMainAdded(!!c.mainAdded);
  setSecondaryAdded(!!c.secondaryAdded);
  if (typeof c.bgPath === "string" && c.bgPath) {
    setBgPath(c.bgPath);
    const img = new Image();
    // Same-origin (/api/files/...) so the canvas is NOT tainted and toBlob works.
    img.onload = () => setBgImage(img);
    img.src = c.bgPath;
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);  // run once
```

### c) Track new uploads
In `onImageUpload`, also remember the File and clear any stale saved path:
```ts
setBgFile(file);
setBgPath(""); // a new upload supersedes the saved one; server will set the path
```

### d) Send config (+ bg) on save
In `onSave`, after building the PNG blob, attach the config and any new bg:
```ts
const fd = new FormData();
fd.set("packageId", packageId);
fd.set("file", new File([blob], "thumbnail.png", { type: "image/png" }));
fd.set("config", JSON.stringify({
  title, subtitle,
  titleFont, titleColor, titleSize,
  subtitleFont, subtitleColor, subtitleSize,
  mainAdded, secondaryAdded,
  bgPath, // preserved if no new upload; server overrides if `bg` is sent
}));
if (bgFile) fd.set("bg", bgFile);
const path = await saveThumbnail(fd);
setSavedPath(path);
```

### Canvas-taint caveat
The background is loaded from the **same origin** (`/api/files/...`), so drawing
it to the canvas does **not** taint it and `canvas.toBlob()` keeps working. If
the background URL ever becomes cross-origin (e.g. a CDN), set
`img.crossOrigin = "anonymous"` and ensure the response sends
`Access-Control-Allow-Origin`, or `toBlob` will throw a SecurityError.

---

## 7. Verify locally (before deploying)

1. Stop any running dev server. Ensure port 3000 is free; `.env.local` has the
   SQLite URL + `APP_URL=http://localhost:3000`.
2. `npm run db:push` (adds the column to dev.db).
3. Start dev on port 3000. Log in (a dev account, e.g. seed one via
   `npm run seed:dev`, or sign up — signup auto-logs-in).
4. Open a package → add Main/Secondary text, change a font/colour/size, upload a
   background → **Save thumbnail / Update thumbnail**.
5. Navigate away and reopen the package. Confirm the editor restores **all**
   settings **and** the background image, and the canvas re-renders identically.
6. `npm run test` (vitest) and a clean `npm run build` (dev server stopped) both
   pass.

---

## 8. Ship to production

Order matters: **migrate Neon first, then deploy the image.**

```bash
# 1. Apply the migration to Neon (prod creds; DIRECT_URL is the no-pooler URL)
DIRECT_URL="<neon direct>" DATABASE_URL="<neon pooled>" npm run db:migrate:deploy

# 2. Build + push the image for linux/amd64 (next tag = v9)
az acr login -n crtypebeatos5c46ce
docker buildx build --platform linux/amd64 \
  -t crtypebeatos5c46ce.azurecr.io/typebeatos:v9 --push .

# 3. Roll the new revision
az containerapp update -n ca-typebeatos -g rg-typebeatos-eastus \
  --image crtypebeatos5c46ce.azurecr.io/typebeatos:v9

# 4. Verify health + that traffic is on the new revision
curl -s https://typebeatos.com/api/health
az containerapp revision list -n ca-typebeatos -g rg-typebeatos-eastus \
  --query "[?properties.active].{name:name,weight:properties.trafficWeight,img:properties.template.containers[0].image}" -o tsv
```

Then smoke-test on `https://typebeatos.com`: build a thumbnail on a real
package, save, reopen, confirm it restores.

---

## 9. Acceptance criteria

- [ ] `thumbnailConfig` column exists in dev (SQLite) and prod (Neon).
- [ ] Saving a thumbnail persists text, fonts, colours, sizes, added-property
      flags, and the source background image.
- [ ] Reopening a package restores the editor **and** the background exactly;
      the canvas renders the same image; re-saving still works (no taint error).
- [ ] Packages with no saved config still open cleanly on defaults
      (`thumbnailConfig === ""`).
- [ ] `npm run test` and `npm run build` pass; prod deployed as `v9` and healthy.

---

## 10. Out of scope / notes

- The **scheduled date already persists correctly** — do not change that path.
- Old packages saved before this change have `thumbnailConfig === ""` and will
  open on defaults (their old rendered PNG is still in `thumbnailPath`). That's
  expected.
- Storing the source background roughly doubles per-thumbnail storage (source +
  composited). Fine for Azure Files; revisit only if storage becomes a concern.
