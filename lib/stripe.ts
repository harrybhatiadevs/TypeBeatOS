import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export function readStripeEnv(name: string): string {
  return (process.env[name] || "").replace(/\s+/g, "");
}

/** Lazily-constructed Stripe client. Throws only when actually used without a key. */
export function getStripe(): Stripe {
  const key = readStripeEnv("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!client) client = new Stripe(key);
  return client;
}

export function stripeConfigured(): boolean {
  return !!readStripeEnv("STRIPE_SECRET_KEY");
}
