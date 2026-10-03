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
  kind: "spark" | "drip" | "ripple" | "bloom";
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
  private pad = 28;
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
  private winT = 0;
  private opts: Required<ColorEngineOptions>;
  private unsubscribers: Array<() => void> = [];
  private grainCanvas: HTMLCanvasElement | null = null;

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
    this.winT = 0;
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

  resize(cssW: number, cssH: number) {
    this.cssW = Math.max(1, cssW);
    this.cssH = Math.max(1, cssH);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.cssW * this.dpr);
    this.canvas.height = Math.floor(this.cssH * this.dpr);
    this.canvas.style.width = `${this.cssW}px`;
    this.canvas.style.height = `${this.cssH}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.grainCanvas = null;
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
    return regionPart * 0.65 + strokePart * 0.35;
  }

  private emitProgress() {
    const p = this.getProgress();
    this.opts.onProgress(p);
    if (!this.completed && p >= 0.98) {
      this.completed = true;
      this.winT = 0;
      this.winBloom();
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
    for (let i = this.template.regions.length - 1; i >= 0; i--) {
      const r = this.template.regions[i];
      if (pointInPoly(p, r.points)) return r.id;
    }
    return null;
  }

  private fillRegion(regionId: string, origin: Pt) {
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
    this.watercolorBurst(origin, this.color);
    this.emitProgress();
  }

  private watercolorBurst(p: Pt, color: string) {
    const c = this.toCanvas(p);
    for (let i = 0; i < 36; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.6 + Math.random() * 2.8;
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        max: 0.4 + Math.random() * 0.55,
        color,
        size: 3 + Math.random() * 6,
        kind: i % 3 === 0 ? "drip" : "spark",
      });
    }
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: 0,
        vy: 0,
        life: 1,
        max: 0.4 + i * 0.15,
        color,
        size: 12 + i * 18,
        kind: "ripple",
      });
    }
  }

  private winBloom() {
    const c = { x: this.cssW / 2, y: this.cssH / 2 };
    const colors = [...this.fills.values()];
    const palette = colors.length ? colors : [this.color];
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 6;
      const color = palette[i % palette.length];
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1,
        life: 1,
        max: 0.7 + Math.random() * 0.8,
        color,
        size: 3 + Math.random() * 6,
        kind: i % 5 === 0 ? "bloom" : "spark",
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
        st.samples.length > 0 &&
        painted / st.samples.length >= 0.32 &&
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

  private spawnTrail(p: Pt, color: string) {
    if (Math.random() > 0.45) return;
    const c = this.toCanvas(p);
    this.particles.push({
      x: c.x,
      y: c.y,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2 - 0.35,
      life: 1,
      max: 0.28 + Math.random() * 0.3,
      color,
      size: 2 + Math.random() * 3,
      kind: "drip",
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

    for (const anim of this.fillAnims) {
      // ease-out watercolor expand
      anim.progress = Math.min(1, anim.progress + dt * 2.1 * (1.15 - anim.progress * 0.4));
    }
    this.fillAnims = this.fillAnims.filter((a) => a.progress < 1 || this.fills.has(a.regionId));

    for (const [id, st] of this.strokes) {
      if (st.animT < 0) continue;
      st.animT = Math.min(1, st.animT + dt * 0.95);
      const color = st.animColor ?? this.color;
      st.color = color;
      const until = Math.floor(st.animT * st.samples.length);
      for (let i = 0; i < until; i++) st.samples[i].painted = true;
      if (st.animT < 1) {
        const stroke = this.template?.strokes.find((s) => s.id === id);
        if (stroke?.points.length) {
          this.spawnTrail(pointOnPath(stroke.points, st.animT), color);
        }
      }
      if (st.animT >= 1) {
        st.animT = -1;
        this.emitProgress();
      }
    }

    for (const p of this.particles) {
      if (p.kind === "ripple") {
        p.size += 70 * dt;
        p.life -= dt / p.max;
        continue;
      }
      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      if (p.kind === "drip") {
        p.vy += 18 * dt;
        p.vx *= 0.98;
      } else {
        p.vy += 40 * dt;
      }
      p.life -= dt / p.max;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    if (this.completed) this.winT += dt;
    this.draw(now);
  }

  private ensureGrain() {
    if (this.grainCanvas) return this.grainCanvas;
    const g = document.createElement("canvas");
    g.width = 128;
    g.height = 128;
    const gctx = g.getContext("2d");
    if (!gctx) return null;
    const img = gctx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 222 + Math.floor(Math.random() * 28);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 16;
    }
    gctx.putImageData(img, 0, 0);
    this.grainCanvas = g;
    return g;
  }

  private drawPaper() {
    const { ctx, cssW, cssH } = this;
    const grd = ctx.createLinearGradient(0, 0, cssW, cssH);
    grd.addColorStop(0, "#fffdf9");
    grd.addColorStop(0.5, "#f8f4ec");
    grd.addColorStop(1, "#efe6d8");
    ctx.fillStyle = grd;
    roundRect(ctx, 6, 6, cssW - 12, cssH - 12, 24);
    ctx.fill();

    ctx.save();
    ctx.strokeStyle = "rgba(148,163,184,0.1)";
    ctx.lineWidth = 1;
    for (let x = 22; x < cssW - 10; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 14);
      ctx.lineTo(x, cssH - 14);
      ctx.stroke();
    }
    for (let y = 22; y < cssH - 10; y += 30) {
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(cssW - 14, y);
      ctx.stroke();
    }
    ctx.restore();

    const grain = this.ensureGrain();
    if (grain) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      const pattern = ctx.createPattern(grain, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        roundRect(ctx, 6, 6, cssW - 12, cssH - 12, 24);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private draw(now: number) {
    const { ctx, cssW, cssH } = this;
    ctx.clearRect(0, 0, cssW, cssH);
    this.drawPaper();

    if (!this.template) return;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.004);

    for (const region of this.template.regions) {
      const fill = this.fills.get(region.id);
      const anim = this.fillAnims.find((a) => a.regionId === region.id);
      ctx.save();
      this.pathPoly(region.points);
      if (fill) {
        if (anim && anim.progress < 1) {
          const origin = this.toCanvas(anim.origin);
          const maxR = Math.hypot(cssW, cssH) * 0.85;
          const eased = 1 - Math.pow(1 - anim.progress, 2.4);
          ctx.clip();
          // soft watercolor edge via layered circles
          for (let layer = 3; layer >= 0; layer--) {
            const r = maxR * eased * (1 - layer * 0.04);
            const g = ctx.createRadialGradient(origin.x, origin.y, r * 0.15, origin.x, origin.y, r);
            g.addColorStop(0, anim.color);
            g.addColorStop(0.7, anim.color);
            g.addColorStop(1, "transparent");
            ctx.globalAlpha = 0.55 + layer * 0.1;
            ctx.fillStyle = layer === 0 ? anim.color : g;
            ctx.beginPath();
            ctx.arc(origin.x, origin.y, r, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = fill;
          ctx.globalAlpha = 0.9;
          ctx.fill();
          // subtle watercolor grain overlay tint
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = "#fff";
          ctx.fill();
        }
      } else {
        ctx.fillStyle = `rgba(255,255,255,${0.35 + pulse * 0.08})`;
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = "rgba(30,41,59,0.78)";
      ctx.lineWidth = 2.6;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      this.pathPoly(region.points);
      ctx.stroke();
      ctx.restore();
    }

    for (const stroke of this.template.strokes) {
      const st = this.strokes.get(stroke.id);
      ctx.save();
      ctx.setLineDash([7, 10]);
      ctx.lineDashOffset = -now * 0.04;
      ctx.strokeStyle = `rgba(71,85,105,${0.35 + pulse * 0.15})`;
      ctx.lineWidth = Math.max(2.5, this.opts.strokeWidth * 0.4);
      ctx.lineCap = "round";
      this.strokePath(stroke.points);
      ctx.restore();

      if (st) {
        ctx.save();
        ctx.strokeStyle = st.color ?? this.color;
        ctx.shadowColor = st.color ?? this.color;
        ctx.shadowBlur = 14;
        ctx.lineWidth = this.opts.strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        this.strokePainted(st, stroke);
        ctx.restore();
      }
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.kind === "ripple") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5 * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "bloom") {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
        g.addColorStop(0, p.color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.2 * p.life, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (this.completed) {
      const bloom = Math.min(1, this.winT * 1.2);
      ctx.save();
      ctx.globalAlpha = 0.08 + bloom * 0.1 * pulse;
      ctx.fillStyle = this.color;
      roundRect(ctx, 6, 6, cssW - 12, cssH - 12, 24);
      ctx.fill();
      ctx.restore();
    }
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

    if (st.animT >= 0 && st.animT < 1) {
      const p = pointOnPath(stroke.points, st.animT);
      const c = this.toCanvas(p);
      const color = st.animColor ?? this.color;
      for (let i = 3; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8 + i * 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.12 * i;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 22;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowBlur = 0;
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
