import type { Pt } from "./pathMath";
import { pointOnPath } from "./pathMath";

export type LifeStyle =
  | "bounce"
  | "swim"
  | "fly"
  | "wiggle"
  | "spin"
  | "pulse"
  | "hop";

export function lifeStyleFor(id: string, category?: string): LifeStyle {
  const key = `${id} ${category ?? ""}`.toLowerCase();
  if (/fish|whale|duck|boat|hajó|hal/.test(key)) return "swim";
  if (/bird|butterfly|plane|rocket|ufo|balloon|madár|pillangó|repülő|rakéta/.test(key))
    return "fly";
  if (/car|bus|train|bike|autó|busz|vonat/.test(key)) return "hop";
  if (/star|sun|planet|moon|csillag|nap|bolygó/.test(key)) return "spin";
  if (/flower|tree|heart|virág|fa|szív/.test(key)) return "pulse";
  if (/cat|dog|fox|bunny|bear|cica|kutya|róka/.test(key)) return "bounce";
  return "wiggle";
}

/** Transform a normalized point for the "come alive" phase. */
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
    case "bounce": {
      const bob = Math.sin(t * 5.2) * 0.028 * s;
      const squash = 1 + Math.sin(t * 5.2) * 0.04 * s;
      return { x: cx + dx * (2 - squash), y: cy + dy * squash + bob };
    }
    case "swim": {
      const wave = Math.sin(t * 3.4 + p.y * 8) * 0.035 * s;
      const bob = Math.sin(t * 2.6) * 0.02 * s;
      return { x: p.x + wave, y: p.y + bob };
    }
    case "fly": {
      const bob = Math.sin(t * 4.2) * 0.04 * s;
      const sway = Math.sin(t * 2.1) * 0.03 * s;
      const flap = 1 + Math.sin(t * 10) * 0.03 * s;
      return { x: cx + dx * flap + sway, y: cy + dy * flap + bob };
    }
    case "wiggle": {
      const a = Math.sin(t * 6) * 0.12 * s;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos + Math.sin(t * 3) * 0.015 * s,
      };
    }
    case "spin": {
      const a = t * 1.8 * s;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const scale = 1 + Math.sin(t * 3) * 0.05 * s;
      return {
        x: cx + (dx * cos - dy * sin) * scale,
        y: cy + (dx * sin + dy * cos) * scale,
      };
    }
    case "pulse": {
      const scale = 1 + Math.sin(t * 4) * 0.07 * s;
      return { x: cx + dx * scale, y: cy + dy * scale };
    }
    case "hop": {
      const hop = Math.abs(Math.sin(t * 4.5)) * 0.045 * s;
      const lean = Math.sin(t * 4.5) * 0.02 * s;
      return { x: p.x + lean, y: p.y - hop };
    }
    default:
      return p;
  }
}

export function lifeAccentPoint(style: LifeStyle, t: number): Pt {
  switch (style) {
    case "swim":
      return pointOnPath(
        [
          { x: 0.2, y: 0.55 },
          { x: 0.5, y: 0.45 },
          { x: 0.8, y: 0.55 },
        ],
        (Math.sin(t * 0.7) + 1) / 2,
      );
    case "fly":
      return { x: 0.5 + Math.sin(t * 1.2) * 0.2, y: 0.3 + Math.cos(t * 1.5) * 0.08 };
    default:
      return { x: 0.5 + Math.sin(t) * 0.1, y: 0.35 + Math.cos(t * 1.3) * 0.06 };
  }
}
