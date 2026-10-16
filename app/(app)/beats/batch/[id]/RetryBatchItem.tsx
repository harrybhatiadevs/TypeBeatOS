"use client";

import { useRef, useState } from "react";
import { AUDIO_ACCEPT, audioUploadError } from "@/lib/audio-upload";
import { imageToThumbnail, uploadForm } from "@/lib/batch-upload-client";

export default function RetryBatchItem({ batchId, item, defaults, onQueued }: {
  batchId: string;
  item: { id: string; name: string; audioName: string; imageName: string };
  defaults: Record<string, string>;
  onQueued: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [audio, setAudio] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [artist, setArtist] = useState(defaults.targetArtist || "");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const lock = useRef(false);

  const retry = async () => {
    if (lock.current || !audio || !image) return;
    const validation = audioUploadError(audio);
    if (validation) return setError(validation);
    if (audio.name !== item.audioName || image.name !== item.imageName) {
      return setError(`Choose the original files: ${item.audioName} and ${item.imageName}.`);
    }
    if (!artist.trim()) return setError("Enter the target artist.");
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      for (const [key, value] of Object.entries(defaults)) form.set(key, value);
      form.set("targetArtist", artist.trim());
      form.set("name", item.name);
      form.set("audio", audio);
      form.set("image", await imageToThumbnail(image));
      await uploadForm(`/api/batches/${batchId}/items/${item.id}`, form, setProgress);
      onQueued();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not retry this file.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  if (!expanded) return <button type="button" className="copy-btn" onClick={() => setExpanded(true)}>Retry upload</button>;
  return (
    <div className="form-grid">
      <p className="tb-helper full">Choose this beat’s original audio and artwork again. It will keep its existing publish slot.</p>
      <div className="form-field"><label htmlFor={`retry-audio-${item.id}`}>Audio: {item.audioName}</label><input id={`retry-audio-${item.id}`} type="file" accept={AUDIO_ACCEPT} disabled={busy} onChange={(event) => setAudio(event.target.files?.[0] || null)} /></div>
      <div className="form-field"><label htmlFor={`retry-image-${item.id}`}>Artwork: {item.imageName}</label><input id={`retry-image-${item.id}`} type="file" accept="image/jpeg,image/png" disabled={busy} onChange={(event) => setImage(event.target.files?.[0] || null)} /></div>
      <div className="form-field"><label htmlFor={`retry-artist-${item.id}`}>Target artist</label><input id={`retry-artist-${item.id}`} value={artist} disabled={busy} onChange={(event) => setArtist(event.target.value)} /></div>
      {error && <div className="form-error full" role="alert">{error}</div>}
      <button type="button" className="btn btn-primary btn-sm" disabled={busy || !audio || !image} onClick={retry}>{busy ? progress === 100 ? "Preparing package…" : `Uploading ${progress}%…` : "Retry this beat →"}</button>
    </div>
  );
}
