import { requireUser } from "@/lib/auth";
import { saveProfile } from "@/lib/actions/profile";
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

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const { saved } = await searchParams;
  const p = user.profile;
  const activeDays = parseScheduleDays(p?.scheduleDays || "1,3,5");

  return (
    <>
      <h1 className="page-title">Producer profile</h1>
      <p className="page-sub">
        Set this once — every generated description, pinned comment, and schedule uses it.
      </p>

      <form action={saveProfile}>
        <div className="card">
          <h3>Brand &amp; links</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="producerName">Producer name</label>
              <input id="producerName" name="producerName" type="text" defaultValue={p?.producerName || ""} placeholder="prod. yourname" />
            </div>
            <div className="form-field">
              <label htmlFor="contactEmail">Contact email</label>
              <input id="contactEmail" name="contactEmail" type="email" defaultValue={p?.contactEmail || ""} placeholder="beats@you.com" />
            </div>
            <div className="form-field">
              <label htmlFor="storeUrl">Beat store URL (BeatStars / Airbit)</label>
              <input id="storeUrl" name="storeUrl" type="url" defaultValue={p?.storeUrl || ""} placeholder="https://www.beatstars.com/yourname" />
            </div>
            <div className="form-field">
              <label htmlFor="youtubeUrl">YouTube channel URL</label>
              <input id="youtubeUrl" name="youtubeUrl" type="url" defaultValue={p?.youtubeUrl || ""} placeholder="https://youtube.com/@yourname" />
            </div>
            <div className="form-field">
              <label htmlFor="instagramUrl">Instagram URL</label>
              <input id="instagramUrl" name="instagramUrl" type="url" defaultValue={p?.instagramUrl || ""} placeholder="https://instagram.com/yourname" />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Description defaults</h3>
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="licenseText">License info (appears in every description)</label>
              <textarea
                id="licenseText"
                name="licenseText"
                defaultValue={p?.licenseText || ""}
                placeholder={"This beat is licensed, not sold. Free downloads are for non-profit use only — must credit (prod. yourname)."}
              />
            </div>
            <div className="form-field full">
              <label htmlFor="descriptionFooter">Description footer</label>
              <textarea
                id="descriptionFooter"
                name="descriptionFooter"
                defaultValue={p?.descriptionFooter || ""}
                placeholder={"New beats every Mon / Wed / Fri. Subscribe so you don't miss the next one."}
              />
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
              <input id="scheduleTime" name="scheduleTime" type="time" defaultValue={p?.scheduleTime || "18:00"} />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save profile
          </button>
          {saved && <span className="form-saved">✓ Saved</span>}
        </div>
      </form>
    </>
  );
}
