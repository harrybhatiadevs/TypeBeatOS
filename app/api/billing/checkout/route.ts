import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getOrCreateStripeCustomer, getSubscription, priceIdFor, resolvePlanId } from "@/lib/billing";
import type { PlanId, Interval } from "@/lib/plans";
import { launchCouponFor, launchEligibleForCustomer } from "@/lib/launch-discount";
import { loggerFor } from "@/lib/logger";

const log = loggerFor("billing-checkout");

function betaTrialDaysFor(input: { code?: string | null; plan: PlanId }): number {
  const expected = (process.env.STRIPE_BETA_TRIAL_CODE || "").trim().toLowerCase();
  const provided = (input.code || "").trim().toLowerCase();
  if (!expected || !provided) return 0;
  if (provided !== expected) return -1;
  return input.plan === "pro" ? Number(process.env.STRIPE_BETA_TRIAL_DAYS || 7) : -1;
}

// Create an embedded Stripe Checkout session for a subscription. Returns the
// client_secret the browser mounts with <EmbeddedCheckout>.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!stripeConfigured()) return NextResponse.json({ error: "Billing isn't set up yet." }, { status: 503 });

  let body: { plan?: PlanId; interval?: Interval; betaCode?: string; launchOffer?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const plan = body.plan;
  const interval: Interval = body.interval === "year" ? "year" : "month";
  if (plan !== "pro" && plan !== "serious") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  const betaTrialDays = betaTrialDaysFor({ code: body.betaCode, plan });
  if (betaTrialDays < 0) {
    return NextResponse.json({ error: "That beta code is not valid for this plan." }, { status: 400 });
  }
  const price = priceIdFor(plan, interval);
  if (!price) return NextResponse.json({ error: "That plan isn't available yet." }, { status: 503 });

  const existing = await getSubscription(user.id);
  if (resolvePlanId(existing) !== "free") {
    return NextResponse.json({ error: "Use Manage billing to change your existing subscription." }, { status: 409 });
  }

  try {
    const origin = request.headers.get("origin") || new URL(request.url).origin;
    const customer = await getOrCreateStripeCustomer(user);
    const stripe = getStripe();
    const eligible = interval === "month" && betaTrialDays === 0 && await launchEligibleForCustomer(stripe, customer);
    if (body.launchOffer && !eligible) {
      return NextResponse.json({ error: "The launch special is for new monthly subscribers only. Refresh the plans to see your available pricing." }, { status: 409 });
    }
    const coupon = eligible ? await launchCouponFor(stripe, plan, price) : null;

    const subscriptionData = {
      metadata: { userId: user.id },
      ...(betaTrialDays > 0 ? { trial_period_days: betaTrialDays } : {}),
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ui_mode: "embedded_page",
      customer,
      line_items: [{ price, quantity: 1 }],
      subscription_data: subscriptionData,
      ...(coupon ? { discounts: [{ coupon }] } : { allow_promotion_codes: true }),
      return_url: `${origin}/billing?checkout={CHECKOUT_SESSION_ID}`,
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    log.error({ error: error instanceof Error ? error.message : String(error), plan, interval }, "could not create checkout");
    return NextResponse.json({ error: "Could not start checkout. Please try again in a moment." }, { status: 503 });
  }
}
