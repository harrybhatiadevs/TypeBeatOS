// Plan definitions — the single source of truth for tiers, quotas, and display
// copy. Pure (no env, no secrets) so it's safe to import from client components.
// Stripe price-id resolution lives server-side in lib/billing.ts.

export type PlanId = "free" | "pro" | "serious";
export type Interval = "month" | "year";

export type Plan = {
  id: PlanId;
  label: string;
  /** Monthly upload-pack (generated package) quota. */
  packsPerMonth: number;
  /** Max connected YouTube channels (Infinity = unlimited). */
  maxChannels: number;
  /** Max saved upload templates (0 = feature locked, Infinity = unlimited). */
  maxTemplates: number;
  /** Display prices in USD. priceAnnual is the yearly total. */
  priceMonthly: number;
  priceAnnual: number;
  blurb: string;
  perks: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Free",
    packsPerMonth: 3,
    maxChannels: 1,
    maxTemplates: 0,
    priceMonthly: 0,
    priceAnnual: 0,
    blurb: "Get started",
    perks: ["3 upload packs / mo", "Titles + descriptions", "Direct YouTube publish"],
  },
  pro: {
    id: "pro",
    label: "Pro",
    packsPerMonth: 60,
    maxChannels: 1,
    maxTemplates: 3,
    priceMonthly: 19,
    priceAnnual: 190, // ~2 months free
    blurb: "For active channels",
    perks: ["60 upload packs / mo", "Batch upload queue", "Direct YouTube publish", "Custom templates"],
  },
  serious: {
    id: "serious",
    label: "Serious",
    packsPerMonth: 150,
    maxChannels: Infinity,
    maxTemplates: Infinity,
    priceMonthly: 29,
    priceAnnual: 290, // ~2 months free
    blurb: "Scale it",
    perks: ["150 upload packs / mo", "Multiple channels", "Analytics + keyword insights", "Advanced templates"],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "serious"];

export function isPaidPlan(id: PlanId): boolean {
  return id === "pro" || id === "serious";
}

/** Display price for a plan at the chosen interval (per-month equivalent for annual). */
export function displayMonthly(plan: Plan, interval: Interval): number {
  if (plan.priceMonthly === 0) return 0;
  return interval === "year" ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;
}
