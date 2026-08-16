import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "../legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms of service — TypeBeatOS",
  description:
    "Terms of service for TypeBeatOS — what producers can do with the service, what we provide, and the rules around YouTube and AI-generated assets.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "2026-07-06";

export default function TermsPage() {
  return (
    <LegalShell title="Terms of service." updated={UPDATED} isDraft={false}>
      <p>
        By creating a TypeBeatOS account, or by joining the waitlist, you
        agree to these terms. If you do not agree, do not use the service.
      </p>

      <h2>1. Who we are</h2>
      <p>
        TypeBeatOS is operated from Australia (&quot;we&quot;) and built for
        type-beat producers (&quot;you&quot;).
        We provide tooling that turns finished beats into SEO-optimised
        YouTube upload packages and ships them to your channel on a
        schedule you control.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>
          You are responsible for keeping your password secret and the
          activity on your account.
        </li>
        <li>
          You must be at least 16 years old to use TypeBeatOS.
        </li>
        <li>
          We may suspend or terminate accounts that abuse the service —
          spam, attempts to bypass rate limits, scraping the YouTube API
          beyond your scoped quota, or violating YouTube&apos;s own terms.
        </li>
      </ul>

      <h2>3. What you can use TypeBeatOS for</h2>
      <ul>
        <li>
          Producing and shipping your own original beats to your own YouTube
          channels. That is the supported workflow.
        </li>
        <li>
          You retain full ownership of every beat you upload and every
          generated asset (titles, descriptions, tags, thumbnails, rendered
          videos). We do not claim a licence in them beyond what is strictly
          needed to provide the service.
        </li>
      </ul>

      <h2>4. What you cannot do</h2>
      <ul>
        <li>Upload audio you do not own or have a licence to distribute.</li>
        <li>
          Use TypeBeatOS to publish content that infringes third-party
          rights, is unlawful, defames, harasses, or impersonates an artist
          in a way that misleads viewers.
        </li>
        <li>
          Use generated &quot;type beat&quot; titles, tags, or thumbnails in
          a way that violates YouTube&apos;s policies on misleading
          metadata, channel impersonation, or trademark.
        </li>
        <li>
          Reverse-engineer, scrape, or otherwise attempt to extract our
          source code, prompts, or data beyond your own account.
        </li>
      </ul>

      <h2>5. YouTube integration</h2>
      <p>
        Connecting your channel grants TypeBeatOS an OAuth token scoped to
        upload videos and read your channel + per-video stats. You can
        disconnect any time from your{" "}
        <Link href="/settings?tab=profile">producer profile</Link>, which revokes
        the Google authorization and removes the stored OAuth tokens.
      </p>
      <p>
        Once a video is published to YouTube, YouTube&apos;s terms govern
        the video, the channel, and the viewers. TypeBeatOS is not
        affiliated with or endorsed by YouTube or Google.
      </p>

      <h2>6. AI-generated assets</h2>
      <p>
        Generated titles, descriptions, tags, and pinned comments come from
        third-party AI models (Google Gemini, or Anthropic Claude as a
        fallback). Outputs are not guaranteed to be unique, accurate, or
        non-infringing. You are responsible for reviewing every generated
        asset before publishing.
      </p>

      <h2>7. Pricing and billing</h2>
      <p>
        Pricing tiers and quotas are listed on the{" "}
        <Link href="/#pricing">pricing section</Link> of the homepage. Plans
        renew monthly unless cancelled. You can cancel anytime from your
        account settings. We may change pricing with at least 30 days&apos;
        notice for paid plans; existing producers keep current pricing
        through the end of their billing period.
      </p>

      <h2>8. Beta period</h2>
      <p>
        TypeBeatOS is currently in private beta. During the beta the service
        may be unavailable, change without notice, or lose data. The first
        200 producers off the waitlist receive the full app at no cost
        through general availability, and are locked in at half price for
        life on whichever plan they choose at launch.
      </p>

      <h2>9. Availability</h2>
      <p>
        We aim for high availability but make no specific uptime guarantee
        during the beta. After general availability the target uptime SLA is
        99.5% per calendar month, measured monthly.
      </p>

      <h2>10. Termination</h2>
      <ul>
        <li>
          You can delete your account any time from{" "}
          <Link href="/settings?tab=delete">account settings</Link>. Deletion removes your
          producer profile, beats, packages, generated assets, and YouTube
          tokens. Videos already published to YouTube stay on your channel.
        </li>
        <li>
          We may terminate accounts that violate these terms with notice
          where reasonable.
        </li>
      </ul>

      <h2>11. Disclaimers and liability</h2>
      <p>
        TypeBeatOS is provided &quot;as is&quot; without warranties of any
        kind. To the maximum extent permitted by Australian law, we are not
        liable for indirect, incidental, special, consequential, or punitive
        damages, or for lost profits or revenue. Our total liability for any
        claim arising out of these terms is limited to the greater of AUD 100
        or the fees you paid us in the 12 months before the claim. Nothing in
        these terms excludes, restricts, or modifies any consumer guarantee,
        right, or remedy you have under the Australian Consumer Law that
        cannot lawfully be excluded.
      </p>

      <h2>12. Changes to these terms</h2>
      <p>
        We may update these terms. We will notify producers by email at
        least 14 days before any material change takes effect. Continued use
        of the service after that means you accept the updated terms.
      </p>

      <h2>13. Governing law</h2>
      <p>
        These terms are governed by the laws of Australia. Disputes that
        cannot be resolved by email are subject to the exclusive jurisdiction
        of the courts of Australia.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions or complaints about these terms:{" "}
        <a href="mailto:typebeatos@gmail.com">typebeatos@gmail.com</a>.
      </p>
    </LegalShell>
  );
}
