"use client";

import { useState } from "react";
import { AUDIO_ACCEPT, audioUploadError } from "@/lib/audio-upload";

const GENRES = ["Trap", "R&B", "Drill", "Hip Hop", "Pop", "Afrobeats", "Boom Bap", "Hyperpop", "Lo-fi"];
const MOODS = ["Dark", "Moody", "Hard", "Smooth", "Melodic", "Aggressive", "Chill", "Emotional", "Bouncy"];
const KEYS = [
  "A minor", "A# minor", "B minor", "C minor", "C# minor", "D minor", "D# minor",
  "E minor", "F minor", "F# minor", "G minor", "G# minor",
  "A major", "B major", "C major", "D major", "E major", "F major", "G major",
];

export default function NewBeatForm({ initialError }: { initialError?: string }) {
  const [clientError, setClientError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const error = clientError || initialError;

  return (
    <>
      {error && <div className="form-error">{error}</div>}

      {/*
        Native multipart POST to a route handler — NOT a React Server Action.
        Server Actions send the file through Next's "flight" decoder, which
        silently drops/fails the audio blob in this standalone deployment, so
        every upload-with-audio failed. A plain form POST is parsed by
        request.formData() and works reliably.
      */}
      <form
        action="/api/beats"
        method="POST"
        encType="multipart/form-data"
        onSubmit={(event) => {
          const form = event.currentTarget;
          const input = form.elements.namedItem("audio");
          const file = input instanceof HTMLInputElement ? input.files?.[0] : null;
          const message = audioUploadError(file);

          if (message) {
            event.preventDefault();
            setClientError(message);
            return;
          }

          setClientError(null);
          setSubmitting(true);
        }}
      >
        <div className="card">
          <h3>Beat details</h3>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">Beat name *</label>
              <input id="name" name="name" type="text" required placeholder="Late Night" />
            </div>
            <div className="form-field">
              <label htmlFor="audio">Audio file (optional)</label>
              <input id="audio" name="audio" type="file" accept={AUDIO_ACCEPT} />
            </div>
            <div className="form-field">
              <label htmlFor="targetArtist">Target artist *</label>
              <input id="targetArtist" name="targetArtist" type="text" required placeholder="Drake" />
            </div>
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
              <label htmlFor="bpm">BPM — auto-detected from audio if left blank</label>
              <input id="bpm" name="bpm" type="number" min="40" max="300" placeholder="Auto-detect" />
            </div>
            <div className="form-field">
              <label htmlFor="key">Key — auto-detected from audio if left blank</label>
              <input id="key" name="key" type="text" list="keys" placeholder="Auto-detect" />
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
              <input id="storeLink" name="storeLink" type="url" placeholder="https://www.beatstars.com/yourname/..." />
            </div>
            <div className="form-field">
              <label htmlFor="licensePrice">Lease price ($)</label>
              <input id="licensePrice" name="licensePrice" type="text" placeholder="29.99" />
            </div>
            <div className="form-field">
              <label htmlFor="exclusivePrice">Exclusive price ($)</label>
              <input id="exclusivePrice" name="exclusivePrice" type="text" placeholder="299" />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
            {submitting ? "Building package…" : "Generate upload package →"}
          </button>
        </div>
      </form>
    </>
  );
}
