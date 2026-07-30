import { describe, expect, it } from "vitest";
import {
  isYouTubePrivacyStatus,
  youtubePublishStatus,
} from "./youtube-upload-policy";

describe("YouTube upload policy", () => {
  it("accepts only YouTube's supported visibility values", () => {
    expect(isYouTubePrivacyStatus("public")).toBe(true);
    expect(isYouTubePrivacyStatus("private")).toBe(true);
    expect(isYouTubePrivacyStatus("unlisted")).toBe(true);
    expect(isYouTubePrivacyStatus("scheduled")).toBe(false);
    expect(isYouTubePrivacyStatus(undefined)).toBe(false);
  });

  it("publishes immediately with the user's selected visibility", () => {
    expect(
      youtubePublishStatus({
        privacyStatus: "unlisted",
        madeForKids: true,
        scheduledAt: null,
      }),
    ).toEqual({
      privacyStatus: "unlisted",
      selfDeclaredMadeForKids: true,
    });
  });

  it("uses YouTube's private-plus-publishAt contract for scheduled public videos", () => {
    expect(
      youtubePublishStatus({
        privacyStatus: "public",
        madeForKids: false,
        scheduledAt: new Date("2026-08-02T08:30:00.000Z"),
        now: new Date("2026-08-01T08:30:00.000Z"),
      }),
    ).toEqual({
      privacyStatus: "private",
      selfDeclaredMadeForKids: false,
      publishAt: "2026-08-02T08:30:00.000Z",
    });
  });

  it("does not schedule private or unlisted uploads", () => {
    expect(
      youtubePublishStatus({
        privacyStatus: "private",
        madeForKids: false,
        scheduledAt: new Date("2026-08-02T08:30:00.000Z"),
        now: new Date("2026-08-01T08:30:00.000Z"),
      }),
    ).toEqual({
      privacyStatus: "private",
      selfDeclaredMadeForKids: false,
    });
  });
});
