import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/billing";

// Open the Stripe-hosted Billing Portal so the customer can update/cancel.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!stripeConfigured()) return NextResponse.json({ error: "Billing isn't set up yet." }, { status: 503 });

  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const customer = await getOrCreateStripeCustomer(user);
  const portal = await getStripe().billingPortal.sessions.create({
    customer,
    return_url: `${origin}/billing`,
  });
  return NextResponse.json({ url: portal.url });
}
