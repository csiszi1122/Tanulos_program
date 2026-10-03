/**
 * Premium coloring-page style SVG outlines (viewBox 0 0 200 200).
 * Organic curves, realistic proportions — black line art sits ON TOP of opaque fills.
 */
export type ArtLife =
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

export type ArtDef = {
  id: string;
  title: string;
  emoji: string;
  category: string;
  life: ArtLife;
  /** Closed regions for fill (path d in 0..200 space) */
  regions: { id: string; label: string; d: string }[];
  /** Decorative open strokes (whiskers, details) */
  strokes?: { id: string; d: string }[];
};

/** Convert simple region SVG paths into our template builder format later. */
export const PREMIUM_ART: ArtDef[] = [
  {
    id: "cat",
    title: "Cica",
    emoji: "🐱",
    category: "Állatok",
    life: "walk",
    regions: [
      {
        id: "body",
        label: "Test",
        d: "M68 112 C52 114 44 132 48 152 C52 172 72 182 98 180 C124 182 148 170 150 148 C152 128 140 112 124 110 C118 122 108 128 98 128 C86 128 76 122 68 112 Z",
      },
      {
        id: "head",
        label: "Fej",
        d: "M66 74 C58 48 78 30 100 32 C122 30 142 48 134 74 C142 96 124 114 100 112 C76 114 58 96 66 74 Z",
      },
      {
        id: "ear-l",
        label: "Bal fül",
        d: "M70 52 C62 22 90 20 94 50 C86 56 76 56 70 52 Z",
      },
      {
        id: "ear-r",
        label: "Jobb fül",
        d: "M130 52 C138 22 110 20 106 50 C114 56 124 56 130 52 Z",
      },
      {
        id: "belly",
        label: "Has",
        d: "M80 136 C86 154 112 154 118 136 C112 158 86 158 80 136 Z",
      },
      {
        id: "tail",
        label: "Farok",
        d: "M148 136 C168 118 188 132 180 152 C172 168 158 168 150 154 C148 148 148 142 148 136 Z",
      },
      {
        id: "paw-fl",
        label: "Mancs",
        d: "M66 168 C60 182 78 188 84 174 C80 170 72 168 66 168 Z",
      },
      {
        id: "paw-fr",
        label: "Mancs",
        d: "M112 168 C108 182 126 188 132 174 C126 170 118 168 112 168 Z",
      },
      {
        id: "paw-bl",
        label: "Mancs",
        d: "M78 172 C74 186 92 188 96 176 Z",
      },
      {
        id: "paw-br",
        label: "Mancs",
        d: "M122 172 C120 186 138 186 138 172 Z",
      },
    ],
    strokes: [
      { id: "eye-l", d: "M84 70 C86 76 92 76 94 70" },
      { id: "eye-r", d: "M106 70 C108 76 114 76 116 70" },
      { id: "nose", d: "M96 84 C100 90 104 84 100 80 Z" },
      { id: "mouth", d: "M100 88 C96 94 92 96 90 94 M100 88 C104 94 108 96 110 94" },
      { id: "whisk-l1", d: "M86 88 L56 80" },
      { id: "whisk-l2", d: "M86 92 L54 94" },
      { id: "whisk-l3", d: "M86 96 L58 108" },
      { id: "whisk-r1", d: "M114 88 L144 80" },
      { id: "whisk-r2", d: "M114 92 L146 94" },
      { id: "whisk-r3", d: "M114 96 L142 108" },
    ],
  },
  {
    id: "dog",
    title: "Kutya",
    emoji: "🐶",
    category: "Állatok",
    life: "walk",
    regions: [
      {
        id: "body",
        label: "Test",
        d: "M56 118 C44 116 38 138 50 158 C64 176 96 184 122 174 C146 180 164 162 158 140 C154 120 138 112 122 114 C114 126 96 132 80 126 C68 122 60 118 56 118 Z",
      },
      {
        id: "head",
        label: "Fej",
        d: "M54 68 C42 44 68 28 94 38 C112 30 134 44 128 70 C136 92 114 110 90 104 C68 110 48 92 54 68 Z",
      },
      {
        id: "ear-l",
        label: "Fül",
        d: "M56 56 C36 68 38 102 64 94 C62 78 60 66 56 56 Z",
      },
      {
        id: "ear-r",
        label: "Fül",
        d: "M116 48 C134 34 154 56 140 82 C130 72 122 58 116 48 Z",
      },
      {
        id: "snout",
        label: "Orr",
        d: "M74 80 C70 98 102 102 106 80 C98 90 82 90 74 80 Z",
      },
      {
        id: "tail",
        label: "Farok",
        d: "M156 124 C178 104 194 128 176 148 C164 158 158 138 156 124 Z",
      },
      {
        id: "leg-fl",
        label: "Láb",
        d: "M68 160 C64 182 84 186 88 164 Z",
      },
      {
        id: "leg-fr",
        label: "Láb",
        d: "M100 162 C98 184 118 186 120 164 Z",
      },
      {
        id: "leg-bl",
        label: "Láb",
        d: "M118 164 C116 184 134 184 134 162 Z",
      },
      {
        id: "leg-br",
        label: "Láb",
        d: "M136 158 C136 180 154 178 150 156 Z",
      },
    ],
    strokes: [
      { id: "eye-l", d: "M78 64 C80 68 84 68 86 64" },
      { id: "eye-r", d: "M100 62 C102 66 106 66 108 62" },
      { id: "nose", d: "M90 84 C92 90 96 90 98 84" },
    ],
  },
  {
    id: "butterfly",
    title: "Pillangó",
    emoji: "🦋",
    category: "Állatok",
    life: "flutter",
    regions: [
      {
        id: "wing-ul",
        label: "Szárny",
        d: "M96 88 C78 52 42 40 28 66 C18 90 36 118 68 114 C82 112 92 100 96 88 Z",
      },
      {
        id: "wing-ur",
        label: "Szárny",
        d: "M104 88 C122 52 158 40 172 66 C182 90 164 118 132 114 C118 112 108 100 104 88 Z",
      },
      {
        id: "wing-ll",
        label: "Szárny",
        d: "M94 106 C70 112 42 138 52 162 C64 180 90 172 100 144 C102 130 98 116 94 106 Z",
      },
      {
        id: "wing-lr",
        label: "Szárny",
        d: "M106 106 C130 112 158 138 148 162 C136 180 110 172 100 144 C98 130 102 116 106 106 Z",
      },
      {
        id: "body",
        label: "Test",
        d: "M96 62 C90 64 88 148 100 150 C112 148 110 64 104 62 C102 56 98 56 96 62 Z",
      },
      {
        id: "spot-ul",
        label: "Mintázat",
        d: "M52 78 C44 68 56 58 66 70 C62 76 56 80 52 78 Z",
      },
      {
        id: "spot-ur",
        label: "Mintázat",
        d: "M148 78 C156 68 144 58 134 70 C138 76 144 80 148 78 Z",
      },
      {
        id: "spot-ll",
        label: "Mintázat",
        d: "M68 140 C60 132 70 124 78 134 C74 140 70 142 68 140 Z",
      },
      {
        id: "spot-lr",
        label: "Mintázat",
        d: "M132 140 C140 132 130 124 122 134 C126 140 130 142 132 140 Z",
      },
    ],
    strokes: [
      { id: "ant-l", d: "M96 64 C86 44 74 34 68 28" },
      { id: "ant-r", d: "M104 64 C114 44 126 34 132 28" },
      { id: "vein-l", d: "M70 90 C58 78 48 84 42 96" },
      { id: "vein-r", d: "M130 90 C142 78 152 84 158 96" },
    ],
  },
  {
    id: "car",
    title: "Autó",
    emoji: "🚗",
    category: "Járművek",
    life: "drive",
    regions: [
      {
        id: "body",
        label: "Karosszéria",
        d: "M24 120 C28 96 40 84 58 78 L86 72 C104 68 122 68 140 74 C158 80 170 92 178 110 L184 124 L184 142 C184 148 178 152 170 152 L30 152 C24 152 20 148 20 142 L20 128 C20 124 22 120 24 120 Z",
      },
      {
        id: "cabin",
        label: "Utastér",
        d: "M72 74 L132 74 C146 76 158 88 164 104 L78 104 C74 90 72 80 72 74 Z",
      },
      {
        id: "window-f",
        label: "Ablak",
        d: "M84 80 L124 80 C134 82 142 92 146 102 L88 102 C84 92 84 84 84 80 Z",
      },
      {
        id: "bumper-f",
        label: "Lökhárító",
        d: "M168 128 L184 128 L184 142 L166 142 Z",
      },
      {
        id: "bumper-b",
        label: "Lökhárító",
        d: "M20 128 L36 128 L36 142 L20 142 Z",
      },
      {
        id: "wheel-l",
        label: "Kerék",
        d: "M58 148 C42 148 42 176 58 176 C74 176 74 148 58 148 Z",
      },
      {
        id: "wheel-r",
        label: "Kerék",
        d: "M150 148 C134 148 134 176 150 176 C166 176 166 148 150 148 Z",
      },
      {
        id: "hub-l",
        label: "Felni",
        d: "M58 156 C50 156 50 168 58 168 C66 168 66 156 58 156 Z",
      },
      {
        id: "hub-r",
        label: "Felni",
        d: "M150 156 C142 156 142 168 150 168 C158 168 158 156 150 156 Z",
      },
      {
        id: "light-f",
        label: "Lámpa",
        d: "M172 112 C178 112 182 118 180 124 L168 124 C166 118 168 112 172 112 Z",
      },
      {
        id: "light-b",
        label: "Lámpa",
        d: "M24 114 C28 112 32 116 30 122 L22 122 C20 116 22 114 24 114 Z",
      },
    ],
    strokes: [
      { id: "door", d: "M108 104 L108 148" },
      { id: "handle", d: "M112 120 L122 120" },
    ],
  },
  {
    id: "fish",
    title: "Hal",
    emoji: "🐟",
    category: "Állatok",
    life: "swim",
    regions: [
      {
        id: "body",
        label: "Test",
        d: "M36 100 C36 68 78 48 122 56 C154 62 172 86 164 112 C154 140 112 156 70 146 C46 140 36 120 36 100 Z",
      },
      {
        id: "tail",
        label: "Farok",
        d: "M160 102 C184 68 198 90 190 112 C198 136 180 158 160 122 Z",
      },
      {
        id: "fin-top",
        label: "Úszó",
        d: "M88 60 C96 34 128 38 124 66 C110 62 98 62 88 60 Z",
      },
      {
        id: "fin-bot",
        label: "Úszó",
        d: "M86 136 C94 160 124 158 118 132 C106 136 96 136 86 136 Z",
      },
      {
        id: "fin-side",
        label: "Úszó",
        d: "M90 104 C78 96 68 108 78 118 C86 114 90 110 90 104 Z",
      },
      {
        id: "eye",
        label: "Szem",
        d: "M58 90 C52 90 52 102 58 102 C64 102 64 90 58 90 Z",
      },
    ],
    strokes: [
      { id: "gill", d: "M74 86 C80 100 80 114 74 128" },
      { id: "scale1", d: "M100 88 C108 96 108 104 100 112" },
      { id: "scale2", d: "M116 90 C124 98 124 106 116 114" },
    ],
  },
  {
    id: "bird",
    title: "Madár",
    emoji: "🐦",
    category: "Állatok",
    life: "fly",
    regions: [
      {
        id: "body",
        label: "Test",
        d: "M66 108 C56 86 76 64 106 68 C132 72 148 96 136 122 C124 146 86 148 66 128 C58 120 60 112 66 108 Z",
      },
      {
        id: "wing",
        label: "Szárny",
        d: "M86 94 C62 82 34 96 44 120 C56 138 90 128 106 112 C98 104 92 98 86 94 Z",
      },
      {
        id: "head",
        label: "Fej",
        d: "M120 74 C114 54 140 44 152 62 C160 76 146 92 130 86 C122 84 120 78 120 74 Z",
      },
      {
        id: "beak",
        label: "Csőr",
        d: "M150 68 L176 74 L150 84 Z",
      },
      {
        id: "tail",
        label: "Farok",
        d: "M64 122 C40 128 28 154 52 152 C68 150 74 134 64 122 Z",
      },
      {
        id: "belly",
        label: "Has",
        d: "M90 118 C96 132 120 130 122 114 C112 124 98 124 90 118 Z",
      },
    ],
    strokes: [
      { id: "eye", d: "M132 68 C134 72 138 72 140 68" },
      { id: "wing-line", d: "M70 102 C84 108 96 108 108 102" },
    ],
  },
  {
    id: "fox",
    title: "Róka",
    emoji: "🦊",
    category: "Állatok",
    life: "walk",
    regions: [
      {
        id: "body",
        label: "Test",
        d: "M62 118 C50 120 46 148 64 164 C84 180 120 178 140 158 C156 144 152 118 134 114 C120 128 94 134 74 126 Z",
      },
      {
        id: "head",
        label: "Fej",
        d: "M70 68 C62 44 88 30 112 40 C134 36 152 56 142 80 C150 98 130 112 106 106 C84 112 64 94 70 68 Z",
      },
      {
        id: "ear-l",
        label: "Fül",
        d: "M76 50 L64 18 L98 46 Z",
      },
      {
        id: "ear-r",
        label: "Fül",
        d: "M124 46 L148 16 L140 54 Z",
      },
      {
        id: "chest",
        label: "Mell",
        d: "M94 98 C86 114 114 116 116 98 C108 108 100 108 94 98 Z",
      },
      {
        id: "tail",
        label: "Farok",
        d: "M138 128 C166 112 192 138 172 164 C152 182 142 150 138 128 Z",
      },
      {
        id: "leg-l",
        label: "Láb",
        d: "M76 160 C72 182 92 184 96 162 Z",
      },
      {
        id: "leg-r",
        label: "Láb",
        d: "M116 158 C114 180 134 180 134 156 Z",
      },
    ],
    strokes: [
      { id: "eye-l", d: "M90 66 C92 70 96 70 98 66" },
      { id: "eye-r", d: "M114 66 C116 70 120 70 122 66" },
      { id: "nose", d: "M104 84 C106 90 110 88 108 82" },
    ],
  },
  {
    id: "rocket",
    title: "Rakéta",
    emoji: "🚀",
    category: "Űr",
    life: "fly",
    regions: [
      {
        id: "nose",
        label: "Orrokúp",
        d: "M100 20 C84 48 82 66 84 80 L116 80 C118 66 116 48 100 20 Z",
      },
      {
        id: "body",
        label: "Test",
        d: "M84 80 L116 80 L118 142 L82 142 Z",
      },
      {
        id: "window",
        label: "Ablak",
        d: "M100 96 C88 96 88 118 100 118 C112 118 112 96 100 96 Z",
      },
      {
        id: "fin-l",
        label: "Szárny",
        d: "M84 118 L52 156 L84 148 Z",
      },
      {
        id: "fin-r",
        label: "Szárny",
        d: "M116 118 L148 156 L116 148 Z",
      },
      {
        id: "flame",
        label: "Láng",
        d: "M88 142 C90 166 100 186 100 186 C100 186 110 166 112 142 Z",
      },
    ],
  },
  {
    id: "flower",
    title: "Virág",
    emoji: "🌸",
    category: "Természet",
    life: "sway",
    regions: [
      {
        id: "center",
        label: "Közép",
        d: "M100 84 C86 84 86 106 100 106 C114 106 114 84 100 84 Z",
      },
      {
        id: "p1",
        label: "Szirom",
        d: "M100 84 C88 52 112 52 100 84 Z",
      },
      {
        id: "p2",
        label: "Szirom",
        d: "M114 90 C140 68 154 96 122 104 Z",
      },
      {
        id: "p3",
        label: "Szirom",
        d: "M114 106 C142 118 132 148 108 122 Z",
      },
      {
        id: "p4",
        label: "Szirom",
        d: "M86 106 C58 118 68 148 92 122 Z",
      },
      {
        id: "p5",
        label: "Szirom",
        d: "M86 90 C60 68 46 96 78 104 Z",
      },
      {
        id: "stem",
        label: "Szár",
        d: "M96 118 C94 146 94 168 96 176 L104 176 C106 168 106 146 104 118 Z",
      },
      {
        id: "leaf",
        label: "Levél",
        d: "M104 140 C128 128 146 150 122 162 C114 154 108 148 104 140 Z",
      },
    ],
  },
  {
    id: "house",
    title: "Ház",
    emoji: "🏠",
    category: "Formák",
    life: "float",
    regions: [
      { id: "roof", label: "Tető", d: "M32 98 L100 30 L168 98 Z" },
      { id: "wall", label: "Fal", d: "M46 98 L154 98 L154 170 L46 170 Z" },
      { id: "door", label: "Ajtó", d: "M86 126 L114 126 L114 170 L86 170 Z" },
      { id: "window-l", label: "Ablak", d: "M56 112 L78 112 L78 134 L56 134 Z" },
      { id: "window-r", label: "Ablak", d: "M122 112 L144 112 L144 134 L122 134 Z" },
      { id: "chimney", label: "Kémény", d: "M128 48 L128 78 L148 78 L148 56 Z" },
    ],
  },
  {
    id: "bus",
    title: "Busz",
    emoji: "🚌",
    category: "Járművek",
    life: "drive",
    regions: [
      {
        id: "body",
        label: "Karosszéria",
        d: "M26 78 L172 78 C178 78 182 84 182 90 L178 134 L22 134 L18 90 C18 84 22 78 26 78 Z",
      },
      { id: "w1", label: "Ablak", d: "M38 88 L68 88 L68 112 L38 112 Z" },
      { id: "w2", label: "Ablak", d: "M76 88 L106 88 L106 112 L76 112 Z" },
      { id: "w3", label: "Ablak", d: "M114 88 L144 88 L144 112 L114 112 Z" },
      { id: "door", label: "Ajtó", d: "M150 88 L170 88 L170 128 L150 128 Z" },
      {
        id: "wheel-l",
        label: "Kerék",
        d: "M56 132 C42 132 42 158 56 158 C70 158 70 132 56 132 Z",
      },
      {
        id: "wheel-r",
        label: "Kerék",
        d: "M146 132 C132 132 132 158 146 158 C160 158 160 132 146 132 Z",
      },
    ],
  },
  {
    id: "boat",
    title: "Hajó",
    emoji: "⛵",
    category: "Járművek",
    life: "swim",
    regions: [
      {
        id: "hull",
        label: "Hajótest",
        d: "M36 118 C44 150 70 162 100 162 C130 162 156 150 164 118 Z",
      },
      { id: "sail", label: "Vitorla", d: "M100 40 L152 116 L100 116 Z" },
      { id: "mast", label: "Árbóc", d: "M97 40 L97 118 L103 118 L103 40 Z" },
      { id: "flag", label: "Zászló", d: "M103 44 L128 54 L103 64 Z" },
    ],
  },
  {
    id: "tree",
    title: "Fa",
    emoji: "🌳",
    category: "Természet",
    life: "sway",
    regions: [
      {
        id: "crown",
        label: "Lomb",
        d: "M100 36 C68 36 44 68 54 98 C34 102 38 136 68 134 C72 158 128 158 132 134 C160 136 164 102 144 98 C156 68 132 36 100 36 Z",
      },
      {
        id: "trunk",
        label: "Törzs",
        d: "M86 130 C84 152 84 170 88 176 L112 176 C116 170 116 152 114 130 Z",
      },
      {
        id: "hole",
        label: "Odú",
        d: "M100 98 C92 98 92 116 100 116 C108 116 108 98 100 98 Z",
      },
    ],
  },
  {
    id: "plane",
    title: "Repülő",
    emoji: "✈️",
    category: "Járművek",
    life: "fly",
    regions: [
      {
        id: "fuselage",
        label: "Törzs",
        d: "M36 100 C36 86 72 78 124 84 C156 88 176 96 178 104 C176 112 156 120 124 122 C72 128 36 114 36 100 Z",
      },
      {
        id: "wing",
        label: "Szárny",
        d: "M88 100 L34 66 L54 100 L34 134 Z",
      },
      {
        id: "tail",
        label: "Farok",
        d: "M152 94 L180 66 L170 104 L180 134 L152 112 Z",
      },
      {
        id: "window",
        label: "Ablak",
        d: "M68 92 C62 92 62 108 68 108 C74 108 74 92 68 92 Z",
      },
    ],
  },
  {
    id: "bunny",
    title: "Nyuszi",
    emoji: "🐰",
    category: "Állatok",
    life: "hop",
    regions: [
      {
        id: "body",
        label: "Test",
        d: "M72 118 C60 120 56 152 76 168 C96 182 128 176 140 156 C152 140 144 116 126 116 C116 130 98 134 82 126 Z",
      },
      {
        id: "head",
        label: "Fej",
        d: "M76 76 C68 52 90 36 112 44 C132 38 150 58 140 82 C146 102 124 116 102 110 C80 116 70 96 76 76 Z",
      },
      {
        id: "ear-l",
        label: "Fül",
        d: "M84 50 C76 14 102 10 104 50 C96 56 88 56 84 50 Z",
      },
      {
        id: "ear-r",
        label: "Fül",
        d: "M116 48 C122 12 146 16 134 52 C126 56 120 54 116 48 Z",
      },
      {
        id: "tail",
        label: "Farok",
        d: "M138 126 C152 116 164 132 150 144 Z",
      },
      {
        id: "foot-l",
        label: "Láb",
        d: "M80 164 C74 182 104 184 106 166 Z",
      },
      {
        id: "foot-r",
        label: "Láb",
        d: "M114 162 C112 180 138 180 134 160 Z",
      },
    ],
    strokes: [
      { id: "eye-l", d: "M92 72 C94 76 98 76 100 72" },
      { id: "eye-r", d: "M112 72 C114 76 118 76 120 72" },
      { id: "nose", d: "M104 86 C106 90 110 88 108 84" },
    ],
  },
  {
    id: "icecream",
    title: "Fagyi",
    emoji: "🍦",
    category: "Ételek",
    life: "float",
    regions: [
      {
        id: "scoop1",
        label: "Golyó",
        d: "M100 68 C76 68 70 102 100 108 C130 102 124 68 100 68 Z",
      },
      {
        id: "scoop2",
        label: "Golyó",
        d: "M74 56 C56 46 54 78 78 84 C90 72 88 56 74 56 Z",
      },
      {
        id: "scoop3",
        label: "Golyó",
        d: "M126 56 C144 46 146 78 122 84 C110 72 112 56 126 56 Z",
      },
      {
        id: "cone",
        label: "Tölcsér",
        d: "M76 102 L124 102 L100 176 Z",
      },
    ],
    strokes: [
      { id: "cone1", d: "M84 112 L108 160" },
      { id: "cone2", d: "M116 112 L92 160" },
      { id: "cone3", d: "M88 128 L112 128" },
    ],
  },
];
