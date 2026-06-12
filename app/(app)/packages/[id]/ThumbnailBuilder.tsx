"use client";

import { useEffect, useRef, useState } from "react";
import { saveThumbnail } from "@/lib/actions/packages";

const W = 1280;
const H = 720;

const FONT_OPTIONS = [
  { label: "Inter", value: "Inter, sans-serif" },
  { label: "Arial Black", value: "\"Arial Black\", Arial, sans-serif" },
  { label: "Impact", value: "Impact, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: "\"Times New Roman\", serif" },
  { label: "Courier", value: "\"Courier New\", monospace" },
];

export default function ThumbnailBuilder({
  packageId,
  initialThumbnailPath,
  defaultTitle,
  defaultSubtitle,
}: {
  packageId: string;
  initialThumbnailPath: string;
  defaultTitle: string;
  defaultSubtitle: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [hideAllText, setHideAllText] = useState(false);
  const [titleFont, setTitleFont] = useState(FONT_OPTIONS[0].value);
  const [titleColor, setTitleColor] = useState("#ffffff");
  const [titleSize, setTitleSize] = useState(120);
  const [subtitleFont, setSubtitleFont] = useState(FONT_OPTIONS[0].value);
  const [subtitleColor, setSubtitleColor] = useState("#ff4757");
  const [subtitleSize, setSubtitleSize] = useState(44);
  const [saving, setSaving] = useState(false);
  const [savedPath, setSavedPath] = useState(initialThumbnailPath);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);

    if (bgImage) {
      const scale = Math.min(W / bgImage.width, H / bgImage.height);
      const w = bgImage.width * scale;
      const h = bgImage.height * scale;
      ctx.drawImage(bgImage, (W - w) / 2, (H - h) / 2, w, h);
    }

    if (!hideAllText) {
      const vignette = ctx.createRadialGradient(W / 2, H / 2, H / 3, W / 2, H / 2, H);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      // Subtitle (artist type beat)
      ctx.textAlign = "center";
      ctx.fillStyle = subtitleColor;
      ctx.font = `700 ${subtitleSize}px ${subtitleFont}`;
      ctx.fillText(subtitle, W / 2, H / 2 - 80, W - 120);

      // Title
      ctx.fillStyle = titleColor;
      ctx.font = `900 ${titleSize}px ${titleFont}`;
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 28;
      ctx.fillText(`"${title}"`, W / 2, H / 2 + 50, W - 100);
      ctx.shadowBlur = 0;
    }
  }, [title, subtitle, bgImage, hideAllText, titleFont, titleColor, titleSize, subtitleFont, subtitleColor, subtitleSize]);

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setBgImage(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
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
        <div className="form-field">
          <label>Main text font</label>
          <select value={titleFont} onChange={(e) => setTitleFont(e.target.value)}>
            {FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Main text colour</label>
          <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} />
        </div>
        <div className="form-field full">
          <label>Main text size</label>
          <input
            type="range"
            min="48"
            max="180"
            value={titleSize}
            onChange={(e) => setTitleSize(parseInt(e.target.value, 10))}
          />
        </div>
        <div className="form-field full">
          <label>Top line</label>
          <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Top line font</label>
          <select value={subtitleFont} onChange={(e) => setSubtitleFont(e.target.value)}>
            {FONT_OPTIONS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>Top line colour</label>
          <input type="color" value={subtitleColor} onChange={(e) => setSubtitleColor(e.target.value)} />
        </div>
        <div className="form-field full">
          <label>Top line size</label>
          <input
            type="range"
            min="24"
            max="90"
            value={subtitleSize}
            onChange={(e) => setSubtitleSize(parseInt(e.target.value, 10))}
          />
        </div>
        <div className="form-field full">
          <label>Background image</label>
          <input type="file" accept="image/*" onChange={onImageUpload} />
        </div>
        <div className="form-field full">
          <label className="checkbox-pill" style={{ alignSelf: "flex-start" }}>
            <input
              type="checkbox"
              checked={hideAllText}
              onChange={(e) => setHideAllText(e.target.checked)}
            />
            <span>Hide all text</span>
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
