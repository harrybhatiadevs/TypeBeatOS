"use client";

import { useEffect, useRef, useState } from "react";
import { saveThumbnail } from "@/lib/actions/packages";

const W = 1280;
const H = 720;

const GRADIENTS: [string, string][] = [
  ["#1e1b4b", "#7c3aed"],
  ["#0f172a", "#0e7490"],
  ["#27272a", "#b91c1c"],
  ["#0a0a0f", "#3f3f46"],
  ["#312e81", "#db2777"],
];

export default function ThumbnailBuilder({
  packageId,
  initialThumbnailPath,
  defaultTitle,
  defaultSubtitle,
  producerName,
}: {
  packageId: string;
  initialThumbnailPath: string;
  defaultTitle: string;
  defaultSubtitle: string;
  producerName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [gradient, setGradient] = useState(0);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [advisory, setAdvisory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedPath, setSavedPath] = useState(initialThumbnailPath);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    if (bgImage) {
      const scale = Math.max(W / bgImage.width, H / bgImage.height);
      const w = bgImage.width * scale;
      const h = bgImage.height * scale;
      ctx.drawImage(bgImage, (W - w) / 2, (H - h) / 2, w, h);
      // Darken for text contrast
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, W, H);
    } else {
      const [c1, c2] = GRADIENTS[gradient];
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // Subtle vignette
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H / 3, W / 2, H / 2, H);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Subtitle (artist type beat)
    ctx.textAlign = "center";
    ctx.fillStyle = "#c4b5fd";
    ctx.font = "700 44px Inter, sans-serif";
    ctx.fillText(subtitle, W / 2, H / 2 - 80, W - 120);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 120px Inter, sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 24;
    ctx.fillText(`"${title}"`, W / 2, H / 2 + 50, W - 100);
    ctx.shadowBlur = 0;

    // Producer name
    if (producerName) {
      ctx.font = "600 36px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(producerName, W / 2, H - 60, W - 120);
    }

    // Parental advisory sticker
    if (advisory) {
      const bw = 190;
      const bh = 96;
      const bx = W - bw - 40;
      const by = H - bh - 40;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = "#000000";
      ctx.fillRect(bx + 6, by + 6, bw - 12, bh - 12);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "900 22px Inter, sans-serif";
      ctx.fillText("PARENTAL", bx + bw / 2, by + 34);
      ctx.fillText("ADVISORY", bx + bw / 2, by + 58);
      ctx.font = "600 14px Inter, sans-serif";
      ctx.fillText("EXPLICIT CONTENT", bx + bw / 2, by + 80);
    }
  }, [title, subtitle, gradient, bgImage, advisory, producerName]);

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = URL.createObjectURL(file);
  };

  const onSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    canvas.toBlob(async (blob) => {
      try {
        if (!blob) return;
        const fd = new FormData();
        fd.set("packageId", packageId);
        fd.set("file", new File([blob], "thumbnail.png", { type: "image/png" }));
        const path = await saveThumbnail(fd);
        setSavedPath(path);
      } finally {
        setSaving(false);
      }
    }, "image/png");
  };

  const onDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "thumbnail.png";
    a.click();
  };

  return (
    <div className="card">
      <h3>Thumbnail</h3>
      <canvas ref={canvasRef} width={W} height={H} className="thumb-canvas" />
      <div className="thumb-controls">
        <div className="form-field full">
          <label>Main text</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-field full">
          <label>Top line</label>
          <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Background</label>
          <div className="swatch-row">
            {GRADIENTS.map(([c1, c2], i) => (
              <button
                key={i}
                type="button"
                className={`swatch${i === gradient && !bgImage ? " selected" : ""}`}
                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                onClick={() => {
                  setBgImage(null);
                  setGradient(i);
                }}
                aria-label={`Gradient ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="form-field">
          <label>Or upload image</label>
          <input type="file" accept="image/*" onChange={onImageUpload} />
        </div>
        <div className="form-field full">
          <label className="checkbox-pill" style={{ alignSelf: "flex-start" }}>
            <input
              type="checkbox"
              checked={advisory}
              onChange={(e) => setAdvisory(e.target.checked)}
            />
            <span>Parental advisory sticker</span>
          </label>
        </div>
        <div className="form-field full" style={{ flexDirection: "row", gap: 10 }}>
          <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={onSave}>
            {saving ? "Saving…" : savedPath ? "✓ Update thumbnail" : "Save thumbnail"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDownload}>
            ⬇ Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
