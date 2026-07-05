import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, readStripeEnv } from "@/lib/stripe";
import { db } from "@/lib/db";
import { planFromPriceId } from "@/lib/billing";
import { loggerFor } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = loggerFor("stripe");

export async function POST(request: Request) {
  const secret = readStripeEnv("STRIPE_WEBHOOK_SECRET");
  if (!secret) return NextResponse.json({ error: "webhook not configured" }, { status: 503 });

  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const raw = await request.text(); // must be the untouched raw body
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    log.warn({ err: err instanceof Error ? err.message : err }, "signature verification failed");
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "invoice.paid":
      case "invoice.payment_failed":
        await syncFromEvent(event);
        break;
      default:
        break;
    }
  } catch (err) {
    // Ack anyway (200) so Stripe doesn't hammer retries on our internal errors;
    // state is reconciled on the next event or via a manual resync.
    log.error({ type: event.type, err: err instanceof Error ? err.message : err }, "handler error");
  }

  return NextResponse.json({ received: true });
}

/** Resolve the customer from any relevant event, fetch the authoritative
 *  subscription from Stripe, and upsert our Subscription row. */
async function syncFromEvent(event: Stripe.Event) {
  const stripe = getStripe();
  const obj = event.data.object as unknown as Record<string, unknown>;

  const customerId = typeof obj.customer === "string" ? obj.customer : null;
  let subscriptionId: string | null = event.type.startsWith("customer.subscription")
    ? (obj.id as string)
    : typeof obj.subscription === "string"
      ? (obj.subscription as string)
      : null;

  if (!customerId) return;

  // Map Stripe customer -> our user.
  const existing = await db.subscription.findFirst({ where: { stripeCustomerId: customerId } });
  let userId = existing?.userId ?? null;
  if (!userId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (!("deleted" in customer) || !customer.deleted) {
      userId = ((customer as Stripe.Customer).metadata?.userId as string) || null;
    }
  }
  if (!userId) {
    log.warn({ customerId, type: event.type }, "no user for customer");
    return;
  }

  if (!subscriptionId) {
    const list = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 1 });
    subscriptionId = list.data[0]?.id ?? null;
  }

  if (!subscriptionId) {
    await db.subscription.upsert({
      where: { userId },
      create: { userId, stripeCustomerId: customerId, plan: "free", status: "inactive" },
      update: { plan: "free", status: "inactive", stripeSubscriptionId: null, cancelAtPeriodEnd: false },
    });
    return;
  }

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = sub.items.data[0]?.price?.id ?? "";
  const mapped = planFromPriceId(priceId);
  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;

  const data = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    plan: mapped?.plan ?? "free",
    status: sub.status,
    interval: mapped?.interval ?? "month",
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };

  await db.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  log.info({ userId, plan: data.plan, status: data.status, type: event.type }, "subscription synced");
}
