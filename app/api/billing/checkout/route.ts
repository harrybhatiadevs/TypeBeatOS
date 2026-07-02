import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getOrCreateStripeCustomer, priceIdFor } from "@/lib/billing";
import type { PlanId, Interval } from "@/lib/plans";

// Create an embedded Stripe Checkout session for a subscription. Returns the
// client_secret the browser mounts with <EmbeddedCheckout>.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!stripeConfigured()) return NextResponse.json({ error: "Billing isn't set up yet." }, { status: 503 });

  let body: { plan?: PlanId; interval?: Interval };
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
  const price = priceIdFor(plan, interval);
  if (!price) return NextResponse.json({ error: "That plan isn't available yet." }, { status: 503 });

  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const customer = await getOrCreateStripeCustomer(user);

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    ui_mode: "embedded_page",
    customer,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
    return_url: `${origin}/billing?checkout={CHECKOUT_SESSION_ID}`,
  });

  return NextResponse.json({ clientSecret: session.client_secret });
}
