import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "../legal/LegalShell";

export const metadata: Metadata = {
  title: "Privacy policy — TypeBeatOS",
  description:
    "How TypeBeatOS collects, stores, and uses producer account data, YouTube channel data, and beat uploads.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "2026-07-24";

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy policy." updated={UPDATED} isDraft={false}>
      <p>
        TypeBeatOS (&quot;we&quot;, &quot;us&quot;) builds an upload pipeline for
        type-beat producers. This policy explains what we collect, how we use
        it, who else gets to see it, and what controls you have.
      </p>

      <h2>Who runs this</h2>
      <p>
        TypeBeatOS is operated from Australia. Questions, requests, or
        complaints can be sent to{" "}
        <a href="mailto:typebeatos@gmail.com">typebeatos@gmail.com</a>.
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
          uploads and read-only YouTube access, and per-video stats (views,
          likes, comments) for the packages we shipped.
        </li>
        <li>
          Waitlist: just the email you submitted and the date.
        </li>
        <li>
          Operational logs: request IDs, IP addresses, and error traces — kept
          for 30 days for debugging and abuse prevention.
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

      <h2>Google and YouTube data</h2>
      <p>
        TypeBeatOS uses YouTube API Services. By connecting your channel you
        also agree to the{" "}
        <a
          href="https://www.youtube.com/t/terms"
          target="_blank"
          rel="noreferrer noopener"
        >
          YouTube Terms of Service
        </a>
        , and Google&apos;s handling of your data is governed by the{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer noopener"
        >
          Google Privacy Policy
        </a>
        .
      </p>
      <p>
        TypeBeatOS&apos;s use and transfer of information received from Google
        APIs to any other app will adhere to the{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer noopener"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements. Specifically:
      </p>
      <ul>
        <li>
          We request only the scopes the upload pipeline needs:{" "}
          <code>youtube.upload</code> to publish videos to your channel, and{" "}
          <code>youtube.readonly</code> to read your channel ID + title and the
          public stats of the videos we ship for you.
        </li>
        <li>
          We use this data solely to provide and improve those user-facing
          features. We do not use Google user data for advertising, and we do
          not sell it.
        </li>
        <li>
          We do not transfer Google user data to third parties except as needed
          to provide or improve the service, to comply with applicable law, or
          in connection with a merger or acquisition.
        </li>
        <li>
          We do not send Google or YouTube user data to Gemini, Anthropic, or
          any other AI provider, and we do not use it to develop, improve, or
          train general-purpose or third-party AI/ML models.
        </li>
        <li>
          We do not allow humans to read your Google user data unless we have
          your consent for a specific support issue, it is necessary for
          security purposes (such as investigating abuse), or we are required
          to by applicable law.
        </li>
        <li>
          You can revoke our access at any time by disconnecting YouTube from
          your <Link href="/settings?tab=profile">producer profile</Link>, or from your{" "}
          <a
            href="https://security.google.com/settings/security/permissions"
            target="_blank"
            rel="noreferrer noopener"
          >
            Google Account permissions
          </a>
          .
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
          <strong>AI provider.</strong> Beat metadata (artist, genre, mood,
          key, BPM) is sent to Google&apos;s Gemini API — or Anthropic&apos;s
          Claude API as a fallback — to generate the SEO pack. We do not send
          your audio file, YouTube credentials, channel identity, YouTube
          statistics, or any other Google user data.
        </li>
        <li>
          <strong>Infrastructure providers.</strong> Compute on Azure Container
          Apps, database at Neon, object storage on Azure Files, transactional
          email via Resend. Each handles data as a processor on our behalf.
        </li>
      </ul>

      <h2>Where data lives</h2>
      <p>
        The application and your uploaded files run in Microsoft Azure&apos;s
        Australia East region (Azure Container Apps + Azure Files), and the
        database is hosted by Neon. Some data is processed overseas by the
        sub-processors listed above (for example Google, Anthropic, and Resend
        in the United States).
      </p>

      <h2>How we protect your data</h2>
      <ul>
        <li>
          Data is encrypted in transit using HTTPS/TLS. Our managed database
          and storage providers encrypt stored data at rest.
        </li>
        <li>
          Access to production systems and Google OAuth credentials is limited
          to authorised operators and service components that need it to run
          TypeBeatOS.
        </li>
        <li>
          OAuth tokens and application secrets are kept on the server, are
          never exposed to the browser, and are not written to application
          logs.
        </li>
        <li>
          We use session protections, OAuth state validation, rate limiting,
          and operational monitoring to reduce unauthorised access and abuse.
        </li>
      </ul>

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
          YouTube tokens, channel ID, and channel title: until you disconnect
          from your <Link href="/settings?tab=profile">producer profile</Link>{" "}
          or delete your account.
        </li>
        <li>Operational logs: 30 days, then rolled off by our logging platform.</li>
        <li>
          Waitlist signups: until the waitlist is closed or you ask us to
          remove your email.
        </li>
      </ul>

      <h2>Your controls</h2>
      <ul>
        <li>Export every package and uploaded asset from the producer dashboard.</li>
        <li>
          Disconnect YouTube any time from your{" "}
          <Link href="/settings?tab=profile">producer profile</Link>.
          We revoke the Google authorization, delete the stored access and
          refresh tokens and connected channel identity, and stop requesting
          video statistics.
        </li>
        <li>
          Delete your account from{" "}
          <Link href="/settings?tab=delete">Settings</Link>. This
          removes your producer profile, beats, packages, generated assets,
          YouTube tokens, and waitlist signup. Videos already published to
          YouTube stay on your channel — YouTube controls them now.
        </li>
        <li>
          Request a copy of your data, ask us to correct it, or restrict our
          processing of it by emailing{" "}
          <a href="mailto:typebeatos@gmail.com">typebeatos@gmail.com</a>.
        </li>
      </ul>

      <h2>Children</h2>
      <p>
        TypeBeatOS is intended for producers aged 16 and over. We do not
        knowingly collect data from anyone under that age. If you
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
        <a href="mailto:typebeatos@gmail.com">typebeatos@gmail.com</a>.
      </p>
    </LegalShell>
  );
}
