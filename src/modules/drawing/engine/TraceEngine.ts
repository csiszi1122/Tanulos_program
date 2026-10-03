import type { ColorRegion, ColorTemplate } from "../data/colorTemplates";
import { dist, lerp, pointInPoly, pointOnPath, resamplePath, type Pt } from "./pathMath";
import {
  lifeAccentPoint,
  lifeStyleFor,
  lifeTransform,
  type LifeStyle,
} from "./lifeAnim";

type Sample = Pt & { covered: boolean };

type PartState = {
  region: ColorRegion;
  samples: Sample[];
  fillColor: string | null;
  fillProgress: number; // 0..1 expand anim
  fillOrigin: Pt;
  outlineDone: boolean;
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
  kind: "spark" | "ink" | "bloom" | "ripple" | "star";
};

export type TraceEngineOptions = {
  strokeWidth?: number;
  hitRadius?: number;
  partCoverage?: number;
  onProgress?: (ratio: number, activeLabel: string | null) => void;
  onPartComplete?: (label: string, color: string) => void;
  onAllComplete?: () => void;
  onLifeDone?: () => void;
};

export class TraceEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private cssW = 0;
  private cssH = 0;
  private pad = 36;
  private template: ColorTemplate | null = null;
  private parts: PartState[] = [];
  private activeIndex = 0;
  private color = "#2563eb";
  private userStrokes: Array<{ pts: Pt[]; color: string }> = [];
  private currentStroke: Pt[] | null = null;
  private particles: Particle[] = [];
  private raf = 0;
  private t0 = performance.now();
  private guideT = -1;
  private drawing = false;
  private phase: "draw" | "life" | "done" = "draw";
  private lifeT = 0;
  private lifeStyle: LifeStyle = "wiggle";
  private opts: Required<TraceEngineOptions>;
  private unsubscribers: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement, opts: TraceEngineOptions = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.opts = {
      strokeWidth: opts.strokeWidth ?? 16,
      hitRadius: opts.hitRadius ?? 0.06,
      partCoverage: opts.partCoverage ?? 0.9,
      onProgress: opts.onProgress ?? (() => undefined),
      onPartComplete: opts.onPartComplete ?? (() => undefined),
      onAllComplete: opts.onAllComplete ?? (() => undefined),
      onLifeDone: opts.onLifeDone ?? (() => undefined),
    };
    this.bindPointer();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  setColor(hex: string) {
    this.color = hex;
  }

  getColor() {
    return this.color;
  }

  setTemplate(template: ColorTemplate) {
    this.template = template;
    this.phase = "draw";
    this.lifeT = 0;
    this.lifeStyle = lifeStyleFor(template.id, template.category, template.life);
    this.userStrokes = [];
    this.currentStroke = null;
    this.particles = [];
    this.guideT = -1;
    this.parts = template.regions.map((region) => ({
      region,
      samples: resamplePath(region.points, 0.014).map((p) => ({
        ...p,
        covered: false,
      })),
      fillColor: null,
      fillProgress: 0,
      fillOrigin: { x: 0.5, y: 0.5 },
      outlineDone: false,
    }));
    this.activeIndex = 0;
    this.emitProgress();
    window.setTimeout(() => this.playGuide(), 500);
  }

  clearUser() {
    if (!this.template) return;
    this.setTemplate(this.template);
  }

  playGuide() {
    if (this.phase !== "draw") return;
    this.guideT = 0;
  }

  getProgress(): number {
    if (!this.parts.length) return 0;
    return this.parts.filter((p) => p.outlineDone).length / this.parts.length;
  }

  getActiveLabel(): string | null {
    return this.parts[this.activeIndex]?.region.label ?? null;
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

  private emitProgress() {
    this.opts.onProgress(this.getProgress(), this.getActiveLabel());
  }

  private toCanvas(p: Pt): Pt {
    const size = Math.min(this.cssW, this.cssH) - this.pad * 2;
    const ox = (this.cssW - size) / 2;
    const oy = (this.cssH - size) / 2;
    return { x: ox + p.x * size, y: oy + p.y * size };
  }

  private mapPt(p: Pt): Pt {
    if (this.phase === "life" || this.phase === "done") {
      const intensity = this.phase === "done" ? 0.35 : 1;
      return this.toCanvas(lifeTransform(p, this.lifeStyle, this.lifeT, intensity));
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

  private activePart(): PartState | null {
    return this.parts[this.activeIndex] ?? null;
  }

  private magnetize(p: Pt, part: PartState): Pt {
    let best: Sample | null = null;
    let bestD = this.opts.hitRadius * 1.8;
    for (const s of part.samples) {
      if (s.covered) continue;
      const d = dist(s, p);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (!best) return p;
    return lerp(p, best, (1 - bestD / (this.opts.hitRadius * 1.8)) * 0.65);
  }

  private coverNear(p: Pt) {
    const part = this.activePart();
    if (!part || part.outlineDone || this.phase !== "draw") return;
    let changed = false;
    for (const s of part.samples) {
      if (s.covered) continue;
      if (dist(s, p) <= this.opts.hitRadius) {
        s.covered = true;
        changed = true;
      }
    }
    if (changed) this.emitProgress();
  }

  /**
   * Fill only after a nearly complete outline — never mid-stroke.
   * Requires high coverage AND returning near the start (closed loop),
   * or near-total coverage with the pointer back at the outline start.
   */
  private tryCompleteActive(end: Pt) {
    const part = this.activePart();
    if (!part || part.outlineDone || !this.currentStroke) return;
    const cov =
      part.samples.filter((s) => s.covered).length / Math.max(1, part.samples.length);
    const first = this.currentStroke[0];
    const outlineStart = part.region.points[0];
    const closedLoop =
      this.currentStroke.length >= 22 && dist(first, end) <= 0.08;
    const nearOutlineStart = dist(end, outlineStart) <= 0.1;
    const nearlyDone = cov >= this.opts.partCoverage;
    // No early fill: coverage alone is never enough without closing near start
    if (nearlyDone && (closedLoop || (cov >= 0.96 && nearOutlineStart))) {
      this.completePart(part, end);
    }
  }

  private completePart(part: PartState, origin: Pt) {
    if (part.outlineDone) return;
    part.outlineDone = true;
    part.fillColor = this.color;
    part.fillProgress = 0;
    // centroid-ish origin inside region
    let cx = 0;
    let cy = 0;
    for (const q of part.region.points) {
      cx += q.x;
      cy += q.y;
    }
    const n = part.region.points.length || 1;
    part.fillOrigin = pointInPoly(origin, part.region.points)
      ? origin
      : { x: cx / n, y: cy / n };

    this.burst(part.fillOrigin, this.color, 55);
    this.opts.onPartComplete(part.region.label, this.color);

    // advance to next unfinished
    const next = this.parts.findIndex((p) => !p.outlineDone);
    this.activeIndex = next === -1 ? this.parts.length : next;
    this.guideT = next === -1 ? -1 : 0;
    this.emitProgress();

    if (next === -1) {
      this.startLife();
    }
  }

  private startLife() {
    this.phase = "life";
    this.lifeT = 0;
    this.opts.onAllComplete();
    // long celebration particles
    for (let i = 0; i < 120; i++) {
      const a = Math.random() * Math.PI * 2;
      const c = this.toCanvas({ x: 0.5, y: 0.5 });
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * (2 + Math.random() * 6),
        vy: Math.sin(a) * (2 + Math.random() * 6) - 2,
        life: 1,
        max: 1.2 + Math.random(),
        color: this.parts[i % this.parts.length]?.fillColor ?? "#fff",
        size: 3 + Math.random() * 8,
        kind: i % 5 === 0 ? "star" : "spark",
      });
    }
  }

  private burst(p: Pt, color: string, n: number) {
    const c = this.toCanvas(p);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 5;
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.8,
        life: 1,
        max: 0.6 + Math.random() * 0.7,
        color: i % 4 === 0 ? "#fff" : color,
        size: 2.5 + Math.random() * 6,
        kind: i % 3 === 0 ? "bloom" : "ink",
      });
    }
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: 0,
        vy: 0,
        life: 1,
        max: 0.5 + i * 0.15,
        color,
        size: 18 + i * 26,
        kind: "ripple",
      });
    }
  }

  private bindPointer() {
    const el = this.canvas;
    el.style.touchAction = "none";

    const down = (e: PointerEvent) => {
      if (this.phase !== "draw") return;
      el.setPointerCapture(e.pointerId);
      this.drawing = true;
      let n = this.toNorm(e.clientX, e.clientY);
      const part = this.activePart();
      if (!n || !part) return;
      n = this.magnetize(n, part);
      this.currentStroke = [n];
      this.coverNear(n);
    };

    const move = (e: PointerEvent) => {
      if (!this.drawing || !this.currentStroke || this.phase !== "draw") return;
      const part = this.activePart();
      if (!part) return;
      let n = this.toNorm(e.clientX, e.clientY);
      if (!n) return;
      n = this.magnetize(n, part);
      const last = this.currentStroke[this.currentStroke.length - 1];
      if (dist(last, n) < 0.003) return;
      this.currentStroke.push(n);
      this.coverNear(n);
    };

    const up = (e: PointerEvent) => {
      if (!this.drawing) return;
      this.drawing = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (this.currentStroke && this.currentStroke.length > 2) {
        this.userStrokes.push({ pts: this.currentStroke, color: this.color });
        const last = this.currentStroke[this.currentStroke.length - 1];
        this.tryCompleteActive(last);
      }
      this.currentStroke = null;
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

    for (const part of this.parts) {
      if (part.fillColor && part.fillProgress < 1) {
        part.fillProgress = Math.min(1, part.fillProgress + dt * 1.8);
      }
    }

    if (this.guideT >= 0 && this.phase === "draw") {
      this.guideT += dt * 0.45;
      if (this.guideT >= 1) this.guideT = -1;
    }

    if (this.phase === "life") {
      this.lifeT += dt;
      // ambient sparkles while alive
      if (Math.random() < 0.35) {
        const ap = lifeAccentPoint(this.lifeStyle, this.lifeT);
        const c = this.toCanvas(ap);
        this.particles.push({
          x: c.x,
          y: c.y,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 2,
          life: 1,
          max: 0.8 + Math.random() * 0.6,
          color: "#fde68a",
          size: 2 + Math.random() * 4,
          kind: "star",
        });
      }
      // ~7.5s life show then settle
      if (this.lifeT >= 7.5) {
        this.phase = "done";
        this.opts.onLifeDone();
      }
    }

    for (const p of this.particles) {
      if (p.kind === "ripple") {
        p.size += 90 * dt;
        p.life -= dt / p.max;
      } else {
        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;
        p.vy += 28 * dt;
        p.life -= dt / p.max;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    this.draw(now);
  }

  private draw(now: number) {
    const { ctx, cssW, cssH } = this;
    ctx.clearRect(0, 0, cssW, cssH);

    // premium paper studio
    const g = ctx.createLinearGradient(0, 0, cssW, cssH);
    g.addColorStop(0, "#f8fafc");
    g.addColorStop(0.5, "#ffffff");
    g.addColorStop(1, "#f1f5f9");
    ctx.fillStyle = g;
    roundRect(ctx, 6, 6, cssW - 12, cssH - 12, 28);
    ctx.fill();

    // soft vignette
    const vg = ctx.createRadialGradient(
      cssW / 2,
      cssH / 2,
      Math.min(cssW, cssH) * 0.2,
      cssW / 2,
      cssH / 2,
      Math.min(cssW, cssH) * 0.72,
    );
    vg.addColorStop(0, "rgba(255,255,255,0)");
    vg.addColorStop(1, "rgba(15,23,42,0.06)");
    ctx.fillStyle = vg;
    roundRect(ctx, 6, 6, cssW - 12, cssH - 12, 28);
    ctx.fill();

    if (!this.template) return;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.005);

    // Opaque fills first (no stacking transparency between parts)
    for (const part of this.parts) {
      if (!part.fillColor) continue;
      ctx.save();
      this.pathPoly(part.region.points, 0.985);
      if (part.fillProgress < 1) {
        const o = this.mapPt(part.fillOrigin);
        ctx.clip();
        const grad = ctx.createRadialGradient(
          o.x,
          o.y,
          4,
          o.x,
          o.y,
          Math.hypot(cssW, cssH) * part.fillProgress,
        );
        grad.addColorStop(0, shade(part.fillColor, 0.12));
        grad.addColorStop(0.7, part.fillColor);
        grad.addColorStop(1, shade(part.fillColor, -0.08));
        ctx.fillStyle = grad;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(o.x, o.y, Math.hypot(cssW, cssH) * part.fillProgress, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const c0 = this.mapPt({ x: 0.35, y: 0.3 });
        const c1 = this.mapPt({ x: 0.7, y: 0.75 });
        const grad = ctx.createLinearGradient(c0.x, c0.y, c1.x, c1.y);
        grad.addColorStop(0, shade(part.fillColor, 0.1));
        grad.addColorStop(0.55, part.fillColor);
        grad.addColorStop(1, shade(part.fillColor, -0.12));
        ctx.fillStyle = grad;
        ctx.globalAlpha = 1;
        ctx.fill();
      }
      ctx.restore();
    }

    // Crisp black outlines ON TOP so colors stay visually separated
    for (let i = 0; i < this.parts.length; i++) {
      const part = this.parts[i];
      const active = i === this.activeIndex && this.phase === "draw";
      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.globalAlpha = 1;
      if (active && !part.outlineDone) {
        ctx.setLineDash([8, 10]);
        ctx.lineDashOffset = -now * 0.05;
        ctx.strokeStyle = `rgba(37,99,235,${0.55 + pulse * 0.35})`;
        ctx.lineWidth = 3.8;
        ctx.shadowColor = "rgba(37,99,235,0.35)";
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = part.outlineDone ? 3.2 : 2.4;
      }
      this.strokePoly(part.region.points);
      ctx.restore();

      if (active && !part.outlineDone) {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = this.opts.strokeWidth * 0.7;
        ctx.lineCap = "round";
        this.strokeCovered(part);
        ctx.restore();
      }
    }

    // Decorative strokes from template
    if (this.template.strokes?.length) {
      ctx.save();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      for (const s of this.template.strokes) this.strokePts(s.points);
      ctx.restore();
    }

    // User ink (semi-transparent so filled colors remain readable underneath)
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.55;
    for (const stroke of this.userStrokes) {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = this.opts.strokeWidth * 0.85;
      this.strokePts(stroke.pts);
    }
    if (this.currentStroke) {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.opts.strokeWidth;
      this.strokePts(this.currentStroke);
    }
    ctx.restore();

    // guide orb on active outline
    const active = this.activePart();
    if (active && this.guideT >= 0 && this.phase === "draw") {
      const gp = pointOnPath(active.region.points, this.guideT);
      const c = this.mapPt(gp);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 13 + pulse * 5, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowBlur = 0;
      ctx.fill();
    }

    // start pulse on active part
    if (active && !active.outlineDone && this.phase === "draw") {
      const start = active.region.points[0];
      const c = this.mapPt(start);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 9 + pulse * 7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(37,99,235,${0.25 + pulse * 0.35})`;
      ctx.fill();
    }

    // life glow
    if (this.phase === "life" || this.phase === "done") {
      ctx.save();
      ctx.globalAlpha = 0.12 + 0.08 * Math.sin(this.lifeT * 3);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 10;
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 30;
      for (const part of this.parts) this.strokePoly(part.region.points);
      ctx.restore();
    }

    // particles
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
        drawStar(ctx, p.x, p.y, p.size * p.life, 5);
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
    if (points.length < 2) return;
    let cx = 0;
    let cy = 0;
    for (const q of points) {
      cx += q.x;
      cy += q.y;
    }
    cx /= points.length;
    cy /= points.length;
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
    const { ctx } = this;
    if (points.length < 2) return;
    ctx.beginPath();
    const f = this.mapPt(points[0]);
    ctx.moveTo(f.x, f.y);
    for (let i = 1; i < points.length; i++) {
      const p = this.mapPt(points[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();
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

  private strokeCovered(part: PartState) {
    const { ctx } = this;
    let drawing = false;
    for (let i = 0; i < part.samples.length; i++) {
      const s = part.samples[i];
      const prev = part.samples[i - 1];
      if (s.covered && prev?.covered) {
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

function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spikes: number,
) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i * Math.PI) / spikes - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/** Lighten/darken hex color for soft gradients without muddy overlays. */
function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + Math.round(amt * 255)));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + Math.round(amt * 255)));
  const b = Math.min(255, Math.max(0, (n & 255) + Math.round(amt * 255)));
  return `rgb(${r},${g},${b})`;
}
