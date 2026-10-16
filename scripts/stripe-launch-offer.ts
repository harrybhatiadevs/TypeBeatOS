// Provision the same verified coupons checkout uses. No charges or subscriptions.
// node --env-file=.env.local --conditions=react-server --import tsx scripts/stripe-launch-offer.ts --verify-checkout
import { getStripe, readStripeEnv } from "../lib/stripe";
import { launchCouponFor } from "../lib/launch-discount";
import { launchOfferFor } from "../lib/plans";

async function main() {
  const stripe = getStripe();
  const testMode = readStripeEnv("STRIPE_SECRET_KEY").startsWith("sk_test_");
  const verifyCheckout = process.argv.includes("--verify-checkout");
  if (verifyCheckout && !testMode) throw new Error("Checkout verification must use a Stripe test key.");
  for (const plan of ["pro", "serious"] as const) {
    const price = readStripeEnv(`STRIPE_PRICE_${plan.toUpperCase()}_MONTHLY`);
    if (!price) throw new Error(`Missing ${plan} monthly price ID.`);
    const coupon = await launchCouponFor(stripe, plan, price);
    const offer = launchOfferFor(plan)!;
    let checkoutTotal: number | null = null;
    if (verifyCheckout) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription", ui_mode: "embedded_page",
        line_items: [{ price, quantity: 1 }], discounts: [{ coupon }],
        return_url: "http://localhost:3000/billing?checkout={CHECKOUT_SESSION_ID}",
        metadata: { verification: "launch_offer" },
      });
      try {
        checkoutTotal = session.amount_total;
        if (checkoutTotal !== offer.firstMonthPrice * 100) throw new Error(`${plan} checkout total does not match the offer.`);
      } finally {
        await stripe.checkout.sessions.expire(session.id);
      }
    }
    console.log(JSON.stringify({ plan, mode: testMode ? "test" : "live", coupon, firstMonth: offer.firstMonthPrice, renewal: offer.regularPrice, duration: "once", checkoutTotal }));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
