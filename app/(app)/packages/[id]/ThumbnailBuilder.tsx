"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Download, ImagePlus, Save, SlidersHorizontal } from "lucide-react";
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

type ThumbPresetId = "clean" | "accent" | "label" | "noText";
type ThumbLayout = "center" | "lowerLeft";

type ThumbPreset = {
  id: ThumbPresetId;
  label: string;
  detail: string;
  titleColor: string;
  subtitleColor: string;
  titleSize: number;
  subtitleSize: number;
  titleFont: string;
  subtitleFont: string;
  hideAllText: boolean;
  layout: ThumbLayout;
};

const PRESETS: ThumbPreset[] = [
  {
    id: "clean",
    label: "Clean dark",
    detail: "Centered title, soft contrast.",
    titleColor: "#ffffff",
    subtitleColor: "#a9b6d8",
    titleSize: 118,
    subtitleSize: 42,
    titleFont: FONT_OPTIONS[0].value,
    subtitleFont: FONT_OPTIONS[0].value,
    hideAllText: false,
    layout: "center",
  },
  {
    id: "accent",
    label: "Red accent",
    detail: "High contrast brand accent.",
    titleColor: "#ffffff",
    subtitleColor: "#ff4757",
    titleSize: 126,
    subtitleSize: 42,
    titleFont: FONT_OPTIONS[1].value,
    subtitleFont: FONT_OPTIONS[0].value,
    hideAllText: false,
    layout: "center",
  },
  {
    id: "label",
    label: "Minimal label",
    detail: "Editorial lower-left cover.",
    titleColor: "#ffffff",
    subtitleColor: "#ff6b76",
    titleSize: 92,
    subtitleSize: 34,
    titleFont: FONT_OPTIONS[0].value,
    subtitleFont: FONT_OPTIONS[0].value,
    hideAllText: false,
    layout: "lowerLeft",
  },
  {
    id: "noText",
    label: "No text",
    detail: "Visual-only cover.",
    titleColor: "#ffffff",
    subtitleColor: "#ff4757",
    titleSize: 110,
    subtitleSize: 38,
    titleFont: FONT_OPTIONS[0].value,
    subtitleFont: FONT_OPTIONS[0].value,
    hideAllText: true,
    layout: "center",
  },
];

function drawGeneratedBackground(ctx: CanvasRenderingContext2D, presetId: ThumbPresetId) {
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  if (presetId === "clean") {
    gradient.addColorStop(0, "#07090f");
    gradient.addColorStop(0.55, "#11131b");
    gradient.addColorStop(1, "#050505");
  } else if (presetId === "label") {
    gradient.addColorStop(0, "#101010");
    gradient.addColorStop(0.5, "#1a1517");
    gradient.addColorStop(1, "#050505");
  } else {
    gradient.addColorStop(0, "#16040a");
    gradient.addColorStop(0.55, "#09090d");
    gradient.addColorStop(1, "#020202");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  const halo = ctx.createRadialGradient(W * 0.78, H * 0.18, 20, W * 0.78, H * 0.18, H * 0.72);
  halo.addColorStop(0, presetId === "clean" ? "rgba(140,183,255,0.26)" : "rgba(237,7,44,0.34)");
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 1;
  for (let x = -W; x < W * 1.5; x += 84) {
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.lineTo(x + W * 0.55, 0);
    ctx.stroke();
  }
}

function drawCoverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  const scale = Math.max(W / image.width, H / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (W - w) / 2, (H - h) / 2, w, h);
}

function fittedFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxSize: number,
  minSize: number,
  weight: number,
  font: string,
  maxWidth: number
) {
  let size = maxSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${font}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

function wrapWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function drawTextBlock({
  ctx,
  title,
  subtitle,
  titleFont,
  subtitleFont,
  titleColor,
  subtitleColor,
  titleSize,
  subtitleSize,
  layout,
}: {
  ctx: CanvasRenderingContext2D;
  title: string;
  subtitle: string;
  titleFont: string;
  subtitleFont: string;
  titleColor: string;
  subtitleColor: string;
  titleSize: number;
  subtitleSize: number;
  layout: ThumbLayout;
}) {
  const safeTitle = title.trim() || "Untitled";
  const safeSubtitle = subtitle.trim();
  const maxWidth = layout === "center" ? W - 160 : W * 0.62;
  const x = layout === "center" ? W / 2 : 86;
  const align: CanvasTextAlign = layout === "center" ? "center" : "left";
  const baseY = layout === "center" ? H / 2 - 46 : H - 168;

  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0,0,0,0.68)";
  ctx.shadowBlur = layout === "center" ? 26 : 18;

  if (safeSubtitle) {
    const fittedSubtitle = fittedFontSize(ctx, safeSubtitle, subtitleSize, 24, 750, subtitleFont, maxWidth);
    ctx.font = `750 ${fittedSubtitle}px ${subtitleFont}`;
    ctx.fillStyle = subtitleColor;
    ctx.fillText(safeSubtitle, x, baseY, maxWidth);
  }

  const fittedTitle = fittedFontSize(ctx, safeTitle, titleSize, 54, 900, titleFont, maxWidth);
  ctx.font = `900 ${fittedTitle}px ${titleFont}`;
  const titleLines = wrapWords(ctx, safeTitle, maxWidth, 2);
  const lineHeight = fittedTitle * 0.98;
  const startY = safeSubtitle ? baseY + lineHeight * 0.95 : baseY + lineHeight * 0.25;

  ctx.fillStyle = titleColor;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, x, startY + index * lineHeight, maxWidth);
  });
  ctx.shadowBlur = 0;
}

function presetById(id: ThumbPresetId) {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[1];
}

export default function ThumbnailBuilder({
  packageId,
  initialThumbnailPath,
  defaultTitle,
  defaultSubtitle,
  onSaved,
}: {
  packageId: string;
  initialThumbnailPath: string;
  defaultTitle: string;
  defaultSubtitle: string;
  onSaved?: (path: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialPreset = PRESETS[1];
  const [activePreset, setActivePreset] = useState<ThumbPresetId>(initialPreset.id);
  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [hideAllText, setHideAllText] = useState(initialPreset.hideAllText);
  const [titleFont, setTitleFont] = useState(initialPreset.titleFont);
  const [titleColor, setTitleColor] = useState(initialPreset.titleColor);
  const [titleSize, setTitleSize] = useState(initialPreset.titleSize);
  const [subtitleFont, setSubtitleFont] = useState(initialPreset.subtitleFont);
  const [subtitleColor, setSubtitleColor] = useState(initialPreset.subtitleColor);
  const [subtitleSize, setSubtitleSize] = useState(initialPreset.subtitleSize);
  const [layout, setLayout] = useState<ThumbLayout>(initialPreset.layout);
  const [saving, setSaving] = useState(false);
  const [savedPath, setSavedPath] = useState(initialThumbnailPath);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (bgImage) {
      drawCoverImage(ctx, bgImage);
    } else {
      drawGeneratedBackground(ctx, activePreset);
    }

    const surface = ctx.createLinearGradient(0, 0, 0, H);
    surface.addColorStop(0, "rgba(0,0,0,0.08)");
    surface.addColorStop(0.55, hideAllText ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.28)");
    surface.addColorStop(1, "rgba(0,0,0,0.58)");
    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, W, H);

    if (!hideAllText) {
      drawTextBlock({
        ctx,
        title,
        subtitle,
        titleFont,
        subtitleFont,
        titleColor,
        subtitleColor,
        titleSize,
        subtitleSize,
        layout,
      });
    }
  }, [
    activePreset,
    title,
    subtitle,
    bgImage,
    hideAllText,
    titleFont,
    titleColor,
    titleSize,
    subtitleFont,
    subtitleColor,
    subtitleSize,
    layout,
  ]);

  const applyPreset = (preset: ThumbPreset) => {
    setActivePreset(preset.id);
    setTitleFont(preset.titleFont);
    setTitleColor(preset.titleColor);
    setTitleSize(preset.titleSize);
    setSubtitleFont(preset.subtitleFont);
    setSubtitleColor(preset.subtitleColor);
    setSubtitleSize(preset.subtitleSize);
    setHideAllText(preset.hideAllText);
    setLayout(preset.layout);
  };

  const onImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
        onSaved?.(path);
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

  const preset = presetById(activePreset);

  return (
    <div className="thumb-builder">
      <section className="card thumb-stage-card">
        <div className="field-head thumb-stage-head">
          <div>
            <h3>Thumbnail</h3>
            <p className="tb-helper">{preset.label}</p>
          </div>
          <span className={savedPath ? "readiness-status readiness-status-ready" : "readiness-status readiness-status-warning"}>
            {savedPath ? "Saved" : "Draft"}
          </span>
        </div>
        <div className="thumb-stage">
          <canvas ref={canvasRef} width={W} height={H} className="thumb-canvas" />
        </div>
      </section>

      <section className="card thumb-preset-card">
        <div className="field-head">
          <h3>Choose a look</h3>
          <button type="button" className="copy-btn" onClick={() => setBgImage(null)}>
            Clear image
          </button>
        </div>
        <div className="thumb-preset-grid" aria-label="Thumbnail presets">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`thumb-preset-button${item.id === activePreset ? " active" : ""}`}
              onClick={() => applyPreset(item)}
            >
              <span className={`thumb-preset-swatch thumb-preset-swatch-${item.id}`} aria-hidden="true" />
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </button>
          ))}
        </div>

        <div className="thumb-quick-grid">
          <div className="form-field">
            <label>Main text</label>
            <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="form-field">
            <label>Top line</label>
            <input type="text" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
          </div>
        </div>
      </section>

      <details className="card advanced-panel thumb-advanced">
        <summary>
          <span>
            <strong>Advanced controls</strong>
            <small>Fine tune typography, color, and layout.</small>
          </span>
          <SlidersHorizontal size={18} strokeWidth={2.2} aria-hidden="true" />
        </summary>
        <div className="thumb-controls">
          <div className="form-field">
            <label>Main text font</label>
            <select value={titleFont} onChange={(event) => setTitleFont(event.target.value)}>
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Main text color</label>
            <input type="color" value={titleColor} onChange={(event) => setTitleColor(event.target.value)} />
          </div>
          <div className="form-field full">
            <label>Main text size</label>
            <input
              type="range"
              min="48"
              max="180"
              value={titleSize}
              onChange={(event) => setTitleSize(parseInt(event.target.value, 10))}
            />
          </div>
          <div className="form-field">
            <label>Top line font</label>
            <select value={subtitleFont} onChange={(event) => setSubtitleFont(event.target.value)}>
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Top line color</label>
            <input type="color" value={subtitleColor} onChange={(event) => setSubtitleColor(event.target.value)} />
          </div>
          <div className="form-field full">
            <label>Top line size</label>
            <input
              type="range"
              min="24"
              max="90"
              value={subtitleSize}
              onChange={(event) => setSubtitleSize(parseInt(event.target.value, 10))}
            />
          </div>
          <div className="form-field">
            <label>Layout</label>
            <select value={layout} onChange={(event) => setLayout(event.target.value as ThumbLayout)}>
              <option value="center">Centered</option>
              <option value="lowerLeft">Lower left</option>
            </select>
          </div>
          <div className="form-field thumb-toggle-field">
            <label className="checkbox-pill self-start">
              <input
                type="checkbox"
                checked={hideAllText}
                onChange={(event) => setHideAllText(event.target.checked)}
              />
              <span>Hide text</span>
            </label>
          </div>
        </div>
      </details>

      <div className="thumb-action-bar">
        <span>{savedPath ? "Thumbnail saved." : "Save to update readiness."}</span>
        <div className="cluster">
          <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={onSave}>
            <Save size={17} strokeWidth={2.2} aria-hidden="true" />
            {saving ? "Saving..." : savedPath ? "Update thumbnail" : "Save thumbnail"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDownload}>
            <Download size={17} strokeWidth={2.2} aria-hidden="true" />
            Download PNG
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus size={17} strokeWidth={2.2} aria-hidden="true" />
            Add image
          </button>
          <input ref={fileInputRef} className="thumb-hidden-file" type="file" accept="image/*" onChange={onImageUpload} />
        </div>
      </div>
    </div>
  );
}
