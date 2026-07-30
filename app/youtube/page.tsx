import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "../legal/LegalShell";

export const metadata: Metadata = {
  title: "YouTube integration — TypeBeatOS",
  description:
    "How TypeBeatOS connects to YouTube, which Google permissions it requests, and how producers control that access.",
  alternates: { canonical: "/youtube" },
};

const UPDATED = "2026-07-24";

export default function YouTubeIntegrationPage() {
  return (
    <LegalShell
      title="TypeBeatOS YouTube integration."
      updated={UPDATED}
      isDraft={false}
    >
      <p>
        TypeBeatOS is a YouTube upload automation app for type-beat producers.
        It turns a finished beat into a complete upload package—title,
        description, tags, thumbnail, and rendered video—and publishes or
        schedules that package on the producer&apos;s own YouTube channel.
      </p>

      <h2>Why TypeBeatOS connects to Google</h2>
      <p>
        A producer chooses <strong>Connect YouTube</strong> inside TypeBeatOS
        and authorises access through Google OAuth. TypeBeatOS uses that access
        only to identify the channel the producer selected, upload videos the
        producer asks it to publish, and display statistics for those uploads.
        Connecting a YouTube channel is optional and is never used to sign in
        to TypeBeatOS.
      </p>

      <h2>Google permissions requested</h2>
      <ul>
        <li>
          <code>youtube.upload</code> allows TypeBeatOS to upload the rendered
          beat videos and metadata the producer chooses to publish.
        </li>
        <li>
          <code>youtube.readonly</code> allows TypeBeatOS to read the connected
          channel&apos;s ID and title and retrieve statistics for videos the
          producer published through TypeBeatOS.
        </li>
      </ul>
      <p>
        TypeBeatOS does not use Google user data for advertising, does not sell
        Google user data, and does not publish anything without an action from
        the producer.
      </p>

      <h2>Upload controls</h2>
      <p>
        Before uploading, the producer chooses whether the video will be
        public, private, or unlisted and declares whether it is made for kids.
        A future public upload is first sent privately and scheduled through
        YouTube; private and unlisted uploads remain at the visibility selected
        by the producer.
      </p>

      <h2>AI and Google user data</h2>
      <p>
        TypeBeatOS does not send Google or YouTube user data to Gemini,
        Anthropic, or any other AI provider, and does not use Google user data
        to develop, improve, or train AI/ML models. Only beat metadata supplied
        directly by the producer may be used to generate an SEO package.
      </p>

      <h2>Producer control</h2>
      <p>
        Producers can disconnect YouTube from TypeBeatOS at any time. They can
        also revoke access from their Google Account permissions. Disconnecting
        revokes the Google authorization, stops future uploads and statistics
        requests, and removes the stored OAuth tokens and connected channel
        identity from TypeBeatOS.
      </p>

      <h2>Privacy and terms</h2>
      <p>
        The <Link href="/privacy">TypeBeatOS Privacy Policy</Link> explains in
        detail how Google and YouTube data is accessed, used, stored, and
        deleted. Use of TypeBeatOS is also governed by the{" "}
        <Link href="/terms">TypeBeatOS Terms of Service</Link>.
      </p>

      <p>
        TypeBeatOS is not affiliated with or endorsed by YouTube or Google.
        Questions about the integration can be sent to{" "}
        <a href="mailto:typebeatos@gmail.com">typebeatos@gmail.com</a>.
      </p>
    </LegalShell>
  );
}
