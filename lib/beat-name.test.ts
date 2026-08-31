import { describe, expect, it } from "vitest";
import { beatNameFromFilename, normalizedFileStem } from "./beat-name";

describe("beatNameFromFilename", () => {
  it("takes the quoted title out of a full type-beat export", () => {
    expect(beatNameFromFilename('[FREE] Drake Type Beat - "Midnight" (prod. xyz) 140bpm.mp3')).toBe("Midnight");
    expect(beatNameFromFilename('FREE_Lil Baby Type Beat_"Racks"_140bpm_Amin.wav')).toBe("Racks");
  });

  it("takes what follows the type-beat prefix when nothing is quoted", () => {
    expect(beatNameFromFilename("travis scott type beat - astro world (prod by me) 145 bpm.mp3")).toBe("Astro World");
    expect(beatNameFromFilename("FREE_Lil Baby Type Beat_Racks_140bpm_Amin.wav")).toBe("Racks");
    expect(beatNameFromFilename("drake-type-beat-no-cap-140bpm.wav")).toBe("No Cap");
  });

  it("strips bracketed promo, prod credits and track numbers", () => {
    expect(beatNameFromFilename("Midnight (prod. Harry) [FREE].mp3")).toBe("Midnight");
    expect(beatNameFromFilename("01 - late night.wav")).toBe("Late Night");
    expect(beatNameFromFilename("[FREE FOR PROFIT] paranoia.mp3")).toBe("Paranoia");
  });

  it("strips collab handles and the key left stranded before them", () => {
    expect(beatNameFromFilename("controversy 150 bpm Amaj @miche2x @flexondatrack @neekomadethis.mp3")).toBe("Controversy");
    expect(beatNameFromFilename("avalon 129 bpm Bmin @miche2x @flexondatrack @neekomadethis.mp3")).toBe("Avalon");
  });

  it("strips a bare @ so the key behind it is still trailing", () => {
    // A lone @ used to survive and block the trailing-key rule entirely.
    expect(beatNameFromFilename("scared of my guitar Ebmaj @.mp3")).toBe("Scared of My Guitar");
    expect(beatNameFromFilename("scared of my guitar Ebmaj @ .mp3")).toBe("Scared of My Guitar");
    expect(beatNameFromFilename("scared of my guitar 140 bpm Ebmaj @.mp3")).toBe("Scared of My Guitar");
  });

  it("strips trailing mix state and key signatures", () => {
    expect(beatNameFromFilename("late_night_FINAL.wav")).toBe("Late Night");
    expect(beatNameFromFilename("Rainfall - mastered.mp3")).toBe("Rainfall");
    expect(beatNameFromFilename("free type beat rainfall Fmin mixdown.wav")).toBe("Rainfall");
  });

  it("title-cases without mangling deliberate casing", () => {
    expect(beatNameFromFilename("nyc nights.mp3")).toBe("Nyc Nights");
    expect(beatNameFromFilename("NYC nights.mp3")).toBe("NYC Nights");
    expect(beatNameFromFilename("king of the coast.wav")).toBe("King of the Coast");
  });

  it("leaves an ordinary title alone", () => {
    expect(beatNameFromFilename("Midnight.mp3")).toBe("Midnight");
    expect(beatNameFromFilename("Don't Stop.wav")).toBe("Don't Stop");
  });

  it("never returns an empty name", () => {
    expect(beatNameFromFilename("[FREE] Drake Type Beat.mp3")).not.toBe("");
    expect(beatNameFromFilename("140bpm.wav")).not.toBe("");
  });
});

describe("normalizedFileStem", () => {
  it("normalizes artwork suffixes for matching", () => {
    expect(normalizedFileStem("Late Night.wav")).toBe("latenight");
    expect(normalizedFileStem("late-night-thumbnail.jpg")).toBe("latenight");
  });

  it("still yields a key when cleaning would empty the name", () => {
    expect(normalizedFileStem("[FREE] Drake Type Beat.mp3")).not.toBe("");
  });
});
