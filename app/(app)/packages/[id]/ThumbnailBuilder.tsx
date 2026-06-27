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
  initialConfig,
  defaultTitle,
  defaultSubtitle,
}: {
  packageId: string;
  initialThumbnailPath: string;
  initialConfig: string;
  defaultTitle: string;
  defaultSubtitle: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgPath, setBgPath] = useState("");
  const [bgFile, setBgFile] = useState<File | null>(null);
  // Text properties are opt-in: the thumbnail starts as just the background
  // image, and the producer adds Main / Secondary text from the dropdown.
  const [mainAdded, setMainAdded] = useState(false);
  const [secondaryAdded, setSecondaryAdded] = useState(false);
  const [titleFont, setTitleFont] = useState(FONT_OPTIONS[0].value);
  const [titleColor, setTitleColor] = useState("#ffffff");
  const [titleSize, setTitleSize] = useState(120);
  const [subtitleFont, setSubtitleFont] = useState(FONT_OPTIONS[0].value);
  const [subtitleColor, setSubtitleColor] = useState("#ff4757");
  const [subtitleSize, setSubtitleSize] = useState(44);
  const [saving, setSaving] = useState(false);
  const [savedPath, setSavedPath] = useState(initialThumbnailPath);

  useEffect(() => {
    if (!initialConfig) return;

    let c: Record<string, unknown>;
    try {
      const parsed = JSON.parse(initialConfig);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
      c = parsed as Record<string, unknown>;
    } catch {
      return;
    }

    if (typeof c.title === "string") setTitle(c.title);
    if (typeof c.subtitle === "string") setSubtitle(c.subtitle);
    if (typeof c.titleFont === "string") setTitleFont(c.titleFont);
    if (typeof c.titleColor === "string") setTitleColor(c.titleColor);
    if (typeof c.titleSize === "number") setTitleSize(c.titleSize);
    if (typeof c.subtitleFont === "string") setSubtitleFont(c.subtitleFont);
    if (typeof c.subtitleColor === "string") setSubtitleColor(c.subtitleColor);
    if (typeof c.subtitleSize === "number") setSubtitleSize(c.subtitleSize);
    setMainAdded(!!c.mainAdded);
    setSecondaryAdded(!!c.secondaryAdded);
    if (typeof c.bgPath === "string" && c.bgPath) {
      setBgPath(c.bgPath);
      const img = new Image();
      img.onload = () => setBgImage(img);
      img.src = c.bgPath;
    }
  }, [initialConfig]);

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

    if (mainAdded || secondaryAdded) {
      const vignette = ctx.createRadialGradient(W / 2, H / 2, H / 3, W / 2, H / 2, H);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.textAlign = "center";

    // Secondary text (e.g. artist type beat)
    if (secondaryAdded) {
      ctx.fillStyle = subtitleColor;
      ctx.font = `700 ${subtitleSize}px ${subtitleFont}`;
      ctx.fillText(subtitle, W / 2, H / 2 - 80, W - 120);
    }

    // Main text
    if (mainAdded) {
      ctx.fillStyle = titleColor;
      ctx.font = `900 ${titleSize}px ${titleFont}`;
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 28;
      ctx.fillText(`"${title}"`, W / 2, H / 2 + 50, W - 100);
      ctx.shadowBlur = 0;
    }
  }, [title, subtitle, bgImage, mainAdded, secondaryAdded, titleFont, titleColor, titleSize, subtitleFont, subtitleColor, subtitleSize]);

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgFile(file);
    setBgPath("");
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
        fd.set(
          "config",
          JSON.stringify({
            title,
            subtitle,
            titleFont,
            titleColor,
            titleSize,
            subtitleFont,
            subtitleColor,
            subtitleSize,
            mainAdded,
            secondaryAdded,
            bgPath,
          })
        );
        if (bgFile) fd.set("bg", bgFile);
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

  const available: { id: string; label: string }[] = [];
  if (!mainAdded) available.push({ id: "main", label: "Main text" });
  if (!secondaryAdded) available.push({ id: "secondary", label: "Secondary text" });

  const onAddProperty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "main") setMainAdded(true);
    if (e.target.value === "secondary") setSecondaryAdded(true);
    // Controlled to "" so the dropdown snaps back to its placeholder.
  };

  return (
    <div className="card">
      <h3>Thumbnail</h3>
      <canvas ref={canvasRef} width={W} height={H} className="thumb-canvas" />
      <div className="thumb-controls">
        <div className="form-field full">
          <label>Background image</label>
          <input type="file" accept="image/*" onChange={onImageUpload} />
        </div>

        {mainAdded && (
          <div className="thumb-prop">
            <div className="thumb-field-head">
              <label>Main text</label>
              <button
                type="button"
                className="thumb-prop-remove"
                onClick={() => setMainAdded(false)}
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={title}
              placeholder="Main text"
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="form-field">
              <label>Font &amp; colour</label>
              <div className="field-inline">
                <select value={titleFont} onChange={(e) => setTitleFont(e.target.value)}>
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
                <input
                  type="color"
                  className="color-dot"
                  value={titleColor}
                  onChange={(e) => setTitleColor(e.target.value)}
                  aria-label="Main text colour"
                  title="Main text colour"
                />
              </div>
            </div>
            <div className="form-field">
              <label>Size</label>
              <input
                type="range"
                min="48"
                max="180"
                value={titleSize}
                onChange={(e) => setTitleSize(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        )}

        {secondaryAdded && (
          <div className="thumb-prop">
            <div className="thumb-field-head">
              <label>Secondary text</label>
              <button
                type="button"
                className="thumb-prop-remove"
                onClick={() => setSecondaryAdded(false)}
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={subtitle}
              placeholder="Secondary text"
              onChange={(e) => setSubtitle(e.target.value)}
            />
            <div className="form-field">
              <label>Font &amp; colour</label>
              <div className="field-inline">
                <select value={subtitleFont} onChange={(e) => setSubtitleFont(e.target.value)}>
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
                <input
                  type="color"
                  className="color-dot"
                  value={subtitleColor}
                  onChange={(e) => setSubtitleColor(e.target.value)}
                  aria-label="Secondary text colour"
                  title="Secondary text colour"
                />
              </div>
            </div>
            <div className="form-field">
              <label>Size</label>
              <input
                type="range"
                min="24"
                max="90"
                value={subtitleSize}
                onChange={(e) => setSubtitleSize(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        )}

        {available.length > 0 && (
          <div className="form-field full">
            <label>Add properties</label>
            <select value="" onChange={onAddProperty}>
              <option value="">+ Add a property…</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-field full thumb-actions">
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
