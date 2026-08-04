import { describe, expect, it } from "vitest";
import { validateCreateBatchInput } from "./batch-types";

const valid = {
  items: [
    { audioName: "one.wav", imageName: "one.png" },
    { audioName: "two.wav", imageName: "two.png" },
  ],
  autoUpload: true,
  autoSchedule: true,
  privacyStatus: "private",
  madeForKids: false,
};

describe("validateCreateBatchInput", () => {
  it("accepts a valid batch", () => {
    expect(validateCreateBatchInput(valid)).toMatchObject({ ok: true });
  });

  it("rejects a one-item batch", () => {
    expect(validateCreateBatchInput({ ...valid, items: valid.items.slice(0, 1) })).toEqual({
      ok: false,
      error: "Choose between 2 and 5 beats.",
    });
  });

  it("rejects incomplete pairs", () => {
    expect(
      validateCreateBatchInput({
        ...valid,
        items: [valid.items[0], { audioName: "two.wav", imageName: "" }],
      }),
    ).toMatchObject({ ok: false });
  });
});
