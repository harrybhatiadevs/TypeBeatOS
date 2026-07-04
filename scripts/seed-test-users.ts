/**
 * Dev-only: create/refresh test accounts with known passwords + plans.
 *   pro@test.com  → Pro subscription
 *   free@test.com → Free (no subscription)
 * Both with password "test". Uses Better-Auth's own hasher so login works
 * even though the password is shorter than the signup minimum.
 *
 * Run: DATABASE_URL="file:./dev.db" BETTER_AUTH_SECRET="<any 32+ chars>" \
 *        npx tsx scripts/seed-test-users.ts
 */
import { auth } from "@/lib/auth-server";
import { db } from "@/lib/db";

async function ensure(email: string, plan: "pro" | "free") {
  const ctx = await auth.$context;
  const password = await ctx.password.hash("test");
  const name = email.split("@")[0];

  const user = await db.user.upsert({
    where: { email },
    create: { email, name, emailVerified: true },
    update: { emailVerified: true },
  });

  const existing = await db.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  if (existing) {
    await db.account.update({ where: { id: existing.id }, data: { password } });
  } else {
    await db.account.create({
      data: { accountId: user.id, providerId: "credential", userId: user.id, password },
    });
  }

  if (plan === "pro") {
    await db.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, plan: "pro", status: "active", interval: "month" },
      update: { plan: "pro", status: "active", interval: "month" },
    });
  } else {
    await db.subscription.deleteMany({ where: { userId: user.id } });
  }

  console.log(`✓ ${email} → ${plan} (user ${user.id})`);
}

async function main() {
  await ensure("pro@test.com", "pro");
  await ensure("free@test.com", "free");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
