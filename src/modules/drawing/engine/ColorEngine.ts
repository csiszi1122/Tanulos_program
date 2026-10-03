import type { ColorStroke, ColorTemplate } from "../data/colorTemplates";
import {
  dist,
  pointInPoly,
  pointOnPath,
  resamplePath,
  type Pt,
} from "./pathMath";
import {
  lifeAccentPoint,
  lifeStyleFor,
  lifeTransform,
  type LifeStyle,
} from "./lifeAnim";

type FillAnim = {
  regionId: string;
  color: string;
  progress: number;
  origin: Pt;
};

type StrokeState = {
  samples: Array<Pt & { painted: boolean }>;
  color: string | null;
  animT: number;
  animColor: string | null;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  kind: "spark" | "drip" | "ripple" | "bloom" | "star";
};

export type ColorEngineOptions = {
  strokeWidth?: number;
  hitRadius?: number;
  onProgress?: (ratio: number) => void;
  onComplete?: () => void;
  onLifeDone?: () => void;
  onRegionFill?: (label: string) => void;
};

export class ColorEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private cssW = 0;
  private cssH = 0;
  private pad = 36;
  private template: ColorTemplate | null = null;
  private fills = new Map<string, string>();
  private fillAnims: FillAnim[] = [];
  private strokes = new Map<string, StrokeState>();
  private color = "#2563eb";
  private particles: Particle[] = [];
  private raf = 0;
  private t0 = performance.now();
  private drawing = false;
  private lastNorm: Pt | null = null;
  private phase: "paint" | "life" | "done" = "paint";
  private lifeT = 0;
  private lifeStyle: LifeStyle = "wiggle";
  private opts: Required<ColorEngineOptions>;
  private unsubscribers: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement, opts: ColorEngineOptions = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.opts = {
      strokeWidth: opts.strokeWidth ?? 16,
      hitRadius: opts.hitRadius ?? 0.05,
      onProgress: opts.onProgress ?? (() => undefined),
      onComplete: opts.onComplete ?? (() => undefined),
      onLifeDone: opts.onLifeDone ?? (() => undefined),
      onRegionFill: opts.onRegionFill ?? (() => undefined),
    };
    this.bindPointer();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  setColor(hex: string) {
    this.color = hex;
  }

  setTemplate(template: ColorTemplate) {
    this.template = template;
    this.fills.clear();
    this.fillAnims = [];
    this.strokes.clear();
    this.particles = [];
    this.phase = "paint";
    this.lifeT = 0;
    this.lifeStyle = lifeStyleFor(template.id, template.category, template.life);
    for (const s of template.strokes) {
      this.strokes.set(s.id, {
        samples: resamplePath(s.points, 0.014).map((p) => ({ ...p, painted: false })),
        color: null,
        animT: -1,
        animColor: null,
      });
    }
    this.emitProgress();
  }

  reset() {
    if (!this.template) return;
    this.setTemplate(this.template);
  }

  getPhase() {
    return this.phase;
  }

  resize(cssW: number, cssH: number) {
    this.cssW = Math.max(1, cssW);
    this.cssH = Math.max(1, cssH);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.cssW * this.dpr);
    this.canvas.height = Math.floor(this.cssH * this.dpr);
    this.canvas.style.width = `${this.cssW}px`;
    this.canvas.style.height = `${this.cssH}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    for (const off of this.unsubscribers) off();
  }

  getProgress(): number {
    if (!this.template) return 0;
    const regionTotal = this.template.regions.length;
    const regionDone = this.fills.size;
    let strokeTotal = 0;
    let strokeDone = 0;
    for (const st of this.strokes.values()) {
      strokeTotal += st.samples.length || 1;
      strokeDone += st.samples.filter((s) => s.painted).length;
    }
    if (!regionTotal && !strokeTotal) return 1;
    const regionPart = regionTotal ? regionDone / regionTotal : 1;
    const strokePart = strokeTotal ? strokeDone / strokeTotal : 1;
    if (!strokeTotal) return regionPart;
    if (!regionTotal) return strokePart;
    return regionPart * 0.7 + strokePart * 0.3;
  }

  private emitProgress() {
    const p = this.getProgress();
    this.opts.onProgress(p);
    if (this.phase === "paint" && p >= 0.98) {
      this.startLife();
    }
  }

  private startLife() {
    this.phase = "life";
    this.lifeT = 0;
    this.opts.onComplete();
    const c = { x: this.cssW / 2, y: this.cssH / 2 };
    const colors = [...this.fills.values()];
    for (let i = 0; i < 100; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * (2 + Math.random() * 6),
        vy: Math.sin(a) * (2 + Math.random() * 6) - 2,
        life: 1,
        max: 1.1 + Math.random(),
        color: colors[i % Math.max(1, colors.length)] ?? this.color,
        size: 3 + Math.random() * 7,
        kind: i % 4 === 0 ? "star" : "bloom",
      });
    }
  }

  private toCanvas(p: Pt): Pt {
    const size = Math.min(this.cssW, this.cssH) - this.pad * 2;
    const ox = (this.cssW - size) / 2;
    const oy = (this.cssH - size) / 2;
    return { x: ox + p.x * size, y: oy + p.y * size };
  }

  private mapPt(p: Pt): Pt {
    if (this.phase === "life" || this.phase === "done") {
      return this.toCanvas(
        lifeTransform(p, this.lifeStyle, this.lifeT, this.phase === "done" ? 0.35 : 1),
      );
    }
    return this.toCanvas(p);
  }

  private toNorm(clientX: number, clientY: number): Pt | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const size = Math.min(this.cssW, this.cssH) - this.pad * 2;
    if (size <= 0) return null;
    const ox = (this.cssW - size) / 2;
    const oy = (this.cssH - size) / 2;
    return { x: (x - ox) / size, y: (y - oy) / size };
  }

  private findRegion(p: Pt): string | null {
    if (!this.template) return null;
    for (let i = this.template.regions.length - 1; i >= 0; i--) {
      const r = this.template.regions[i];
      if (pointInPoly(p, r.points)) return r.id;
    }
    return null;
  }

  private fillRegion(regionId: string, origin: Pt) {
    this.fills.set(regionId, this.color);
    this.fillAnims = this.fillAnims.filter((a) => a.regionId !== regionId);
    this.fillAnims.push({ regionId, color: this.color, progress: 0, origin });
    const label =
      this.template?.regions.find((r) => r.id === regionId)?.label ?? regionId;
    this.opts.onRegionFill(label);
    this.burst(origin, this.color);
    this.emitProgress();
  }

  private burst(p: Pt, color: string) {
    const c = this.toCanvas(p);
    for (let i = 0; i < 48; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.8 + Math.random() * 3.5;
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        max: 0.5 + Math.random() * 0.6,
        color: i % 4 === 0 ? "#fff" : color,
        size: 3 + Math.random() * 7,
        kind: i % 3 === 0 ? "drip" : "spark",
      });
    }
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: 0,
        vy: 0,
        life: 1,
        max: 0.45 + i * 0.12,
        color,
        size: 14 + i * 22,
        kind: "ripple",
      });
    }
  }

  private paintNear(p: Pt) {
    let changed = false;
    for (const [, st] of this.strokes) {
      for (const s of st.samples) {
        if (s.painted) continue;
        if (dist(s, p) <= this.opts.hitRadius) {
          s.painted = true;
          st.color = this.color;
          changed = true;
        }
      }
      const painted = st.samples.filter((s) => s.painted).length;
      if (
        st.animT < 0 &&
        st.samples.length &&
        painted / st.samples.length >= 0.32 &&
        painted < st.samples.length
      ) {
        st.animT = painted / st.samples.length;
        st.animColor = this.color;
      }
    }
    if (changed) this.emitProgress();
  }

  private bindPointer() {
    const el = this.canvas;
    el.style.touchAction = "none";
    let downAt: Pt | null = null;
    let moved = false;

    const down = (e: PointerEvent) => {
      if (this.phase !== "paint") return;
      el.setPointerCapture(e.pointerId);
      this.drawing = true;
      moved = false;
      const n = this.toNorm(e.clientX, e.clientY);
      downAt = n;
      this.lastNorm = n;
      if (n) this.paintNear(n);
    };

    const move = (e: PointerEvent) => {
      if (!this.drawing || this.phase !== "paint") return;
      const n = this.toNorm(e.clientX, e.clientY);
      if (!n || !this.lastNorm) return;
      if (dist(n, this.lastNorm) > 0.008) moved = true;
      this.lastNorm = n;
      this.paintNear(n);
    };

    const up = (e: PointerEvent) => {
      if (!this.drawing) return;
      this.drawing = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const n = this.toNorm(e.clientX, e.clientY) ?? downAt;
      if (n && !moved) {
        const id = this.findRegion(n);
        if (id) this.fillRegion(id, n);
      }
      downAt = null;
      this.lastNorm = null;
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    this.unsubscribers.push(() => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    });
  }

  private loop(now: number) {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.033, (now - this.t0) / 1000);
    this.t0 = now;

    for (const anim of this.fillAnims) anim.progress = Math.min(1, anim.progress + dt * 2.2);

    for (const st of this.strokes.values()) {
      if (st.animT < 0) continue;
      st.animT = Math.min(1, st.animT + dt * 0.9);
      st.color = st.animColor ?? this.color;
      const until = Math.floor(st.animT * st.samples.length);
      for (let i = 0; i < until; i++) st.samples[i].painted = true;
      if (st.animT >= 1) {
        st.animT = -1;
        this.emitProgress();
      }
    }

    if (this.phase === "life") {
      this.lifeT += dt;
      if (Math.random() < 0.4) {
        const ap = lifeAccentPoint(this.lifeStyle, this.lifeT);
        const c = this.toCanvas(ap);
        this.particles.push({
          x: c.x,
          y: c.y,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 2,
          life: 1,
          max: 0.9,
          color: "#fde68a",
          size: 2 + Math.random() * 4,
          kind: "star",
        });
      }
      if (this.lifeT >= 7.5) {
        this.phase = "done";
        this.opts.onLifeDone();
      }
    }

    for (const p of this.particles) {
      if (p.kind === "ripple") {
        p.size += 85 * dt;
        p.life -= dt / p.max;
      } else {
        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;
        p.vy += 24 * dt;
        p.life -= dt / p.max;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.draw(now);
  }

  private draw(now: number) {
    const { ctx, cssW, cssH } = this;
    ctx.clearRect(0, 0, cssW, cssH);

    const g = ctx.createLinearGradient(0, 0, cssW, cssH);
    g.addColorStop(0, "#f8fafc");
    g.addColorStop(0.5, "#ffffff");
    g.addColorStop(1, "#eef2ff");
    ctx.fillStyle = g;
    roundRect(ctx, 6, 6, cssW - 12, cssH - 12, 28);
    ctx.fill();

    if (!this.template) return;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.004);

    // Opaque soft-gradient fills (no muddy stacking)
    for (const region of this.template.regions) {
      const fill = this.fills.get(region.id);
      const anim = this.fillAnims.find((a) => a.regionId === region.id);
      ctx.save();
      this.pathPoly(region.points, 0.985);
      if (fill) {
        if (anim && anim.progress < 1) {
          const o = this.mapPt(anim.origin);
          ctx.clip();
          const grad = ctx.createRadialGradient(
            o.x,
            o.y,
            2,
            o.x,
            o.y,
            Math.hypot(cssW, cssH) * anim.progress,
          );
          grad.addColorStop(0, shade(anim.color, 0.14));
          grad.addColorStop(0.65, anim.color);
          grad.addColorStop(1, shade(anim.color, -0.1));
          ctx.fillStyle = grad;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(o.x, o.y, Math.hypot(cssW, cssH) * anim.progress, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const a = this.mapPt({ x: 0.3, y: 0.28 });
          const b = this.mapPt({ x: 0.75, y: 0.8 });
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, shade(fill, 0.12));
          grad.addColorStop(0.5, fill);
          grad.addColorStop(1, shade(fill, -0.14));
          ctx.fillStyle = grad;
          ctx.globalAlpha = 1;
          ctx.fill();
        }
      } else {
        ctx.fillStyle = `rgba(241,245,249,${0.65 + pulse * 0.1})`;
        ctx.fill();
      }
      ctx.restore();
    }

    // Black outlines on top — keeps each color readable
    for (const region of this.template.regions) {
      ctx.save();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.globalAlpha = 1;
      this.strokePoly(region.points);
      ctx.restore();
    }

    for (const stroke of this.template.strokes) {
      const st = this.strokes.get(stroke.id);
      ctx.save();
      ctx.setLineDash([8, 11]);
      ctx.lineDashOffset = -now * 0.04;
      ctx.strokeStyle = `rgba(100,116,139,${0.35 + pulse * 0.2})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      this.strokePts(stroke.points);
      ctx.restore();

      if (st) {
        ctx.save();
        ctx.strokeStyle = st.color ?? this.color;
        ctx.shadowColor = st.color ?? this.color;
        ctx.shadowBlur = 12;
        ctx.lineWidth = this.opts.strokeWidth;
        ctx.lineCap = "round";
        this.strokePainted(st, stroke);
        ctx.restore();
      }
    }

    if (this.phase === "life" || this.phase === "done") {
      ctx.save();
      ctx.globalAlpha = 0.14 + 0.08 * Math.sin(this.lifeT * 3);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 8;
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 28;
      for (const region of this.template.regions) this.strokePoly(region.points);
      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.kind === "ripple") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "star") {
        ctx.fillStyle = p.color;
        star(ctx, p.x, p.y, p.size * p.life);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private pathPoly(points: Pt[], inset = 1) {
    const { ctx } = this;
    let cx = 0;
    let cy = 0;
    for (const q of points) {
      cx += q.x;
      cy += q.y;
    }
    cx /= Math.max(1, points.length);
    cy /= Math.max(1, points.length);
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const q = {
        x: cx + (points[i].x - cx) * inset,
        y: cy + (points[i].y - cy) * inset,
      };
      const p = this.mapPt(q);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
  }

  private strokePoly(points: Pt[]) {
    this.pathPoly(points);
    this.ctx.stroke();
  }

  private strokePts(points: Pt[]) {
    const { ctx } = this;
    if (points.length < 2) return;
    ctx.beginPath();
    const f = this.mapPt(points[0]);
    ctx.moveTo(f.x, f.y);
    for (let i = 1; i < points.length; i++) {
      const p = this.mapPt(points[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  private strokePainted(st: StrokeState, stroke: ColorStroke) {
    const { ctx } = this;
    let drawing = false;
    for (let i = 0; i < st.samples.length; i++) {
      const s = st.samples[i];
      const prev = st.samples[i - 1];
      if (s.painted && prev?.painted) {
        if (!drawing) {
          const pc = this.mapPt(prev);
          ctx.beginPath();
          ctx.moveTo(pc.x, pc.y);
          drawing = true;
        }
        const c = this.mapPt(s);
        ctx.lineTo(c.x, c.y);
      } else if (drawing) {
        ctx.stroke();
        drawing = false;
      }
    }
    if (drawing) ctx.stroke();

    if (st.animT >= 0 && st.animT < 1) {
      const p = pointOnPath(stroke.points, st.animT);
      const c = this.mapPt(p);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = st.animColor ?? this.color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + Math.round(amt * 255)));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + Math.round(amt * 255)));
  const b = Math.min(255, Math.max(0, (n & 255) + Math.round(amt * 255)));
  return `rgb(${r},${g},${b})`;
}
