/**
 * One-off cleanup script: deletes the seeded development test account and any
 * leftover fixture data before flipping a database to production.
 *
 * Usage (during SQLite -> Postgres migration, or after restoring a dev dump):
 *
 *   CONFIRM_CLEANUP=yes npx tsx scripts/cleanup-test-data.ts
 *
 * The confirmation gate and SQLite URL check prevent this script from running
 * against Neon or another live customer database by accident.
 */
import { db } from "@/lib/db";

// Every test-account email the codebase has ever issued — cleanup needs
// to catch any of them regardless of which seed era they're from.
const TEST_EMAILS = [
  "test@typebeatos.com",
  "test@typebeatos.local",
  "ba-test@typebeatos.local",
];

async function main() {
  if (process.env.CONFIRM_CLEANUP !== "yes") {
    console.error("Refusing to run without CONFIRM_CLEANUP=yes");
    process.exit(2);
  }
  if (!process.env.DATABASE_URL?.startsWith("file:")) {
    console.error("Refusing to clean a non-SQLite database");
    process.exit(2);
  }

  const beforeUsers = await db.user.count({ where: { email: { in: TEST_EMAILS } } });
  if (beforeUsers === 0) {
    console.log("No test accounts found. Database is clean.");
    return;
  }

  // Sessions, profiles, beats, packages, YouTubeAccount all cascade from User.
  const result = await db.user.deleteMany({ where: { email: { in: TEST_EMAILS } } });
  console.log(`Deleted ${result.count} test account(s):`, TEST_EMAILS.join(", "));

  // Sanity check: assert they're gone before we exit.
  const remaining = await db.user.count({ where: { email: { in: TEST_EMAILS } } });
  if (remaining > 0) {
    console.error(`FAILED: ${remaining} test account(s) still present.`);
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
