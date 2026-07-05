"use client";

import { useCallback, useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { PLANS, PLAN_ORDER, type Interval, type PlanId } from "@/lib/plans";

export default function BillingPlans({
  currentPlanId,
  isPaid,
  configured,
  publishableKey,
}: {
  currentPlanId: PlanId;
  isPaid: boolean;
  configured: boolean;
  publishableKey: string;
}) {
  const [interval, setInterval] = useState<Interval>("month");
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);
  const [betaCode, setBetaCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One Stripe.js instance for the whole component.
  const stripePromise = useMemo<Promise<Stripe | null> | null>(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: checkoutPlan, interval, betaCode: betaCode.trim() || undefined }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Could not start checkout.");
    }
    const { clientSecret } = await res.json();
    return clientSecret as string;
  }, [checkoutPlan, interval, betaCode]);

  async function openPortal() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error || "Could not open billing.");
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  // Embedded checkout view.
  if (checkoutPlan && stripePromise) {
    return (
      <div className="card">
        <button type="button" className="copy-btn" onClick={() => setCheckoutPlan(null)} style={{ marginBottom: "1rem" }}>
          ← Back to plans
        </button>
        <EmbeddedCheckoutProvider key={`${checkoutPlan}-${interval}`} stripe={stripePromise} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  return (
    <>
      {error && <div className="form-error">{error}</div>}

      <div className="billing-toggle" role="group" aria-label="Billing interval">
        <button
          type="button"
          className={`billing-toggle-btn${interval === "month" ? " is-active" : ""}`}
          onClick={() => setInterval("month")}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`billing-toggle-btn${interval === "year" ? " is-active" : ""}`}
          onClick={() => setInterval("year")}
        >
          Annual <span className="billing-save">2 months free</span>
        </button>
      </div>

      <div className="billing-beta">
        <label htmlFor="billing-beta-code">Beta code</label>
        <input
          id="billing-beta-code"
          type="text"
          value={betaCode}
          onChange={(event) => setBetaCode(event.target.value)}
          placeholder="Optional"
          autoComplete="off"
        />
      </div>

      <div className="billing-plans">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const isCurrent = id === currentPlanId;
          const price = interval === "year" ? plan.priceAnnual : plan.priceMonthly;
          const unit = interval === "year" ? "/yr" : "/mo";
          const featured = id === "pro";

          return (
            <div key={id} className={`billing-plan${featured ? " billing-plan-featured" : ""}${isCurrent ? " billing-plan-current" : ""}`}>
              {isCurrent && <span className="billing-plan-flag">Current plan</span>}
              {!isCurrent && featured && <span className="billing-plan-flag">Most popular</span>}
              <div className="billing-plan-name">{plan.label}</div>
              <div className="billing-plan-price">
                ${price}
                <small>{plan.priceMonthly === 0 ? "" : unit}</small>
              </div>
              {interval === "year" && plan.priceMonthly > 0 && (
                <div className="billing-plan-sub">${Math.round(plan.priceAnnual / 12)}/mo billed yearly</div>
              )}
              <ul className="billing-plan-perks">
                {plan.perks.map((p) => <li key={p}>{p}</li>)}
              </ul>

              {isCurrent ? (
                isPaid ? (
                  <button type="button" className="btn btn-ghost" disabled={busy} onClick={openPortal}>
                    Manage billing
                  </button>
                ) : (
                  <button type="button" className="btn btn-ghost" disabled>
                    Your plan
                  </button>
                )
              ) : id === "free" ? (
                <button type="button" className="btn btn-ghost" disabled={busy} onClick={openPortal}>
                  Downgrade
                </button>
              ) : (
                <button
                  type="button"
                  className={featured ? "btn btn-primary" : "btn btn-ghost"}
                  disabled={!configured}
                  onClick={() => {
                    setError(null);
                    setCheckoutPlan(id);
                  }}
                >
                  {configured ? `Choose ${plan.label}` : "Coming soon"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!configured && (
        <p className="page-sub" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Checkout isn&apos;t live yet — payment is being set up.
        </p>
      )}
    </>
  );
}
