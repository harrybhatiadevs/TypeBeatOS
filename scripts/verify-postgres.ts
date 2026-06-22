import { PrismaClient } from "@prisma/client";

const EXPECTED_TABLES = [
  "Account",
  "Beat",
  "Package",
  "Profile",
  "Session",
  "User",
  "Verification",
  "WaitlistSignup",
  "YouTubeAccount",
  "_prisma_migrations",
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl?.startsWith("postgres")) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string");
  }

  const db = new PrismaClient();
  try {
    await db.$queryRaw`SELECT 1`;
    const rows = await db.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tables = rows.map(({ table_name }) => table_name);
    const missing = EXPECTED_TABLES.filter((table) => !tables.includes(table));

    console.log("Connected to PostgreSQL successfully.");
    console.log(`Tables (${tables.length}): ${tables.join(", ") || "none"}`);

    if (missing.length > 0) {
      throw new Error(`Neon schema is missing tables: ${missing.join(", ")}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
