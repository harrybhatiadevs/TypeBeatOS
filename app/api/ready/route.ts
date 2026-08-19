import { NextResponse } from "next/server";

// Container-platform readiness probe. Deliberately does NOT touch the database.
//
// The Azure Container Apps readiness probe runs every 15s. When it queried
// Postgres, that was ~5,760 `SELECT 1`s a day against Neon — enough to reset
// Neon's 5-minute scale-to-zero timer forever, so the database never slept and
// billed ~24h of compute a day even with no users on the site.
//
// Readiness decides which replica receives traffic. We run min=max=1 (see
// infra/azure/containerapp.yaml), so a DB-aware readiness signal has nothing to
// act on: failing it takes the whole site down rather than shifting traffic.
// A 200 here means what the platform actually needs to know — this process is
// up and routing HTTP. Database health is reported by `/api/health`, which is
// for humans and uptime monitors, not for a 15-second loop.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { status: "ok", uptime: process.uptime() },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
