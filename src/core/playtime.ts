const PLAY_KEY = "tanulos_play_minutes";

function today() {
  return new Date().toISOString().slice(0, 10);
}

type PlayDay = { date: string; minutes: number };

function load(): PlayDay {
  try {
    const raw = JSON.parse(localStorage.getItem(PLAY_KEY) ?? "{}") as PlayDay;
    if (raw.date === today()) return raw;
  } catch {
    /* ignore */
  }
  return { date: today(), minutes: 0 };
}

function save(row: PlayDay) {
  localStorage.setItem(PLAY_KEY, JSON.stringify(row));
}

export function getPlayedMinutesToday(): number {
  return load().minutes;
}

export function addPlaySeconds(seconds: number) {
  const row = load();
  row.minutes += seconds / 60;
  save(row);
}

export function remainingMinutes(limit: number): number | null {
  if (!limit || limit <= 0) return null;
  return Math.max(0, limit - getPlayedMinutesToday());
}

export function isPlayBlocked(limit: number): boolean {
  if (!limit || limit <= 0) return false;
  return getPlayedMinutesToday() >= limit;
}
