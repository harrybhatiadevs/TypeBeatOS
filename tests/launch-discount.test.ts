import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { launchOfferFor, PLANS } from "../lib/plans";

vi.mock("server-only", () => ({}));
import { launchCouponFor, launchEligibleForCustomer } from "../lib/launch-discount";

const prices = { retrieve: vi.fn() };
const coupons = { retrieve: vi.fn(), create: vi.fn() };
const subscriptions = { list: vi.fn() };
const stripe = { prices, coupons, subscriptions } as unknown as Stripe;
const proPrice = { active: true, currency: "usd", unit_amount: 1900, recurring: { interval: "month", interval_count: 1 }, product: "prod_pro" };
const proCoupon = { id: "typebeatos_launch_pro_first_month_v1", valid: true, duration: "once", amount_off: 700, currency: "usd", applies_to: { products: ["prod_pro"] } };

beforeEach(() => {
  vi.resetAllMocks();
  prices.retrieve.mockResolvedValue(proPrice);
  coupons.retrieve.mockResolvedValue(proCoupon);
  subscriptions.list.mockResolvedValue({ data: [], has_more: false });
});

describe("first-month launch offer", () => {
  it("offers a larger percentage discount on Serious without changing renewal or annual prices", () => {
    expect(launchOfferFor("pro")).toMatchObject({ firstMonthPrice: 12, regularPrice: 19, amountOff: 700, percentOff: 37 });
    expect(launchOfferFor("serious")).toMatchObject({ firstMonthPrice: 17, regularPrice: 29, amountOff: 1200, percentOff: 41 });
    expect(launchOfferFor("free")).toBeNull();
    expect(PLANS.pro.priceAnnual).toBe(190);
    expect(PLANS.serious.priceAnnual).toBe(290);
  });

  it.each(["active", "trialing", "past_due", "unpaid"])("does not give a launch discount to a current %s subscriber", async (status) => {
    subscriptions.list.mockResolvedValue({ data: [{ status }], has_more: false });
    expect(await launchEligibleForCustomer(stripe, "cus_1")).toBe(false);
  });

  it("allows a returning customer whose canceled subscription predates the launch", async () => {
    subscriptions.list.mockResolvedValue({ data: [{ status: "canceled", metadata: {}, discounts: [] }], has_more: false });
    expect(await launchEligibleForCustomer(stripe, "cus_1")).toBe(true);
  });

  it("keeps the offer visible when checkout will replace an old sandbox customer", async () => {
    subscriptions.list.mockRejectedValue({ code: "resource_missing", param: "customer" });
    expect(await launchEligibleForCustomer(stripe, "cus_old_sandbox")).toBe(true);
  });

  it("blocks repeat redemption after a discounted subscription is canceled", async () => {
    subscriptions.list.mockResolvedValue({ data: [{ status: "canceled", metadata: { launch_offer: "launch_first_month_v1" }, discounts: [] }], has_more: false });
    expect(await launchEligibleForCustomer(stripe, "cus_1")).toBe(false);
  });

  it("recognizes an existing launch coupon even without the campaign metadata", async () => {
    subscriptions.list.mockResolvedValue({ data: [{ status: "canceled", metadata: {}, discounts: [{ source: { coupon: proCoupon.id } }] }], has_more: false });
    expect(await launchEligibleForCustomer(stripe, "cus_1")).toBe(false);
  });

  it("allows a new customer or an abandoned unpaid checkout", async () => {
    expect(await launchEligibleForCustomer(stripe, "cus_1")).toBe(true);
    subscriptions.list.mockResolvedValue({ data: [{ status: "incomplete_expired" }], has_more: false });
    expect(await launchEligibleForCustomer(stripe, "cus_1")).toBe(true);
  });

  it("reuses the existing verified coupon", async () => {
    expect(await launchCouponFor(stripe, "pro", "price_pro")).toBe(proCoupon.id);
    expect(coupons.create).not.toHaveBeenCalled();
  });

  it("creates a product-scoped, once-only coupon idempotently", async () => {
    coupons.retrieve.mockRejectedValue({ code: "resource_missing" });
    coupons.create.mockResolvedValue(proCoupon);
    await launchCouponFor(stripe, "pro", "price_pro");
    expect(coupons.create).toHaveBeenCalledWith(expect.objectContaining({
      id: proCoupon.id, amount_off: 700, currency: "usd", duration: "once", applies_to: { products: ["prod_pro"] },
    }), { idempotencyKey: proCoupon.id });
  });

  it.each([
    { ...proPrice, currency: "aud" },
    { ...proPrice, unit_amount: 2900 },
    { ...proPrice, recurring: { interval: "year", interval_count: 1 } },
  ])("refuses a Stripe price that differs from the advertised monthly offer", async (price) => {
    prices.retrieve.mockResolvedValue(price);
    await expect(launchCouponFor(stripe, "pro", "price_wrong")).rejects.toThrow("does not match");
    expect(coupons.create).not.toHaveBeenCalled();
  });

  it("refuses a forever coupon so the discount cannot leak into renewals", async () => {
    coupons.retrieve.mockResolvedValue({ ...proCoupon, duration: "forever" });
    await expect(launchCouponFor(stripe, "pro", "price_pro")).rejects.toThrow("does not match");
  });
});
