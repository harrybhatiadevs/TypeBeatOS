"use client";

import { useEffect, useId, useRef, memo } from "react";
import "./DotField.css";

const TWO_PI = Math.PI * 2;

type DotFieldProps = {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  className?: string;
};

type Dot = { ax: number; ay: number; sx: number; sy: number; vx: number; vy: number; x: number; y: number };

type Snapshot = {
  dotRadius: number;
  dotSpacing: number;
  cursorRadius: number;
  cursorForce: number;
  bulgeOnly: boolean;
  bulgeStrength: number;
  sparkle: boolean;
  waveAmplitude: number;
  gradientFrom: string;
  gradientTo: string;
};

/**
 * Faithful TypeScript port of the React Bits <DotField /> component.
 * Same engine: mouse-speed "engagement", per-dot spring easing, and an SVG
 * radial glow that follows the cursor.
 *
 * Adaptations for this app (a fixed, full-page background):
 *  - mouse position is mapped via the canvas's own bounding rect (viewport
 *    coords) so it stays correct as the page scrolls;
 *  - prefers-reduced-motion / coarse-pointer / narrow screens render a single
 *    static frame (no rAF, no listeners), and small screens drop dot density;
 *  - the wrapping layer is pointer-events: none so it never blocks the form.
 */
const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 67,
  glowRadius = 160,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(168, 85, 247, 0.35)",
  gradientTo = "rgba(180, 151, 207, 0.25)",
  glowColor = "#120F17",
  className,
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const glowOpacity = useRef(0);
  const engagement = useRef(0);
  const propsRef = useRef<Snapshot>({
    dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo,
  });
  propsRef.current = { dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo };
  const rebuildRef = useRef<(() => void) | null>(null);
  // SSR-stable id (Math.random() here would cause a hydration mismatch in Next).
  const glowId = `dot-field-glow-${useId().replace(/[:]/g, "")}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    const glowEl = glowRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const cv = canvas;
    const c2d = ctx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const interactive = !reduced && !coarse && window.innerWidth >= 768;

    let resizeTimer: ReturnType<typeof setTimeout>;
    let speedInterval: ReturnType<typeof setInterval> | undefined;
    let frameCount = 0;

    function resize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 100);
    }

    function doResize() {
      const parent = cv.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      const w = rect.width;
      const h = rect.height;

      cv.width = w * dpr;
      cv.height = h * dpr;
      cv.style.width = `${w}px`;
      cv.style.height = `${h}px`;
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);

      sizeRef.current = { w, h };
      buildDots(w, h);
      if (!interactive) drawStatic();
    }

    function buildDots(w: number, h: number) {
      const p = propsRef.current;
      // lighter grid on small screens
      const densityMul = window.innerWidth < 768 ? 1.6 : 1;
      const step = (p.dotRadius + p.dotSpacing) * densityMul;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const dots: Dot[] = new Array(rows * cols);
      let idx = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
        }
      }
      dotsRef.current = dots;
    }

    function gradient() {
      const p = propsRef.current;
      const g = c2d.createLinearGradient(0, 0, sizeRef.current.w, sizeRef.current.h);
      g.addColorStop(0, p.gradientFrom);
      g.addColorStop(1, p.gradientTo);
      return g;
    }

    function drawStatic() {
      const dots = dotsRef.current;
      const { w, h } = sizeRef.current;
      const rad = propsRef.current.dotRadius / 2;
      c2d.clearRect(0, 0, w, h);
      c2d.fillStyle = gradient();
      c2d.beginPath();
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        c2d.moveTo(d.ax + rad, d.ay);
        c2d.arc(d.ax, d.ay, rad, 0, TWO_PI);
      }
      c2d.fill();
    }

    function onMouseMove(e: MouseEvent) {
      // viewport-relative so it stays correct for a fixed, scrolling page
      const rect = cv.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }

    function updateMouseSpeed() {
      const m = mouseRef.current;
      const dx = m.prevX - m.x;
      const dy = m.prevY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      m.speed += (dist - m.speed) * 0.5;
      if (m.speed < 0.001) m.speed = 0;
      m.prevX = m.x;
      m.prevY = m.y;
    }

    function tick() {
      frameCount++;
      const dots = dotsRef.current;
      const m = mouseRef.current;
      const { w, h } = sizeRef.current;
      const p = propsRef.current;
      const len = dots.length;
      const t = frameCount * 0.02;

      const targetEngagement = Math.min(m.speed / 5, 1);
      engagement.current += (targetEngagement - engagement.current) * 0.06;
      if (engagement.current < 0.001) engagement.current = 0;
      const eng = engagement.current;

      glowOpacity.current += (eng - glowOpacity.current) * 0.08;
      if (glowEl) {
        glowEl.setAttribute("cx", String(m.x));
        glowEl.setAttribute("cy", String(m.y));
        glowEl.style.opacity = String(glowOpacity.current);
      }

      c2d.clearRect(0, 0, w, h);
      c2d.fillStyle = gradient();

      const cr = p.cursorRadius;
      const crSq = cr * cr;
      const rad = p.dotRadius / 2;
      const isBulge = p.bulgeOnly;

      c2d.beginPath();
      for (let i = 0; i < len; i++) {
        const d = dots[i];
        const dx = m.x - d.ax;
        const dy = m.y - d.ay;
        const distSq = dx * dx + dy * dy;

        if (distSq < crSq && eng > 0.01) {
          const dist = Math.sqrt(distSq);
          if (isBulge) {
            const tt = 1 - dist / cr;
            const push = tt * tt * p.bulgeStrength * eng;
            const angle = Math.atan2(dy, dx);
            d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
            d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
          } else {
            const angle = Math.atan2(dy, dx);
            const move = (500 / dist) * (m.speed * p.cursorForce);
            d.vx += Math.cos(angle) * -move;
            d.vy += Math.sin(angle) * -move;
          }
        } else if (isBulge) {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }

        if (!isBulge) {
          d.vx *= 0.9;
          d.vy *= 0.9;
          d.x = d.ax + d.vx;
          d.y = d.ay + d.vy;
          d.sx += (d.x - d.sx) * 0.1;
          d.sy += (d.y - d.sy) * 0.1;
        }

        let drawX = d.sx;
        let drawY = d.sy;
        if (p.waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude;
          drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5;
        }

        if (p.sparkle) {
          const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
          if (hash % 100 < 3) {
            c2d.moveTo(drawX + rad * 1.8, drawY);
            c2d.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
          } else {
            c2d.moveTo(drawX + rad, drawY);
            c2d.arc(drawX, drawY, rad, 0, TWO_PI);
          }
        } else {
          c2d.moveTo(drawX + rad, drawY);
          c2d.arc(drawX, drawY, rad, 0, TWO_PI);
        }
      }
      c2d.fill();

      rafRef.current = requestAnimationFrame(tick);
    }

    doResize();
    window.addEventListener("resize", resize);
    if (interactive) {
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      speedInterval = setInterval(updateMouseSpeed, 20);
      rafRef.current = requestAnimationFrame(tick);
    }

    rebuildRef.current = () => {
      const { w, h } = sizeRef.current;
      if (w > 0 && h > 0) {
        buildDots(w, h);
        if (!interactive) drawStatic();
      }
    };

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (speedInterval) clearInterval(speedInterval);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rebuildRef.current?.();
  }, [dotRadius, dotSpacing]);

  return (
    <div className={`dot-field-container${className ? ` ${className}` : ""}`} aria-hidden="true">
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle
          ref={glowRef}
          cx="-9999"
          cy="-9999"
          r={glowRadius}
          fill={`url(#${glowId})`}
          style={{ opacity: 0, willChange: "opacity" }}
        />
      </svg>
    </div>
  );
});

DotField.displayName = "DotField";

export default DotField;
