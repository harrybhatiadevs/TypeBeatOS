import { describe, expect, it } from "vitest";
import type { Beat, Profile } from "@prisma/client";
import { buildDescription, buildPinnedComment } from "./generate";

const beat = {
  name: "Midnight Drive",
  targetArtist: "Travis Scott",
  secondaryArtist: "Don Toliver",
  genre: "Trap",
  mood: "Dark",
  bpm: 152,
  key: "F minor",
  storeLink: "",
  licensePrice: "34.99",
  exclusivePrice: "399",
} as unknown as Beat;

const profile = {
  producerName: "prod. test",
  contactEmail: "beats@example.com",
  storeUrl: "https://beatstars.com/typebeatos",
  youtubeUrl: "https://youtube.com/@typebeatos",
  instagramUrl: "https://instagram.com/typebeatos",
  licenseText: "Free downloads are for non-profit use only.",
  descriptionFooter: "New beats every Monday, Wednesday, and Friday.",
} as unknown as Profile;

describe("upload copy generation", () => {
  it("builds clean description copy without decorative emoji or hype separators", () => {
    const description = buildDescription(beat, profile, 'Travis Scott Type Beat - "Midnight Drive"');

    expect(description).toContain("License this beat: https://beatstars.com/typebeatos");
    expect(description).toContain("Details: 152 BPM / F minor / Trap / Dark");
    expect(description).toContain("Credit: (prod. test)");
    expect(description).not.toMatch(/[🎵📩💰🔥▶️📸🎧👉→—]/u);
  });

  it("builds concise pinned comment copy", () => {
    const comment = buildPinnedComment(beat, profile);

    expect(comment).toContain("License this beat: https://beatstars.com/typebeatos");
    expect(comment).toContain("Lease $34.99 / Exclusive $399");
    expect(comment).toContain("Using it? Share the finished track in the comments.");
    expect(comment).not.toMatch(/[🎵📩💰🔥▶️📸🎧👉→—]/u);
  });
});
