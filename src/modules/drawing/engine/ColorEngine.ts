import type { ColorStroke, ColorTemplate } from "../data/colorTemplates";
import { dist, pointOnPath, resamplePath, type Pt } from "./pathMath";

type FillAnim = {
  regionId: string;
  color: string;
  progress: number;
  origin: Pt;
};

type StrokeState = {
  samples: Array<Pt & { painted: boolean }>;
  color: string | null;
  animT: number; // -1 idle, 0..1 auto-paint animation
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
};

export type ColorEngineOptions = {
  strokeWidth?: number;
  hitRadius?: number;
  onProgress?: (ratio: number) => void;
  onComplete?: () => void;
  onRegionFill?: (label: string) => void;
};

function pointInPoly(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export class ColorEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private cssW = 0;
  private cssH = 0;
  private pad = 24;
  private template: ColorTemplate | null = null;
  private fills = new Map<string, string>();
  private fillAnims: FillAnim[] = [];
  private strokes = new Map<string, StrokeState>();
  private color = "#3b82f6";
  private particles: Particle[] = [];
  private raf = 0;
  private t0 = performance.now();
  private drawing = false;
  private lastNorm: Pt | null = null;
  private completed = false;
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
    this.completed = false;
    for (const s of template.strokes) {
      this.strokes.set(s.id, {
        samples: resamplePath(s.points, 0.016).map((p) => ({ ...p, painted: false })),
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
    const total = regionTotal + (strokeTotal > 0 ? 1 : 0);
    if (total === 0) return 1;
    const regionPart = regionTotal ? regionDone / regionTotal : 1;
    const strokePart = strokeTotal ? strokeDone / strokeTotal : 1;
    if (!strokeTotal) return regionPart;
    if (!regionTotal) return strokePart;
    return regionPart * 0.65 + strokePart * 0.35;
  }

  private emitProgress() {
    const p = this.getProgress();
    this.opts.onProgress(p);
    if (!this.completed && p >= 0.98) {
      this.completed = true;
      this.opts.onComplete();
    }
  }

  private toCanvas(p: Pt): Pt {
    const size = Math.min(this.cssW, this.cssH) - this.pad * 2;
    const ox = (this.cssW - size) / 2;
    const oy = (this.cssH - size) / 2;
    return { x: ox + p.x * size, y: oy + p.y * size };
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
    // top-most: reverse order so smaller overlays win
    for (let i = this.template.regions.length - 1; i >= 0; i--) {
      const r = this.template.regions[i];
      if (pointInPoly(p, r.points)) return r.id;
    }
    return null;
  }

  private fillRegion(regionId: string, origin: Pt) {
    if (this.fills.has(regionId)) {
      // allow recolor
    }
    this.fills.set(regionId, this.color);
    this.fillAnims = this.fillAnims.filter((a) => a.regionId !== regionId);
    this.fillAnims.push({
      regionId,
      color: this.color,
      progress: 0,
      origin,
    });
    const label =
      this.template?.regions.find((r) => r.id === regionId)?.label ?? regionId;
    this.opts.onRegionFill(label);
    this.burst(origin, this.color, 28);
    this.emitProgress();
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
      // if user covered most of a stroke, animate the rest
      const painted = st.samples.filter((s) => s.painted).length;
      if (
        st.animT < 0 &&
        st.samples.length > 0 &&
        painted / st.samples.length >= 0.35 &&
        painted < st.samples.length
      ) {
        st.animT = painted / st.samples.length;
        st.animColor = this.color;
      }
    }
    if (changed) {
      this.spawnTrail(p, this.color);
      this.emitProgress();
    }
  }

  private burst(p: Pt, color: string, n: number) {
    const c = this.toCanvas(p);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.2 + Math.random() * 3.5;
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        max: 0.45 + Math.random() * 0.5,
        color,
        size: 2.5 + Math.random() * 4,
      });
    }
  }

  private spawnTrail(p: Pt, color: string) {
    if (Math.random() > 0.5) return;
    const c = this.toCanvas(p);
    this.particles.push({
      x: c.x,
      y: c.y,
      vx: (Math.random() - 0.5) * 1.1,
      vy: (Math.random() - 0.5) * 1.1 - 0.3,
      life: 1,
      max: 0.3 + Math.random() * 0.25,
      color,
      size: 2 + Math.random() * 2.5,
    });
  }

  private bindPointer() {
    const el = this.canvas;
    el.style.touchAction = "none";
    let downAt: Pt | null = null;
    let moved = false;

    const down = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      this.drawing = true;
      moved = false;
      const n = this.toNorm(e.clientX, e.clientY);
      downAt = n;
      this.lastNorm = n;
      if (n) this.paintNear(n);
    };

    const move = (e: PointerEvent) => {
      if (!this.drawing) return;
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
        const regionId = this.findRegion(n);
        if (regionId) this.fillRegion(regionId, n);
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

    for (const anim of this.fillAnims) anim.progress = Math.min(1, anim.progress + dt * 2.4);
    this.fillAnims = this.fillAnims.filter((a) => a.progress < 1 || this.fills.has(a.regionId));

    for (const st of this.strokes.values()) {
      if (st.animT < 0) continue;
      st.animT = Math.min(1, st.animT + dt * 0.85);
      const color = st.animColor ?? this.color;
      st.color = color;
      const until = Math.floor(st.animT * st.samples.length);
      for (let i = 0; i < until; i++) st.samples[i].painted = true;
      if (st.animT >= 1) {
        st.animT = -1;
        this.emitProgress();
      }
    }

    for (const p of this.particles) {
      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      p.vy += 35 * dt;
      p.life -= dt / p.max;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    this.draw(now);
  }

  private draw(now: number) {
    const { ctx, cssW, cssH } = this;
    ctx.clearRect(0, 0, cssW, cssH);

    const grd = ctx.createLinearGradient(0, 0, cssW, cssH);
    grd.addColorStop(0, "rgba(255,255,255,0.16)");
    grd.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = grd;
    roundRect(ctx, 8, 8, cssW - 16, cssH - 16, 28);
    ctx.fill();

    if (!this.template) return;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.004);

    // filled regions (with optional expand clip animation)
    for (const region of this.template.regions) {
      const fill = this.fills.get(region.id);
      const anim = this.fillAnims.find((a) => a.regionId === region.id);
      ctx.save();
      this.pathPoly(region.points);
      if (fill) {
        if (anim && anim.progress < 1) {
          const origin = this.toCanvas(anim.origin);
          const maxR = Math.hypot(cssW, cssH);
          ctx.clip();
          ctx.beginPath();
          ctx.arc(origin.x, origin.y, maxR * anim.progress, 0, Math.PI * 2);
          ctx.fillStyle = anim.color;
          ctx.globalAlpha = 0.92;
          ctx.fill();
        } else {
          ctx.fillStyle = fill;
          ctx.globalAlpha = 0.92;
          ctx.fill();
        }
      } else {
        ctx.fillStyle = `rgba(255,255,255,${0.06 + pulse * 0.04})`;
        ctx.fill();
      }
      ctx.restore();

      // outline
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      this.pathPoly(region.points);
      ctx.stroke();
      ctx.restore();
    }

    // stroke guides + painted ink
    for (const stroke of this.template.strokes) {
      const st = this.strokes.get(stroke.id);
      // ghost
      ctx.save();
      ctx.setLineDash([8, 10]);
      ctx.lineDashOffset = -now * 0.035;
      ctx.strokeStyle = `rgba(255,255,255,${0.35 + pulse * 0.15})`;
      ctx.lineWidth = Math.max(3, this.opts.strokeWidth * 0.45);
      ctx.lineCap = "round";
      this.strokePath(stroke.points);
      ctx.restore();

      if (st) {
        const color = st.color ?? this.color;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.lineWidth = this.opts.strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        this.strokePainted(st, stroke);
        ctx.restore();
      }
    }

    // particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private pathPoly(points: Pt[]) {
    const { ctx } = this;
    if (points.length < 2) return;
    ctx.beginPath();
    const first = this.toCanvas(points[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < points.length; i++) {
      const p = this.toCanvas(points[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
  }

  private strokePath(points: Pt[]) {
    const { ctx } = this;
    if (points.length < 2) return;
    ctx.beginPath();
    const first = this.toCanvas(points[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < points.length; i++) {
      const p = this.toCanvas(points[i]);
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
      const c = this.toCanvas(s);
      if (s.painted && prev?.painted) {
        if (!drawing) {
          const pc = this.toCanvas(prev);
          ctx.beginPath();
          ctx.moveTo(pc.x, pc.y);
          drawing = true;
        }
        ctx.lineTo(c.x, c.y);
      } else if (drawing) {
        ctx.stroke();
        drawing = false;
      }
    }
    if (drawing) ctx.stroke();

    // animated head orb while auto-filling
    if (st.animT >= 0 && st.animT < 1) {
      const p = pointOnPath(stroke.points, st.animT);
      const c = this.toCanvas(p);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
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
