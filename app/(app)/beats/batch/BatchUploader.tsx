"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { AUDIO_ACCEPT, audioUploadError } from "@/lib/audio-upload";
import { beatNameFromFilename, pairFileNames } from "@/lib/batch-files";
import { VIDEO_HEIGHT, VIDEO_WIDTH } from "@/lib/video-format";
import { imageToThumbnail, uploadForm, runTwoAtATime } from "@/lib/batch-upload-client";
import { MAX_BATCH_ITEMS, type BatchPrivacyStatus } from "@/lib/batch-types";

type LocalStage = "ready" | "preparing" | "uploading" | "queued" | "failed";
type CreatedBatch = { batchId: string; items: Array<{ id: string; position: number }> };

type BatchUploaderProps = {
  planId: string;
  isAdmin: boolean;
  remaining: number;
  connectedChannel: string;
  profileDefaults: { storeLink: string; scheduleTime: string };
};

/**
 * Ask the server to refine filename-derived names. Returns the deterministic
 * names unchanged if the request fails, so this can never block an upload.
 */
async function fetchRefinedNames(filenames: string[], fallbacks: string[]): Promise<string[]> {
  try {
    const res = await fetch("/api/beat-name", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filenames }),
    });
    if (!res.ok) return fallbacks;
    const data = await res.json();
    const names = data?.names;
    if (!Array.isArray(names) || names.length !== fallbacks.length) return fallbacks;
    return names.map((n: unknown, i: number) =>
      typeof n === "string" && n.trim() ? n.trim() : fallbacks[i],
    );
  } catch {
    return fallbacks;
  }
}

export default function BatchUploader({
  planId,
  isAdmin,
  remaining,
  connectedChannel,
  profileDefaults,
}: BatchUploaderProps) {
  const router = useRouter();
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePairs, setImagePairs] = useState<number[]>([]);
  const [names, setNames] = useState<string[]>([]);
  const [artistOverrides, setArtistOverrides] = useState<string[]>([]);
  const [targetArtist, setTargetArtist] = useState("");
  const [secondaryArtist, setSecondaryArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [storeLink, setStoreLink] = useState(profileDefaults.storeLink);
  const [licensePrice, setLicensePrice] = useState("");
  const [exclusivePrice, setExclusivePrice] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState<BatchPrivacyStatus>("public");
  const [madeForKids, setMadeForKids] = useState(false);
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [autoUpload, setAutoUpload] = useState(!!connectedChannel);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [stages, setStages] = useState<LocalStage[]>([]);
  const [progress, setProgress] = useState<number[]>([]);
  const [itemErrors, setItemErrors] = useState<string[]>([]);
  const [createdBatch, setCreatedBatch] = useState<CreatedBatch | null>(null);
  const submitLock = useRef(false);

  /**
   * Swap in AI-refined names for any entry the producer has not edited. The
   * comparison against `derived` is what protects in-flight typing: an entry
   * that no longer matches its deterministic guess is theirs, not ours.
   */
  const refineNames = useCallback((filenames: string[], derived: string[]) => {
    void fetchRefinedNames(filenames, derived).then((refined) => {
      setNames((current) =>
        current.map((name, i) => (name === derived[i] ? refined[i] ?? name : name)),
      );
    });
  }, []);

  const allowed = isAdmin || planId !== "free";
  const completePairs = audioFiles.length >= 2 && audioFiles.length === imageFiles.length;
  const pairNames = useMemo(
    () => imagePairs.map((index) => imageFiles[index]?.name || "No image"),
    [imageFiles, imagePairs],
  );

  const selectAudio = (files: FileList | null) => {
    const selected = Array.from(files || []).slice(0, MAX_BATCH_ITEMS);
    const firstError = selected.map(audioUploadError).find(Boolean);
    if (firstError) {
      setError(firstError);
      return;
    }
    setError("");
    setAudioFiles(selected);
    const derived = selected.map((file) => beatNameFromFilename(file.name));
    setNames(derived);
    // Refine in the background. Only entries still exactly equal to the
    // deterministic guess are replaced, so anything typed meanwhile survives.
    refineNames(selected.map((file) => file.name), derived);
    setArtistOverrides(selected.map(() => ""));
    setImagePairs(pairFileNames(selected.map((file) => file.name), imageFiles.map((file) => file.name)));
    setStages(selected.map(() => "ready"));
    setProgress(selected.map(() => 0));
  };

  const selectImages = (files: FileList | null) => {
    const selected = Array.from(files || [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, MAX_BATCH_ITEMS);
    setError("");
    setImageFiles(selected);
    setImagePairs(pairFileNames(audioFiles.map((file) => file.name), selected.map((file) => file.name)));
  };

  const setStage = (index: number, stage: LocalStage) => {
    setStages((current) => current.map((value, i) => (i === index ? stage : value)));
  };
  const setItemProgress = (index: number, value: number) => {
    setProgress((current) => current.map((percent, i) => (i === index ? value : percent)));
  };

  const submit = async () => {
    if (submitLock.current) return;
    if (!allowed) return setError("Upgrade to Pro to use the batch upload queue.");
    if (!completePairs) return setError(`Choose the same number of audio files and images (2–${MAX_BATCH_ITEMS}).`);
    if (audioFiles.length > remaining && !isAdmin) {
      return setError(`This batch needs ${audioFiles.length} upload packs, but only ${remaining} remain.`);
    }
    if (!targetArtist.trim() && artistOverrides.some((artist) => !artist.trim())) {
      return setError("Add a shared target artist or specify one for every beat.");
    }
    if (imagePairs.some((index) => index < 0) || new Set(imagePairs).size !== audioFiles.length) {
      return setError("Every beat needs a different image.");
    }
    if (autoUpload && !connectedChannel) {
      return setError("Connect a YouTube channel or turn off automatic upload.");
    }

    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      // Paint the busy state before preparing artwork or dispatching requests.
      await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
      let created = createdBatch;
      if (!created) {
        const create = await fetch("/api/batches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: audioFiles.map((audio, index) => ({
              audioName: audio.name,
              imageName: imageFiles[imagePairs[index]].name,
            })),
            autoUpload,
            autoSchedule,
            privacyStatus,
            madeForKids,
          }),
        });
        const result = (await create.json()) as {
          batchId?: string;
          items?: Array<{ id: string; position: number }>;
          error?: string;
        };
        if (!create.ok || !result.batchId || !result.items) {
          throw new Error(result.error || "Could not create this batch.");
        }
        created = { batchId: result.batchId, items: result.items };
        setCreatedBatch(created);
      }
      const batch = created;
      // A lost HTTP response can still have created the package. Reconcile
      // before retrying so those successful items are never uploaded twice.
      let current: { items: Array<{ id: string; packageId: string | null; status: string }> } = { items: [] };
      if (createdBatch) {
        const snapshot = await fetch(`/api/batches/${batch.batchId}`, { cache: "no-store" });
        if (!snapshot.ok) throw new Error("Could not check the queue. Keep this page open and try again.");
        current = await snapshot.json();
      }
      const failures: number[] = [];

      const tasks = batch.items.map((batchItem, index) => async () => {
        const persisted = current.items.find((item) => item.id === batchItem.id);
        if (persisted?.packageId) {
          setStage(index, "queued");
          return;
        }
        try {
          setItemErrors((errors) => errors.map((message, i) => i === index ? "" : message));
          setStage(index, "preparing");
          const thumbnail = await imageToThumbnail(imageFiles[imagePairs[index]]);
          const formData = new FormData();
          formData.set("audio", audioFiles[index]);
          formData.set("image", thumbnail);
          formData.set("name", names[index].trim() || beatNameFromFilename(audioFiles[index].name));
          formData.set("targetArtist", artistOverrides[index].trim() || targetArtist.trim());
          formData.set("secondaryArtist", secondaryArtist.trim());
          formData.set("genre", genre.trim());
          formData.set("mood", mood.trim());
          formData.set("storeLink", storeLink.trim());
          formData.set("licensePrice", licensePrice.trim());
          formData.set("exclusivePrice", exclusivePrice.trim());
          setStage(index, "uploading");
          await uploadForm(
            `/api/batches/${batch.batchId}/items/${batchItem.id}`,
            formData,
            (percent) => setItemProgress(index, percent),
          );
          setStage(index, "queued");
        } catch (err) {
          const message = err instanceof Error ? err.message : "One beat failed to upload.";
          failures.push(index);
          setItemErrors((errors) => Array.from({ length: audioFiles.length }, (_, i) => i === index ? message : errors[i] || ""));
          await fetch(`/api/batches/${batch.batchId}/items/${batchItem.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: message }),
          }).catch(() => undefined);
          setStage(index, "failed");
          setError((current) => current || message);
        }
      });

      await runTwoAtATime(tasks);
      if (failures.length) {
        setError(`${failures.length} file${failures.length === 1 ? "" : "s"} could not upload. Your successful beats are queued. Retry the remaining files below.`);
        setSubmitting(false);
      } else {
        router.push(`/beats/batch/${batch.batchId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start this batch.");
      setSubmitting(false);
    } finally {
      submitLock.current = false;
    }
  };

  if (!allowed) {
    return (
      <div className="card batch-upgrade-card">
        <div className="batch-upgrade-copy">
          <span className="badge badge-scheduled">Pro workflow</span>
          <h2>Turn up to {MAX_BATCH_ITEMS} uploads into one workflow.</h2>
          <p className="tb-helper">
            Add your beats and artwork once. TypeBeatOS pairs the files, applies your shared details, renders every video, and lines up the release run.
          </p>
          <ul className="batch-upgrade-benefits">
            <li><span>01</span><strong>Pair 2–{MAX_BATCH_ITEMS} beats with artwork automatically</strong></li>
            <li><span>02</span><strong>Set artist, pricing, and visibility once</strong></li>
            <li><span>03</span><strong>Render, schedule, and upload as one queue</strong></li>
          </ul>
          <div className="batch-upgrade-actions">
            <Link href="/billing?upgrade=batch" className="btn btn-primary">Unlock Batch Upload</Link>
            <Link href="/billing" className="copy-btn">Compare plans</Link>
          </div>
        </div>
        <div className="batch-upgrade-preview" aria-hidden="true">
          <div className="batch-upgrade-preview-head">
            <span>Release queue</span>
            <small>3 beats</small>
          </div>
          <div className="batch-upgrade-preview-row is-ready">
            <span>01</span><div><strong>Late Night</strong><small>Audio + artwork paired</small></div><em>Ready</em>
          </div>
          <div className="batch-upgrade-preview-row is-rendering">
            <span>02</span><div><strong>Midnight Drive</strong><small>Building YouTube video</small></div><em>64%</em>
          </div>
          <div className="batch-upgrade-preview-row">
            <span>03</span><div><strong>Free Throws</strong><small>Queued for the next slot</small></div><em>Next</em>
          </div>
          <div className="batch-upgrade-preview-lock">Pro</div>
        </div>
      </div>
    );
  }

  return (
    <div className="batch-builder">
      <fieldset disabled={submitting} style={{ display: "contents" }}>
      {error && <div className="form-error" role="alert">{error}</div>}

      <section className="card batch-step-card">
        <div className="batch-step-head"><span>1</span><div><h2>Add files</h2><p>Choose 2–{MAX_BATCH_ITEMS} audio files and the same number of images.</p></div></div>
        <div className="batch-drop-grid">
          <label className="batch-drop-zone">
            <strong>Beat audio</strong>
            <span>MP3, WAV, M4A, OGG, FLAC or AIFF · 50 MB each</span>
            <input type="file" accept={AUDIO_ACCEPT} multiple disabled={submitting || !!createdBatch} onChange={(event) => selectAudio(event.target.files)} />
            <em>{audioFiles.length ? `${audioFiles.length} beat${audioFiles.length === 1 ? "" : "s"} selected` : "Choose audio files"}</em>
          </label>
          <label className="batch-drop-zone">
            <strong>Artwork</strong>
            <span>JPG or PNG · fitted to {VIDEO_WIDTH}×{VIDEO_HEIGHT}</span>
            <input type="file" accept="image/png,image/jpeg" multiple disabled={submitting || !!createdBatch} onChange={(event) => selectImages(event.target.files)} />
            <em>{imageFiles.length ? `${imageFiles.length} image${imageFiles.length === 1 ? "" : "s"} selected` : "Choose images"}</em>
          </label>
        </div>

        {audioFiles.length > 0 && (
          <div className="table-scroll batch-pair-table">
            <table className="table">
              <thead><tr><th>Beat name</th><th>Audio</th><th>Paired image</th><th>Artist override</th><th>Status</th></tr></thead>
              <tbody>
                {audioFiles.map((audio, index) => (
                  <tr key={`${audio.name}-${index}`}>
                    <td><input aria-label={`Beat ${index + 1} name`} value={names[index] || ""} onChange={(event) => setNames((current) => current.map((name, i) => i === index ? event.target.value : name))} /></td>
                    <td className="tb-muted">{audio.name}</td>
                    <td>
                      <select aria-label={`Image for beat ${index + 1}`} value={imagePairs[index] ?? -1} onChange={(event) => setImagePairs((current) => current.map((pair, i) => i === index ? Number(event.target.value) : pair))}>
                        <option value={-1}>Choose image</option>
                        {imageFiles.map((image, imageIndex) => <option key={`${image.name}-${imageIndex}`} value={imageIndex}>{image.name}</option>)}
                      </select>
                    </td>
                    <td><input aria-label={`Artist override for beat ${index + 1}`} placeholder="Use shared artist" value={artistOverrides[index] || ""} onChange={(event) => setArtistOverrides((current) => current.map((artist, i) => i === index ? event.target.value : artist))} /></td>
                    <td>
                      {submitting || createdBatch ? (
                        <span className={`badge batch-local-${stages[index] || "ready"}`}>
                          {stages[index] === "uploading" ? progress[index] === 100 ? "Preparing package…" : `${progress[index] || 0}%` : stages[index] || "ready"}
                        </span>
                      ) : <span className="tb-muted">{pairNames[index] === "No image" ? "Needs image" : "Paired"}</span>}
                      {itemErrors[index] && <p className="form-error">{itemErrors[index]}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card batch-step-card">
        <div className="batch-step-head"><span>2</span><div><h2>Shared beat details</h2><p>These values apply to every row unless an artist override is supplied above.</p></div></div>
        <div className="form-grid">
          <div className="form-field"><label htmlFor="batchTargetArtist">Target artist *</label><input id="batchTargetArtist" value={targetArtist} onChange={(event) => setTargetArtist(event.target.value)} placeholder="Drake" /></div>
          <div className="form-field"><label htmlFor="batchSecondaryArtist">Secondary artist</label><input id="batchSecondaryArtist" value={secondaryArtist} onChange={(event) => setSecondaryArtist(event.target.value)} placeholder="PARTYNEXTDOOR" /></div>
          <div className="form-field"><label htmlFor="batchGenre">Genre</label><input id="batchGenre" value={genre} onChange={(event) => setGenre(event.target.value)} placeholder="R&B Trap" /></div>
          <div className="form-field"><label htmlFor="batchMood">Mood</label><input id="batchMood" value={mood} onChange={(event) => setMood(event.target.value)} placeholder="Moody" /></div>
          <div className="form-field full"><label htmlFor="batchStoreLink">Beat store link</label><input id="batchStoreLink" type="url" value={storeLink} onChange={(event) => setStoreLink(event.target.value)} /></div>
          <div className="form-field"><label htmlFor="batchLease">Lease price ($)</label><input id="batchLease" value={licensePrice} onChange={(event) => setLicensePrice(event.target.value)} placeholder="29.99" /></div>
          <div className="form-field"><label htmlFor="batchExclusive">Exclusive price ($)</label><input id="batchExclusive" value={exclusivePrice} onChange={(event) => setExclusivePrice(event.target.value)} placeholder="299" /></div>
        </div>
      </section>

      <section className="card batch-step-card">
        <div className="batch-step-head"><span>3</span><div><h2>Render and publish</h2><p>Each beat becomes a clean artwork video, ready for YouTube.</p></div></div>
        <div className="form-grid">
          <div className="form-field"><label htmlFor="batchVisibility">YouTube visibility</label><select id="batchVisibility" value={privacyStatus} onChange={(event) => setPrivacyStatus(event.target.value as BatchPrivacyStatus)}><option value="public">Public / scheduled</option><option value="private">Private</option><option value="unlisted">Unlisted</option></select></div>
          <div className="form-field"><label htmlFor="batchAudience">Audience</label><select id="batchAudience" value={madeForKids ? "yes" : "no"} onChange={(event) => setMadeForKids(event.target.value === "yes")}><option value="no">Not made for kids</option><option value="yes">Made for kids</option></select></div>
          <div className="batch-toggle-field"><label><input type="checkbox" checked={autoSchedule} onChange={(event) => setAutoSchedule(event.target.checked)} /><span><strong>Use my posting schedule</strong><small>Next available slots at {profileDefaults.scheduleTime}</small></span></label></div>
          <div className="batch-toggle-field"><label><input type="checkbox" checked={autoUpload} disabled={!connectedChannel} onChange={(event) => setAutoUpload(event.target.checked)} /><span><strong>Upload automatically to YouTube</strong><small>{connectedChannel ? connectedChannel : "Connect a channel in Settings first"}</small></span></label></div>
        </div>
        {privacyStatus === "public" && !autoSchedule && autoUpload && <div className="form-error">Public videos will publish as soon as their uploads finish.</div>}
      </section>

      <div className="batch-submit-bar">
        <div><strong>{audioFiles.length || 0} beats</strong><span>{isAdmin ? "Unlimited packs available" : `${remaining} upload packs remaining`}</span></div>
        <button className="btn btn-primary" type="button" onClick={submit} disabled={submitting || !completePairs} aria-busy={submitting}>
          {submitting ? `Uploading batch · ${stages.filter((stage) => stage === "queued").length}/${audioFiles.length} queued…` : createdBatch ? "Retry remaining files →" : `Build and queue ${audioFiles.length || 0} beats →`}
        </button>
        {createdBatch && !submitting && <Link className="btn btn-ghost" href={`/beats/batch/${createdBatch.batchId}`}>View batch progress</Link>}
      </div>
      </fieldset>
    </div>
  );
}
