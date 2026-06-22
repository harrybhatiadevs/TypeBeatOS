import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "TypeBeatOS — the YouTube upload system for type-beat producers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default OG / Twitter card image served at /opengraph-image. Picked up
 * automatically by Next 15's metadata file convention; every page that
 * doesn't opt out gets this image on share previews.
 *
 * Satori (behind ImageResponse) requires `display: flex` on any div
 * with more than one child, and it doesn't reliably wrap mixed-colour
 * inline text. Each line of the headline lives in its own block-level
 * div so the red accent on "TYPE BEATS" sits on its own line cleanly.
 */
export default async function OpengraphImage() {
  const headlineLine = {
    display: "flex",
    fontSize: 88,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: -2,
    textTransform: "uppercase" as const,
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000",
          color: "#fff",
          padding: "72px 96px",
          backgroundImage:
            "radial-gradient(circle at 100% 100%, rgba(237, 7, 44, 0.55), transparent 55%)",
        }}
      >
        {/* Top row — brand mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
              color: "#000",
              fontSize: 30,
              fontWeight: 900,
              borderRadius: 10,
            }}
          >
            TB
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 4,
            }}
          >
            <span style={{ color: "#fff" }}>TYPEBEAT</span>
            <span style={{ color: "#ed072c" }}>OS</span>
          </div>
        </div>

        {/* Centre — headline stacked one line per div so Satori can lay it
            out without trying to wrap mixed-colour inline text. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ ...headlineLine, color: "#fff" }}>The YouTube</div>
          <div style={{ ...headlineLine, color: "#fff" }}>upload system for</div>
          <div style={{ ...headlineLine, color: "#ed072c" }}>type-beat producers.</div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "rgba(255, 255, 255, 0.62)",
              maxWidth: 880,
              lineHeight: 1.35,
              marginTop: 22,
            }}
          >
            Drop in a finished beat. We write the SEO pack, render the video, and schedule it.
          </div>
        </div>

        {/* Bottom row — private beta tag */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#ed072c",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            Private beta · 2026
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
