import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  findFirst: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  packageUpdate: vi.fn(),
  create: vi.fn(),
  thumbnail: vi.fn(),
  pipeline: vi.fn(),
  refresh: vi.fn(),
  plan: vi.fn(),
  count: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getUser: mocks.getUser }));
vi.mock("@/lib/db", () => ({ db: {
  uploadBatchItem: { findFirst: mocks.findFirst, updateMany: mocks.updateMany, update: mocks.update, count: mocks.count },
  package: { update: mocks.packageUpdate },
} }));
vi.mock("@/lib/beat-create", () => ({ createBeatPackage: mocks.create }));
vi.mock("@/lib/billing", () => ({ getPlanState: mocks.plan, startOfMonth: () => new Date("2026-10-01") }));
vi.mock("@/lib/batch-thumbnail", () => ({ saveBatchThumbnail: mocks.thumbnail }));
vi.mock("@/lib/batch-pipeline", () => ({ startBatchPipeline: mocks.pipeline, refreshBatchStatus: mocks.refresh }));

import { POST, PATCH } from "../app/api/batches/[id]/items/[itemId]/route";

const params = { params: Promise.resolve({ id: "batch-1", itemId: "item-1" }) };
const item = { id: "item-1", batchId: "batch-1", status: "failed", packageId: null, scheduledAt: null,
  batch: { autoUpload: false, privacyStatus: "private", madeForKids: false } };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.findFirst.mockResolvedValue(item);
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.create.mockResolvedValue({ packageId: "package-1" });
  mocks.plan.mockResolvedValue({ isAdmin: false, planId: "pro", remaining: 30 });
  mocks.count.mockResolvedValue(0);
});

describe("batch upload retries", () => {
  it("does not retry another user's item", async () => {
    mocks.findFirst.mockResolvedValue(null);
    const response = await POST(new Request("http://localhost/api/batches/batch-1/items/item-1", { method: "POST" }), params);
    expect(response.status).toBe(404);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "item-1", batchId: "batch-1", batch: { userId: "user-1" } },
    }));
  });

  it("enforces quota when retrying a released reservation", async () => {
    mocks.plan.mockResolvedValue({ isAdmin: false, planId: "pro", remaining: 1 });
    mocks.count.mockResolvedValue(1);
    const response = await POST(new Request("http://localhost/api/batches/batch-1/items/item-1", { method: "POST" }), params);
    expect(response.status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("returns an existing package after a lost response without creating a duplicate", async () => {
    mocks.findFirst.mockResolvedValue({ ...item, packageId: "package-1", status: "rendering" });
    const response = await POST(new Request("http://localhost/api/batches/batch-1/items/item-1", { method: "POST" }), params);
    expect(await response.json()).toEqual({ packageId: "package-1" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("claims a failed upload and queues its package", async () => {
    const form = new FormData();
    form.set("audio", new File(["audio"], "beat.mp3", { type: "audio/mpeg" }));
    const response = await POST(new Request("http://localhost/api/batches/batch-1/items/item-1", { method: "POST", body: form }), params);
    expect(response.status).toBe(200);
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "item-1", packageId: null, status: { in: ["pending", "failed"] } },
    }));
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.pipeline).toHaveBeenCalledTimes(1);
  });

  it("rejects concurrent submissions when another request owns the claim", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    const response = await POST(new Request("http://localhost/api/batches/batch-1/items/item-1", { method: "POST" }), params);
    expect(response.status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("does not release an in-flight upload when the browser reports a timeout", async () => {
    await PATCH(new Request("http://localhost/api/batches/batch-1/items/item-1", {
      method: "PATCH", body: JSON.stringify({ error: "Timed out" }),
    }), params);
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "item-1", packageId: null, status: "pending" },
    }));
  });
});
