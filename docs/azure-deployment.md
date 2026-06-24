# Azure Container Apps deployment runbook — TypeBeatOS

Production deployment target for TypeBeatOS. Mirrors the structure of
`docs/deploy-runbook.md` (Fly.io), which is kept as a fallback. Database stays
on **Neon Postgres**; email stays on **Resend**; uploads use an **Azure Files**
share mounted at `/app/uploads` (no application code change).

This runbook assumes the SQLite→Neon cutover in `docs/postgres-cutover.md` is
done and you have a Neon **pooled** `DATABASE_URL` and **direct** `DIRECT_URL`.

> **No app code changes.** The same `Dockerfile` Fly used is reused as-is. Only
> new infra (Azure) and these docs are added. `fly.toml` and the Fly runbook
> remain untouched as a fallback.

---

## Architecture at a glance

| Concern | Choice |
| --- | --- |
| Compute | Azure Container Apps, **single replica (min=max=1)** |
| Image build | `az acr build` (remote, **amd64** — required for `ffmpeg-static`) |
| Registry | Azure Container Registry (Basic, admin enabled for v1) |
| Database | Neon Postgres (unchanged) |
| Email | Resend (unchanged) |
| File storage | Azure Files SMB share mounted at `/app/uploads` |
| Ingress / TLS | Free `*.azurecontainerapps.io` FQDN, auto HTTPS |
| Logs | Log Analytics workspace (attached to the ACA environment) |
| Migrations | Run manually from a laptop against Neon (unchanged flow) |

**Why single replica:** video render (`lib/video.ts`) and YouTube upload
(`lib/youtube.ts`) run in **in-process Promise queues**. A second replica would
have its own separate queue and the shared Azure Files mount would not make the
queues coherent. Multi-replica is gated on roadmap **C1** (object-storage
abstraction) + **C2** (durable queue). Until then: `minReplicas == maxReplicas == 1`.

---

## 0. Prerequisites

```bash
az login
az account set --subscription "<SUBSCRIPTION_ID>"
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.ContainerRegistry
```

Shell variables used throughout (edit the unique ones — see naming rules below):

```bash
RG=rg-typebeatos
REGION=australiaeast            # Fly was Sydney; australiaeast is the AU region
ENV=cae-typebeatos
APP=ca-typebeatos
ACR=crtypebeatos<UNIQUE>        # see naming rules
STORAGE=sttypebeatos<UNIQUE>    # see naming rules
SHARE=uploads
```

### Naming rules (global uniqueness — read before choosing names)

Both of these are part of a **global DNS namespace**, so the names must be
**globally unique across all of Azure** and **lowercase**:

- **Container Registry (`$ACR`)** — 5–50 chars, **lowercase letters and numbers
  only** (no hyphens). Becomes `<name>.azurecr.io`. Append something unique,
  e.g. your initials + digits: `crtypebeatoshb42`.
- **Storage account (`$STORAGE`)** — 3–24 chars, **lowercase letters and numbers
  only**. Append a unique suffix: `sttypebeatoshb42`.

If `az ... create` returns "name is already taken / not available", pick a new
suffix. Resource group, environment, and app names are only scoped to your
subscription, so they don't need global uniqueness.

---

## 1. Protect your credits first — budget + cost alert

Set this **before** creating billable resources so a misconfiguration can't
quietly burn credits.

**Portal (recommended — reliable email alerts):**
Cost Management + Billing → **Budgets** → **Add** → scope = your subscription →
amount (e.g. `50` AUD/month) → alert conditions at **80%** and **100%** of
budget → add your email as the alert recipient.

**CLI alternative (resource-group scoped):**

```bash
az consumption budget create \
  --budget-name budget-typebeatos \
  --resource-group $RG \
  --amount 50 \
  --category Cost \
  --time-grain Monthly \
  --start-date $(date -u +%Y-%m-01) \
  --end-date   $(date -u -v+1y +%Y-%m-01 2>/dev/null || date -u -d '+1 year' +%Y-%m-01)
```

> The portal path is recommended because the `az consumption budget` command's
> email-notification flags are version-dependent and finicky; the portal lets
> you attach alert thresholds + recipients reliably.

---

## 2. Resource group + registry + image build

```bash
az group create --name $RG --location $REGION

az acr create --resource-group $RG --name $ACR --sku Basic --admin-enabled true

# Remote build on Azure's amd64 builders. Do NOT `docker build` locally on an
# Apple-silicon Mac — ffmpeg-static would embed an arm64 binary that crashes on
# the amd64 Container Apps runtime. This is the analog of `fly deploy --remote-only`.
az acr build --registry $ACR --image typebeatos:v1 .
```

Grab the registry login server + admin credentials (needed for the YAML):

```bash
ACR_LOGIN_SERVER=$(az acr show -n $ACR -g $RG --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show -n $ACR -g $RG --query username -o tsv)
ACR_PASSWORD=$(az acr credential show -n $ACR -g $RG --query "passwords[0].value" -o tsv)
echo "$ACR_LOGIN_SERVER / $ACR_USERNAME"   # do not echo the password
```

---

## 3. Storage account + Azure Files share

```bash
az storage account create --resource-group $RG --name $STORAGE \
  --location $REGION --sku Standard_LRS --kind StorageV2

STORAGE_KEY=$(az storage account keys list --resource-group $RG \
  --account-name $STORAGE --query "[0].value" -o tsv)

az storage share create --name $SHARE --account-name $STORAGE \
  --account-key "$STORAGE_KEY" --quota 10
```

### Will the non-root container user be able to write here?

**Yes.** The Dockerfile runs as the non-root `nextjs` user (`Dockerfile:75`).
Azure Files mounts in Container Apps use SMB/CIFS, which does **not** enforce
Linux uid/gid ownership — the share is presented with a uniform permission mask
that is read/write for the container process regardless of its uid. The app also
calls `mkdir(..., { recursive: true })` before each write
(`lib/actions/beats.ts`, `lib/actions/packages.ts`, `lib/video.ts`), so the
`audio/`, `thumbs/`, and `videos/` subfolders are created on demand.

This is verified explicitly in the smoke test (write a file, restart, confirm it
persists). **Fallback if a write ever fails with EACCES:** the minimal fix would
be to run the container as root (drop the `USER nextjs` line in the Dockerfile) —
but this is **not expected to be necessary** and is a last resort, since it
touches the Dockerfile.

---

## 4. Container Apps environment + link the file share

```bash
az containerapp env create --resource-group $RG --name $ENV --location $REGION

# Register the Azure Files share on the environment under the name the app YAML
# references (storageName: uploadsmount).
az containerapp env storage set --resource-group $RG --name $ENV \
  --storage-name uploadsmount \
  --azure-file-account-name $STORAGE \
  --azure-file-account-key "$STORAGE_KEY" \
  --azure-file-share-name $SHARE \
  --access-mode ReadWrite
```

A Log Analytics workspace is provisioned with the environment automatically;
logs are queryable immediately (see step 7 / smoke test).

---

## 5. Prepare secrets (the gitignored working copy)

`infra/azure/containerapp.yaml` is committed with **placeholder** secret values.
Never commit real secrets. Make a working copy and fill it in locally:

```bash
cp infra/azure/containerapp.yaml containerapp.filled.yaml
# Keep it out of git:
echo "containerapp.filled.yaml" >> .git/info/exclude
```

In `containerapp.filled.yaml`, replace the placeholders:

- `<REGION>`, `<APP>` → your values.
- `managedEnvironmentId` → `az containerapp env show -n $ENV -g $RG --query id -o tsv`
- `<ACR_LOGIN_SERVER>` (two places), `<ACR_ADMIN_USERNAME>`, `<ACR_ADMIN_PASSWORD>`
  → from step 2.
- `database-url` → Neon **pooled** URL (`-pooler` host, `sslmode=require`).
- **`better-auth-secret` → generate ONCE and keep it forever:**

  ```bash
  openssl rand -hex 32
  ```

  Store this value in your password manager. **Do not regenerate it on
  redeploys** — changing it invalidates every existing session and logs all
  users out. Redeploys (step 8) only swap the image and never touch secrets, so
  it persists automatically.
- `google-client-id`, `google-client-secret` → Google Cloud OAuth client.
- `resend-api-key`, `anthropic-api-key` → optional; leave placeholders if not
  live yet (email falls back to the console stub; titles fall back to templates).
- `EMAIL_FROM` → e.g. `"TypeBeatOS <noreply@yourdomain>"`.
- Leave `APP_URL` as `https://PLACEHOLDER` for now — set in step 7.

> **`DIRECT_URL` is deliberately not in the YAML.** It is only used by Prisma
> migrations run from your laptop (step 6 below). The running container never
> needs it.

---

## 6. Create the Container App (single shot, registry included)

```bash
az containerapp create \
  --resource-group $RG \
  --name $APP \
  --yaml containerapp.filled.yaml
```

This one command creates the app with its image, registry pull credentials,
secrets, env vars, the `/app/uploads` volume mount, single-replica scale, and
the liveness/readiness probes — so there is **no** separate `registry set` step
(the registry must be configured *as part of* creation, not before the app
exists).

---

## 7. Resolve the FQDN, set APP_URL, wire Google OAuth

```bash
FQDN=$(az containerapp show -g $RG -n $APP \
  --query properties.configuration.ingress.fqdn -o tsv)
echo "https://$FQDN"

az containerapp update -g $RG -n $APP \
  --set-env-vars APP_URL="https://$FQDN"
```

Then in **Google Cloud Console → APIs & Services → Credentials → your OAuth
client → Authorized redirect URIs**, add exactly:

```
https://<FQDN>/api/youtube/callback
```

`APP_URL` drives both Better-Auth's `baseURL` and the YouTube OAuth callback
(`lib/auth-server.ts`, `lib/youtube.ts`); the Google redirect URI must match it
character-for-character or the YouTube connect flow fails.

---

## 8. Run Neon migrations (from your laptop — unchanged flow)

Same as `docs/postgres-cutover.md`. **`DIRECT_URL` is used only here.**

```bash
DIRECT_URL="<neon direct, NO -pooler>" \
DATABASE_URL="<neon pooled, -pooler>" \
npm run db:migrate:deploy

# verify
DIRECT_URL="<...>" DATABASE_URL="<...>" npm run db:migrate:status
```

> Never run `prisma migrate reset`, `db push --force-reset`, or the dev seed
> against the Neon production branch.

---

## Probe behaviour (why it won't restart on a Neon hiccup)

- **Readiness → `GET /api/health`** (`app/api/health/route.ts`): returns 503 if
  the DB `SELECT 1` fails. ACA reacts by taking the replica **out of traffic**
  until it recovers — it does **not** restart the container. So a transient Neon
  outage degrades gracefully instead of cycling the app.
- **Liveness → TCP connect on `:3000`**: proves the Node process is alive without
  touching the DB. Only an actual process hang/crash triggers a restart. This is
  what protects in-flight in-process render/upload jobs from being killed by a
  database blip.

---

## Redeploying after a code change

```bash
az acr build --registry $ACR --image typebeatos:v2 .
az containerapp update -g $RG -n $APP --image $ACR_LOGIN_SERVER/typebeatos:v2
```

Image-only update. Secrets (including `BETTER_AUTH_SECRET`) and env vars are
untouched, so sessions survive the deploy.

---

## Production smoke-test checklist

Against `https://$FQDN`:

- [ ] `curl https://$FQDN/api/health` → `200`, `{"status":"ok","db":"ok"}`.
- [ ] Landing page renders (logo + centered hero), padlock/HTTPS valid.
- [ ] **Signup** → dashboard, verify-email banner shows.
- [ ] **Email verification** link arrives (Resend) → banner clears.
- [ ] **Login / logout** → `tbos_session` cookie set with `Secure`.
- [ ] **Forgot → reset password** → Resend email → new password logs in.
- [ ] **Beat upload** (real audio) → BPM/key auto-detected, package generated.
- [ ] **Thumbnail save** → served via `/api/files/thumbs/...`.
- [ ] **Video render** → MP4 plays via `/api/files/videos/...`.
- [ ] **Persistence test:** `az containerapp revision restart` (or deploy a new
      revision), then re-open a previously uploaded file → still served (proves
      Azure Files persistence, not ephemeral disk). *This is the key migration
      check — #4.*
- [ ] **YouTube connect** → OAuth round-trip returns to `https://$FQDN`
      (confirms APP_URL + Google redirect URI match).
- [ ] Single replica: `az containerapp replica list -g $RG -n $APP` → exactly 1.
- [ ] Logs flow: `az containerapp logs show -g $RG -n $APP --follow`.

---

## Rollback

- **Bad image:** list revisions and reactivate the previous one.
  ```bash
  az containerapp revision list -g $RG -n $APP -o table
  az containerapp revision activate -g $RG -n $APP --revision <previous-revision>
  ```
- **Bad migration:** revert the code/migration and use Neon's point-in-time
  restore on the production branch (same as the Fly runbook).

---

## Documented next steps (not built now)

- **Azure Blob Storage** (roadmap C1): replace local-fs writes with a storage
  abstraction. Prerequisite for multi-replica. Azure Files is the zero-code v1.
- **Durable job queue** (roadmap C2): required before raising `maxReplicas`.
- **Container Apps Job for migrations**: cloud-native alternative to laptop-run
  `db:migrate:deploy` (a one-off job that runs on each release).
- **Managed identity for ACR pull**: replace admin username/password with a
  system-assigned identity granted `AcrPull` (hardening; admin creds are the
  reliable single-shot v1 path).
- **Custom domain + managed certificate**: bind a domain and switch `APP_URL` +
  the Google redirect URI to it. Using the free `*.azurecontainerapps.io` FQDN
  for now.
- **GitHub Actions auto-deploy**: `azure/login` → `az acr build` → `az
  containerapp update`, mirroring the optional Fly CI stub. Manual for now.
- **Fly.io files** remain in the repo as a fallback and are not removed.
