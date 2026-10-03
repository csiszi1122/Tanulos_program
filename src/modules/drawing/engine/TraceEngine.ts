import type { DrawingTemplate, Pt } from "./pathMath";
import { dist, pointOnPath, resamplePath } from "./pathMath";

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
  private pad = 28;
  private template: DrawingTemplate | null = null;
  private samples: Sample[] = [];
  private userStrokes: Pt[][] = [];
  private currentStroke: Pt[] | null = null;
  private particles: Particle[] = [];
  private raf = 0;
  private t0 = performance.now();
  private guideT = -1;
  private guidePath = 0;
  private won = false;
  private drawing = false;
  private opts: Required<TraceEngineOptions>;
  private unsubscribers: Array<() => void> = [];

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
    this.userStrokes = [];
    this.currentStroke = null;
    this.guideT = -1;
    this.rebuildSamples();
    this.opts.onCoverage(0);
  }

  clearUser() {
    this.userStrokes = [];
    this.currentStroke = null;
    this.won = false;
    for (const s of this.samples) s.covered = false;
    this.opts.onCoverage(0);
  }

  playGuide() {
    this.guideT = 0;
    this.guidePath = 0;
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
      for (const p of resamplePath(path, 0.014)) {
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
    return {
      x: (x - ox) / size,
      y: (y - oy) / size,
    };
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
        this.burst(p);
        this.opts.onWin();
      }
    }
  }

  private burst(p: Pt) {
    const c = this.toCanvas(p);
    const color = this.template?.color ?? "#fff";
    for (let i = 0; i < 48; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 4;
      this.particles.push({
        x: c.x,
        y: c.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        max: 0.7 + Math.random() * 0.6,
        color,
        size: 3 + Math.random() * 5,
      });
    }
  }

  private spawnTrail(p: Pt) {
    if (Math.random() > 0.45) return;
    const c = this.toCanvas(p);
    this.particles.push({
      x: c.x,
      y: c.y,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2 - 0.4,
      life: 1,
      max: 0.35 + Math.random() * 0.3,
      color: this.template?.color ?? "#fff",
      size: 2 + Math.random() * 3,
    });
  }

  private bindPointer() {
    const el = this.canvas;
    el.style.touchAction = "none";

    const down = (e: PointerEvent) => {
      if (this.won) return;
      el.setPointerCapture(e.pointerId);
      this.drawing = true;
      const n = this.toNorm(e.clientX, e.clientY);
      if (!n) return;
      this.currentStroke = [n];
      this.coverNear(n);
      this.spawnTrail(n);
    };

    const move = (e: PointerEvent) => {
      if (!this.drawing || !this.currentStroke) return;
      const n = this.toNorm(e.clientX, e.clientY);
      if (!n) return;
      const last = this.currentStroke[this.currentStroke.length - 1];
      if (dist(last, n) < 0.004) return;
      this.currentStroke.push(n);
      this.coverNear(n);
      this.spawnTrail(n);
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
        this.userStrokes.push(this.currentStroke);
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
    this.draw(now);
  }

  private tickGuide(dt: number) {
    if (this.guideT < 0 || !this.template) return;
    this.guideT += dt * 0.55;
    const paths = this.template.paths;
    if (this.guideT >= 1) {
      this.guideT = 0;
      this.guidePath += 1;
      if (this.guidePath >= paths.length) {
        this.guideT = -1;
        this.guidePath = 0;
      }
    }
  }

  private tickParticles(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      p.vy += 40 * dt;
      p.life -= dt / p.max;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private draw(now: number) {
    const { ctx, cssW, cssH } = this;
    ctx.clearRect(0, 0, cssW, cssH);

    // soft paper panel
    const grd = ctx.createLinearGradient(0, 0, cssW, cssH);
    grd.addColorStop(0, "rgba(255,255,255,0.14)");
    grd.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = grd;
    roundRect(ctx, 8, 8, cssW - 16, cssH - 16, 28);
    ctx.fill();

    if (!this.template) return;
    const color = this.template.color;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.005);

    // ghost outlines
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([10, 14]);
    ctx.lineDashOffset = -now * 0.04;
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + pulse * 0.12})`;
    ctx.lineWidth = Math.max(3, this.opts.strokeWidth * 0.45);
    for (const path of this.template.paths) this.strokeNorm(path);
    ctx.restore();

    // faint template color underlay
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(4, this.opts.strokeWidth * 0.55);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const path of this.template.paths) this.strokeNorm(path);
    ctx.restore();

    // covered segments glow
    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.lineWidth = this.opts.strokeWidth * 0.7;
    ctx.lineCap = "round";
    this.drawCoveredChains();
    ctx.restore();

    // user strokes
    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineWidth = this.opts.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.92;
    for (const stroke of this.userStrokes) this.strokeNorm(stroke);
    if (this.currentStroke) this.strokeNorm(this.currentStroke);
    ctx.restore();

    // start pulse
    const start = this.template.paths[0]?.[0];
    if (start && !this.won) {
      const c = this.toCanvas(start);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 10 + pulse * 8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.35 + pulse * 0.35})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // guide orb
    if (this.guideT >= 0 && this.template.paths[this.guidePath]) {
      const path = this.template.paths[this.guidePath];
      const gp = pointOnPath(path, this.guideT);
      const c = this.toCanvas(gp);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 14 + pulse * 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 22;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.shadowBlur = 0;
      ctx.fill();

      // trailing guide stroke
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = this.opts.strokeWidth * 0.85;
      ctx.lineCap = "round";
      ctx.beginPath();
      const steps = Math.max(2, Math.floor(this.guideT * 40));
      for (let i = 0; i <= steps; i++) {
        const p = this.toCanvas(pointOnPath(path, (i / steps) * this.guideT));
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();
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

    if (this.won) {
      ctx.save();
      ctx.globalAlpha = 0.15 + 0.1 * pulse;
      ctx.strokeStyle = color;
      ctx.lineWidth = this.opts.strokeWidth * 1.2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 28;
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
      } else {
        if (drawing) {
          ctx.stroke();
          drawing = false;
        }
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
