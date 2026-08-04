"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AUDIO_ACCEPT, audioUploadError } from "@/lib/audio-upload";
import { beatNameFromFilename, pairFileNames } from "@/lib/batch-files";
import { MAX_BATCH_ITEMS, type BatchPrivacyStatus } from "@/lib/batch-types";

type LocalStage = "ready" | "preparing" | "uploading" | "queued" | "failed";

type BatchUploaderProps = {
  planId: string;
  isAdmin: boolean;
  remaining: number;
  connectedChannel: string;
  profileDefaults: { storeLink: string; scheduleTime: string };
};

function imageToThumbnail(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Could not prepare this image."));

      const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.fillStyle = "#000";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      canvas.toBlob(
        (blob) => blob
          ? resolve(new File([blob], "thumbnail.png", { type: "image/png" }))
          : reject(new Error("Could not prepare this image.")),
        "image/png",
        0.92,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not read ${file.name}.`));
    };
    image.src = objectUrl;
  });
}

function uploadForm(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<{ packageId: string }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      const response = request.response as { packageId?: string; error?: string } | null;
      if (request.status >= 200 && request.status < 300 && response?.packageId) {
        resolve({ packageId: response.packageId });
      } else {
        reject(new Error(response?.error || "Upload failed."));
      }
    };
    request.onerror = () => reject(new Error("Network error while uploading this beat."));
    request.send(formData);
  });
}

async function runTwoAtATime(tasks: Array<() => Promise<void>>) {
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      await task();
    }
  };
  await Promise.all([worker(), worker()]);
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
    setNames(selected.map((file) => beatNameFromFilename(file.name)));
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
    if (!allowed) return setError("Upgrade to Pro to use the batch upload queue.");
    if (!completePairs) return setError("Choose the same number of audio files and images (2–5).");
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

    setSubmitting(true);
    setError("");
    try {
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
      const created = (await create.json()) as {
        batchId?: string;
        items?: Array<{ id: string; position: number }>;
        error?: string;
      };
      if (!create.ok || !created.batchId || !created.items) {
        throw new Error(created.error || "Could not create this batch.");
      }

      const tasks = created.items.map((batchItem, index) => async () => {
        try {
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
            `/api/batches/${created.batchId}/items/${batchItem.id}`,
            formData,
            (percent) => setItemProgress(index, percent),
          );
          setStage(index, "queued");
        } catch (err) {
          const message = err instanceof Error ? err.message : "One beat failed to upload.";
          await fetch(`/api/batches/${created.batchId}/items/${batchItem.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: message }),
          }).catch(() => undefined);
          setStage(index, "failed");
          setError((current) => current || message);
        }
      });

      await runTwoAtATime(tasks);
      router.push(`/beats/batch/${created.batchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start this batch.");
      setSubmitting(false);
    }
  };

  if (!allowed) {
    return (
      <div className="card batch-upgrade-card">
        <span className="badge badge-scheduled">Pro feature</span>
        <h2>Upload several beats in one run</h2>
        <p className="tb-helper">
          Batch upload pairs your audio and artwork, applies shared settings, renders every video, and queues YouTube automatically.
        </p>
        <Link href="/billing?upgrade=batch" className="btn btn-primary">Upgrade to Pro</Link>
      </div>
    );
  }

  return (
    <div className="batch-builder">
      {error && <div className="form-error" role="alert">{error}</div>}

      <section className="card batch-step-card">
        <div className="batch-step-head"><span>1</span><div><h2>Add files</h2><p>Choose 2–5 audio files and the same number of images.</p></div></div>
        <div className="batch-drop-grid">
          <label className="batch-drop-zone">
            <strong>Beat audio</strong>
            <span>MP3, WAV, M4A, OGG, FLAC or AIFF · 50 MB each</span>
            <input type="file" accept={AUDIO_ACCEPT} multiple onChange={(event) => selectAudio(event.target.files)} />
            <em>{audioFiles.length ? `${audioFiles.length} beat${audioFiles.length === 1 ? "" : "s"} selected` : "Choose audio files"}</em>
          </label>
          <label className="batch-drop-zone">
            <strong>Artwork</strong>
            <span>JPG or PNG · automatically cropped to 1280×720</span>
            <input type="file" accept="image/png,image/jpeg" multiple onChange={(event) => selectImages(event.target.files)} />
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
                      {submitting ? (
                        <span className={`badge batch-local-${stages[index] || "ready"}`}>
                          {stages[index] === "uploading" ? `${progress[index] || 0}%` : stages[index] || "ready"}
                        </span>
                      ) : <span className="tb-muted">{pairNames[index] === "No image" ? "Needs image" : "Paired"}</span>}
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
          {submitting ? "Uploading batch…" : `Build and queue ${audioFiles.length || 0} beats →`}
        </button>
      </div>
    </div>
  );
}
