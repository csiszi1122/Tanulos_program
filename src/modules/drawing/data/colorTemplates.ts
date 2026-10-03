import {
  type Pt,
  closed,
  scalePaths,
  smoothPath,
  svgPath,
} from "../engine/pathMath";
import { PREMIUM_ART, type ArtDef } from "./premiumArt";

export type ColorRegion = {
  id: string;
  label: string;
  points: Pt[];
};

export type ColorStroke = {
  id: string;
  points: Pt[];
};

export type ColorTemplate = {
  id: string;
  title: string;
  emoji: string;
  category: string;
  life: ArtDef["life"];
  regions: ColorRegion[];
  strokes: ColorStroke[];
};

function ink(d: string, view = 200, smooth = 1): Pt[] {
  const pts = svgPath(d, view);
  return smooth > 0 ? smoothPath(pts, smooth) : pts;
}

function fromArt(art: ArtDef): ColorTemplate {
  const regions: ColorRegion[] = art.regions.map((r) => ({
    id: r.id,
    label: r.label,
    points: closed(...ink(r.d)),
  }));
  const strokes: ColorStroke[] = (art.strokes ?? []).map((s) => ({
    id: s.id,
    points: ink(s.d, 200, 0),
  }));
  const all = [...regions.map((r) => r.points), ...strokes.map((s) => s.points)];
  const scaled = scalePaths(all, 0.13);
  return {
    id: art.id,
    title: art.title,
    emoji: art.emoji,
    category: art.category,
    life: art.life,
    regions: regions.map((r, i) => ({ ...r, points: scaled[i] })),
    strokes: strokes.map((s, i) => ({
      ...s,
      points: scaled[regions.length + i],
    })),
  };
}

export const COLOR_CATEGORIES = [
  "Állatok",
  "Járművek",
  "Természet",
  "Ételek",
  "Formák",
  "Űr",
] as const;

export const COLOR_TEMPLATES: ColorTemplate[] = PREMIUM_ART.map(fromArt);

export function colorTemplatesByCategory(category: string): ColorTemplate[] {
  return COLOR_TEMPLATES.filter((t) => t.category === category);
}
