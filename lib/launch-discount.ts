import "server-only";
import type Stripe from "stripe";
import { launchOfferFor, type PlanId } from "./plans";

/** One launch redemption per customer; canceled subscriptions before the launch are eligible. */
export async function launchEligibleForCustomer(stripe: Stripe, customerId: string): Promise<boolean> {
  let subscriptions: Stripe.ApiList<Stripe.Subscription>;
  try {
    subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100, expand: ["data.discounts"] });
  } catch (error) {
    const detail = error as { code?: string; param?: string };
    // getOrCreateStripeCustomer replaces stale sandbox/deleted customer IDs
    // before checkout; show that new customer's eligible offer consistently.
    if (detail.code === "resource_missing" && detail.param === "customer") return true;
    throw error;
  }
  const launchCoupons = new Set([launchOfferFor("pro")!.couponId, launchOfferFor("serious")!.couponId]);
  return !subscriptions.has_more && subscriptions.data.every((subscription) => {
    if (subscription.status === "incomplete_expired") return true;
    if (subscription.status !== "canceled" && subscription.status !== "incomplete") return false;
    if (subscription.metadata?.launch_offer === "launch_first_month_v1") return false;
    return (subscription.discounts || []).every((discount) => {
      if (typeof discount === "string") return false;
      const coupon = discount.source?.coupon;
      return !coupon || !launchCoupons.has(typeof coupon === "string" ? coupon : coupon.id);
    });
  });
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
