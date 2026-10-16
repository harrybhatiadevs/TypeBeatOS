"use client";

import { useCallback, useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { LAUNCH_OFFER, launchOfferFor, PLANS, PLAN_ORDER, type Interval, type PlanId } from "@/lib/plans";

export default function BillingPlans({
  currentPlanId,
  isPaid,
  configured,
  publishableKey,
  launchEligible,
}: {
  currentPlanId: PlanId;
  isPaid: boolean;
  configured: boolean;
  publishableKey: string;
  launchEligible: boolean;
}) {
  const [interval, setInterval] = useState<Interval>("month");
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);
  const [betaCode, setBetaCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showLaunch = launchEligible && interval === "month" && !betaCode.trim();

  // One Stripe.js instance for the whole component.
  const stripePromise = useMemo<Promise<Stripe | null> | null>(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: checkoutPlan, interval, betaCode: betaCode.trim() || undefined, launchOffer: showLaunch }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Could not start checkout.");
    }
    const { clientSecret } = await res.json();
    return clientSecret as string;
  }, [checkoutPlan, interval, betaCode, showLaunch]);

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
        {showLaunch && <p className="billing-checkout-offer">{LAUNCH_OFFER.label}: ${launchOfferFor(checkoutPlan)?.firstMonthPrice} for your first month, then ${PLANS[checkoutPlan].priceMonthly}/month. USD.</p>}
        <EmbeddedCheckoutProvider key={`${checkoutPlan}-${interval}`} stripe={stripePromise} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  return (
    <>
      {error && <div className="form-error">{error}</div>}

      {showLaunch && <div className="billing-launch-banner">
        <span className="billing-launch-label">{LAUNCH_OFFER.label} · One-month discount</span>
        <h2>Your first month, for less.</h2>
        <p>Pro ${LAUNCH_OFFER.prices.pro} or Serious ${LAUNCH_OFFER.prices.serious} for your first month. Then ${PLANS.pro.priceMonthly} or ${PLANS.serious.priceMonthly}/month. New monthly subscribers only. Applied automatically at checkout.</p>
      </div>}

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
      {betaCode.trim() && <p className="billing-offer-note">Beta codes replace the launch offer and cannot be combined with it.</p>}

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
          const offer = showLaunch ? launchOfferFor(id) : null;
          const price = offer ? offer.firstMonthPrice : interval === "year" ? plan.priceAnnual : plan.priceMonthly;
          const unit = interval === "year" ? "/yr" : "/mo";
          const featured = id === "pro";

          return (
            <div key={id} className={`billing-plan${featured ? " billing-plan-featured" : ""}${isCurrent ? " billing-plan-current" : ""}`}>
              {isCurrent && <span className="billing-plan-flag">Current plan</span>}
              {!isCurrent && featured && <span className="billing-plan-flag">Most popular</span>}
              <div className="billing-plan-name">{plan.label}</div>
              {offer && <div className="billing-launch-saving">{offer.percentOff}% off your first month{id === "serious" ? " · Best launch value" : ""}</div>}
              <div className="billing-plan-price">
                {offer && <del className="billing-plan-was" aria-label={`Regular price $${offer.regularPrice} per month`}>${offer.regularPrice}</del>}
                ${price}
                <small>{plan.priceMonthly === 0 ? "" : offer ? "/first month" : unit}</small>
              </div>
              {offer && <div className="billing-plan-sub">Then ${plan.priceMonthly}/month. Cancel anytime.</div>}
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
                  disabled={!configured || busy}
                  onClick={() => {
                    setError(null);
                    if (isPaid) void openPortal();
                    else setCheckoutPlan(id);
                  }}
                >
                  {configured ? `${isPaid ? "Switch to" : "Choose"} ${plan.label}` : "Coming soon"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="billing-offer-note">All prices are in USD. The launch special applies to the first month of a new monthly subscription only. Annual plans and existing subscriptions keep their regular prices.</p>

      {!configured && (
        <p className="page-sub" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          Checkout isn&apos;t live yet — payment is being set up.
        </p>
      )}
    </>
  );
}
