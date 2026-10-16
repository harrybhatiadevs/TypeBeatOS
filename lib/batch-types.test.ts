import { describe, expect, it } from "vitest";
import { MAX_BATCH_ITEMS, validateCreateBatchInput } from "./batch-types";

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
      error: `Choose between 2 and ${MAX_BATCH_ITEMS} beats.`,
    });
  });

  it("accepts exactly 30 beats", () => {
    const items = Array.from({ length: MAX_BATCH_ITEMS }, (_, index) => ({
      audioName: `beat-${index + 1}.wav`,
      imageName: `beat-${index + 1}.png`,
    }));

    expect(validateCreateBatchInput({ ...valid, items })).toMatchObject({ ok: true });
  });

  it("rejects more than 30 beats", () => {
    const items = Array.from({ length: MAX_BATCH_ITEMS + 1 }, (_, index) => ({
      audioName: `beat-${index + 1}.wav`,
      imageName: `beat-${index + 1}.png`,
    }));

    expect(validateCreateBatchInput({ ...valid, items })).toEqual({
      ok: false,
      error: `Choose between 2 and ${MAX_BATCH_ITEMS} beats.`,
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
