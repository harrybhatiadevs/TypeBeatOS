import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const GENRES = ["Trap", "R&B", "Drill", "Hip Hop", "Pop", "Afrobeats", "Boom Bap", "Hyperpop", "Lo-fi"];
const MOODS = ["Dark", "Moody", "Hard", "Smooth", "Melodic", "Aggressive", "Chill", "Emotional", "Bouncy"];
const KEYS = [
  "A minor", "A# minor", "B minor", "C minor", "C# minor", "D minor", "D# minor",
  "E minor", "F minor", "F# minor", "G minor", "G# minor",
  "A major", "B major", "C major", "D major", "E major", "F major", "G major",
];

export default async function EditBeatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;

  const beat = await db.beat.findFirst({
    where: { id, userId: user.id },
    include: { package: true },
  });
  if (!beat) notFound();

  return (
    <>
      <h1 className="page-title">Edit beat</h1>
      <p className="page-sub">
        Update the beat metadata used across your catalog and upload package workflow.
      </p>

      {error && <div className="form-error">{error}</div>}

      {/* Native multipart POST to a route handler — not a Server Action, which
          fails on file uploads in this deployment (see /api/beats). */}
      <form action={`/api/beats/${beat.id}`} method="POST" encType="multipart/form-data">

        <div className="card">
          <h3>Beat details</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">Beat name *</label>
              <input id="name" name="name" type="text" required defaultValue={beat.name} />
            </div>
            <div className="form-field">
              <label htmlFor="audio">Replace audio file (optional)</label>
              <input id="audio" name="audio" type="file" accept=".mp3,.wav,.m4a,.ogg,.flac,.aiff" />
            </div>
            <div className="form-field">
              <label htmlFor="targetArtist">Target artist *</label>
              <input id="targetArtist" name="targetArtist" type="text" required defaultValue={beat.targetArtist} />
            </div>
            <div className="form-field">
              <label htmlFor="secondaryArtist">Secondary artist</label>
              <input id="secondaryArtist" name="secondaryArtist" type="text" defaultValue={beat.secondaryArtist} />
            </div>
            <div className="form-field">
              <label htmlFor="genre">Genre</label>
              <input id="genre" name="genre" type="text" list="genres" defaultValue={beat.genre} />
              <datalist id="genres">
                {GENRES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div className="form-field">
              <label htmlFor="mood">Mood</label>
              <input id="mood" name="mood" type="text" list="moods" defaultValue={beat.mood} />
              <datalist id="moods">
                {MOODS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="form-field">
              <label htmlFor="bpm">BPM</label>
              <input id="bpm" name="bpm" type="number" min="40" max="300" defaultValue={beat.bpm || ""} />
            </div>
            <div className="form-field">
              <label htmlFor="key">Key</label>
              <input id="key" name="key" type="text" list="keys" defaultValue={beat.key} />
              <datalist id="keys">
                {KEYS.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Selling</h3>
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="storeLink">Beat store link (overrides profile default)</label>
              <input id="storeLink" name="storeLink" type="url" defaultValue={beat.storeLink} />
            </div>
            <div className="form-field">
              <label htmlFor="licensePrice">Lease price ($)</label>
              <input id="licensePrice" name="licensePrice" type="text" defaultValue={beat.licensePrice} />
            </div>
            <div className="form-field">
              <label htmlFor="exclusivePrice">Exclusive price ($)</label>
              <input id="exclusivePrice" name="exclusivePrice" type="text" defaultValue={beat.exclusivePrice} />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
          <Link href="/beats" className="btn btn-ghost">
            Cancel
          </Link>
          {beat.package && (
            <Link href={`/packages/${beat.package.id}`} className="btn btn-ghost">
              Open package
            </Link>
          )}
        </div>
      </form>
    </>
  );
}
