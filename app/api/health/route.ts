import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Liveness + readiness probe for the host.
// Returns 200 with `db: "ok"` when Postgres is reachable, 503 otherwise.
// Uptime monitors should treat anything != 200 as failure.
export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  try {
    await db.$queryRawUnsafe<{ ok: number }[]>("SELECT 1 as ok");
    dbOk = true;
  } catch {
    dbOk = false;
  }
  const body = {
    status: dbOk ? "ok" : "degraded",
    db: dbOk ? "ok" : "down",
    uptime: process.uptime(),
    latency_ms: Date.now() - startedAt,
  };
  return NextResponse.json(body, {
    status: dbOk ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
