import {
  db,
  getDailyHistory,
  type Profile,
} from "../db";

export async function exportProgressCsv(profileId: number): Promise<string> {
  const [history, progress, achievements, stickers, profile] = await Promise.all([
    getDailyHistory(profileId, 60),
    db.progress.where("profileId").equals(profileId).first(),
    db.achievements.where("profileId").equals(profileId).toArray(),
    db.stickers.where("profileId").equals(profileId).toArray(),
    db.profiles.get(profileId),
  ]);

  const lines: string[] = [];
  lines.push("Tanulós Program - haladás export");
  lines.push(`Profil,${profile?.name ?? ""}`);
  lines.push(`Összpont,${progress?.totalPoints ?? 0}`);
  lines.push(`Sorozat,${progress?.streak ?? 0}`);
  lines.push(`Achievementek,${achievements.length}`);
  lines.push(`Matricák,${stickers.length}`);
  lines.push("");
  lines.push("date,points,tasks,goal_met");
  for (const row of history) {
    lines.push(`${row.date},${row.points},${row.tasksCompleted},${row.goalMet ? 1 : 0}`);
  }
  return lines.join("\n");
}

export async function buildBackupPayload(profileId: number) {
  const [profile, progress, achievements, stickers, history] = await Promise.all([
    db.profiles.get(profileId),
    db.progress.where("profileId").equals(profileId).first(),
    db.achievements.where("profileId").equals(profileId).toArray(),
    db.stickers.where("profileId").equals(profileId).toArray(),
    getDailyHistory(profileId, 90),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    progress,
    achievements,
    stickers,
    history,
  };
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportBackupJson(profile: Profile) {
  if (!profile.id) return;
  const payload = await buildBackupPayload(profile.id);
  downloadTextFile(
    `tanulos-backup-${profile.name}.json`,
    JSON.stringify(payload, null, 2),
    "application/json",
  );
}

export async function createBackupQrDataUrl(profileId: number): Promise<string> {
  const payload = await buildBackupPayload(profileId);
  const compact = JSON.stringify({
    v: 1,
    p: payload.profile?.name,
    pts: payload.progress?.totalPoints,
    ach: payload.achievements?.length,
    stk: payload.stickers?.length,
  });
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(compact, { margin: 1, width: 220 });
}
