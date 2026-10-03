import type { Pt } from "./pathMath";

export type LifeStyle =
  | "walk"
  | "fly"
  | "swim"
  | "drive"
  | "flutter"
  | "float"
  | "spin"
  | "bloom"
  | "sway"
  | "hop"
  | "wiggle";

export function lifeStyleFor(
  id: string,
  category?: string,
  explicit?: LifeStyle,
): LifeStyle {
  if (explicit) return explicit;
  const key = `${id} ${category ?? ""}`.toLowerCase();
  if (/butterfly|pillangó|insect|bogár|flutter/.test(key)) return "flutter";
  if (/fish|whale|duck|boat|hajó|hal|swim/.test(key)) return "swim";
  if (/bird|madár|soar|flap/.test(key)) return "fly";
  if (/plane|rocket|ufo|balloon|repülő|rakéta/.test(key)) return "fly";
  if (/car|bus|train|bike|autó|busz|vonat|drive/.test(key)) return "drive";
  if (/bunny|nyuszi|hop/.test(key)) return "hop";
  if (/star|sun|planet|moon|csillag|nap|bolygó/.test(key)) return "spin";
  if (/flower|tree|plant|virág|fa|növény|sway|bloom/.test(key)) return "sway";
  if (/heart|szív/.test(key)) return "bloom";
  if (/cat|dog|fox|bear|horse|cica|kutya|róka|ló|walk|trot/.test(key)) return "walk";
  return "wiggle";
}

/**
 * Character-specific "come alive" motion in normalized space.
 * Includes travel (walk/drive/fly paths), not only in-place bobbing.
 */
export function lifeTransform(
  p: Pt,
  style: LifeStyle,
  t: number,
  intensity = 1,
): Pt {
  const s = intensity;
  const cx = 0.5;
  const cy = 0.52;
  const dx = p.x - cx;
  const dy = p.y - cy;

  switch (style) {
    case "walk": {
      // Cat/dog: stroll left-right + leg-cycle bob
      const travel = Math.sin(t * 0.85) * 0.1 * s;
      const bob = Math.abs(Math.sin(t * 6.5)) * 0.022 * s;
      const lean = Math.sin(t * 6.5) * 0.018 * s;
      return { x: p.x + travel + lean * dy * 2, y: p.y - bob };
    }
    case "hop": {
      const travel = Math.sin(t * 1.1) * 0.08 * s;
      const hop = Math.max(0, Math.sin(t * 5.2)) * 0.07 * s;
      return { x: p.x + travel, y: p.y - hop };
    }
    case "drive": {
      // Car/bus: drive across with slight suspension bounce + wheel lean
      const travel = Math.sin(t * 0.7) * 0.14 * s;
      const bounce = Math.abs(Math.sin(t * 8)) * 0.012 * s;
      const nose = Math.sin(t * 0.7) * 0.025 * s;
      return {
        x: p.x + travel,
        y: p.y - bounce + nose * (p.x - 0.5),
      };
    }
    case "swim": {
      const travel = Math.sin(t * 0.75) * 0.1 * s;
      const wave = Math.sin(t * 3.2 + p.y * 10) * 0.03 * s;
      const bob = Math.sin(t * 2.4) * 0.018 * s;
      return { x: p.x + travel + wave, y: p.y + bob };
    }
    case "fly": {
      const travelX = Math.sin(t * 0.9) * 0.12 * s;
      const travelY = Math.cos(t * 1.1) * 0.06 * s;
      const bank = Math.sin(t * 0.9) * 0.08 * s;
      return {
        x: cx + dx * Math.cos(bank) - dy * Math.sin(bank) + travelX,
        y: cy + dx * Math.sin(bank) + dy * Math.cos(bank) + travelY,
      };
    }
    case "flutter": {
      // Butterfly: figure-8 path + rapid wing flap scale
      const fx = Math.sin(t * 1.4) * 0.14 * s;
      const fy = Math.sin(t * 2.8) * 0.07 * s;
      const flap = 1 + Math.sin(t * 14) * 0.08 * s;
      return { x: cx + dx * flap + fx, y: cy + dy * (2 - flap) + fy };
    }
    case "spin": {
      const a = t * 1.6 * s;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const scale = 1 + Math.sin(t * 3) * 0.06 * s;
      return {
        x: cx + (dx * cos - dy * sin) * scale,
        y: cy + (dx * sin + dy * cos) * scale,
      };
    }
    case "bloom": {
      const scale = 1 + Math.sin(t * 2.2) * 0.08 * s + Math.sin(t * 0.5) * 0.03 * s;
      const swayAmt = Math.sin(t * 1.5) * 0.02 * s;
      return { x: cx + dx * scale + swayAmt, y: cy + dy * scale };
    }
    case "sway": {
      // Flower/plant: gentle stem lean from the base
      const lean = Math.sin(t * 1.35) * 0.06 * s;
      const bob = Math.sin(t * 2.1) * 0.012 * s;
      const height = Math.max(0, 0.85 - p.y);
      return {
        x: p.x + lean * height,
        y: p.y - bob * height,
      };
    }
    case "float": {
      const bob = Math.sin(t * 2) * 0.035 * s;
      const drift = Math.sin(t * 0.8) * 0.04 * s;
      return { x: p.x + drift, y: p.y + bob };
    }
    case "wiggle":
    default: {
      const a = Math.sin(t * 5) * 0.1 * s;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos + Math.sin(t * 2.5) * 0.015 * s,
      };
    }
  }
}

export function lifeAccentPoint(style: LifeStyle, t: number): Pt {
  switch (style) {
    case "drive":
      return { x: 0.5 + Math.sin(t * 0.7) * 0.2, y: 0.72 };
    case "walk":
    case "hop":
      return { x: 0.5 + Math.sin(t * 0.85) * 0.15, y: 0.78 };
    case "swim":
      return { x: 0.5 + Math.sin(t * 0.75) * 0.18, y: 0.55 + Math.sin(t * 2) * 0.05 };
    case "fly":
    case "flutter":
      return { x: 0.5 + Math.sin(t * 1.3) * 0.2, y: 0.35 + Math.cos(t * 1.6) * 0.1 };
    case "sway":
    case "bloom":
      return { x: 0.5 + Math.sin(t * 1.35) * 0.08, y: 0.28 + Math.sin(t * 2) * 0.04 };
    default:
      return { x: 0.5 + Math.sin(t) * 0.1, y: 0.35 + Math.cos(t * 1.3) * 0.06 };
  }
}
