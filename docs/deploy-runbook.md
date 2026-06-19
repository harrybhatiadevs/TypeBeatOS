# Fly.io deploy runbook

This is the first real production deploy. Until now we've served beta
traffic via the Cloudflare quick tunnel from a Mac (`start-beta.sh`),
which is fine for ten testers and not fine for a hundred.

The runbook assumes you've already run `docs/postgres-cutover.md` and
have a Neon production `DATABASE_URL`. If you haven't, do that first —
deploying against the dev SQLite file is meaningless.

## Pre-flight (one-time, ~10 min)

1. `brew install flyctl` (or `curl -L https://fly.io/install.sh | sh`)
2. `fly auth login` — picks your GitHub email
3. Confirm `fly.toml` `app = "typebeatos"` is the name you want; Fly
   names are globally unique.

## Provision the Fly app (one-time, ~5 min)

```bash
# Creates the app + the volume the Dockerfile mount expects
fly apps create typebeatos --org personal
fly volumes create typebeatos_data --region syd --size 10 --yes
```

## Set secrets (one-time)

```bash
# Required
fly secrets set \
  DATABASE_URL="<neon production pooled URL>" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  GOOGLE_CLIENT_ID="<from Google Cloud OAuth client>" \
  GOOGLE_CLIENT_SECRET="<same>" \
  APP_URL="https://typebeatos.fly.dev"

# Optional now, required as we wire integrations
fly secrets set \
  ANTHROPIC_API_KEY="<for AI title generation>" \
  STABILITY_API_KEY="<for thumbnail backgrounds>"
```

Note: `APP_URL` should be the canonical public origin. Once a custom
domain is attached, update it; Google's OAuth client redirect URI must
match exactly.

## Deploy

```bash
fly deploy --remote-only
```

`--remote-only` builds the Dockerfile on Fly's remote builder so you
don't need a working local Docker daemon. First deploy takes ~6 minutes
(cold cache); subsequent ones ~2 minutes.

## Smoke test (~5 min)

In order — stop at the first failure:

- [ ] `curl https://typebeatos.fly.dev/api/health` returns `{"status":"ok","db":"up",...}`
- [ ] Hit `/waitlist` from a browser — page renders, signup succeeds
- [ ] Sign up a real account, log in, log out
- [ ] Upload a small mp3 beat
- [ ] Generate a package (titles, description, tags)
- [ ] Render a video (waveform style — exercises ffmpeg)
- [ ] Connect a YouTube channel
- [ ] (Skip actual YouTube upload until Google app verification clears)

Watch logs in another terminal:
```bash
fly logs
```

The structured pino output is JSON in production — pipe through `jq` if
you want pretty:
```bash
fly logs | jq -R 'fromjson? // .'
```

## Rollback

Two paths depending on what broke:

**Bad image (build succeeded but app crashes):**
```bash
fly releases       # find the last good release number
fly deploy --image registry.fly.io/typebeatos:deployment-<good-number>
```

**Bad migration (app boots but data is wrong):**
1. Roll back code via the above
2. Restore the Neon `production` branch from PITR — `neon branches restore production --timestamp=<just before deploy>`

If both fail, the SQLite dev DB is still on the developer's Mac. We can
serve read-only via the beta tunnel as a stopgap.

## What's NOT in this runbook (yet)

These are Sprint 2+ follow-ups, deliberately scoped out:

- **R2 / S3 for `/app/uploads`.** Today the volume holds renders + audio.
  That works for one machine; the moment we scale horizontally we need
  shared object storage. Tracked separately.
- **Separate worker machine group.** The in-process queue in `lib/video.ts`
  and `lib/youtube.ts` assumes a single machine. Splitting renders off
  to a `processes = ["worker"]` group needs the queue moved to BullMQ +
  Upstash Redis first.
- **Sentry.** DSN wiring is one env var + a small `instrumentation.ts`
  hook — saved for when we have the Sentry account.
- **Resend.** Same story — needs an account before the in-codebase wiring
  is worth doing.
- **Custom domain + TLS.** `fly certs add typebeatos.com` once DNS is
  pointed at the Fly anycast IP.

## CI auto-deploy (optional, post-launch)

Once the first manual deploy is green, add a GitHub Actions job:
```yaml
deploy:
  needs: [test, audit]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: superfly/flyctl-actions/setup-flyctl@master
    - run: flyctl deploy --remote-only
      env:
        FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Grab the token from `fly tokens create deploy` and store as
`FLY_API_TOKEN` in repo secrets. Don't wire this until you've done at
least one manual deploy successfully.
