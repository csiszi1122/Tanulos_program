import {
  type DrawingTemplate,
  type Pt,
  arc,
  bezier,
  circle,
  closed,
  ellipse,
  heart,
  line,
  poly,
  scalePaths,
  star,
} from "../engine/pathMath";

export type { DrawingTemplate };

function T(
  id: string,
  title: string,
  emoji: string,
  category: string,
  color: string,
  paths: Pt[][],
): DrawingTemplate {
  return { id, title, emoji, category, color, paths: scalePaths(paths) };
}

const COLORS = {
  coral: "#fb7185",
  amber: "#fbbf24",
  lime: "#a3e635",
  cyan: "#22d3ee",
  sky: "#38bdf8",
  violet: "#a78bfa",
  pink: "#f472b6",
  orange: "#fb923c",
  mint: "#34d399",
  yellow: "#facc15",
  blue: "#60a5fa",
  rose: "#fda4af",
};

export const DRAWING_CATEGORIES = [
  "Állatok",
  "Járművek",
  "Természet",
  "Ételek",
  "Formák",
  "Űr",
  "Betűk",
  "Számok",
] as const;

export const DRAWING_TEMPLATES: DrawingTemplate[] = [
  // —— Állatok ——
  T("cat", "Cica", "🐱", "Állatok", COLORS.orange, [
    circle(0.5, 0.48, 0.22),
    poly({ x: 0.32, y: 0.32 }, { x: 0.28, y: 0.12 }, { x: 0.42, y: 0.3 }),
    poly({ x: 0.68, y: 0.32 }, { x: 0.72, y: 0.12 }, { x: 0.58, y: 0.3 }),
    arc(0.5, 0.52, 0.08, 0.2, Math.PI - 0.2),
    circle(0.42, 0.44, 0.025, 16),
    circle(0.58, 0.44, 0.025, 16),
  ]),
  T("dog", "Kutya", "🐶", "Állatok", COLORS.amber, [
    ellipse(0.5, 0.5, 0.24, 0.2),
    ellipse(0.28, 0.42, 0.08, 0.14, 24, 0.4),
    ellipse(0.72, 0.42, 0.08, 0.14, 24, -0.4),
    circle(0.5, 0.55, 0.05, 16),
    circle(0.42, 0.45, 0.02, 12),
    circle(0.58, 0.45, 0.02, 12),
  ]),
  T("fish", "Hal", "🐟", "Állatok", COLORS.sky, [
    ellipse(0.48, 0.5, 0.26, 0.16),
    closed({ x: 0.72, y: 0.5 }, { x: 0.9, y: 0.32 }, { x: 0.9, y: 0.68 }),
    circle(0.36, 0.46, 0.03, 14),
  ]),
  T("bird", "Madár", "🐦", "Állatok", COLORS.cyan, [
    ellipse(0.48, 0.52, 0.2, 0.14),
    circle(0.68, 0.42, 0.1, 24),
    poly({ x: 0.28, y: 0.5 }, { x: 0.12, y: 0.32 }, { x: 0.18, y: 0.55 }),
    poly({ x: 0.74, y: 0.42 }, { x: 0.86, y: 0.4 }),
    circle(0.7, 0.4, 0.02, 10),
  ]),
  T("butterfly", "Pillangó", "🦋", "Állatok", COLORS.violet, [
    line({ x: 0.5, y: 0.22 }, { x: 0.5, y: 0.78 }, 16),
    ellipse(0.34, 0.38, 0.16, 0.14, 32, -0.3),
    ellipse(0.66, 0.38, 0.16, 0.14, 32, 0.3),
    ellipse(0.36, 0.62, 0.13, 0.12, 28, 0.25),
    ellipse(0.64, 0.62, 0.13, 0.12, 28, -0.25),
  ]),
  T("bunny", "Nyuszi", "🐰", "Állatok", COLORS.pink, [
    circle(0.5, 0.58, 0.2),
    ellipse(0.4, 0.3, 0.06, 0.18, 24),
    ellipse(0.6, 0.3, 0.06, 0.18, 24),
    circle(0.43, 0.55, 0.025, 12),
    circle(0.57, 0.55, 0.025, 12),
    arc(0.5, 0.62, 0.06, 0.2, Math.PI - 0.2),
  ]),
  T("bear", "Maci", "🐻", "Állatok", COLORS.amber, [
    circle(0.5, 0.52, 0.24),
    circle(0.3, 0.32, 0.1, 24),
    circle(0.7, 0.32, 0.1, 24),
    circle(0.42, 0.5, 0.03, 12),
    circle(0.58, 0.5, 0.03, 12),
    ellipse(0.5, 0.6, 0.07, 0.05, 20),
  ]),
  T("elephant", "Elefánt", "🐘", "Állatok", COLORS.blue, [
    ellipse(0.48, 0.48, 0.22, 0.18),
    circle(0.7, 0.42, 0.12, 24),
    bezier(
      { x: 0.78, y: 0.48 },
      { x: 0.9, y: 0.55 },
      { x: 0.82, y: 0.78 },
      { x: 0.7, y: 0.82 },
    ),
    ellipse(0.28, 0.48, 0.08, 0.14, 20),
    circle(0.72, 0.4, 0.025, 10),
  ]),
  T("duck", "Kacsa", "🦆", "Állatok", COLORS.yellow, [
    ellipse(0.48, 0.58, 0.24, 0.14),
    circle(0.68, 0.42, 0.12, 24),
    poly({ x: 0.78, y: 0.42 }, { x: 0.95, y: 0.4 }, { x: 0.78, y: 0.48 }),
    circle(0.7, 0.4, 0.02, 10),
  ]),
  T("owl", "Bagoly", "🦉", "Állatok", COLORS.violet, [
    ellipse(0.5, 0.52, 0.22, 0.26),
    circle(0.4, 0.48, 0.08, 20),
    circle(0.6, 0.48, 0.08, 20),
    circle(0.4, 0.48, 0.03, 12),
    circle(0.6, 0.48, 0.03, 12),
    poly({ x: 0.5, y: 0.55 }, { x: 0.45, y: 0.62 }, { x: 0.55, y: 0.62 }),
  ]),
  T("snail", "Csiga", "🐌", "Állatok", COLORS.lime, [
    circle(0.55, 0.48, 0.2),
    circle(0.55, 0.48, 0.12, 24),
    bezier(
      { x: 0.35, y: 0.55 },
      { x: 0.2, y: 0.6 },
      { x: 0.15, y: 0.45 },
      { x: 0.22, y: 0.35 },
    ),
    circle(0.2, 0.3, 0.03, 10),
    circle(0.26, 0.28, 0.03, 10),
  ]),
  T("crab", "Rák", "🦀", "Állatok", COLORS.coral, [
    ellipse(0.5, 0.52, 0.22, 0.14),
    circle(0.38, 0.48, 0.04, 12),
    circle(0.62, 0.48, 0.04, 12),
    arc(0.28, 0.45, 0.12, Math.PI * 0.2, Math.PI * 1.1, 20),
    arc(0.72, 0.45, 0.12, -0.1, Math.PI * 0.8, 20),
    line({ x: 0.4, y: 0.64 }, { x: 0.38, y: 0.78 }, 8),
    line({ x: 0.5, y: 0.66 }, { x: 0.5, y: 0.8 }, 8),
    line({ x: 0.6, y: 0.64 }, { x: 0.62, y: 0.78 }, 8),
  ]),
  T("fox", "Róka", "🦊", "Állatok", COLORS.orange, [
    closed(
      { x: 0.5, y: 0.28 },
      { x: 0.78, y: 0.55 },
      { x: 0.62, y: 0.78 },
      { x: 0.38, y: 0.78 },
      { x: 0.22, y: 0.55 },
    ),
    poly({ x: 0.28, y: 0.4 }, { x: 0.18, y: 0.18 }, { x: 0.38, y: 0.35 }),
    poly({ x: 0.72, y: 0.4 }, { x: 0.82, y: 0.18 }, { x: 0.62, y: 0.35 }),
    circle(0.42, 0.52, 0.025, 10),
    circle(0.58, 0.52, 0.025, 10),
  ]),
  T("whale", "Bálna", "🐋", "Állatok", COLORS.blue, [
    ellipse(0.48, 0.52, 0.3, 0.16),
    closed({ x: 0.75, y: 0.5 }, { x: 0.92, y: 0.3 }, { x: 0.88, y: 0.55 }, { x: 0.92, y: 0.7 }),
    circle(0.3, 0.48, 0.03, 12),
    arc(0.42, 0.42, 0.08, Math.PI * 1.1, Math.PI * 1.8, 12),
  ]),
  T("dino", "Dínó", "🦕", "Állatok", COLORS.mint, [
    ellipse(0.45, 0.55, 0.22, 0.14),
    bezier(
      { x: 0.62, y: 0.48 },
      { x: 0.75, y: 0.3 },
      { x: 0.82, y: 0.28 },
      { x: 0.88, y: 0.38 },
    ),
    circle(0.88, 0.38, 0.07, 18),
    bezier(
      { x: 0.28, y: 0.58 },
      { x: 0.15, y: 0.7 },
      { x: 0.12, y: 0.55 },
      { x: 0.18, y: 0.42 },
    ),
    line({ x: 0.38, y: 0.68 }, { x: 0.36, y: 0.82 }, 8),
    line({ x: 0.52, y: 0.68 }, { x: 0.54, y: 0.82 }, 8),
    circle(0.9, 0.36, 0.015, 8),
  ]),
  T("turtle", "Teknős", "🐢", "Állatok", COLORS.lime, [
    ellipse(0.5, 0.5, 0.26, 0.18),
    circle(0.78, 0.5, 0.1, 20),
    ellipse(0.28, 0.42, 0.07, 0.05, 16),
    ellipse(0.28, 0.58, 0.07, 0.05, 16),
    ellipse(0.62, 0.68, 0.07, 0.05, 16),
    circle(0.82, 0.48, 0.02, 8),
  ]),
  T("frog", "Béka", "🐸", "Állatok", COLORS.lime, [
    ellipse(0.5, 0.55, 0.24, 0.16),
    circle(0.38, 0.4, 0.1, 20),
    circle(0.62, 0.4, 0.1, 20),
    circle(0.38, 0.4, 0.04, 12),
    circle(0.62, 0.4, 0.04, 12),
    arc(0.5, 0.58, 0.1, 0.15, Math.PI - 0.15),
  ]),
  T("penguin", "Pingvin", "🐧", "Állatok", COLORS.sky, [
    ellipse(0.5, 0.52, 0.18, 0.28),
    ellipse(0.5, 0.58, 0.1, 0.16),
    circle(0.5, 0.28, 0.1, 20),
    circle(0.46, 0.28, 0.02, 8),
    circle(0.54, 0.28, 0.02, 8),
    poly({ x: 0.5, y: 0.32 }, { x: 0.45, y: 0.38 }, { x: 0.55, y: 0.38 }),
  ]),

  // —— Járművek ——
  T("car", "Autó", "🚗", "Járművek", COLORS.coral, [
    closed(
      { x: 0.12, y: 0.58 },
      { x: 0.18, y: 0.42 },
      { x: 0.38, y: 0.32 },
      { x: 0.68, y: 0.32 },
      { x: 0.88, y: 0.48 },
      { x: 0.9, y: 0.58 },
    ),
    line({ x: 0.12, y: 0.58 }, { x: 0.9, y: 0.58 }, 16),
    circle(0.3, 0.62, 0.08, 20),
    circle(0.72, 0.62, 0.08, 20),
  ]),
  T("rocket", "Rakéta", "🚀", "Járművek", COLORS.rose, [
    closed(
      { x: 0.5, y: 0.12 },
      { x: 0.66, y: 0.42 },
      { x: 0.66, y: 0.72 },
      { x: 0.34, y: 0.72 },
      { x: 0.34, y: 0.42 },
    ),
    poly({ x: 0.34, y: 0.55 }, { x: 0.18, y: 0.72 }, { x: 0.34, y: 0.72 }),
    poly({ x: 0.66, y: 0.55 }, { x: 0.82, y: 0.72 }, { x: 0.66, y: 0.72 }),
    circle(0.5, 0.42, 0.06, 16),
    poly({ x: 0.4, y: 0.72 }, { x: 0.5, y: 0.9 }, { x: 0.6, y: 0.72 }),
  ]),
  T("plane", "Repülő", "✈️", "Járművek", COLORS.sky, [
    ellipse(0.5, 0.48, 0.32, 0.08),
    poly({ x: 0.45, y: 0.48 }, { x: 0.2, y: 0.28 }, { x: 0.35, y: 0.48 }),
    poly({ x: 0.45, y: 0.48 }, { x: 0.2, y: 0.68 }, { x: 0.35, y: 0.48 }),
    poly({ x: 0.75, y: 0.45 }, { x: 0.88, y: 0.28 }, { x: 0.82, y: 0.48 }),
    circle(0.32, 0.48, 0.03, 10),
  ]),
  T("boat", "Hajó", "⛵", "Járművek", COLORS.cyan, [
    closed(
      { x: 0.18, y: 0.62 },
      { x: 0.28, y: 0.78 },
      { x: 0.72, y: 0.78 },
      { x: 0.82, y: 0.62 },
    ),
    line({ x: 0.5, y: 0.62 }, { x: 0.5, y: 0.22 }, 14),
    closed({ x: 0.5, y: 0.22 }, { x: 0.78, y: 0.55 }, { x: 0.5, y: 0.55 }),
  ]),
  T("train", "Vonat", "🚂", "Járművek", COLORS.orange, [
    closed(
      { x: 0.15, y: 0.4 },
      { x: 0.55, y: 0.4 },
      { x: 0.55, y: 0.7 },
      { x: 0.15, y: 0.7 },
    ),
    closed(
      { x: 0.55, y: 0.48 },
      { x: 0.85, y: 0.48 },
      { x: 0.85, y: 0.7 },
      { x: 0.55, y: 0.7 },
    ),
    circle(0.28, 0.74, 0.07, 16),
    circle(0.45, 0.74, 0.07, 16),
    circle(0.7, 0.74, 0.07, 16),
    closed({ x: 0.22, y: 0.28 }, { x: 0.35, y: 0.28 }, { x: 0.35, y: 0.4 }, { x: 0.22, y: 0.4 }),
  ]),
  T("bike", "Bicikli", "🚲", "Járművek", COLORS.mint, [
    circle(0.28, 0.62, 0.14),
    circle(0.72, 0.62, 0.14),
    poly({ x: 0.28, y: 0.62 }, { x: 0.45, y: 0.4 }, { x: 0.62, y: 0.62 }, { x: 0.28, y: 0.62 }),
    line({ x: 0.45, y: 0.4 }, { x: 0.58, y: 0.28 }, 10),
    line({ x: 0.62, y: 0.62 }, { x: 0.72, y: 0.62 }, 8),
    line({ x: 0.5, y: 0.5 }, { x: 0.38, y: 0.35 }, 8),
  ]),
  T("bus", "Busz", "🚌", "Járművek", COLORS.yellow, [
    closed(
      { x: 0.12, y: 0.35 },
      { x: 0.88, y: 0.35 },
      { x: 0.88, y: 0.68 },
      { x: 0.12, y: 0.68 },
    ),
    closed({ x: 0.2, y: 0.4 }, { x: 0.38, y: 0.4 }, { x: 0.38, y: 0.55 }, { x: 0.2, y: 0.55 }),
    closed({ x: 0.45, y: 0.4 }, { x: 0.63, y: 0.4 }, { x: 0.63, y: 0.55 }, { x: 0.45, y: 0.55 }),
    circle(0.28, 0.72, 0.07, 16),
    circle(0.72, 0.72, 0.07, 16),
  ]),

  // —— Természet ——
  T("flower", "Virág", "🌸", "Természet", COLORS.pink, [
    circle(0.5, 0.42, 0.08, 20),
    circle(0.5, 0.28, 0.09, 18),
    circle(0.64, 0.36, 0.09, 18),
    circle(0.6, 0.52, 0.09, 18),
    circle(0.4, 0.52, 0.09, 18),
    circle(0.36, 0.36, 0.09, 18),
    line({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.85 }, 14),
    ellipse(0.42, 0.72, 0.08, 0.04, 16, -0.5),
  ]),
  T("tree", "Fa", "🌳", "Természet", COLORS.mint, [
    closed({ x: 0.42, y: 0.55 }, { x: 0.58, y: 0.55 }, { x: 0.58, y: 0.88 }, { x: 0.42, y: 0.88 }),
    circle(0.5, 0.38, 0.22),
    circle(0.35, 0.45, 0.14, 24),
    circle(0.65, 0.45, 0.14, 24),
  ]),
  T("sun", "Nap", "☀️", "Természet", COLORS.yellow, [
    circle(0.5, 0.5, 0.18),
    ...Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      return line(
        { x: 0.5 + Math.cos(a) * 0.24, y: 0.5 + Math.sin(a) * 0.24 },
        { x: 0.5 + Math.cos(a) * 0.36, y: 0.5 + Math.sin(a) * 0.36 },
        6,
      );
    }),
  ]),
  T("moon", "Hold", "🌙", "Természet", COLORS.amber, [
    arc(0.52, 0.5, 0.24, -Math.PI * 0.7, Math.PI * 0.7, 36),
    arc(0.62, 0.5, 0.18, Math.PI * 0.65, -Math.PI * 0.65, 30),
  ]),
  T("cloud", "Felhő", "☁️", "Természet", COLORS.sky, [
    [
      ...arc(0.35, 0.52, 0.14, Math.PI * 0.15, Math.PI * 1.1, 16),
      ...arc(0.5, 0.42, 0.16, Math.PI * 0.9, Math.PI * 2.1, 18),
      ...arc(0.68, 0.5, 0.14, -Math.PI * 0.2, Math.PI * 0.9, 16),
      { x: 0.78, y: 0.62 },
      { x: 0.25, y: 0.62 },
    ],
  ]),
  T("star-shape", "Csillag", "⭐", "Természet", COLORS.yellow, [
    star(0.5, 0.5, 5, 0.32, 0.14),
  ]),
  T("rainbow", "Szivárvány", "🌈", "Természet", COLORS.violet, [
    arc(0.5, 0.72, 0.38, Math.PI, 0, 36),
    arc(0.5, 0.72, 0.3, Math.PI, 0, 32),
    arc(0.5, 0.72, 0.22, Math.PI, 0, 28),
  ]),
  T("leaf", "Levél", "🍃", "Természet", COLORS.lime, [
    closed(
      ...bezier(
        { x: 0.5, y: 0.15 },
        { x: 0.85, y: 0.35 },
        { x: 0.75, y: 0.75 },
        { x: 0.5, y: 0.88 },
      ),
      ...bezier(
        { x: 0.5, y: 0.88 },
        { x: 0.25, y: 0.75 },
        { x: 0.15, y: 0.35 },
        { x: 0.5, y: 0.15 },
      ).reverse(),
    ),
    line({ x: 0.5, y: 0.22 }, { x: 0.5, y: 0.82 }, 16),
  ]),
  T("mountain", "Hegy", "⛰️", "Természet", COLORS.blue, [
    closed({ x: 0.1, y: 0.78 }, { x: 0.35, y: 0.28 }, { x: 0.55, y: 0.55 }, { x: 0.7, y: 0.35 }, {
      x: 0.92,
      y: 0.78,
    }),
    poly({ x: 0.32, y: 0.35 }, { x: 0.35, y: 0.28 }, { x: 0.4, y: 0.38 }),
  ]),
  T("mushroom", "Gomba", "🍄", "Természet", COLORS.coral, [
    arc(0.5, 0.48, 0.28, Math.PI, 0, 32),
    line({ x: 0.22, y: 0.48 }, { x: 0.78, y: 0.48 }, 12),
    closed({ x: 0.4, y: 0.48 }, { x: 0.6, y: 0.48 }, { x: 0.58, y: 0.82 }, { x: 0.42, y: 0.82 }),
    circle(0.4, 0.38, 0.04, 12),
    circle(0.58, 0.32, 0.035, 12),
  ]),

  // —— Ételek ——
  T("apple", "Alma", "🍎", "Ételek", COLORS.coral, [
    circle(0.5, 0.55, 0.24),
    bezier(
      { x: 0.5, y: 0.32 },
      { x: 0.48, y: 0.22 },
      { x: 0.55, y: 0.15 },
      { x: 0.62, y: 0.18 },
    ),
    ellipse(0.58, 0.28, 0.08, 0.04, 16, -0.6),
  ]),
  T("icecream", "Fagyi", "🍦", "Ételek", COLORS.pink, [
    closed({ x: 0.35, y: 0.48 }, { x: 0.65, y: 0.48 }, { x: 0.5, y: 0.9 }),
    circle(0.5, 0.38, 0.16),
    circle(0.38, 0.32, 0.1, 18),
    circle(0.62, 0.32, 0.1, 18),
  ]),
  T("pizza", "Pizza", "🍕", "Ételek", COLORS.orange, [
    closed({ x: 0.5, y: 0.18 }, { x: 0.85, y: 0.82 }, { x: 0.15, y: 0.82 }),
    circle(0.45, 0.48, 0.04, 12),
    circle(0.58, 0.58, 0.04, 12),
    circle(0.4, 0.65, 0.035, 12),
  ]),
  T("cake", "Torta", "🎂", "Ételek", COLORS.rose, [
    closed(
      { x: 0.22, y: 0.45 },
      { x: 0.78, y: 0.45 },
      { x: 0.78, y: 0.78 },
      { x: 0.22, y: 0.78 },
    ),
    ellipse(0.5, 0.45, 0.28, 0.08, 28),
    line({ x: 0.5, y: 0.28 }, { x: 0.5, y: 0.42 }, 8),
    ellipse(0.5, 0.26, 0.04, 0.06, 14),
  ]),
  T("banana", "Banán", "🍌", "Ételek", COLORS.yellow, [
    bezier(
      { x: 0.25, y: 0.35 },
      { x: 0.15, y: 0.55 },
      { x: 0.35, y: 0.85 },
      { x: 0.7, y: 0.78 },
    ),
    bezier(
      { x: 0.7, y: 0.78 },
      { x: 0.85, y: 0.7 },
      { x: 0.55, y: 0.4 },
      { x: 0.35, y: 0.32 },
    ),
    line({ x: 0.25, y: 0.35 }, { x: 0.35, y: 0.32 }, 6),
  ]),
  T("donut", "Fánk", "🍩", "Ételek", COLORS.pink, [
    circle(0.5, 0.5, 0.28),
    circle(0.5, 0.5, 0.12, 28),
  ]),
  T("cherry", "Cseresznye", "🍒", "Ételek", COLORS.coral, [
    circle(0.38, 0.58, 0.14),
    circle(0.62, 0.62, 0.14),
    bezier(
      { x: 0.38, y: 0.45 },
      { x: 0.4, y: 0.25 },
      { x: 0.55, y: 0.2 },
      { x: 0.62, y: 0.48 },
    ),
  ]),

  // —— Formák ——
  T("heart", "Szív", "❤️", "Formák", COLORS.coral, [heart(0.5, 0.48, 0.28)]),
  T("house", "Ház", "🏠", "Formák", COLORS.amber, [
    closed({ x: 0.2, y: 0.48 }, { x: 0.5, y: 0.18 }, { x: 0.8, y: 0.48 }),
    closed(
      { x: 0.25, y: 0.48 },
      { x: 0.75, y: 0.48 },
      { x: 0.75, y: 0.85 },
      { x: 0.25, y: 0.85 },
    ),
    closed({ x: 0.42, y: 0.62 }, { x: 0.58, y: 0.62 }, { x: 0.58, y: 0.85 }, { x: 0.42, y: 0.85 }),
  ]),
  T("balloon", "Léggömb", "🎈", "Formák", COLORS.violet, [
    ellipse(0.5, 0.4, 0.18, 0.24),
    poly({ x: 0.5, y: 0.64 }, { x: 0.45, y: 0.7 }, { x: 0.55, y: 0.7 }),
    bezier(
      { x: 0.5, y: 0.7 },
      { x: 0.55, y: 0.8 },
      { x: 0.42, y: 0.88 },
      { x: 0.5, y: 0.95 },
    ),
  ]),
  T("crown", "Korona", "👑", "Formák", COLORS.yellow, [
    closed(
      { x: 0.15, y: 0.65 },
      { x: 0.15, y: 0.4 },
      { x: 0.3, y: 0.55 },
      { x: 0.5, y: 0.25 },
      { x: 0.7, y: 0.55 },
      { x: 0.85, y: 0.4 },
      { x: 0.85, y: 0.65 },
    ),
    circle(0.5, 0.22, 0.04, 12),
  ]),
  T("smiley", "Mosoly", "😊", "Formák", COLORS.yellow, [
    circle(0.5, 0.5, 0.32),
    circle(0.38, 0.42, 0.04, 12),
    circle(0.62, 0.42, 0.04, 12),
    arc(0.5, 0.52, 0.14, 0.2, Math.PI - 0.2),
  ]),
  T("diamond", "Gyémánt", "💎", "Formák", COLORS.cyan, [
    closed(
      { x: 0.5, y: 0.15 },
      { x: 0.78, y: 0.4 },
      { x: 0.5, y: 0.88 },
      { x: 0.22, y: 0.4 },
    ),
    line({ x: 0.22, y: 0.4 }, { x: 0.78, y: 0.4 }, 12),
  ]),
  T("gift", "Ajándék", "🎁", "Formák", COLORS.rose, [
    closed(
      { x: 0.22, y: 0.4 },
      { x: 0.78, y: 0.4 },
      { x: 0.78, y: 0.85 },
      { x: 0.22, y: 0.85 },
    ),
    closed(
      { x: 0.18, y: 0.28 },
      { x: 0.82, y: 0.28 },
      { x: 0.82, y: 0.42 },
      { x: 0.18, y: 0.42 },
    ),
    line({ x: 0.5, y: 0.28 }, { x: 0.5, y: 0.85 }, 14),
  ]),
  T("umbrella", "Esernyő", "☂️", "Formák", COLORS.violet, [
    arc(0.5, 0.48, 0.32, Math.PI, 0, 36),
    line({ x: 0.18, y: 0.48 }, { x: 0.82, y: 0.48 }, 14),
    line({ x: 0.5, y: 0.48 }, { x: 0.5, y: 0.82 }, 12),
    arc(0.58, 0.82, 0.08, 0, Math.PI, 12),
  ]),

  // —— Űr ——
  T("planet", "Bolygó", "🪐", "Űr", COLORS.violet, [
    circle(0.5, 0.5, 0.2),
    ellipse(0.5, 0.5, 0.36, 0.1, 40, -0.35),
  ]),
  T("ufo", "UFO", "🛸", "Űr", COLORS.mint, [
    ellipse(0.5, 0.52, 0.32, 0.1),
    ellipse(0.5, 0.45, 0.16, 0.12, 28),
    line({ x: 0.35, y: 0.6 }, { x: 0.32, y: 0.72 }, 6),
    line({ x: 0.5, y: 0.62 }, { x: 0.5, y: 0.75 }, 6),
    line({ x: 0.65, y: 0.6 }, { x: 0.68, y: 0.72 }, 6),
  ]),
  T("alien", "Űrlény", "👽", "Űr", COLORS.lime, [
    ellipse(0.5, 0.42, 0.22, 0.2),
    ellipse(0.38, 0.42, 0.08, 0.12, 18),
    ellipse(0.62, 0.42, 0.08, 0.12, 18),
    line({ x: 0.42, y: 0.6 }, { x: 0.35, y: 0.82 }, 8),
    line({ x: 0.58, y: 0.6 }, { x: 0.65, y: 0.82 }, 8),
  ]),
  T("comet", "Üstökös", "☄️", "Űr", COLORS.amber, [
    circle(0.68, 0.35, 0.12),
    bezier(
      { x: 0.58, y: 0.4 },
      { x: 0.4, y: 0.5 },
      { x: 0.25, y: 0.7 },
      { x: 0.15, y: 0.85 },
    ),
    bezier(
      { x: 0.62, y: 0.45 },
      { x: 0.45, y: 0.55 },
      { x: 0.35, y: 0.75 },
      { x: 0.28, y: 0.88 },
    ),
  ]),
  T("satellite", "Műhold", "🛰️", "Űr", COLORS.sky, [
    closed(
      { x: 0.4, y: 0.4 },
      { x: 0.6, y: 0.4 },
      { x: 0.6, y: 0.6 },
      { x: 0.4, y: 0.6 },
    ),
    closed({ x: 0.18, y: 0.35 }, { x: 0.38, y: 0.42 }, { x: 0.38, y: 0.58 }, { x: 0.18, y: 0.65 }),
    closed({ x: 0.82, y: 0.35 }, { x: 0.62, y: 0.42 }, { x: 0.62, y: 0.58 }, { x: 0.82, y: 0.65 }),
    line({ x: 0.5, y: 0.4 }, { x: 0.5, y: 0.25 }, 8),
    circle(0.5, 0.22, 0.04, 10),
  ]),

  // —— Betűk ——
  T("letter-a", "Betű A", "🅰️", "Betűk", COLORS.coral, [
    poly({ x: 0.22, y: 0.82 }, { x: 0.5, y: 0.18 }, { x: 0.78, y: 0.82 }),
    line({ x: 0.34, y: 0.55 }, { x: 0.66, y: 0.55 }, 12),
  ]),
  T("letter-b", "Betű B", "🅱️", "Betűk", COLORS.sky, [
    line({ x: 0.3, y: 0.18 }, { x: 0.3, y: 0.82 }, 16),
    bezier(
      { x: 0.3, y: 0.18 },
      { x: 0.75, y: 0.18 },
      { x: 0.75, y: 0.48 },
      { x: 0.3, y: 0.5 },
    ),
    bezier(
      { x: 0.3, y: 0.5 },
      { x: 0.82, y: 0.52 },
      { x: 0.82, y: 0.82 },
      { x: 0.3, y: 0.82 },
    ),
  ]),
  T("letter-c", "Betű C", "©️", "Betűk", COLORS.mint, [
    arc(0.52, 0.5, 0.28, Math.PI * 0.25, Math.PI * 1.75, 40),
  ]),
  T("letter-s", "Betű S", "💫", "Betűk", COLORS.violet, [
    bezier(
      { x: 0.72, y: 0.28 },
      { x: 0.25, y: 0.15 },
      { x: 0.25, y: 0.5 },
      { x: 0.5, y: 0.5 },
    ),
    bezier(
      { x: 0.5, y: 0.5 },
      { x: 0.8, y: 0.5 },
      { x: 0.8, y: 0.85 },
      { x: 0.28, y: 0.75 },
    ),
  ]),
  T("letter-o", "Betű O", "⭕", "Betűk", COLORS.orange, [circle(0.5, 0.5, 0.3)]),
  T("letter-m", "Betű M", "Ⓜ️", "Betűk", COLORS.amber, [
    poly(
      { x: 0.2, y: 0.82 },
      { x: 0.2, y: 0.22 },
      { x: 0.5, y: 0.55 },
      { x: 0.8, y: 0.22 },
      { x: 0.8, y: 0.82 },
    ),
  ]),

  // —— Számok ——
  T("num-1", "Szám 1", "1️⃣", "Számok", COLORS.sky, [
    poly({ x: 0.38, y: 0.32 }, { x: 0.52, y: 0.18 }, { x: 0.52, y: 0.82 }),
    line({ x: 0.35, y: 0.82 }, { x: 0.68, y: 0.82 }, 10),
  ]),
  T("num-2", "Szám 2", "2️⃣", "Számok", COLORS.coral, [
    bezier(
      { x: 0.28, y: 0.35 },
      { x: 0.28, y: 0.15 },
      { x: 0.75, y: 0.15 },
      { x: 0.72, y: 0.4 },
    ),
    bezier(
      { x: 0.72, y: 0.4 },
      { x: 0.7, y: 0.55 },
      { x: 0.3, y: 0.7 },
      { x: 0.28, y: 0.82 },
    ),
    line({ x: 0.28, y: 0.82 }, { x: 0.75, y: 0.82 }, 12),
  ]),
  T("num-3", "Szám 3", "3️⃣", "Számok", COLORS.violet, [
    bezier(
      { x: 0.3, y: 0.28 },
      { x: 0.3, y: 0.15 },
      { x: 0.75, y: 0.15 },
      { x: 0.7, y: 0.4 },
    ),
    bezier(
      { x: 0.55, y: 0.48 },
      { x: 0.8, y: 0.48 },
      { x: 0.8, y: 0.85 },
      { x: 0.3, y: 0.78 },
    ),
    line({ x: 0.55, y: 0.48 }, { x: 0.7, y: 0.4 }, 6),
  ]),
  T("num-4", "Szám 4", "4️⃣", "Számok", COLORS.mint, [
    poly({ x: 0.65, y: 0.18 }, { x: 0.65, y: 0.82 }),
    poly({ x: 0.65, y: 0.18 }, { x: 0.28, y: 0.55 }, { x: 0.75, y: 0.55 }),
  ]),
  T("num-5", "Szám 5", "5️⃣", "Számok", COLORS.orange, [
    poly({ x: 0.7, y: 0.2 }, { x: 0.32, y: 0.2 }, { x: 0.3, y: 0.48 }),
    bezier(
      { x: 0.3, y: 0.48 },
      { x: 0.8, y: 0.4 },
      { x: 0.8, y: 0.85 },
      { x: 0.32, y: 0.78 },
    ),
  ]),
  T("num-8", "Szám 8", "8️⃣", "Számok", COLORS.pink, [
    ellipse(0.5, 0.35, 0.16, 0.14),
    ellipse(0.5, 0.65, 0.18, 0.16),
  ]),
];

export function templatesByCategory(category: string): DrawingTemplate[] {
  return DRAWING_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplate(id: string): DrawingTemplate | undefined {
  return DRAWING_TEMPLATES.find((t) => t.id === id);
}
