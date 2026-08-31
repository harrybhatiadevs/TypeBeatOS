import { describe, expect, it } from "vitest";
import { pairFileNames } from "./batch-files";

// Name extraction itself is covered in beat-name.test.ts.
describe("batch file helpers", () => {
  it("pairs exact filename stems before falling back to order", () => {
    expect(
      pairFileNames(
        ["Alpha.wav", "Beta.wav", "Gamma.wav"],
        ["Gamma cover.png", "Alpha artwork.jpg", "misc.png"],
      ),
    ).toEqual([1, 2, 0]);
  });

  it("pairs a type-beat export with its plainly named artwork", () => {
    expect(
      pairFileNames(['[FREE] Drake Type Beat - "Midnight" 140bpm.mp3'], ["midnight cover.png"]),
    ).toEqual([0]);
  });
});
