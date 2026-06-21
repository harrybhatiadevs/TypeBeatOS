import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "../legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy policy — TypeBeatOS",
  description:
    "How TypeBeatOS collects, stores, and uses producer account data, YouTube channel data, and beat uploads.",
};

const UPDATED = "2026-06-20";

export default function PrivacyPage() {
  return (
    <LegalShell eyebrow="Privacy policy" title="Privacy policy." updated={UPDATED} isDraft={true}>
      <p>
        TypeBeatOS (&quot;we&quot;, &quot;us&quot;) builds an upload pipeline for
        type-beat producers. This policy explains what we collect, how we use
        it, who else gets to see it, and what controls you have.
      </p>

      <h2>Who runs this</h2>
      <p>
        TypeBeatOS is operated by{" "}
        <span className="tb-legal-placeholder">[legal-entity]</span> registered
        in <span className="tb-legal-placeholder">[jurisdiction]</span>.
        Questions, requests, or complaints can be sent to{" "}
        <span className="tb-legal-placeholder">[privacy-contact-email]</span>.
      </p>

      <h2>What we collect</h2>
      <p>
        We collect the minimum producer data needed to render and ship upload
        packages to YouTube on your behalf:
      </p>
      <ul>
        <li>Account: email, password hash, producer display name.</li>
        <li>
          Producer profile: store URLs (BeatStars, Airbit), contact email,
          YouTube channel URL, Instagram URL, license + footer text.
        </li>
        <li>
          Beats you upload: filename, BPM, key, genre, mood, target artist,
          and the audio file itself stored on our object storage.
        </li>
        <li>
          Upload packages: generated SEO title, description, tags, pinned
          comment, thumbnail image, rendered video.
        </li>
        <li>
          YouTube channel data, only after you connect via Google OAuth:
          channel ID + title, an OAuth access + refresh token scoped to
          uploads and read-only analytics, and per-video stats (views, likes,
          comments) for the packages we shipped.
        </li>
        <li>
          Waitlist: just the email you submitted and the date.
        </li>
        <li>
          Operational logs: request IDs, IP addresses, and error traces — kept
          for{" "}
          <span className="tb-legal-placeholder">[log-retention-days]</span>{" "}
          days for debugging and abuse prevention.
        </li>
      </ul>

      <h2>What we do not collect</h2>
      <ul>
        <li>
          We do not run analytics scripts (Google Analytics, Mixpanel, etc) on
          producer surfaces.
        </li>
        <li>
          We do not read or scan your YouTube channel beyond the channel ID +
          title at connect, and the public stats of videos we ship for you.
        </li>
        <li>We do not sell or rent producer data to third parties.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To generate the SEO pack, render the video, and ship to YouTube.</li>
        <li>
          To show you analytics for the videos we shipped (views, likes,
          comments, performance by artist keyword).
        </li>
        <li>
          To send you transactional email (signup confirmation, upload
          failures, weekly digest). We do not send marketing email without an
          explicit opt-in.
        </li>
        <li>
          To debug failures, rate-limit abuse, and keep the service running.
        </li>
      </ul>

      <h2>Who else sees it</h2>
      <ul>
        <li>
          <strong>Google / YouTube.</strong> Connecting your channel sends
          your producer-uploaded video to YouTube under your channel. YouTube
          becomes the controller of that video.
        </li>
        <li>
          <strong>Anthropic.</strong> Beat metadata (artist, genre, mood, key,
          BPM) is sent to Anthropic&apos;s Claude API to generate the SEO
          pack. We do not send your audio file or YouTube credentials.
        </li>
        <li>
          <strong>Stability AI / image-gen provider.</strong> Thumbnail
          background prompts are sent to the configured image-generation
          provider. We do not send producer-identifying information.
        </li>
        <li>
          <strong>Infrastructure providers.</strong> Hosting at Fly.io,
          database at Neon, object storage at{" "}
          <span className="tb-legal-placeholder">[object-storage-provider]</span>,
          email at <span className="tb-legal-placeholder">[email-provider]</span>.
          Each handles data as a processor on our behalf.
        </li>
      </ul>

      <h2>Where data lives</h2>
      <p>
        Application and database run in the{" "}
        <span className="tb-legal-placeholder">[hosting-region]</span> region
        (Fly.io + Neon). Beat audio and rendered videos sit on object storage
        in <span className="tb-legal-placeholder">[storage-region]</span>.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>
          Account + producer profile: until you delete the account.
        </li>
        <li>
          Beats + generated packages + videos: until you delete them or close
          the account.
        </li>
        <li>
          YouTube tokens: until you disconnect from <Link href="/profile">profile</Link>.
        </li>
        <li>
          Operational logs:{" "}
          <span className="tb-legal-placeholder">[log-retention-days]</span>{" "}
          days, then auto-deleted.
        </li>
        <li>
          Waitlist signups: until the waitlist is closed or you ask us to
          remove your email.
        </li>
      </ul>

      <h2>Your controls</h2>
      <ul>
        <li>Export every package and uploaded asset from the producer dashboard.</li>
        <li>
          Disconnect YouTube any time from <Link href="/profile">profile</Link>.
          We revoke the refresh token and stop polling stats.
        </li>
        <li>
          Delete your account from <Link href="/profile">profile</Link>. This
          removes your producer profile, beats, packages, generated assets,
          YouTube tokens, and waitlist signup. Videos already published to
          YouTube stay on your channel — YouTube controls them now.
        </li>
        <li>
          Request a copy of your data, ask us to correct it, or restrict our
          processing of it by emailing{" "}
          <span className="tb-legal-placeholder">[privacy-contact-email]</span>.
        </li>
      </ul>

      <h2>Children</h2>
      <p>
        TypeBeatOS is intended for producers aged{" "}
        <span className="tb-legal-placeholder">[minimum-age]</span> and over.
        We do not knowingly collect data from anyone under that age. If you
        believe a minor signed up, email us and we will delete the account.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We will notify producers by email at least 14 days before any
        material change takes effect. The &quot;Last updated&quot; date at
        the top of this page always reflects the current version.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, data requests, or complaints:{" "}
        <span className="tb-legal-placeholder">[privacy-contact-email]</span>.
      </p>
    </LegalShell>
  );
}
