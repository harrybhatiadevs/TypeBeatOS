import "./billing.css";
import { requireUser } from "@/lib/auth";
import { getPlanState } from "@/lib/billing";
import { getStripe, readStripeEnv, stripeConfigured } from "@/lib/stripe";
import { isPaidPlan } from "@/lib/plans";
import BillingPlans from "./BillingPlans";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string; checkout?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const { planId, plan, used, limit, subscription, isAdmin } = await getPlanState(user);

  // If we just came back from checkout, confirm it completed (webhook may lag).
  let checkoutComplete = false;
  if (sp.checkout && stripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sp.checkout);
      checkoutComplete = session.status === "complete";
    } catch {
      // ignore — treat as not complete
    }
  }

  const publishableKey = readStripeEnv("STRIPE_PUBLISHABLE_KEY");
  const paid = isPaidPlan(planId);
  const limitLabel = isAdmin ? "unlimited" : String(limit);
  const usagePct = isAdmin || !isFinite(limit) || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <>
      <h1 className="page-title">Plan &amp; billing</h1>
      <p className="page-sub">Manage your subscription and monthly upload-pack usage.</p>

      {checkoutComplete && (
        <div className="billing-alert billing-alert-success">
          Payment received — your plan is active. Thanks for upgrading!
        </div>
      )}
      {sp.upgrade === "quota" && !checkoutComplete && (
        <div className="billing-alert billing-alert-warn">
          You&apos;ve hit your monthly pack limit. Upgrade below to keep generating.
        </div>
      )}

      <div className="card">
        <div className="billing-current-label">Current plan</div>
        <div className="billing-current-plan">
          {plan.label}
          {paid && subscription?.status && (
            <span
              className={`badge ${
                subscription.status === "active" || subscription.status === "trialing"
                  ? "badge-uploaded"
                  : "badge-failed"
              }`}
            >
              {subscription.status}
            </span>
          )}
          {isAdmin && <span className="badge badge-scheduled">admin · unlimited</span>}
        </div>
        {subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
          <div className="billing-current-note">
            Cancels {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </div>
        )}

        <div className="billing-usage">
          <div className="billing-usage-head">
            <span>Upload packs this month</span>
            <span>
              {used} / {limitLabel}
            </span>
          </div>
          <div className="billing-usage-bar">
            <div className="billing-usage-fill" style={{ width: `${usagePct}%` }} />
          </div>
        </div>
      </div>

      <BillingPlans
        currentPlanId={planId}
        isPaid={paid}
        configured={stripeConfigured()}
        publishableKey={publishableKey}
      />
    </>
  );
}
