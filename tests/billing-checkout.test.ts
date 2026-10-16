import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), configured: vi.fn(), customer: vi.fn(), price: vi.fn(), subscription: vi.fn(),
  resolve: vi.fn(), eligible: vi.fn(), coupon: vi.fn(), create: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getUser: mocks.user }));
vi.mock("@/lib/stripe", () => ({ stripeConfigured: mocks.configured, getStripe: () => ({ checkout: { sessions: { create: mocks.create } } }) }));
vi.mock("@/lib/billing", () => ({ getOrCreateStripeCustomer: mocks.customer, priceIdFor: mocks.price, getSubscription: mocks.subscription, resolvePlanId: mocks.resolve }));
vi.mock("@/lib/launch-discount", () => ({ launchEligibleForCustomer: mocks.eligible, launchCouponFor: mocks.coupon }));

import { POST } from "../app/api/billing/checkout/route";

const request = (body: Record<string, unknown>) => new Request("http://localhost/api/billing/checkout", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  mocks.user.mockResolvedValue({ id: "user_1" });
  mocks.configured.mockReturnValue(true);
  mocks.customer.mockResolvedValue("cus_1");
  mocks.price.mockReturnValue("price_regular");
  mocks.subscription.mockResolvedValue(null);
  mocks.resolve.mockReturnValue("free");
  mocks.eligible.mockResolvedValue(true);
  mocks.coupon.mockResolvedValue("coupon_once");
  mocks.create.mockResolvedValue({ client_secret: "secret_test" });
});

describe("launch checkout", () => {
  it.each(["pro", "serious"])("automatically discounts the first monthly %s invoice", async (plan) => {
    const response = await POST(request({ plan, interval: "month", launchOffer: true }));
    expect(response.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      line_items: [{ price: "price_regular", quantity: 1 }], discounts: [{ coupon: "coupon_once" }],
    }));
    expect(mocks.create.mock.calls[0][0]).not.toHaveProperty("allow_promotion_codes");
    expect(mocks.create.mock.calls[0][0].subscription_data).not.toHaveProperty("trial_period_days");
    expect(mocks.create.mock.calls[0][0].subscription_data.metadata.launch_offer).toBe("launch_first_month_v1");
  });

  it("leaves annual billing undiscounted", async () => {
    await POST(request({ plan: "pro", interval: "year" }));
    expect(mocks.coupon).not.toHaveBeenCalled();
    expect(mocks.create.mock.calls[0][0]).not.toHaveProperty("discounts");
  });

  it("sends existing subscribers to billing management instead of creating a second subscription", async () => {
    mocks.resolve.mockReturnValue("pro");
    const response = await POST(request({ plan: "serious", interval: "month" }));
    expect(response.status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("never silently charges full price when a displayed launch offer is no longer available", async () => {
    mocks.eligible.mockResolvedValue(false);
    const response = await POST(request({ plan: "pro", interval: "month", launchOffer: true }));
    expect(response.status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("keeps beta trials separate from the launch discount", async () => {
    vi.stubEnv("STRIPE_BETA_TRIAL_CODE", "beta-test");
    vi.stubEnv("STRIPE_BETA_TRIAL_DAYS", "7");
    await POST(request({ plan: "pro", interval: "month", betaCode: "beta-test" }));
    expect(mocks.coupon).not.toHaveBeenCalled();
    expect(mocks.create.mock.calls[0][0]).not.toHaveProperty("discounts");
    expect(mocks.create.mock.calls[0][0].subscription_data.trial_period_days).toBe(7);
  });

  it("does not open an undiscounted checkout if coupon configuration fails", async () => {
    mocks.coupon.mockRejectedValue(new Error("coupon mismatch"));
    const response = await POST(request({ plan: "pro", interval: "month", launchOffer: true }));
    expect(response.status).toBe(503);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
