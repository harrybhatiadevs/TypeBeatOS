import { describe, expect, it } from "vitest";
import { beatNameFromFilename, normalizedFileStem, pairFileNames } from "./batch-files";

describe("batch file helpers", () => {
  it("turns common export filenames into clean beat names", () => {
    expect(beatNameFromFilename("late_night_FINAL.wav")).toBe("late night");
    expect(beatNameFromFilename("Rainfall - mastered.mp3")).toBe("Rainfall");
  });

  it("normalizes artwork suffixes for matching", () => {
    expect(normalizedFileStem("Late Night.wav")).toBe("latenight");
    expect(normalizedFileStem("late-night-thumbnail.jpg")).toBe("latenight");
  });

  it("pairs exact filename stems before falling back to order", () => {
    expect(
      pairFileNames(
        ["Alpha.wav", "Beta.wav", "Gamma.wav"],
        ["Gamma cover.png", "Alpha artwork.jpg", "misc.png"],
      ),
    ).toEqual([1, 2, 0]);
  });
});
