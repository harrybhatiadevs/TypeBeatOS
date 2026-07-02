// Create (or recreate) the Stripe webhook endpoint for prod and append its
// signing secret to .env.local. Does not print the secret.
//   node --env-file=.env.local scripts/stripe-webhook.mjs [url]
import Stripe from "stripe";
import { appendFileSync } from "fs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const url = process.argv[2] || "https://typebeatos.com/api/stripe/webhook";
const events = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
];

// Remove any existing endpoint for this URL (secret can't be re-read, so recreate).
const list = await stripe.webhookEndpoints.list({ limit: 100 });
for (const ep of list.data) {
  if (ep.url === url) await stripe.webhookEndpoints.del(ep.id);
}

const created = await stripe.webhookEndpoints.create({ url, enabled_events: events });
appendFileSync(".env.local", `STRIPE_WEBHOOK_SECRET=${created.secret}\n`);
console.log(`WEBHOOK OK id=${created.id} url=${url} (secret written to .env.local)`);
