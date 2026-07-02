import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getStripe, stripeConfigured } from "@/lib/stripe";

// Poll a Checkout Session's status from the /billing return page.
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!stripeConfigured()) return NextResponse.json({ error: "Billing isn't set up yet." }, { status: 503 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing session id." }, { status: 400 });

  const session = await getStripe().checkout.sessions.retrieve(id);
  return NextResponse.json({ status: session.status, paymentStatus: session.payment_status });
}
