import type { DrawingTemplate, Pt } from "./pathMath";
import { dist, lerp, pointOnPath, resamplePath, smoothPath } from "./pathMath";

type Sample = Pt & { covered: boolean; pathIndex: number };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  kind: "spark" | "ink" | "bloom" | "ripple";
};

export type TraceEngineOptions = {
  strokeWidth?: number;
  hitRadius?: number;
  winCoverage?: number;
  onCoverage?: (coverage: number) => void;
  onWin?: () => void;
};

export class TraceEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private cssW = 0;
  private cssH = 0;
  private pad = 32;
  private template: DrawingTemplate | null = null;
  private samples: Sample[] = [];
  private userStrokes: Pt[][] = [];
  private currentStroke: Pt[] | null = null;
  private particles: Particle[] = [];
  private raf = 0;
  private t0 = performance.now();
  private guideT = -1;
  private guidePath = 0;
  private guideTrail: Pt[] = [];
  private won = false;
  private winT = 0;
  private drawing = false;
  private opts: Required<TraceEngineOptions>;
  private unsubscribers: Array<() => void> = [];
  private grainCanvas: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement, opts: TraceEngineOptions = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.opts = {
      strokeWidth: opts.strokeWidth ?? 18,
      hitRadius: opts.hitRadius ?? 0.055,
      winCoverage: opts.winCoverage ?? 0.72,
      onCoverage: opts.onCoverage ?? (() => undefined),
      onWin: opts.onWin ?? (() => undefined),
    };
    this.bindPointer();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  setOptions(partial: Partial<TraceEngineOptions>) {
    this.opts = { ...this.opts, ...partial } as Required<TraceEngineOptions>;
  }

  setTemplate(template: DrawingTemplate) {
    this.template = template;
    this.won = false;
    this.winT = 0;
    this.userStrokes = [];
    this.currentStroke = null;
    this.guideT = -1;
    this.guideTrail = [];
    this.particles = [];
    this.rebuildSamples();
    this.opts.onCoverage(0);
  }

  clearUser() {
    this.userStrokes = [];
    this.currentStroke = null;
    this.won = false;
    this.winT = 0;
    this.particles = [];
    for (const s of this.samples) s.covered = false;
    this.opts.onCoverage(0);
  }

  playGuide() {
    this.guideT = 0;
    this.guidePath = 0;
    this.guideTrail = [];
  }

  getCoverage(): number {
    if (!this.samples.length) return 0;
    const covered = this.samples.filter((s) => s.covered).length;
    return covered / this.samples.length;
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
    this.unsubscribers = [];
  }

  private rebuildSamples() {
    this.samples = [];
    if (!this.template) return;
    this.template.paths.forEach((path, pathIndex) => {
      for (const p of resamplePath(path, 0.012)) {
        this.samples.push({ ...p, covered: false, pathIndex });
      }
    });
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

  /** Soft magnetic pull toward nearest uncovered guide sample. */
  private magnetize(p: Pt): Pt {
    let best: Sample | null = null;
    let bestD = this.opts.hitRadius * 1.6;
    for (const s of this.samples) {
      if (s.covered) continue;
      const d = dist(s, p);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (!best) return p;
    const pull = 1 - bestD / (this.opts.hitRadius * 1.6);
    return lerp(p, best, pull * 0.55);
  }

  private coverNear(p: Pt) {
    const r = this.opts.hitRadius;
    let changed = false;
    for (const s of this.samples) {
      if (s.covered) continue;
      if (dist(s, p) <= r) {
        s.covered = true;
        changed = true;
      }
    }
    if (changed) {
      const c = this.getCoverage();
      this.opts.onCoverage(c);
      if (!this.won && c >= this.opts.winCoverage) {
        this.won = true;
        this.winT = 0;
        this.celebrationBurst(p);
        this.opts.onWin();
      }
    }
  }

  private celebrationBurst(p: Pt) {
    const c = this.toCanvas(p);
    const color = this.template?.color ?? "#f43f5e";
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 7;
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1,
        life: 1,
        max: 0.8 + Math.random() * 0.9,
        color: i % 3 === 0 ? "#fff" : color,
        size: 3 + Math.random() * 7,
        kind: i % 4 === 0 ? "bloom" : "spark",
      });
    }
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: 0,
        vy: 0,
        life: 1,
        max: 0.55 + i * 0.12,
        color,
        size: 20 + i * 28,
        kind: "ripple",
      });
    }
  }

  private spawnInkTrail(p: Pt, boost = false) {
    if (!boost && Math.random() > 0.55) return;
    const c = this.toCanvas(p);
    const color = this.template?.color ?? "#334155";
    this.particles.push({
      x: c.x + (Math.random() - 0.5) * 4,
      y: c.y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8 - 0.2,
      life: 1,
      max: 0.28 + Math.random() * 0.35,
      color,
      size: (boost ? 4 : 2) + Math.random() * 3,
      kind: "ink",
    });
  }

  private bindPointer() {
    const el = this.canvas;
    el.style.touchAction = "none";

    const down = (e: PointerEvent) => {
      if (this.won) return;
      el.setPointerCapture(e.pointerId);
      this.drawing = true;
      let n = this.toNorm(e.clientX, e.clientY);
      if (!n) return;
      n = this.magnetize(n);
      this.currentStroke = [n];
      this.coverNear(n);
      this.spawnInkTrail(n, true);
    };

    const move = (e: PointerEvent) => {
      if (!this.drawing || !this.currentStroke) return;
      let n = this.toNorm(e.clientX, e.clientY);
      if (!n) return;
      n = this.magnetize(n);
      const last = this.currentStroke[this.currentStroke.length - 1];
      if (dist(last, n) < 0.003) return;
      this.currentStroke.push(n);
      this.coverNear(n);
      this.spawnInkTrail(n);
    };

    const up = (e: PointerEvent) => {
      if (!this.drawing) return;
      this.drawing = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (this.currentStroke && this.currentStroke.length > 1) {
        this.userStrokes.push(smoothPath(this.currentStroke, 1));
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
    this.tickGuide(dt);
    this.tickParticles(dt);
    if (this.won) this.winT += dt;
    this.draw(now);
  }

  private tickGuide(dt: number) {
    if (this.guideT < 0 || !this.template) return;
    this.guideT += dt * 0.48;
    const paths = this.template.paths;
    const path = paths[this.guidePath];
    if (path) {
      const gp = pointOnPath(path, Math.min(1, this.guideT));
      this.guideTrail.push(gp);
      if (this.guideTrail.length > 48) this.guideTrail.shift();
      this.spawnInkTrail(gp, true);
    }
    if (this.guideT >= 1) {
      this.guideT = 0;
      this.guideTrail = [];
      this.guidePath += 1;
      if (this.guidePath >= paths.length) {
        this.guideT = -1;
        this.guidePath = 0;
      }
    }
  }

  private tickParticles(dt: number) {
    for (const p of this.particles) {
      if (p.kind === "ripple") {
        p.size += 90 * dt;
        p.life -= dt / p.max;
        continue;
      }
      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      if (p.kind === "spark" || p.kind === "bloom") p.vy += 55 * dt;
      else p.vy += 12 * dt;
      p.life -= dt / p.max;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
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
      const v = 220 + Math.floor(Math.random() * 30);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 18;
    }
    gctx.putImageData(img, 0, 0);
    this.grainCanvas = g;
    return g;
  }

  private drawPaper() {
    const { ctx, cssW, cssH } = this;
    // studio paper
    const grd = ctx.createLinearGradient(0, 0, cssW, cssH);
    grd.addColorStop(0, "#fffdf8");
    grd.addColorStop(0.55, "#f7f3eb");
    grd.addColorStop(1, "#efe8dc");
    ctx.fillStyle = grd;
    roundRect(ctx, 6, 6, cssW - 12, cssH - 12, 24);
    ctx.fill();

    // subtle grid
    ctx.save();
    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.lineWidth = 1;
    const step = 28;
    for (let x = 20; x < cssW - 10; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 14);
      ctx.lineTo(x, cssH - 14);
      ctx.stroke();
    }
    for (let y = 20; y < cssH - 10; y += step) {
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(cssW - 14, y);
      ctx.stroke();
    }
    ctx.restore();

    const grain = this.ensureGrain();
    if (grain) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      const pattern = ctx.createPattern(grain, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        roundRect(ctx, 6, 6, cssW - 12, cssH - 12, 24);
        ctx.fill();
      }
      ctx.restore();
    }

    // soft inner shadow rim
    ctx.save();
    ctx.strokeStyle = "rgba(15,23,42,0.08)";
    ctx.lineWidth = 2;
    roundRect(ctx, 7, 7, cssW - 14, cssH - 14, 23);
    ctx.stroke();
    ctx.restore();
  }

  private draw(now: number) {
    const { ctx, cssW, cssH } = this;
    ctx.clearRect(0, 0, cssW, cssH);
    this.drawPaper();

    if (!this.template) return;
    const color = this.template.color;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.005);

    // ghost dashed guides
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([7, 11]);
    ctx.lineDashOffset = -now * 0.045;
    ctx.strokeStyle = `rgba(100,116,139,${0.28 + pulse * 0.12})`;
    ctx.lineWidth = Math.max(2.5, this.opts.strokeWidth * 0.38);
    for (const path of this.template.paths) this.strokeNorm(path);
    ctx.restore();

    // soft color underlay
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(4, this.opts.strokeWidth * 0.5);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const path of this.template.paths) this.strokeNorm(path);
    ctx.restore();

    // covered ink glow
    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.lineWidth = this.opts.strokeWidth * 0.72;
    ctx.lineCap = "round";
    this.drawCoveredChains();
    ctx.restore();

    // user strokes — variable-width ribbon feel
    for (const stroke of this.userStrokes) this.strokeVariable(stroke, color, 1);
    if (this.currentStroke) this.strokeVariable(this.currentStroke, color, 0.95);

    // start pulse orb
    const start = this.template.paths[0]?.[0];
    if (start && !this.won) {
      const c = this.toCanvas(start);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 12 + pulse * 10, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.45 + pulse * 0.35})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // guide orb + trailing ink
    if (this.guideT >= 0 && this.template.paths[this.guidePath]) {
      const path = this.template.paths[this.guidePath];
      const gp = pointOnPath(path, this.guideT);
      const c = this.toCanvas(gp);

      if (this.guideTrail.length > 1) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        for (let i = 0; i < this.guideTrail.length; i++) {
          const p = this.toCanvas(this.guideTrail[i]);
          const t = i / (this.guideTrail.length - 1);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else {
            ctx.lineWidth = this.opts.strokeWidth * (0.35 + t * 0.65);
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // outer glow rings
      for (let i = 3; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 10 + i * 6 + pulse * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.08 * i})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(c.x, c.y, 15 + pulse * 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 28;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowBlur = 0;
      ctx.fill();
    }

    // particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.kind === "ripple") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "bloom") {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        g.addColorStop(0, p.color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2 * p.life, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (this.won) {
      const bloom = Math.min(1, this.winT * 1.4);
      ctx.save();
      ctx.globalAlpha = 0.12 + 0.18 * pulse * bloom;
      ctx.strokeStyle = color;
      ctx.lineWidth = this.opts.strokeWidth * (1.1 + bloom * 0.4);
      ctx.shadowColor = color;
      ctx.shadowBlur = 36;
      ctx.lineCap = "round";
      for (const path of this.template.paths) this.strokeNorm(path);
      ctx.restore();
    }
  }

  private strokeNorm(path: Pt[]) {
    if (path.length < 2) return;
    const { ctx } = this;
    ctx.beginPath();
    const first = this.toCanvas(path[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < path.length; i++) {
      const p = this.toCanvas(path[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  private strokeVariable(path: Pt[], color: string, alpha: number) {
    if (path.length < 2) return;
    const { ctx } = this;
    const base = this.opts.strokeWidth;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.globalAlpha = 0.12 * alpha;
    ctx.lineWidth = base * 1.15;
    this.strokeNorm(path);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    for (let i = 1; i < path.length; i++) {
      const a = this.toCanvas(path[i - 1]);
      const b = this.toCanvas(path[i]);
      const t = i / path.length;
      const taper = 0.65 + 0.35 * Math.sin(t * Math.PI);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineWidth = base * taper;
      ctx.stroke();
    }
    // bright core
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = base * 0.28;
    this.strokeNorm(path);
    ctx.restore();
  }

  private drawCoveredChains() {
    const { ctx } = this;
    let drawing = false;
    for (let i = 0; i < this.samples.length; i++) {
      const s = this.samples[i];
      const prev = this.samples[i - 1];
      const c = this.toCanvas(s);
      if (
        s.covered &&
        prev &&
        prev.covered &&
        prev.pathIndex === s.pathIndex &&
        dist(prev, s) < 0.04
      ) {
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
