import { Music2, SlidersHorizontal, Upload } from "lucide-react";
import { createBeat } from "@/lib/actions/beats";

const GENRES = ["Trap", "R&B", "Drill", "Hip Hop", "Pop", "Afrobeats", "Boom Bap", "Hyperpop", "Lo-fi"];
const MOODS = ["Dark", "Moody", "Hard", "Smooth", "Melodic", "Aggressive", "Chill", "Emotional", "Bouncy"];
const KEYS = [
  "A minor", "A# minor", "B minor", "C minor", "C# minor", "D minor", "D# minor",
  "E minor", "F minor", "F# minor", "G minor", "G# minor",
  "A major", "B major", "C major", "D major", "E major", "F major", "G major",
];

export default async function NewBeatPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Create pack
      </p>
      <h1 className="page-title">Add a beat</h1>
      <p className="page-sub">
        Start with the file, name, and target artist. Add detail only when it helps the upload.
      </p>

      {error && <div className="form-error">{error}</div>}

      <form action={createBeat} className="new-beat-form">
        <div className="card new-beat-card">
          <div className="new-beat-card-head">
            <div>
              <h3>Essentials</h3>
              <p>Required fields stay first.</p>
            </div>
            <span className="badge badge-ready">Pack setup</span>
          </div>

          <div className="new-beat-composer">
            <div className="audio-dropzone">
              <div className="audio-dropzone-icon" aria-hidden="true">
                <Upload size={22} strokeWidth={2.2} />
              </div>
              <div className="audio-dropzone-copy">
                <label htmlFor="audio">Audio file</label>
                <p id="audio-help">MP3, WAV, M4A, OGG, FLAC, or AIFF up to 50 MB.</p>
              </div>
              <input
                id="audio"
                name="audio"
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.flac,.aiff"
                aria-describedby="audio-help"
              />
            </div>

            <div className="new-beat-essential-fields">
              <div className="form-field">
                <label htmlFor="name">Beat name</label>
                <input id="name" name="name" type="text" required placeholder="Late Night" />
              </div>
              <div className="form-field">
                <label htmlFor="targetArtist">Target artist</label>
                <input id="targetArtist" name="targetArtist" type="text" required placeholder="Drake" />
              </div>
            </div>
          </div>

          <div className="new-beat-pack-preview" aria-label="Generated pack output">
            <div>
              <Music2 size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Title options</span>
            </div>
            <div>
              <SlidersHorizontal size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Tags and description</span>
            </div>
            <div>
              <Upload size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Upload package</span>
            </div>
          </div>
        </div>

        <div className="form-actions new-beat-actions">
          <span>Name and target artist are required.</span>
          <button type="submit" className="btn btn-primary">
            <Music2 size={18} strokeWidth={2.2} aria-hidden="true" />
            Generate pack
          </button>
        </div>

        <details className="card advanced-panel">
          <summary>
            <span>
              <strong>Production details</strong>
              <small>Optional fields for tighter metadata.</small>
            </span>
            <SlidersHorizontal size={18} strokeWidth={2.2} aria-hidden="true" />
          </summary>
          <div className="form-grid advanced-grid">
            <div className="form-field">
              <label htmlFor="secondaryArtist">Secondary artist</label>
              <input id="secondaryArtist" name="secondaryArtist" type="text" placeholder="PARTYNEXTDOOR" />
            </div>
            <div className="form-field">
              <label htmlFor="genre">Genre</label>
              <input id="genre" name="genre" type="text" list="genres" placeholder="R&B Trap" />
              <datalist id="genres">
                {GENRES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div className="form-field">
              <label htmlFor="mood">Mood</label>
              <input id="mood" name="mood" type="text" list="moods" placeholder="Moody" />
              <datalist id="moods">
                {MOODS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="form-field">
              <label htmlFor="bpm">BPM</label>
              <input id="bpm" name="bpm" type="number" min="40" max="300" placeholder="Detected from audio" />
            </div>
            <div className="form-field">
              <label htmlFor="key">Key</label>
              <input id="key" name="key" type="text" list="keys" placeholder="Detected from audio" />
              <datalist id="keys">
                {KEYS.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </div>
          </div>
        </details>

        <details className="card advanced-panel">
          <summary>
            <span>
              <strong>Selling details</strong>
              <small>Overrides for links and prices.</small>
            </span>
            <SlidersHorizontal size={18} strokeWidth={2.2} aria-hidden="true" />
          </summary>
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="storeLink">Beat store link</label>
              <input id="storeLink" name="storeLink" type="url" placeholder="https://www.beatstars.com/yourname/..." />
            </div>
            <div className="form-field">
              <label htmlFor="licensePrice">Lease price</label>
              <input id="licensePrice" name="licensePrice" type="text" placeholder="29.99" />
            </div>
            <div className="form-field">
              <label htmlFor="exclusivePrice">Exclusive price</label>
              <input id="exclusivePrice" name="exclusivePrice" type="text" placeholder="299" />
            </div>
          </div>
        </details>
      </form>
    </>
  );
}
