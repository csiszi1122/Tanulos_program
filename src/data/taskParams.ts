export type ParamDef = {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  default: number;
};

export type TaskParamSchema = {
  taskId: string;
  moduleId: string;
  title: string;
  params: ParamDef[];
};

/** Per-task tunable knobs for the parent panel. */
export const TASK_PARAM_SCHEMAS: TaskParamSchema[] = [
  {
    taskId: "simple-addition",
    moduleId: "math",
    title: "Egyszerű összeadás",
    params: [
      { key: "maxAddend", label: "Max összeadandó", min: 3, max: 999, default: 5 },
      { key: "optionCount", label: "Válaszlehetőségek", min: 2, max: 12, default: 4 },
    ],
  },
  {
    taskId: "progressive-math",
    moduleId: "math",
    title: "Nehezedő szintek",
    params: [
      { key: "winsNeeded", label: "Szükséges helyes válasz", min: 2, max: 30, default: 3 },
      { key: "easyMax", label: "Könnyű max", min: 3, max: 100, default: 5 },
      { key: "mediumMax", label: "Közepes max", min: 8, max: 500, default: 15 },
      { key: "hardMax", label: "Nehéz max", min: 12, max: 999, default: 25 },
    ],
  },
  {
    taskId: "number-line",
    moduleId: "math",
    title: "Számegyenes ugrás",
    params: [
      { key: "lineMax", label: "Vonal hossza", min: 8, max: 100, default: 10 },
      { key: "start", label: "Kezdőpont", min: 0, max: 50, default: 2 },
      { key: "jump", label: "Célugrás (+)", min: 2, max: 40, default: 3 },
    ],
  },
  {
    taskId: "memory-match",
    moduleId: "math",
    title: "Memória párosító",
    params: [
      { key: "pairCount", label: "Párok száma", min: 2, max: 16, default: 4 },
    ],
  },
  {
    taskId: "lightning-round",
    moduleId: "math",
    title: "Villámkör",
    params: [
      { key: "seconds", label: "Idő (mp)", min: 15, max: 300, step: 5, default: 45 },
      { key: "optionCount", label: "Válaszlehetőségek", min: 2, max: 8, default: 3 },
      { key: "maxAddend", label: "Max összeadandó", min: 5, max: 999, default: 9 },
    ],
  },
  {
    taskId: "multiplication",
    moduleId: "math",
    title: "Szorzótábla",
    params: [
      { key: "rounds", label: "Körök száma", min: 2, max: 50, default: 4 },
      { key: "maxFactor", label: "Max szorzó", min: 2, max: 20, default: 5 },
    ],
  },
  {
    taskId: "letter-recognition",
    moduleId: "language",
    title: "Betűfelismerés",
    params: [
      { key: "rounds", label: "Körök száma", min: 2, max: 30, default: 3 },
      { key: "optionCount", label: "Válaszlehetőségek", min: 2, max: 10, default: 4 },
    ],
  },
  {
    taskId: "word-builder",
    moduleId: "language",
    title: "Szóépítő",
    params: [
      { key: "wordCount", label: "Szavak száma", min: 1, max: 12, default: 3 },
    ],
  },
  {
    taskId: "reading-cards",
    moduleId: "language",
    title: "Olvasó-kártyák",
    params: [
      { key: "cardCount", label: "Kártyák száma", min: 2, max: 24, default: 4 },
    ],
  },
  {
    taskId: "rhyme-finder",
    moduleId: "language",
    title: "Rímkereső",
    params: [
      { key: "rounds", label: "Körök száma", min: 1, max: 20, default: 3 },
    ],
  },
  {
    taskId: "pattern-match",
    moduleId: "logic",
    title: "Mintafelismerés",
    params: [
      { key: "rounds", label: "Körök száma", min: 2, max: 20, default: 4 },
    ],
  },
  {
    taskId: "number-sequence",
    moduleId: "logic",
    title: "Számsor",
    params: [
      { key: "rounds", label: "Körök száma", min: 2, max: 20, default: 4 },
      { key: "maxStep", label: "Max lépésköz", min: 1, max: 20, default: 3 },
    ],
  },
  {
    taskId: "card-memory",
    moduleId: "memory",
    title: "Kártyamemória",
    params: [
      { key: "pairCount", label: "Párok száma", min: 2, max: 16, default: 4 },
    ],
  },
  {
    taskId: "english-words",
    moduleId: "english",
    title: "Angol szavak",
    params: [
      { key: "rounds", label: "Körök száma", min: 2, max: 30, default: 5 },
      { key: "optionCount", label: "Válaszlehetőségek", min: 2, max: 8, default: 4 },
    ],
  },
  {
    taskId: "trace-drawing",
    moduleId: "drawing",
    title: "Vonalrajz műhely",
    params: [
      {
        key: "partCoverage",
        label: "Rész körberajzolás % (magasabb = szigorúbb)",
        min: 80,
        max: 98,
        step: 1,
        default: 90,
      },
      {
        key: "strokeWidth",
        label: "Vonalvastagság (tablet)",
        min: 10,
        max: 36,
        step: 1,
        default: 16,
      },
      {
        key: "drawingsToWin",
        label: "Képek a jutalomhoz",
        min: 1,
        max: 10,
        step: 1,
        default: 2,
      },
    ],
  },
  {
    taskId: "color-fill",
    moduleId: "drawing",
    title: "Színező műhely",
    params: [
      {
        key: "picturesToWin",
        label: "Képek a jutalomhoz",
        min: 1,
        max: 10,
        step: 1,
        default: 2,
      },
      {
        key: "strokeWidth",
        label: "Vonalvastagság (tablet)",
        min: 10,
        max: 36,
        step: 1,
        default: 18,
      },
    ],
  },
];

export type TaskParamsMap = Record<string, Record<string, number>>;

export function defaultTaskParams(): TaskParamsMap {
  const map: TaskParamsMap = {};
  for (const schema of TASK_PARAM_SCHEMAS) {
    map[schema.taskId] = {};
    for (const p of schema.params) {
      map[schema.taskId][p.key] = p.default;
    }
  }
  return map;
}

export function parseTaskParams(json?: string | null): TaskParamsMap {
  const base = defaultTaskParams();
  if (!json) return base;
  try {
    const parsed = JSON.parse(json) as TaskParamsMap;
    for (const schema of TASK_PARAM_SCHEMAS) {
      const incoming = parsed[schema.taskId] ?? {};
      for (const p of schema.params) {
        const raw = incoming[p.key];
        const value = typeof raw === "number" && Number.isFinite(raw) ? raw : p.default;
        base[schema.taskId][p.key] = Math.min(p.max, Math.max(p.min, value));
      }
    }
  } catch {
    /* keep defaults */
  }
  return base;
}

export function serializeTaskParams(map: TaskParamsMap): string {
  return JSON.stringify(map);
}

export function getTaskConfig(
  taskId: string,
  map: TaskParamsMap,
): Record<string, number> {
  return { ...(map[taskId] ?? defaultTaskParams()[taskId] ?? {}) };
}

export function setTaskParam(
  map: TaskParamsMap,
  taskId: string,
  key: string,
  value: number,
): TaskParamsMap {
  const schema = TASK_PARAM_SCHEMAS.find((s) => s.taskId === taskId);
  const def = schema?.params.find((p) => p.key === key);
  const clamped = def
    ? Math.min(def.max, Math.max(def.min, value))
    : value;
  return {
    ...map,
    [taskId]: {
      ...(map[taskId] ?? {}),
      [key]: clamped,
    },
  };
}
