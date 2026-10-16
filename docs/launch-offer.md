# First-month launch special

New monthly subscribers receive Pro for **$12 USD for the first month** (normally $19/month) or Serious for **$17 USD for the first month** (normally $29/month). Serious saves approximately 41%; Pro approximately 37%.

The normal recurring Stripe Price IDs remain unchanged. Checkout applies a product-scoped, USD, `duration: once` coupon: $7 off Pro or $12 off Serious. Stripe therefore bills the normal monthly price on renewal. Annual prices remain $190 and $290. Existing subscribers change plans through the billing portal and do not create a second discounted subscription. The launch discount does not stack with beta trials or manually entered promotion codes.

Shared offer values live in `lib/plans.ts`. Both the landing page and billing page read those values. `lib/launch-discount.ts` verifies the real Stripe monthly price and coupon before checkout, and fails rather than silently charging an unexpected amount. Current subscriptions and previous launch-coupon redemptions make a customer ineligible for a repeat offer. Canceled subscriptions from before the launch and expired unpaid attempts do not. Discounted subscriptions carry a campaign marker so canceling and resubscribing cannot repeatedly claim the offer.

## Provisioning and verification

Coupons are provisioned automatically when eligible checkout first runs. They can also be created and checked in advance:

```sh
node --env-file=.env.local --conditions=react-server --import tsx scripts/stripe-launch-offer.ts
```

With a **test key**, add `--verify-checkout` to confirm the embedded Checkout totals are exactly 1200 and 1700 cents. Verification immediately expires its test sessions and creates no subscriptions or payments. It refuses Checkout verification with a live key. Normal provisioning supports either mode and creates only the two coupons.

On 16 October 2026 the test Checkout totals were verified, and the live product-scoped coupons were provisioned and verified against the existing $19/$29 USD monthly prices.
