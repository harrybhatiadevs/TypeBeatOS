"use client";

import { useEffect, useRef } from "react";

type DotFieldProps = {
  className?: string;
  dotRadius?: number;
  dotSpacing?: number;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
};

/**
 * Subtle interactive dot-grid background (React Bits-style).
 * Canvas only, behind content, pointer-events: none — never blocks the form.
 * Soft cursor "bulge" pushes nearby dots outward; a restrained red->purple
 * gradient colours the field. No sparkle, no wave (disabled by spec).
 *
 * Performance / accessibility:
 *  - prefers-reduced-motion -> static field, no listeners, no rAF.
 *  - coarse pointer / mobile  -> static field + lower density.
 *  - the rAF loop idles itself once the cursor settles, so it isn't
 *    repainting every frame when nothing is moving.
 */
export default function DotField({
  className,
  dotRadius = 1.2,
  dotSpacing = 16,
  bulgeStrength = 45,
  glowRadius = 140,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(237,7,44,0.28)",
  gradientTo = "rgba(154,62,240,0.16)",
  glowColor = "rgba(237,7,44,0.10)",
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Non-null aliases so the nested setup()/draw() closures keep the narrowing.
    const cv = canvas;
    const c2d = ctx;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    let w = 0;
    let h = 0;
    let spacing = dotSpacing;
    let interactive = false;
    let raf = 0;
    let active = false;
    let idle = 0;
    let grad: CanvasGradient;

    const target = { x: -9999, y: -9999 };
    const cur = { x: -9999, y: -9999 };

    const isMobile = () => window.innerWidth < 768;

    function setup() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      // lower density on small screens; never interactive on touch / reduced-motion
      spacing = isMobile() ? Math.round(dotSpacing * 1.7) : dotSpacing;
      interactive = !reduced && !coarse && !isMobile();

      cv.width = Math.floor(w * dpr);
      cv.height = Math.floor(h * dpr);
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      grad = c2d.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, gradientFrom);
      grad.addColorStop(1, gradientTo);

      draw();
    }

    function draw() {
      const c = c2d;
      c.clearRect(0, 0, w, h);

      // soft cursor glow, behind the dots
      if (interactive && active && cur.x > -9000) {
        const g = c.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, glowRadius);
        g.addColorStop(0, glowColor);
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.fillRect(cur.x - glowRadius, cur.y - glowRadius, glowRadius * 2, glowRadius * 2);
      }

      c.fillStyle = grad;
      c.beginPath();
      const r = glowRadius;
      const bulging = interactive && active && cur.x > -9000;
      for (let y = spacing / 2; y < h; y += spacing) {
        for (let x = spacing / 2; x < w; x += spacing) {
          let px = x;
          let py = y;
          if (bulging) {
            const dx = x - cur.x;
            const dy = y - cur.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0.001 && dist < r) {
              const f = 1 - dist / r;
              const push = (bulgeStrength * f * f) / dist;
              px = x + dx * push;
              py = y + dy * push;
            }
          }
          c.moveTo(px + dotRadius, py);
          c.arc(px, py, dotRadius, 0, Math.PI * 2);
        }
      }
      c.fill();
    }

    function loop() {
      cur.x += (target.x - cur.x) * 0.18;
      cur.y += (target.y - cur.y) * 0.18;
      draw();
      const moved = Math.hypot(target.x - cur.x, target.y - cur.y);
      idle = moved < 0.4 ? idle + 1 : 0;
      if (idle > 24) {
        // settled — leave the static frame up and stop painting
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
    }

    function ensureLoop() {
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function onMove(e: MouseEvent) {
      target.x = e.clientX;
      target.y = e.clientY;
      if (cur.x < -9000) {
        cur.x = target.x;
        cur.y = target.y;
      }
      active = true;
      idle = 0;
      ensureLoop();
    }

    function onLeave() {
      // ease the bulge away off-screen, then settle
      target.x = -9999;
      target.y = -9999;
      idle = 0;
      ensureLoop();
    }

    setup();
    window.addEventListener("resize", setup);
    if (interactive) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseout", onLeave);
    }

    return () => {
      window.removeEventListener("resize", setup);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [
    dotRadius,
    dotSpacing,
    bulgeStrength,
    glowRadius,
    sparkle,
    waveAmplitude,
    gradientFrom,
    gradientTo,
    glowColor,
  ]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
