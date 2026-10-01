const ADAPT_KEY = "tanulos_adapt";

type AdaptState = Record<string, { correct: number; wrong: number }>;

function load(): AdaptState {
  try {
    return JSON.parse(localStorage.getItem(ADAPT_KEY) ?? "{}") as AdaptState;
  } catch {
    return {};
  }
}

function save(state: AdaptState) {
  localStorage.setItem(ADAPT_KEY, JSON.stringify(state));
}

export function recordAnswer(taskId: string, correct: boolean) {
  const state = load();
  const row = state[taskId] ?? { correct: 0, wrong: 0 };
  if (correct) row.correct += 1;
  else row.wrong += 1;
  state[taskId] = row;
  save(state);
}

/** Returns a multiplier 0.7–1.4 based on recent accuracy. */
export function adaptiveScale(taskId: string): number {
  const row = load()[taskId];
  if (!row) return 1;
  const total = row.correct + row.wrong;
  if (total < 4) return 1;
  const accuracy = row.correct / total;
  if (accuracy > 0.85) return 1.35;
  if (accuracy > 0.7) return 1.15;
  if (accuracy < 0.4) return 0.7;
  if (accuracy < 0.55) return 0.85;
  return 1;
}

export function applyAdaptive(
  taskId: string,
  config: Record<string, number>,
  enabled: boolean,
): Record<string, number> {
  if (!enabled) return config;
  const scale = adaptiveScale(taskId);
  const next = { ...config };
  for (const key of Object.keys(next)) {
    if (
      key.toLowerCase().includes("max") ||
      key === "pairCount" ||
      key === "lineMax" ||
      key === "jump" ||
      key === "maxFactor" ||
      key === "maxAddend" ||
      key === "maxStep"
    ) {
      next[key] = Math.max(1, Math.round(next[key] * scale));
    }
  }
  return next;
}
