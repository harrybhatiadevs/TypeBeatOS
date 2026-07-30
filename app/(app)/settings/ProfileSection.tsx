import { saveProfile } from "@/lib/actions/profile";
import { disconnectYouTube } from "@/lib/actions/youtube";
import { parseScheduleDays } from "@/lib/schedule";
import FormSubmitButton from "@/app/FormSubmitButton";
import TimezoneSelect from "./TimezoneSelect";

const DAYS = [
  { num: 0, label: "Sun" },
  { num: 1, label: "Mon" },
  { num: 2, label: "Tue" },
  { num: 3, label: "Wed" },
  { num: 4, label: "Thu" },
  { num: 5, label: "Fri" },
  { num: 6, label: "Sat" },
];

type ProfileData = {
  producerName: string;
  contactEmail: string;
  storeUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  licenseText: string;
  descriptionFooter: string;
  scheduleDays: string;
  scheduleTime: string;
  timezone: string;
} | null;

export default function ProfileSection({
  profile,
  youtube,
  configured,
  saved,
  ytConnected,
  ytError,
}: {
  profile: ProfileData;
  youtube: { channelId: string; channelTitle: string } | null;
  configured: boolean;
  saved: boolean;
  ytConnected: boolean;
  ytError?: string;
}) {
  const activeDays = parseScheduleDays(profile?.scheduleDays || "1,3,5");

  return (
    <>
      <div className="card">
        <h3>YouTube channel</h3>
        {ytError && <div className="form-error">{ytError}</div>}
        {ytConnected && <p className="form-saved" style={{ marginBottom: 14 }}>✓ Channel connected</p>}
        {youtube ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <p style={{ flex: 1, minWidth: 220 }}>
              Connected as <strong>{youtube.channelTitle || youtube.channelId}</strong> — uploads
              publish straight to this channel at their scheduled time.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <a
                href="https://security.google.com/settings/security/permissions"
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-ghost btn-sm"
              >
                Google permissions ↗
              </a>
              <form action={disconnectYouTube}>
                <FormSubmitButton className="btn btn-danger btn-sm" pendingLabel="Disconnecting...">
                  Disconnect &amp; revoke
                </FormSubmitButton>
              </form>
            </div>
          </div>
        ) : configured ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <p className="tb-muted" style={{ flex: 1, minWidth: 220 }}>
              Connect your channel to upload scheduled videos directly from each package.
            </p>
            <a href="/api/youtube/connect" className="btn btn-primary btn-sm">▶ Connect YouTube</a>
          </div>
        ) : (
          <p className="tb-helper">
            Direct upload needs Google API credentials. Create an OAuth client in Google Cloud
            (YouTube Data API v3, redirect URI <code>{`{APP_URL}`}/api/youtube/callback</code>), then
            set <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in <code>.env</code>.
          </p>
        )}
      </div>

      <form action={saveProfile}>
        <div className="card">
          <h3>Brand &amp; links</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="producerName">Producer name</label>
              <input id="producerName" name="producerName" type="text" defaultValue={profile?.producerName || ""} placeholder="prod. yourname" />
            </div>
            <div className="form-field">
              <label htmlFor="contactEmail">Contact email</label>
              <input id="contactEmail" name="contactEmail" type="email" defaultValue={profile?.contactEmail || ""} placeholder="beats@you.com" />
            </div>
            <div className="form-field">
              <label htmlFor="storeUrl">Beat store URL (BeatStars / Airbit)</label>
              <input id="storeUrl" name="storeUrl" type="url" defaultValue={profile?.storeUrl || ""} placeholder="https://www.beatstars.com/yourname" />
            </div>
            <div className="form-field">
              <label htmlFor="youtubeUrl">YouTube channel URL</label>
              <input id="youtubeUrl" name="youtubeUrl" type="url" defaultValue={profile?.youtubeUrl || ""} placeholder="https://youtube.com/@yourname" />
            </div>
            <div className="form-field">
              <label htmlFor="instagramUrl">Instagram URL</label>
              <input id="instagramUrl" name="instagramUrl" type="url" defaultValue={profile?.instagramUrl || ""} placeholder="https://instagram.com/yourname" />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Description defaults</h3>
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="licenseText">License info (appears in every description)</label>
              <textarea id="licenseText" name="licenseText" defaultValue={profile?.licenseText || ""} placeholder={"This beat is licensed, not sold. Free downloads are for non-profit use only — must credit (prod. yourname)."} />
            </div>
            <div className="form-field full">
              <label htmlFor="descriptionFooter">Description footer</label>
              <textarea id="descriptionFooter" name="descriptionFooter" defaultValue={profile?.descriptionFooter || ""} placeholder={"New beats every Mon / Wed / Fri. Subscribe so you don't miss the next one."} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Default upload schedule</h3>
          <div className="form-grid">
            <div className="form-field full">
              <label>Posting days</label>
              <div className="checkbox-row">
                {DAYS.map((d) => (
                  <label key={d.num} className="checkbox-pill">
                    <input type="checkbox" name="scheduleDays" value={d.num} defaultChecked={activeDays.includes(d.num)} />
                    <span>{d.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="scheduleTime">Posting time</label>
              <input id="scheduleTime" name="scheduleTime" type="time" defaultValue={profile?.scheduleTime || "18:00"} />
            </div>
            <div className="form-field">
              <label htmlFor="timezone">Time zone</label>
              <TimezoneSelect name="timezone" defaultValue={profile?.timezone || ""} />
              <span className="tb-helper" style={{ fontSize: "0.78rem" }}>
                Posting times and YouTube publish times use this zone.
              </span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <FormSubmitButton pendingLabel="Saving...">Save profile</FormSubmitButton>
          {saved && <span className="form-saved">✓ Saved</span>}
        </div>
      </form>
    </>
  );
}
