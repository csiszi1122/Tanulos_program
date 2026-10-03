import {
  type Pt,
  circle,
  closed,
  scalePaths,
  smoothPath,
  svgPath,
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

function ink(d: string, s = 1): Pt[] {
  const pts = svgPath(d, 100);
  return s > 0 ? smoothPath(pts, s) : pts;
}

function R(id: string, label: string, d: string): ColorRegion {
  return { id, label, points: closed(...ink(d)) };
}

function S(id: string, d: string): ColorStroke {
  return { id, points: ink(d) };
}

function CT(
  id: string,
  title: string,
  emoji: string,
  category: string,
  regions: ColorRegion[],
  strokes: ColorStroke[] = [],
): ColorTemplate {
  const all = [...regions.map((r) => r.points), ...strokes.map((s) => s.points)];
  const scaled = scalePaths(all, 0.07);
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
    "c-cat",
    "Cica",
    "🐱",
    "Állatok",
    [
      R("body", "Test", "M34 48 C28 62 36 82 50 84 C64 82 72 62 66 48 C70 36 58 28 50 32 C42 28 30 36 34 48 Z"),
      R("head", "Fej", "M36 36 C32 22 42 14 50 20 C58 14 68 22 64 36 C70 42 62 52 50 50 C38 52 30 42 36 36 Z"),
      R("ear-l", "Bal fül", "M36 28 C30 12 42 10 44 26"),
      R("ear-r", "Jobb fül", "M64 28 C70 12 58 10 56 26"),
      R("belly", "Has", "M42 58 C40 70 46 78 50 78 C54 78 60 70 58 58 C56 52 44 52 42 58 Z"),
      { id: "eye-l", label: "Bal szem", points: circle(0.42, 0.4, 0.035, 18) },
      { id: "eye-r", label: "Jobb szem", points: circle(0.58, 0.4, 0.035, 18) },
    ],
    [S("tail", "M66 60 C78 54 88 66 80 76"), S("whisker-l", "M36 44 C28 42 22 40 20 38"), S("whisker-r", "M64 44 C72 42 78 40 80 38")],
  ),
  CT(
    "c-dog",
    "Kutya",
    "🐶",
    "Állatok",
    [
      R("body", "Test", "M30 52 C26 66 38 82 52 80 C68 84 80 68 76 54 C82 48 78 36 68 38 C62 28 44 28 38 40 C32 36 28 44 30 52 Z"),
      R("ear-l", "Bal fül", "M34 40 C22 28 18 48 30 54"),
      R("ear-r", "Jobb fül", "M70 40 C82 28 86 48 74 54"),
      R("snout", "Orr", "M44 52 C46 60 54 60 56 52 C54 48 46 48 44 52 Z"),
      { id: "eye-l", label: "Bal szem", points: circle(0.44, 0.46, 0.03, 16) },
      { id: "eye-r", label: "Jobb szem", points: circle(0.58, 0.46, 0.03, 16) },
      { id: "nose", label: "Orrhegy", points: circle(0.5, 0.54, 0.025, 14) },
    ],
    [S("tail", "M76 56 C88 60 90 74 78 78"), S("collar", "M38 50 C50 54 64 50 66 48")],
  ),
  CT(
    "c-fish",
    "Hal",
    "🐟",
    "Állatok",
    [
      R("body", "Test", "M20 50 C28 34 50 28 66 38 C78 44 82 52 76 60 C68 72 46 76 28 66 C20 60 16 54 20 50 Z"),
      R("tail", "Farok", "M76 50 C92 32 98 50 92 68 C86 58 86 42 76 50 Z"),
      R("fin-top", "Uszony", "M48 38 C52 26 62 28 58 40"),
      R("fin-bot", "Hasúszó", "M46 62 C50 72 60 70 56 58"),
      { id: "eye", label: "Szem", points: circle(0.34, 0.46, 0.04, 18) },
    ],
    [S("stripe", "M44 44 C52 48 54 56 46 58")],
  ),
  CT(
    "c-bird",
    "Madár",
    "🐦",
    "Állatok",
    [
      R("body", "Test", "M30 56 C28 42 42 36 54 42 C60 32 74 32 80 44 C88 42 92 52 84 56 C88 66 74 74 56 70 C40 74 28 66 30 56 Z"),
      R("wing", "Szárny", "M48 48 C36 42 24 30 20 38 C32 46 40 56 50 54"),
      R("belly", "Has", "M44 56 C46 66 56 68 60 58 C56 52 46 52 44 56 Z"),
      { id: "eye", label: "Szem", points: circle(0.7, 0.42, 0.03, 14) },
      R("beak", "Csőr", "M80 44 C90 42 96 46 90 50 L80 48 Z"),
    ],
    [S("leg-l", "M52 70 C50 82 46 86 44 82"), S("leg-r", "M60 70 C62 82 66 86 68 82")],
  ),
  CT(
    "c-butterfly",
    "Pillangó",
    "🦋",
    "Állatok",
    [
      R("wing-tl", "Bal felső", "M48 40 C30 22 12 30 22 48 C14 54 30 60 48 50"),
      R("wing-tr", "Jobb felső", "M52 40 C70 22 88 30 78 48 C86 54 70 60 52 50"),
      R("wing-bl", "Bal alsó", "M48 52 C32 54 18 70 30 78 C40 84 48 68 50 60"),
      R("wing-br", "Jobb alsó", "M52 52 C68 54 82 70 70 78 C60 84 52 68 50 60"),
      R("body", "Test", "M48 24 C46 40 46 64 50 82 C54 64 54 40 52 24 C51 20 49 20 48 24 Z"),
    ],
    [S("antenna-l", "M48 24 C44 16 42 12 46 10"), S("antenna-r", "M52 24 C56 16 58 12 54 10")],
  ),
  CT(
    "c-owl",
    "Bagoly",
    "🦉",
    "Állatok",
    [
      R("body", "Test", "M36 30 C28 44 28 72 40 84 C46 90 54 90 60 84 C72 72 72 44 64 30 C58 20 42 20 36 30 Z"),
      R("belly", "Has", "M42 54 C40 70 46 78 50 78 C54 78 60 70 58 54 C56 46 44 46 42 54 Z"),
      R("eye-l", "Bal szem", "M38 46 C34 38 46 36 48 46 C46 54 40 52 38 46 Z"),
      R("eye-r", "Jobb szem", "M62 46 C58 38 70 36 72 46 C70 54 64 52 62 46 Z"),
      R("beak", "Csőr", "M48 54 C50 62 52 54 52 54 Z"),
    ],
    [S("ear-l", "M36 32 C40 22 46 28 44 36"), S("ear-r", "M64 32 C60 22 54 28 56 36")],
  ),
  CT(
    "c-turtle",
    "Teknős",
    "🐢",
    "Állatok",
    [
      R("shell", "Páncél", "M28 50 C26 36 40 28 50 30 C60 28 74 36 72 50 C74 64 60 74 50 72 C40 74 26 64 28 50 Z"),
      R("shell-in", "Mintázat", "M36 44 C42 38 50 36 58 40 C64 46 62 56 54 60 C46 64 36 58 36 50 Z"),
      R("head", "Fej", "M72 50 C84 46 90 54 84 60 C78 56 74 54 72 54"),
      R("flip-fl", "Bal mellső", "M30 42 C20 34 16 40 24 46"),
      R("flip-bl", "Bal hátsó", "M30 58 C20 66 16 60 24 54"),
      R("flip-fr", "Jobb mellső", "M48 70 C46 82 40 84 40 80"),
      R("flip-br", "Jobb hátsó", "M58 70 C60 82 66 84 66 80"),
    ],
    [S("eye", "M82 50 C84 48 86 50 84 52")],
  ),
  CT(
    "c-lion",
    "Oroszlán",
    "🦁",
    "Állatok",
    [
      R("mane", "Sörény", "M50 18 C64 20 78 34 80 50 C82 66 70 80 50 84 C30 80 18 66 20 50 C22 34 36 20 50 18 Z"),
      R("face", "Arc", "M38 40 C34 52 40 66 50 68 C60 66 66 52 62 40 C58 32 42 32 38 40 Z"),
      R("muzzle", "Orr", "M44 54 C46 62 54 62 56 54 C54 50 46 50 44 54 Z"),
      { id: "eye-l", label: "Bal szem", points: circle(0.42, 0.48, 0.03, 14) },
      { id: "eye-r", label: "Jobb szem", points: circle(0.58, 0.48, 0.03, 14) },
      { id: "nose", label: "Orr", points: circle(0.5, 0.56, 0.022, 12) },
    ],
    [S("smile", "M42 62 C50 68 58 62 58 62")],
  ),

  // —— Járművek ——
  CT(
    "c-car",
    "Autó",
    "🚗",
    "Járművek",
    [
      R("body", "Karosszéria", "M12 58 C16 42 28 34 42 32 C58 30 72 34 82 44 C90 50 94 58 92 62 L14 62 Z"),
      R("cabin", "Utastér", "M34 34 C40 24 58 22 68 32 L70 48 L36 48 Z"),
      R("window-f", "Első ablak", "M40 38 C46 32 54 32 56 40 L40 40 Z"),
      R("window-r", "Hátsó ablak", "M58 38 C64 34 72 40 70 46 L58 46 Z"),
      R("wheel-f", "Első kerék", "M28 62 C24 72 36 78 40 68 C36 62 30 60 28 62 Z"),
      R("wheel-r", "Hátsó kerék", "M70 62 C66 72 78 78 82 68 C78 62 72 60 70 62 Z"),
    ],
    [S("door", "M54 48 L54 60"), S("light", "M86 54 C90 54 92 58 88 58")],
  ),
  CT(
    "c-rocket",
    "Rakéta",
    "🚀",
    "Járművek",
    [
      R("nose", "Orrkúp", "M50 10 C58 22 62 34 62 46 L38 46 C38 34 42 22 50 10 Z"),
      R("body", "Törzs", "M38 46 L62 46 L62 72 L38 72 Z"),
      R("fin-l", "Bal szárny", "M38 58 C24 68 18 78 28 78 L38 72"),
      R("fin-r", "Jobb szárny", "M62 58 C76 68 82 78 72 78 L62 72"),
      R("flame", "Láng", "M42 72 C46 86 50 92 50 92 C50 92 54 86 58 72"),
      R("window", "Ablak", "M50 40 C56 40 58 48 50 50 C42 48 44 40 50 40 Z"),
    ],
    [S("stripe", "M42 56 L58 56")],
  ),
  CT(
    "c-plane",
    "Repülő",
    "✈️",
    "Járművek",
    [
      R("fuselage", "Törzs", "M18 50 C28 42 48 40 68 44 C80 46 90 48 92 52 C90 56 80 58 68 60 C48 64 28 62 18 54 Z"),
      R("wing-t", "Felső szárny", "M48 48 C36 34 22 24 18 30 C30 38 40 48 48 52"),
      R("wing-b", "Alsó szárny", "M48 52 C36 66 22 76 18 70 C30 62 40 56 48 52"),
      R("tail", "Farok", "M78 46 C86 32 94 28 96 34 C90 42 84 48 78 50"),
      { id: "window", label: "Ablak", points: circle(0.34, 0.48, 0.03, 14) },
    ],
    [S("stripe", "M40 50 L70 52")],
  ),
  CT(
    "c-boat",
    "Hajó",
    "⛵",
    "Járművek",
    [
      R("hull", "Hajótest", "M18 60 C24 74 40 82 50 82 C60 82 76 74 82 60 Z"),
      R("sail-main", "Nagy vitorla", "M50 24 C66 36 78 50 74 56 L50 56 Z"),
      R("sail-jib", "Kis vitorla", "M50 30 C40 40 36 50 38 56 L50 56 Z"),
      R("flag", "Zászló", "M50 22 C58 20 62 24 58 28 L50 26 Z"),
    ],
    [S("mast", "M50 60 L50 22"), S("wave", "M22 66 C30 70 40 72 50 72 C60 72 70 70 78 66")],
  ),
  CT(
    "c-train",
    "Vonat",
    "🚂",
    "Járművek",
    [
      R("engine", "Mozdony", "M14 40 C14 34 20 32 28 32 L54 32 L54 68 L14 68 Z"),
      R("cabin", "Kabin", "M54 46 L84 46 L84 68 L54 68 Z"),
      R("chimney", "Kémény", "M22 20 C22 16 26 14 32 14 L40 14 L40 32 L22 32 Z"),
      R("win-1", "Ablak 1", "M24 40 L38 40 L38 52 L24 52 Z"),
      R("win-2", "Ablak 2", "M42 40 L50 40 L50 52 L42 52 Z"),
      R("win-3", "Ablak 3", "M60 50 L78 50 L78 62 L60 62 Z"),
      R("wheel-1", "Kerék 1", "M26 68 C22 78 34 82 38 72"),
      R("wheel-2", "Kerék 2", "M44 68 C40 78 52 82 56 72"),
      R("wheel-3", "Kerék 3", "M68 68 C64 78 76 82 80 72"),
    ],
    [S("smoke", "M30 18 C34 10 38 10 40 16")],
  ),
  CT(
    "c-bus",
    "Busz",
    "🚌",
    "Járművek",
    [
      R("body", "Karosszéria", "M12 36 C12 30 18 28 24 28 L86 28 C92 28 94 34 94 40 L94 66 L12 66 Z"),
      R("win-1", "Ablak 1", "M20 34 L36 34 L36 50 L20 50 Z"),
      R("win-2", "Ablak 2", "M42 34 L58 34 L58 50 L42 50 Z"),
      R("win-3", "Ablak 3", "M64 34 L80 34 L80 50 L64 50 Z"),
      R("door", "Ajtó", "M84 40 L92 40 L92 62 L84 62 Z"),
      R("wheel-f", "Első kerék", "M28 66 C24 76 36 80 40 70"),
      R("wheel-r", "Hátsó kerék", "M72 66 C68 76 80 80 84 70"),
    ],
    [S("stripe", "M16 56 L82 56")],
  ),

  // —— Természet ——
  CT(
    "c-flower",
    "Virág",
    "🌸",
    "Természet",
    [
      R("p1", "Szirom 1", "M50 34 C50 22 60 18 64 30 C58 32 54 36 50 40"),
      R("p2", "Szirom 2", "M50 40 C60 34 74 36 70 48 C62 46 56 46 50 48"),
      R("p3", "Szirom 3", "M50 48 C58 52 66 64 54 66 C52 58 50 54 48 50"),
      R("p4", "Szirom 4", "M50 48 C42 54 30 62 34 50 C40 50 46 48 50 44"),
      R("p5", "Szirom 5", "M50 40 C40 34 28 36 32 48 C38 46 44 44 50 42"),
      R("center", "Közép", "M50 42 C54 42 56 48 50 50 C44 48 46 42 50 42 Z"),
      R("leaf", "Levél", "M50 66 C40 62 32 70 38 76 C44 72 48 70 50 74"),
    ],
    [S("stem", "M50 50 L50 88")],
  ),
  CT(
    "c-tree",
    "Fa",
    "🌳",
    "Természet",
    [
      R("canopy", "Lomb", "M50 16 C66 18 78 34 72 48 C84 50 86 66 70 72 C72 82 56 86 50 78 C44 86 28 82 30 72 C14 66 16 50 28 48 C22 34 34 18 50 16 Z"),
      R("trunk", "Törzs", "M42 68 L42 90 L58 90 L58 68"),
      R("leaf-l", "Bal ág", "M36 50 C30 44 24 50 30 56"),
      R("leaf-r", "Jobb ág", "M64 52 C70 46 76 52 70 58"),
    ],
    [S("bark", "M48 72 C50 80 52 84 50 88")],
  ),
  CT(
    "c-sun",
    "Nap",
    "☀️",
    "Természet",
    [
      R("core", "Korong", "M50 32 C62 32 70 40 70 50 C70 60 62 68 50 68 C38 68 30 60 30 50 C30 40 38 32 50 32 Z"),
      R("ray-1", "Sugár 1", "M48 16 L52 16 L52 28 L48 28 Z"),
      R("ray-2", "Sugár 2", "M48 72 L52 72 L52 84 L48 84 Z"),
      R("ray-3", "Sugár 3", "M16 48 L28 48 L28 52 L16 52 Z"),
      R("ray-4", "Sugár 4", "M72 48 L84 48 L84 52 L72 52 Z"),
      R("ray-5", "Sugár 5", "M26 26 L34 34 L30 38 L22 30 Z"),
      R("ray-6", "Sugár 6", "M66 66 L74 74 L70 78 L62 70 Z"),
      R("cheek", "Arc", "M42 52 C46 58 54 58 58 52 C54 48 46 48 42 52 Z"),
    ],
    [S("smile", "M42 54 C50 60 58 54 58 54"), S("eye-l", "M42 46 C42 44 44 44 44 46"), S("eye-r", "M56 46 C56 44 58 44 58 46")],
  ),
  CT(
    "c-house",
    "Ház",
    "🏠",
    "Természet",
    [
      R("roof", "Tető", "M16 48 L50 14 L84 48 Z"),
      R("wall", "Fal", "M24 46 L24 86 L76 86 L76 46"),
      R("door", "Ajtó", "M42 58 L58 58 L58 86 L42 86 Z"),
      R("win-l", "Bal ablak", "M28 54 L38 54 L38 66 L28 66 Z"),
      R("win-r", "Jobb ablak", "M62 54 L72 54 L72 66 L62 66 Z"),
      R("chimney", "Kémény", "M64 22 L74 22 L74 40 L64 40 Z"),
    ],
    [S("smoke", "M68 18 C70 10 76 10 74 18"), S("path", "M42 86 C46 92 54 92 58 86")],
  ),
  CT(
    "c-rainbow",
    "Szivárvány",
    "🌈",
    "Természet",
    [
      R("r1", "Ív 1", "M14 74 C20 38 40 18 50 18 C60 18 80 38 86 74 L78 74 C72 46 58 32 50 32 C42 32 28 46 22 74 Z"),
      R("r2", "Ív 2", "M22 74 C28 48 42 34 50 34 C58 34 72 48 78 74 L70 74 C64 54 56 44 50 44 C44 44 36 54 30 74 Z"),
      R("r3", "Ív 3", "M30 74 C36 54 44 46 50 46 C56 46 64 54 70 74 L62 74 C58 60 54 54 50 54 C46 54 42 60 38 74 Z"),
      R("cloud-l", "Bal felhő", "M14 74 C12 66 20 60 28 64 C30 58 40 58 42 66 C46 70 40 78 28 78 L16 78 Z"),
      R("cloud-r", "Jobb felhő", "M86 74 C88 66 80 60 72 64 C70 58 60 58 58 66 C54 70 60 78 72 78 L84 78 Z"),
    ],
  ),
  CT(
    "c-mountain",
    "Hegyvidék",
    "⛰️",
    "Természet",
    [
      R("sky", "Ég", "M8 20 L92 20 L92 78 L8 78 Z"),
      R("peak-l", "Bal csúcs", "M8 78 L32 28 L48 52 L40 78 Z"),
      R("peak-r", "Jobb csúcs", "M40 78 L62 22 L92 78 Z"),
      R("snow-l", "Hó 1", "M32 28 L40 40 L36 44 L28 36 Z"),
      R("snow-r", "Hó 2", "M62 22 L70 36 L64 40 L56 30 Z"),
      R("lake", "Tó", "M20 78 C30 72 50 74 70 70 C80 74 88 76 92 78 L8 78 Z"),
    ],
    [S("bird", "M40 36 C44 32 48 34 46 38")],
  ),

  // —— Ételek ——
  CT(
    "c-apple",
    "Alma",
    "🍎",
    "Ételek",
    [
      R("fruit", "Gyümölcs", "M50 30 C64 28 78 42 74 60 C70 78 56 88 50 88 C44 88 30 78 26 60 C22 42 36 28 50 30 Z"),
      R("leaf", "Levél", "M50 30 C42 24 34 28 38 36 C44 34 48 32 52 34"),
      R("highlight", "Fény", "M40 44 C38 52 42 58 46 52 C48 46 44 42 40 44 Z"),
    ],
    [S("stem", "M50 30 C48 20 52 14 58 16")],
  ),
  CT(
    "c-icecream",
    "Fagyi",
    "🍦",
    "Ételek",
    [
      R("scoop-1", "Gombóc 1", "M38 48 C34 34 42 24 50 24 C58 24 66 34 62 48 C56 46 44 46 38 48 Z"),
      R("scoop-2", "Gombóc 2", "M34 52 C30 44 40 40 48 44 C52 38 64 40 66 50 C70 56 62 62 50 60 C38 62 30 56 34 52 Z"),
      R("cone", "Tölcsér", "M38 60 L50 94 L62 60 Z"),
      R("drip", "Csurgás", "M58 56 C62 64 60 70 56 68 C54 62 56 58 58 56 Z"),
    ],
    [S("wafer-1", "M44 70 L56 70"), S("wafer-2", "M46 80 L54 80")],
  ),
  CT(
    "c-cupcake",
    "Muffin",
    "🧁",
    "Ételek",
    [
      R("frosting", "Krém", "M32 48 C28 34 40 24 50 26 C60 24 72 34 68 48 C62 46 38 46 32 48 Z"),
      R("topping", "Dísz", "M50 18 C56 12 62 18 56 26 C52 24 48 22 50 18 Z"),
      R("wrapper", "Papír", "M30 48 L34 86 L66 86 L70 48 Z"),
      R("paper-fold", "Hajtás", "M36 56 L64 56 L62 70 L38 70 Z"),
    ],
    [S("line-1", "M40 74 L60 74"), S("sprinkle", "M42 40 C46 36 50 40 48 44")],
  ),
  CT(
    "c-donut",
    "Fánk",
    "🍩",
    "Ételek",
    [
      R("dough", "Tészta", "M50 18 C70 18 86 34 86 50 C86 66 70 82 50 82 C30 82 14 66 14 50 C14 34 30 18 50 18 Z"),
      R("hole", "Lyuk", "M50 36 C60 36 66 42 66 50 C66 58 60 64 50 64 C40 64 34 58 34 50 C34 42 40 36 50 36 Z"),
      R("icing", "Máz", "M28 36 C36 26 50 24 62 30 C72 36 78 48 70 42 C60 34 44 32 34 40 C30 44 26 42 28 36 Z"),
    ],
    [S("sprinkle-1", "M34 40 C38 36 42 38 40 42"), S("sprinkle-2", "M60 36 C64 32 68 36 64 40"), S("sprinkle-3", "M58 62 C62 58 66 62 62 66")],
  ),
  CT(
    "c-pizza",
    "Pizza",
    "🍕",
    "Ételek",
    [
      R("slice", "Szelet", "M50 14 L88 80 L12 80 Z"),
      R("crust", "Szél", "M50 14 L88 80 L80 80 L50 28 L20 80 L12 80 Z"),
      { id: "pep-1", label: "Szalámi 1", points: circle(0.5, 0.38, 0.05, 16) },
      { id: "pep-2", label: "Szalámi 2", points: circle(0.4, 0.55, 0.045, 16) },
      { id: "pep-3", label: "Szalámi 3", points: circle(0.58, 0.58, 0.045, 16) },
      { id: "pep-4", label: "Szalámi 4", points: circle(0.46, 0.7, 0.04, 14) },
    ],
    [S("cheese", "M30 72 C40 68 50 70 60 66 C68 70 74 74 70 78")],
  ),

  // —— Formák ——
  CT(
    "c-heart",
    "Szív",
    "❤️",
    "Formák",
    [
      R("heart", "Szív", "M50 84 C26 64 14 46 22 32 C28 18 46 20 50 34 C54 20 72 18 78 32 C86 46 74 64 50 84 Z"),
      R("shine", "Fény", "M34 40 C32 48 36 54 42 48 C44 42 38 38 34 40 Z"),
    ],
  ),
  CT(
    "c-balloon",
    "Lufi",
    "🎈",
    "Formák",
    [
      R("balloon", "Lufi", "M50 14 C66 14 78 30 72 48 C66 64 54 72 50 72 C46 72 34 64 28 48 C22 30 34 14 50 14 Z"),
      R("knot", "Csomó", "M46 72 L50 80 L54 72 Z"),
      R("shine", "Fény", "M40 32 C38 40 42 46 46 40 C48 34 44 30 40 32 Z"),
    ],
    [S("string", "M50 80 C48 90 54 96 52 100")],
  ),
  CT(
    "c-star",
    "Csillag",
    "⭐",
    "Formák",
    [
      R("star", "Csillag", "M50 12 L58 38 L86 40 L64 58 L70 86 L50 70 L30 86 L36 58 L14 40 L42 38 Z"),
      R("core", "Közép", "M50 40 C56 40 60 48 50 54 C40 48 44 40 50 40 Z"),
    ],
  ),

  // —— Űr ——
  CT(
    "c-planet",
    "Bolygó",
    "🪐",
    "Űr",
    [
      R("planet", "Bolygó", "M50 26 C66 26 78 40 78 54 C78 68 66 82 50 82 C34 82 22 68 22 54 C22 40 34 26 50 26 Z"),
      R("spot-1", "Folt 1", "M38 44 C36 52 42 56 46 50 C48 44 42 42 38 44 Z"),
      R("spot-2", "Folt 2", "M56 58 C54 66 60 70 64 64 C66 58 60 56 56 58 Z"),
      R("ring", "Gyűrű", "M16 48 C32 38 68 38 84 48 C90 52 88 60 78 56 C64 48 36 48 22 56 C12 60 10 52 16 48 Z"),
    ],
    [S("star-1", "M18 24 L20 28 L24 28 L21 31 L22 35 L18 33 L14 35 L15 31 L12 28 L16 28 Z"), S("star-2", "M80 70 L81 73 L84 73 L82 75 L83 78 L80 76 L77 78 L78 75 L76 73 L79 73 Z")],
  ),
  CT(
    "c-ufo",
    "UFO",
    "🛸",
    "Űr",
    [
      R("dome", "Kupola", "M36 48 C34 34 44 26 50 26 C56 26 66 34 64 48"),
      R("saucer", "Tányér", "M22 52 C28 44 40 40 50 40 C60 40 72 44 78 52 C84 56 84 64 76 64 L24 64 C16 64 16 56 22 52 Z"),
      R("light-1", "Fény 1", "M32 56 C30 62 36 64 38 58 Z"),
      R("light-2", "Fény 2", "M48 58 C46 64 52 66 54 60 Z"),
      R("light-3", "Fény 3", "M64 56 C62 62 68 64 70 58 Z"),
      R("beam", "Sugár", "M40 64 L34 88 L66 88 L60 64 Z"),
    ],
    [S("antenna", "M50 26 L50 18"), S("star", "M78 28 L80 32 L84 32 L81 35 L82 39 L78 37 L74 39 L75 35 L72 32 L76 32 Z")],
  ),
  CT(
    "c-alien",
    "Űrlény",
    "👽",
    "Űr",
    [
      R("head", "Fej", "M36 36 C28 24 40 14 50 16 C60 14 72 24 64 36 C74 46 72 66 56 72 C50 86 50 86 44 72 C28 66 26 46 36 36 Z"),
      R("eye-l", "Bal szem", "M34 44 C28 40 24 48 32 52 C36 50 38 46 34 44 Z"),
      R("eye-r", "Jobb szem", "M66 44 C72 40 76 48 68 52 C64 50 62 46 66 44 Z"),
      R("body", "Test", "M42 72 C40 84 46 92 50 92 C54 92 60 84 58 72 C56 68 44 68 42 72 Z"),
    ],
    [S("smile", "M44 58 C50 64 56 58 56 58"), S("antenna-l", "M40 28 C34 18 30 16 28 20"), S("antenna-r", "M60 28 C66 18 70 16 72 20")],
  ),
  CT(
    "c-starship",
    "Űrhajó",
    "🚀",
    "Űr",
    [
      R("nose", "Orr", "M50 12 C58 24 60 40 58 52 L42 52 C40 40 42 24 50 12 Z"),
      R("body", "Törzs", "M42 52 L58 52 L58 70 L42 70 Z"),
      R("wing-l", "Bal szárny", "M42 54 C28 62 22 74 34 74 L42 68"),
      R("wing-r", "Jobb szárny", "M58 54 C72 62 78 74 66 74 L58 68"),
      R("engine", "Hajtómű", "M44 70 C48 84 50 90 50 90 C50 90 52 84 56 70"),
      R("cockpit", "Kabinet", "M50 34 C54 34 56 42 50 44 C44 42 46 34 50 34 Z"),
    ],
    [S("stripe", "M44 60 L56 60")],
  ),
];
