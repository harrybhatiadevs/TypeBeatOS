import Link from "next/link";
import { Check } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { youtubeConfigured } from "@/lib/youtube";
import {
  finishOnboarding,
  saveOnboardingBrand,
  saveOnboardingSchedule,
} from "@/lib/actions/onboarding";
import { parseScheduleDays } from "@/lib/schedule";

const DAYS = [
  { num: 0, label: "Sun" },
  { num: 1, label: "Mon" },
  { num: 2, label: "Tue" },
  { num: 3, label: "Wed" },
  { num: 4, label: "Thu" },
  { num: 5, label: "Fri" },
  { num: 6, label: "Sat" },
];

const STEPS = ["Your brand", "Posting rhythm", "Connect YouTube"];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; yt_connected?: string; yt_error?: string }>;
}) {
  const user = await requireUser();
  const { step: stepRaw, yt_connected, yt_error } = await searchParams;
  const step = Math.min(3, Math.max(1, parseInt(stepRaw || "1", 10) || 1));

  const p = user.profile;
  const activeDays = parseScheduleDays(p?.scheduleDays || "1,3,5");
  const youtube = await db.youTubeAccount.findUnique({ where: { userId: user.id } });
  const configured = youtubeConfigured();

  return (
    <div className="onb-wrap">
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Welcome to TypeBeatOS
      </p>
      <h1 className="page-title">Let&apos;s set you up</h1>
      <p className="page-sub">
        Three quick steps for your descriptions and schedule.
      </p>

      <div className="onb-steps">
        {STEPS.map((label, i) => (
          <div key={label} className={`onb-step${i + 1 === step ? " active" : ""}${i + 1 < step ? " done" : ""}`}>
            <span className="onb-step-num">
              {i + 1 < step ? <Check size={13} strokeWidth={2.5} aria-hidden="true" /> : i + 1}
            </span>
            <span className="onb-step-label">{label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <form action={saveOnboardingBrand}>
          <div className="card">
            <h3>Your producer brand</h3>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="producerName">Producer name</label>
                <input
                  id="producerName"
                  name="producerName"
                  type="text"
                  defaultValue={p?.producerName || ""}
                  placeholder="prod. yourname"
                />
              </div>
              <div className="form-field">
                <label htmlFor="contactEmail">Contact email</label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  defaultValue={p?.contactEmail || user.email}
                />
              </div>
              <div className="form-field full">
                <label htmlFor="storeUrl">Beat store URL</label>
                <input
                  id="storeUrl"
                  name="storeUrl"
                  type="url"
                  defaultValue={p?.storeUrl || ""}
                  placeholder="https://www.beatstars.com/yourname"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Continue
              </button>
              <Link href="/onboarding?step=2" className="nav-link">
                Skip
              </Link>
            </div>
          </div>
        </form>
      )}

      {step === 2 && (
        <form action={saveOnboardingSchedule}>
          <div className="card">
            <h3>When should your beats go live?</h3>
            <p className="tb-helper helper-block">
              Choose the upload slots you can keep every week.
            </p>
            <div className="form-grid">
              <div className="form-field full">
                <label>Posting days</label>
                <div className="checkbox-row">
                  {DAYS.map((d) => (
                    <label key={d.num} className="checkbox-pill">
                      <input
                        type="checkbox"
                        name="scheduleDays"
                        value={d.num}
                        defaultChecked={activeDays.includes(d.num)}
                      />
                      <span>{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="scheduleTime">Posting time</label>
                <input
                  id="scheduleTime"
                  name="scheduleTime"
                  type="time"
                  defaultValue={p?.scheduleTime || "18:00"}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Continue
              </button>
              <Link href="/onboarding?step=3" className="nav-link">
                Skip
              </Link>
            </div>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="card">
          <h3>Connect your YouTube channel</h3>
          {yt_error && <div className="form-error">{yt_error}</div>}
          {youtube ? (
            <p className="tb-accent tb-strong helper-block">
              Connected as <strong>{youtube.channelTitle}</strong>
              {yt_connected ? " - you're all set." : "."} Rendered packages can now upload straight
              to your channel on schedule.
            </p>
          ) : configured ? (
            <p className="tb-helper helper-block">
              This is what lets TypeBeatOS publish scheduled uploads for you. You can also do this
              later from your profile.
            </p>
          ) : (
            <p className="tb-helper helper-block">
              YouTube upload isn&apos;t configured on this server yet - you can connect later from
              your profile once it is.
            </p>
          )}
          <div className="form-actions form-actions-tight">
            {!youtube && configured && (
              <a href="/api/youtube/connect?return=/onboarding%3Fstep%3D3" className="btn btn-primary">
                Connect YouTube
              </a>
            )}
            <form action={finishOnboarding} className="inline-form">
              <button type="submit" className={youtube ? "btn btn-primary" : "btn btn-ghost"}>
                {youtube ? "Finish setup" : "Skip and finish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
