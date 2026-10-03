export type Pt = { x: number; y: number };

export type DrawingTemplate = {
  id: string;
  title: string;
  emoji: string;
  category: string;
  color: string;
  /** Normalized paths in 0..1 space */
  paths: Pt[][];
};

export function dist(a: Pt, b: Pt): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Resample polyline to roughly equal spacing in normalized space. */
export function resamplePath(points: Pt[], spacing = 0.012): Pt[] {
  if (points.length < 2) return [...points];
  const out: Pt[] = [{ ...points[0] }];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    let a = points[i - 1];
    const b = points[i];
    let seg = dist(a, b);
    if (seg < 1e-8) continue;
    while (carry + seg >= spacing) {
      const t = (spacing - carry) / seg;
      const p = lerp(a, b, t);
      out.push(p);
      a = p;
      seg = dist(a, b);
      carry = 0;
    }
    carry += seg;
  }
  const last = points[points.length - 1];
  if (dist(out[out.length - 1], last) > spacing * 0.25) out.push({ ...last });
  return out;
}

export function pathLength(points: Pt[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) len += dist(points[i - 1], points[i]);
  return len;
}

export function pointOnPath(points: Pt[], t: number): Pt {
  if (points.length === 0) return { x: 0.5, y: 0.5 };
  if (points.length === 1) return { ...points[0] };
  const total = pathLength(points);
  if (total < 1e-8) return { ...points[0] };
  let target = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const seg = dist(a, b);
    if (target <= seg) return lerp(a, b, seg < 1e-8 ? 0 : target / seg);
    target -= seg;
  }
  return { ...points[points.length - 1] };
}

export function circle(cx: number, cy: number, r: number, steps = 48): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

export function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  steps = 48,
  rot = 0,
): Pt[] {
  const pts: Pt[] = [];
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const lx = Math.cos(a) * rx;
    const ly = Math.sin(a) * ry;
    pts.push({ x: cx + lx * cos - ly * sin, y: cy + lx * sin + ly * cos });
  }
  return pts;
}

export function arc(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  steps = 24,
): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = a0 + (a1 - a0) * t;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

export function poly(...pts: Pt[]): Pt[] {
  return pts;
}

export function closed(...pts: Pt[]): Pt[] {
  if (!pts.length) return [];
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (dist(first, last) < 1e-6) return pts;
  return [...pts, { ...first }];
}

export function star(
  cx: number,
  cy: number,
  spikes: number,
  outer: number,
  inner: number,
): Pt[] {
  const pts: Pt[] = [];
  const step = Math.PI / spikes;
  let rot = -Math.PI / 2;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    pts.push({ x: cx + Math.cos(rot) * r, y: cy + Math.sin(rot) * r });
    rot += step;
  }
  return closed(...pts);
}

export function heart(cx: number, cy: number, s = 0.22): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y =
      -(
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      );
    pts.push({ x: cx + (x / 18) * s, y: cy + (y / 18) * s + s * 0.05 });
  }
  return pts;
}

export function line(a: Pt, b: Pt, steps = 12): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) pts.push(lerp(a, b, i / steps));
  return pts;
}

export function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps = 28): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
      y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
    });
  }
  return pts;
}

/** Chaikin corner-cutting for organic, ink-like curves. */
export function smoothPath(points: Pt[], iterations = 2): Pt[] {
  let pts = points;
  for (let n = 0; n < iterations; n++) {
    if (pts.length < 3) break;
    const next: Pt[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      next.push(lerp(a, b, 0.25), lerp(a, b, 0.75));
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

/**
 * Minimal SVG path parser (M L C Q Z + implicit).
 * Coordinates are expected in a square viewBox (default 0..100).
 */
export function svgPath(d: string, view = 100): Pt[] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  let i = 0;
  let cmd = "M";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  const out: Pt[] = [];
  const push = (px: number, py: number) => {
    out.push({ x: px / view, y: py / view });
    x = px;
    y = py;
  };
  const num = () => Number(tokens[i++]);

  while (i < tokens.length) {
    const t = tokens[i];
    if (/[a-zA-Z]/.test(t)) {
      cmd = t;
      i++;
    }
    const rel = cmd === cmd.toLowerCase();
    const c = cmd.toUpperCase();
    if (c === "M") {
      const nx = num() + (rel ? x : 0);
      const ny = num() + (rel ? y : 0);
      push(nx, ny);
      sx = x;
      sy = y;
      cmd = rel ? "l" : "L";
    } else if (c === "L") {
      push(num() + (rel ? x : 0), num() + (rel ? y : 0));
    } else if (c === "H") {
      push(num() + (rel ? x : 0), y);
    } else if (c === "V") {
      push(x, num() + (rel ? y : 0));
    } else if (c === "C") {
      const x1 = num() + (rel ? x : 0);
      const y1 = num() + (rel ? y : 0);
      const x2 = num() + (rel ? x : 0);
      const y2 = num() + (rel ? y : 0);
      const x3 = num() + (rel ? x : 0);
      const y3 = num() + (rel ? y : 0);
      const curve = bezier(
        { x: x / view, y: y / view },
        { x: x1 / view, y: y1 / view },
        { x: x2 / view, y: y2 / view },
        { x: x3 / view, y: y3 / view },
        24,
      );
      for (let k = 1; k < curve.length; k++) out.push(curve[k]);
      x = x3;
      y = y3;
    } else if (c === "Q") {
      const x1 = num() + (rel ? x : 0);
      const y1 = num() + (rel ? y : 0);
      const x2 = num() + (rel ? x : 0);
      const y2 = num() + (rel ? y : 0);
      // Elevate quadratic to cubic
      const c1x = x + (2 / 3) * (x1 - x);
      const c1y = y + (2 / 3) * (y1 - y);
      const c2x = x2 + (2 / 3) * (x1 - x2);
      const c2y = y2 + (2 / 3) * (y1 - y2);
      const curve = bezier(
        { x: x / view, y: y / view },
        { x: c1x / view, y: c1y / view },
        { x: c2x / view, y: c2y / view },
        { x: x2 / view, y: y2 / view },
        20,
      );
      for (let k = 1; k < curve.length; k++) out.push(curve[k]);
      x = x2;
      y = y2;
    } else if (c === "Z") {
      if (out.length && dist(out[out.length - 1], { x: sx / view, y: sy / view }) > 1e-6) {
        out.push({ x: sx / view, y: sy / view });
      }
      x = sx;
      y = sy;
    } else {
      // unknown — skip one number to avoid infinite loop
      i++;
    }
  }
  return out;
}

/** Fit all paths into the unit square with padding — never overflow the canvas. */
export function scalePaths(paths: Pt[][], pad = 0.12): Pt[][] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;
  for (const path of paths) {
    for (const p of path) {
      any = true;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!any) return paths;
  const w = Math.max(1e-6, maxX - minX);
  const h = Math.max(1e-6, maxY - minY);
  const usable = 1 - pad * 2;
  const scale = usable / Math.max(w, h);
  const contentW = w * scale;
  const contentH = h * scale;
  const ox = (1 - contentW) / 2;
  const oy = (1 - contentH) / 2;
  const clamp = (v: number) => Math.min(1 - pad * 0.25, Math.max(pad * 0.25, v));
  return paths.map((path) =>
    path.map((p) => ({
      x: clamp(ox + (p.x - minX) * scale),
      y: clamp(oy + (p.y - minY) * scale),
    })),
  );
}

export function pointInPoly(p: Pt, poly: Pt[]): boolean {
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
