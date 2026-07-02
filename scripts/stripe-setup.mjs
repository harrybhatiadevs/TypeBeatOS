// One-off: create/reuse Products + Prices in Stripe for the paid plans.
// Idempotent — safe to re-run. Prints the price-id env lines.
//   node --env-file=.env.local scripts/stripe-setup.mjs
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("STRIPE_SECRET_KEY not set");
  process.exit(1);
}
const stripe = new Stripe(key);

const PLANS = [
  { plan: "pro", name: "TypeBeatOS Pro", monthly: 1900, annual: 19000 },
  { plan: "serious", name: "TypeBeatOS Serious", monthly: 2900, annual: 29000 },
];

async function findOrCreateProduct(plan, name) {
  try {
    const found = await stripe.products.search({ query: `metadata['plan']:'${plan}'` });
    if (found.data[0]) return found.data[0];
  } catch {
    // search may not be indexed yet on brand-new accounts — fall through to create
  }
  return stripe.products.create({ name, metadata: { plan } });
}

async function findOrCreatePrice(product, lookupKey, unitAmount, interval) {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (existing.data[0]) return existing.data[0];
  return stripe.prices.create({
    product: product.id,
    unit_amount: unitAmount,
    currency: "usd",
    recurring: { interval },
    lookup_key: lookupKey,
    metadata: { plan: product.metadata.plan, interval },
  });
}

const out = {};
for (const p of PLANS) {
  const product = await findOrCreateProduct(p.plan, p.name);
  const monthly = await findOrCreatePrice(product, `${p.plan}_monthly`, p.monthly, "month");
  const annual = await findOrCreatePrice(product, `${p.plan}_annual`, p.annual, "year");
  out[`STRIPE_PRICE_${p.plan.toUpperCase()}_MONTHLY`] = monthly.id;
  out[`STRIPE_PRICE_${p.plan.toUpperCase()}_ANNUAL`] = annual.id;
}

console.log("PRICE_IDS_START");
for (const [k, v] of Object.entries(out)) console.log(`${k}=${v}`);
console.log("PRICE_IDS_END");
