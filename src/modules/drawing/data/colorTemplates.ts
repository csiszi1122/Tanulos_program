import {
  type Pt,
  arc,
  circle,
  closed,
  ellipse,
  heart,
  poly,
  scalePaths,
  star,
} from "../engine/pathMath";

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
  regions: ColorRegion[];
  strokes: ColorStroke[];
};

function normRegions(regions: ColorRegion[]): ColorRegion[] {
  const paths = scalePaths(regions.map((r) => r.points));
  return regions.map((r, i) => ({ ...r, points: paths[i] }));
}

function normStrokes(strokes: ColorStroke[]): ColorStroke[] {
  if (!strokes.length) return [];
  const paths = scalePaths(strokes.map((s) => s.points));
  return strokes.map((s, i) => ({ ...s, points: paths[i] }));
}

function CT(
  id: string,
  title: string,
  emoji: string,
  category: string,
  regions: ColorRegion[],
  strokes: ColorStroke[] = [],
): ColorTemplate {
  // Normalize regions and strokes together so relative layout stays consistent
  const all = [...regions.map((r) => r.points), ...strokes.map((s) => s.points)];
  const scaled = scalePaths(all);
  const nr = regions.map((r, i) => ({ ...r, points: scaled[i] }));
  const ns = strokes.map((s, i) => ({
    ...s,
    points: scaled[regions.length + i],
  }));
  return { id, title, emoji, category, regions: nr, strokes: ns };
}

export const COLOR_CATEGORIES = [
  "Állatok",
  "Járművek",
  "Természet",
  "Ételek",
  "Formák",
  "Űr",
] as const;

export const COLOR_TEMPLATES: ColorTemplate[] = [
  CT(
    "c-house",
    "Ház",
    "🏠",
    "Formák",
    [
      {
        id: "roof",
        label: "Tető",
        points: closed({ x: 0.2, y: 0.45 }, { x: 0.5, y: 0.15 }, { x: 0.8, y: 0.45 }),
      },
      {
        id: "wall",
        label: "Fal",
        points: closed(
          { x: 0.25, y: 0.45 },
          { x: 0.75, y: 0.45 },
          { x: 0.75, y: 0.85 },
          { x: 0.25, y: 0.85 },
        ),
      },
      {
        id: "door",
        label: "Ajtó",
        points: closed(
          { x: 0.42, y: 0.58 },
          { x: 0.58, y: 0.58 },
          { x: 0.58, y: 0.85 },
          { x: 0.42, y: 0.85 },
        ),
      },
      {
        id: "win",
        label: "Ablak",
        points: closed(
          { x: 0.3, y: 0.52 },
          { x: 0.4, y: 0.52 },
          { x: 0.4, y: 0.64 },
          { x: 0.3, y: 0.64 },
        ),
      },
    ],
    [{ id: "chimney", points: poly({ x: 0.62, y: 0.22 }, { x: 0.62, y: 0.38 }) }],
  ),
  CT(
    "c-fish",
    "Hal",
    "🐟",
    "Állatok",
    [
      { id: "body", label: "Test", points: ellipse(0.45, 0.5, 0.28, 0.18) },
      {
        id: "tail",
        label: "Farok",
        points: closed({ x: 0.7, y: 0.5 }, { x: 0.9, y: 0.32 }, { x: 0.9, y: 0.68 }),
      },
      { id: "eye", label: "Szem", points: circle(0.32, 0.46, 0.04, 18) },
    ],
    [{ id: "fin", points: arc(0.48, 0.42, 0.1, Math.PI * 1.1, Math.PI * 1.9, 16) }],
  ),
  CT(
    "c-car",
    "Autó",
    "🚗",
    "Járművek",
    [
      {
        id: "body",
        label: "Karosszéria",
        points: closed(
          { x: 0.12, y: 0.58 },
          { x: 0.2, y: 0.4 },
          { x: 0.4, y: 0.3 },
          { x: 0.7, y: 0.3 },
          { x: 0.9, y: 0.48 },
          { x: 0.9, y: 0.62 },
          { x: 0.12, y: 0.62 },
        ),
      },
      { id: "wheel1", label: "Kerék", points: circle(0.3, 0.66, 0.09, 22) },
      { id: "wheel2", label: "Kerék", points: circle(0.72, 0.66, 0.09, 22) },
      {
        id: "window",
        label: "Ablak",
        points: closed(
          { x: 0.42, y: 0.34 },
          { x: 0.62, y: 0.34 },
          { x: 0.68, y: 0.48 },
          { x: 0.4, y: 0.48 },
        ),
      },
    ],
    [{ id: "stripe", points: poly({ x: 0.2, y: 0.52 }, { x: 0.85, y: 0.52 }) }],
  ),
  CT(
    "c-flower",
    "Virág",
    "🌸",
    "Természet",
    [
      { id: "c", label: "Közép", points: circle(0.5, 0.4, 0.08, 20) },
      { id: "p1", label: "Szirom", points: circle(0.5, 0.24, 0.1, 18) },
      { id: "p2", label: "Szirom", points: circle(0.66, 0.34, 0.1, 18) },
      { id: "p3", label: "Szirom", points: circle(0.62, 0.52, 0.1, 18) },
      { id: "p4", label: "Szirom", points: circle(0.38, 0.52, 0.1, 18) },
      { id: "p5", label: "Szirom", points: circle(0.34, 0.34, 0.1, 18) },
      {
        id: "leaf",
        label: "Levél",
        points: ellipse(0.4, 0.72, 0.1, 0.05, 18, -0.5),
      },
    ],
    [{ id: "stem", points: poly({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.88 }) }],
  ),
  CT(
    "c-rocket",
    "Rakéta",
    "🚀",
    "Űr",
    [
      {
        id: "body",
        label: "Test",
        points: closed(
          { x: 0.5, y: 0.12 },
          { x: 0.66, y: 0.4 },
          { x: 0.66, y: 0.7 },
          { x: 0.34, y: 0.7 },
          { x: 0.34, y: 0.4 },
        ),
      },
      {
        id: "finL",
        label: "Szárny",
        points: closed({ x: 0.34, y: 0.55 }, { x: 0.16, y: 0.75 }, { x: 0.34, y: 0.75 }),
      },
      {
        id: "finR",
        label: "Szárny",
        points: closed({ x: 0.66, y: 0.55 }, { x: 0.84, y: 0.75 }, { x: 0.66, y: 0.75 }),
      },
      { id: "window", label: "Ablak", points: circle(0.5, 0.42, 0.07, 18) },
      {
        id: "flame",
        label: "Láng",
        points: closed({ x: 0.4, y: 0.72 }, { x: 0.5, y: 0.92 }, { x: 0.6, y: 0.72 }),
      },
    ],
  ),
  CT(
    "c-butterfly",
    "Pillangó",
    "🦋",
    "Állatok",
    [
      { id: "w1", label: "Szárny", points: ellipse(0.32, 0.36, 0.16, 0.14, 28, -0.25) },
      { id: "w2", label: "Szárny", points: ellipse(0.68, 0.36, 0.16, 0.14, 28, 0.25) },
      { id: "w3", label: "Szárny", points: ellipse(0.34, 0.6, 0.13, 0.12, 24, 0.2) },
      { id: "w4", label: "Szárny", points: ellipse(0.66, 0.6, 0.13, 0.12, 24, -0.2) },
      { id: "body", label: "Test", points: ellipse(0.5, 0.5, 0.05, 0.22, 20) },
    ],
    [
      {
        id: "ant",
        points: poly({ x: 0.46, y: 0.28 }, { x: 0.4, y: 0.16 }, { x: 0.54, y: 0.28 }, {
          x: 0.6,
          y: 0.16,
        }),
      },
    ],
  ),
  CT(
    "c-icecream",
    "Fagyi",
    "🍦",
    "Ételek",
    [
      {
        id: "cone",
        label: "Tölcsér",
        points: closed({ x: 0.35, y: 0.48 }, { x: 0.65, y: 0.48 }, { x: 0.5, y: 0.92 }),
      },
      { id: "scoop1", label: "Golyó", points: circle(0.5, 0.38, 0.16, 24) },
      { id: "scoop2", label: "Golyó", points: circle(0.38, 0.3, 0.1, 20) },
      { id: "scoop3", label: "Golyó", points: circle(0.62, 0.3, 0.1, 20) },
    ],
  ),
  CT(
    "c-sun",
    "Nap",
    "☀️",
    "Természet",
    [{ id: "core", label: "Napkorong", points: circle(0.5, 0.5, 0.22, 36) }],
    Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      return {
        id: `ray${i}`,
        points: poly(
          { x: 0.5 + Math.cos(a) * 0.28, y: 0.5 + Math.sin(a) * 0.28 },
          { x: 0.5 + Math.cos(a) * 0.42, y: 0.5 + Math.sin(a) * 0.42 },
        ),
      };
    }),
  ),
  CT(
    "c-balloon",
    "Léggömb",
    "🎈",
    "Formák",
    [
      { id: "ball", label: "Gömb", points: ellipse(0.5, 0.38, 0.2, 0.26, 32) },
      {
        id: "knot",
        label: "Csomó",
        points: closed({ x: 0.5, y: 0.64 }, { x: 0.44, y: 0.72 }, { x: 0.56, y: 0.72 }),
      },
    ],
    [
      {
        id: "string",
        points: poly({ x: 0.5, y: 0.72 }, { x: 0.48, y: 0.82 }, { x: 0.52, y: 0.9 }, {
          x: 0.5,
          y: 0.96,
        }),
      },
    ],
  ),
  CT(
    "c-cat",
    "Cica",
    "🐱",
    "Állatok",
    [
      { id: "face", label: "Fej", points: circle(0.5, 0.52, 0.24, 36) },
      {
        id: "earL",
        label: "Fül",
        points: closed({ x: 0.32, y: 0.35 }, { x: 0.28, y: 0.14 }, { x: 0.44, y: 0.32 }),
      },
      {
        id: "earR",
        label: "Fül",
        points: closed({ x: 0.68, y: 0.35 }, { x: 0.72, y: 0.14 }, { x: 0.56, y: 0.32 }),
      },
      { id: "nose", label: "Orr", points: circle(0.5, 0.55, 0.035, 14) },
    ],
    [
      { id: "smile", points: arc(0.5, 0.58, 0.08, 0.2, Math.PI - 0.2, 16) },
      { id: "whiskL", points: poly({ x: 0.42, y: 0.56 }, { x: 0.22, y: 0.52 }) },
      { id: "whiskR", points: poly({ x: 0.58, y: 0.56 }, { x: 0.78, y: 0.52 }) },
    ],
  ),
  CT(
    "c-boat",
    "Hajó",
    "⛵",
    "Járművek",
    [
      {
        id: "hull",
        label: "Hajótest",
        points: closed(
          { x: 0.18, y: 0.6 },
          { x: 0.28, y: 0.8 },
          { x: 0.72, y: 0.8 },
          { x: 0.82, y: 0.6 },
        ),
      },
      {
        id: "sail",
        label: "Vitorla",
        points: closed({ x: 0.5, y: 0.2 }, { x: 0.78, y: 0.55 }, { x: 0.5, y: 0.55 }),
      },
    ],
    [{ id: "mast", points: poly({ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.6 }) }],
  ),
  CT(
    "c-tree",
    "Fa",
    "🌳",
    "Természet",
    [
      {
        id: "trunk",
        label: "Törzs",
        points: closed(
          { x: 0.42, y: 0.55 },
          { x: 0.58, y: 0.55 },
          { x: 0.58, y: 0.9 },
          { x: 0.42, y: 0.9 },
        ),
      },
      { id: "leaves1", label: "Lomb", points: circle(0.5, 0.35, 0.22, 28) },
      { id: "leaves2", label: "Lomb", points: circle(0.35, 0.42, 0.14, 22) },
      { id: "leaves3", label: "Lomb", points: circle(0.65, 0.42, 0.14, 22) },
    ],
  ),
  CT(
    "c-heart",
    "Szív",
    "❤️",
    "Formák",
    [{ id: "heart", label: "Szív", points: heart(0.5, 0.48, 0.3) }],
  ),
  CT(
    "c-star",
    "Csillag",
    "⭐",
    "Formák",
    [{ id: "star", label: "Csillag", points: star(0.5, 0.5, 5, 0.34, 0.15) }],
  ),
  CT(
    "c-pizza",
    "Pizza",
    "🍕",
    "Ételek",
    [
      {
        id: "slice",
        label: "Szelet",
        points: closed({ x: 0.5, y: 0.15 }, { x: 0.88, y: 0.85 }, { x: 0.12, y: 0.85 }),
      },
      { id: "top1", label: "Feltét", points: circle(0.45, 0.45, 0.05, 14) },
      { id: "top2", label: "Feltét", points: circle(0.58, 0.58, 0.05, 14) },
      { id: "top3", label: "Feltét", points: circle(0.4, 0.65, 0.045, 14) },
    ],
  ),
  CT(
    "c-ufo",
    "UFO",
    "🛸",
    "Űr",
    [
      { id: "dome", label: "Kupola", points: ellipse(0.5, 0.42, 0.16, 0.12, 28) },
      { id: "saucer", label: "Tányér", points: ellipse(0.5, 0.52, 0.34, 0.1, 36) },
    ],
    [
      { id: "beam1", points: poly({ x: 0.35, y: 0.6 }, { x: 0.3, y: 0.78 }) },
      { id: "beam2", points: poly({ x: 0.5, y: 0.62 }, { x: 0.5, y: 0.82 }) },
      { id: "beam3", points: poly({ x: 0.65, y: 0.6 }, { x: 0.7, y: 0.78 }) },
    ],
  ),
  CT(
    "c-apple",
    "Alma",
    "🍎",
    "Ételek",
    [
      { id: "body", label: "Alma", points: circle(0.5, 0.55, 0.26, 36) },
      { id: "leaf", label: "Levél", points: ellipse(0.6, 0.28, 0.09, 0.045, 16, -0.7) },
    ],
    [{ id: "stem", points: poly({ x: 0.5, y: 0.32 }, { x: 0.52, y: 0.18 }) }],
  ),
  CT(
    "c-duck",
    "Kacsa",
    "🦆",
    "Állatok",
    [
      { id: "body", label: "Test", points: ellipse(0.45, 0.58, 0.24, 0.14, 28) },
      { id: "head", label: "Fej", points: circle(0.68, 0.42, 0.12, 24) },
      {
        id: "beak",
        label: "Csőr",
        points: closed({ x: 0.78, y: 0.42 }, { x: 0.95, y: 0.4 }, { x: 0.78, y: 0.5 }),
      },
    ],
  ),
  CT(
    "c-bus",
    "Busz",
    "🚌",
    "Járművek",
    [
      {
        id: "body",
        label: "Busz",
        points: closed(
          { x: 0.1, y: 0.35 },
          { x: 0.9, y: 0.35 },
          { x: 0.9, y: 0.7 },
          { x: 0.1, y: 0.7 },
        ),
      },
      {
        id: "w1",
        label: "Ablak",
        points: closed(
          { x: 0.18, y: 0.4 },
          { x: 0.36, y: 0.4 },
          { x: 0.36, y: 0.55 },
          { x: 0.18, y: 0.55 },
        ),
      },
      {
        id: "w2",
        label: "Ablak",
        points: closed(
          { x: 0.42, y: 0.4 },
          { x: 0.6, y: 0.4 },
          { x: 0.6, y: 0.55 },
          { x: 0.42, y: 0.55 },
        ),
      },
      { id: "wheel1", label: "Kerék", points: circle(0.28, 0.74, 0.08, 18) },
      { id: "wheel2", label: "Kerék", points: circle(0.72, 0.74, 0.08, 18) },
    ],
  ),
  CT(
    "c-mushroom",
    "Gomba",
    "🍄",
    "Természet",
    [
      {
        id: "cap",
        label: "Kalap",
        points: [
          ...arc(0.5, 0.5, 0.3, Math.PI, 0, 28),
          { x: 0.8, y: 0.5 },
          { x: 0.2, y: 0.5 },
        ],
      },
      {
        id: "stem",
        label: "Tönk",
        points: closed(
          { x: 0.4, y: 0.5 },
          { x: 0.6, y: 0.5 },
          { x: 0.58, y: 0.88 },
          { x: 0.42, y: 0.88 },
        ),
      },
      { id: "spot1", label: "Pötty", points: circle(0.4, 0.38, 0.045, 12) },
      { id: "spot2", label: "Pötty", points: circle(0.58, 0.32, 0.04, 12) },
    ],
  ),
  CT(
    "c-crown",
    "Korona",
    "👑",
    "Formák",
    [
      {
        id: "crown",
        label: "Korona",
        points: closed(
          { x: 0.15, y: 0.68 },
          { x: 0.15, y: 0.42 },
          { x: 0.3, y: 0.58 },
          { x: 0.5, y: 0.25 },
          { x: 0.7, y: 0.58 },
          { x: 0.85, y: 0.42 },
          { x: 0.85, y: 0.68 },
        ),
      },
      { id: "jewel", label: "Ékkő", points: circle(0.5, 0.22, 0.05, 14) },
    ],
  ),
  CT(
    "c-planet",
    "Bolygó",
    "🪐",
    "Űr",
    [{ id: "planet", label: "Bolygó", points: circle(0.5, 0.5, 0.22, 36) }],
    [{ id: "ring", points: ellipse(0.5, 0.5, 0.38, 0.1, 40, -0.35) }],
  ),
  CT(
    "c-gift",
    "Ajándék",
    "🎁",
    "Formák",
    [
      {
        id: "box",
        label: "Doboz",
        points: closed(
          { x: 0.22, y: 0.42 },
          { x: 0.78, y: 0.42 },
          { x: 0.78, y: 0.85 },
          { x: 0.22, y: 0.85 },
        ),
      },
      {
        id: "lid",
        label: "Fedő",
        points: closed(
          { x: 0.18, y: 0.28 },
          { x: 0.82, y: 0.28 },
          { x: 0.82, y: 0.45 },
          { x: 0.18, y: 0.45 },
        ),
      },
    ],
    [
      { id: "ribbonV", points: poly({ x: 0.5, y: 0.28 }, { x: 0.5, y: 0.85 }) },
      { id: "ribbonH", points: poly({ x: 0.22, y: 0.55 }, { x: 0.78, y: 0.55 }) },
    ],
  ),
  CT(
    "c-penguin",
    "Pingvin",
    "🐧",
    "Állatok",
    [
      { id: "body", label: "Test", points: ellipse(0.5, 0.55, 0.2, 0.28, 32) },
      { id: "belly", label: "Has", points: ellipse(0.5, 0.6, 0.11, 0.16, 24) },
      { id: "head", label: "Fej", points: circle(0.5, 0.3, 0.12, 24) },
      {
        id: "beak",
        label: "Csőr",
        points: closed({ x: 0.5, y: 0.32 }, { x: 0.44, y: 0.4 }, { x: 0.56, y: 0.4 }),
      },
    ],
  ),
];

// silence unused helper warnings if tree-shaken oddly
void normRegions;
void normStrokes;

export function colorTemplatesByCategory(category: string): ColorTemplate[] {
  return COLOR_TEMPLATES.filter((t) => t.category === category);
}
