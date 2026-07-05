import "server-only";
import { db } from "@/lib/db";
import { getStripe, readStripeEnv } from "@/lib/stripe";
import { PLANS, type Plan, type PlanId, type Interval } from "@/lib/plans";
import { isAdminEmail } from "@/lib/admin";

// ---- Stripe price-id <-> plan mapping (env-driven, server only) ----

export function priceIdFor(plan: PlanId, interval: Interval): string | undefined {
  if (plan === "pro") {
    return interval === "year" ? readStripeEnv("STRIPE_PRICE_PRO_ANNUAL") : readStripeEnv("STRIPE_PRICE_PRO_MONTHLY");
  }
  if (plan === "serious") {
    return interval === "year"
      ? readStripeEnv("STRIPE_PRICE_SERIOUS_ANNUAL")
      : readStripeEnv("STRIPE_PRICE_SERIOUS_MONTHLY");
  }
  return undefined;
}

export function planFromPriceId(priceId: string): { plan: PlanId; interval: Interval } | null {
  const table: Array<[string | undefined, PlanId, Interval]> = [
    [readStripeEnv("STRIPE_PRICE_PRO_MONTHLY"), "pro", "month"],
    [readStripeEnv("STRIPE_PRICE_PRO_ANNUAL"), "pro", "year"],
    [readStripeEnv("STRIPE_PRICE_SERIOUS_MONTHLY"), "serious", "month"],
    [readStripeEnv("STRIPE_PRICE_SERIOUS_ANNUAL"), "serious", "year"],
  ];
  for (const [id, plan, interval] of table) {
    if (id && id === priceId) return { plan, interval };
  }
  return null;
}

// ---- Subscription + usage ----

export type SubscriptionRow = NonNullable<Awaited<ReturnType<typeof getSubscription>>>;

export function getSubscription(userId: string) {
  return db.subscription.findUnique({ where: { userId } });
}

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/** The plan a user effectively has right now (free unless a paid sub is active). */
export function resolvePlanId(sub: { plan: string; status: string } | null): PlanId {
  if (sub && ACTIVE_STATUSES.has(sub.status) && (sub.plan === "pro" || sub.plan === "serious")) {
    return sub.plan;
  }
  return "free";
}

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Upload packs (generated packages) created by this user in the current calendar month. */
export function getMonthlyUsage(userId: string): Promise<number> {
  return db.package.count({ where: { beat: { userId }, createdAt: { gte: startOfMonth() } } });
}

export type PlanState = {
  planId: PlanId;
  plan: Plan;
  used: number;
  limit: number;
  remaining: number;
  isAdmin: boolean;
  subscription: Awaited<ReturnType<typeof getSubscription>>;
};

export async function getPlanState(user: { id: string; email: string }): Promise<PlanState> {
  const [subscription, used] = await Promise.all([getSubscription(user.id), getMonthlyUsage(user.id)]);
  const planId = resolvePlanId(subscription);
  const plan = PLANS[planId];
  const limit = plan.packsPerMonth;
  return {
    planId,
    plan,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    isAdmin: isAdminEmail(user.email),
    subscription,
  };
}

export type QuotaCheck = { ok: true } | { ok: false; used: number; limit: number; planId: PlanId };

/** Whether the user may generate another upload pack this month. Admins bypass. */
export async function canGeneratePackage(user: { id: string; email: string }): Promise<QuotaCheck> {
  if (isAdminEmail(user.email)) return { ok: true };
  const [subscription, used] = await Promise.all([getSubscription(user.id), getMonthlyUsage(user.id)]);
  const planId = resolvePlanId(subscription);
  const limit = PLANS[planId].packsPerMonth;
  if (used >= limit) return { ok: false, used, limit, planId };
  return { ok: true };
}

/** The saved-template allowance for a user's current plan. Admins are unlimited. */
export async function getTemplateAllowance(
  user: { id: string; email: string },
): Promise<{ planId: PlanId; limit: number }> {
  if (isAdminEmail(user.email)) return { planId: "serious", limit: Infinity };
  const subscription = await getSubscription(user.id);
  const planId = resolvePlanId(subscription);
  return { planId, limit: PLANS[planId].maxTemplates };
}

// ---- Stripe customer ----

export async function getOrCreateStripeCustomer(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<string> {
  const existing = await getSubscription(user.id);
  const stripe = getStripe();
  if (existing?.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existing.stripeCustomerId);
      if (!("deleted" in customer) || !customer.deleted) return existing.stripeCustomerId;
    } catch (err) {
      const maybeStripeError = err as { code?: string; param?: string; statusCode?: number };
      if (maybeStripeError.code !== "resource_missing" && maybeStripeError.statusCode !== 404) {
        throw err;
      }
    }
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId: user.id },
  });

  await db.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, stripeCustomerId: customer.id },
    update: { stripeCustomerId: customer.id },
  });
  return customer.id;
}
