import "server-only";
import type Stripe from "stripe";
import { launchOfferFor, type PlanId } from "./plans";

/** The launch offer is for a customer's first subscription, not repeat renewals. */
export async function launchEligibleForCustomer(stripe: Stripe, customerId: string): Promise<boolean> {
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
  return !subscriptions.has_more && subscriptions.data.every((subscription) =>
    subscription.status === "incomplete" || subscription.status === "incomplete_expired",
  );
}

/** Use a once-only coupon so Stripe automatically bills the normal price next month. */
export async function launchCouponFor(stripe: Stripe, planId: PlanId, priceId: string): Promise<string> {
  const offer = launchOfferFor(planId);
  if (!offer) throw new Error("The Free plan has no launch discount.");

  const price = await stripe.prices.retrieve(priceId);
  if (!price.active || price.currency !== "usd" || price.unit_amount !== offer.regularPrice * 100 ||
      price.recurring?.interval !== "month" || price.recurring.interval_count !== 1) {
    throw new Error("Monthly Stripe price does not match the advertised launch offer.");
  }
  const productId = typeof price.product === "string" ? price.product : price.product.id;
  let coupon: Stripe.Coupon;
  try {
    coupon = await stripe.coupons.retrieve(offer.couponId, { expand: ["applies_to"] });
  } catch (error) {
    if ((error as { code?: string }).code !== "resource_missing") throw error;
    coupon = await stripe.coupons.create({
      id: offer.couponId,
      name: `${planId === "pro" ? "Pro" : "Serious"} launch — first month only`,
      amount_off: offer.amountOff,
      currency: "usd",
      duration: "once",
      applies_to: { products: [productId] },
      metadata: { campaign: "launch_first_month_v1", plan: planId },
      expand: ["applies_to"],
    }, { idempotencyKey: offer.couponId });
  }
  if (!coupon.valid || coupon.duration !== "once" || coupon.amount_off !== offer.amountOff ||
      coupon.currency !== "usd" || !coupon.applies_to?.products.includes(productId)) {
    throw new Error("Stripe launch coupon does not match the advertised offer.");
  }
  return coupon.id;
}
