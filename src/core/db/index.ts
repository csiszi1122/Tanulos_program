import Dexie, { type EntityTable } from "dexie";
import { defaultTaskParams, serializeTaskParams } from "../../data/taskParams";
import { DEFAULT_PLAYLISTS, serializePlaylists } from "../../data/playlist";
import { evaluateRewards } from "../rewards/evaluateRewards";

export interface Profile {
  id?: number;
  name: string;
  avatar: string;
  /** Optional JPEG/PNG data URL for a custom photo avatar */
  avatarImage?: string | null;
  createdAt: number;
}

export interface Progress {
  id?: number;
  profileId: number;
  totalPoints: number;
  streak: number;
  lastPlayedAt: number | null;
  dailyPoints: number;
  dailyGoalDate: string;
  tasksCompletedToday: number;
  completedTaskKeys: string;
}

export interface Achievement {
  id?: number;
  profileId: number;
  key: string;
  title: string;
  unlockedAt: number;
}

export interface Sticker {
  id?: number;
  profileId: number;
  stickerId: string;
  unlockedAt: number;
}

export interface DailyHistory {
  id?: number;
  profileId: number;
  date: string;
  points: number;
  tasksCompleted: number;
  goalMet: number;
}

export interface AppSettings {
  id: number;
  soundEnabled: boolean;
  parentPin: string;
  dailyGoal: number;
  enabledModules: string;
  /** JSON map of taskId -> { paramKey: number } */
  taskParamsJson: string;
  themeMode: "vivid" | "soft" | "dark";
  dailyPlayMinutesLimit: number;
  adaptiveDifficulty: boolean;
  playlistJson: string;
}

class TanulosDB extends Dexie {
  profiles!: EntityTable<Profile, "id">;
  progress!: EntityTable<Progress, "id">;
  achievements!: EntityTable<Achievement, "id">;
  stickers!: EntityTable<Sticker, "id">;
  settings!: EntityTable<AppSettings, "id">;
  dailyHistory!: EntityTable<DailyHistory, "id">;

  constructor() {
    super("tanulos_program");
    this.version(1).stores({
      profiles: "++id, name",
      progress: "++id, profileId",
      achievements: "++id, profileId, key",
    });
    this.version(2)
      .stores({
        profiles: "++id, name",
        progress: "++id, profileId",
        achievements: "++id, profileId, key",
        stickers: "++id, profileId, stickerId",
        settings: "id",
      })
      .upgrade(async (tx) => {
        const rows = await tx.table("progress").toArray();
        for (const row of rows) {
          await tx.table("progress").update(row.id, {
            dailyPoints: row.dailyPoints ?? 0,
            dailyGoalDate: row.dailyGoalDate ?? "",
            tasksCompletedToday: row.tasksCompletedToday ?? 0,
            completedTaskKeys: row.completedTaskKeys ?? "",
          });
        }
      });
    this.version(3).stores({
      profiles: "++id, name",
      progress: "++id, profileId",
      achievements: "++id, profileId, key",
      stickers: "++id, profileId, stickerId",
      settings: "id",
      dailyHistory: "++id, profileId, date, [profileId+date]",
    });
    this.version(4).stores({
      profiles: "++id, name",
      progress: "++id, profileId",
      achievements: "++id, profileId, key",
      stickers: "++id, profileId, stickerId",
      settings: "id",
      dailyHistory: "++id, profileId, date, [profileId+date]",
    });
  }
}

export const db = new TanulosDB();

const ACTIVE_PROFILE_KEY = "tanulos_active_profile";

export function getStoredActiveProfileId(): number | null {
  const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function setStoredActiveProfileId(id: number | null) {
  if (id == null) localStorage.removeItem(ACTIVE_PROFILE_KEY);
  else localStorage.setItem(ACTIVE_PROFILE_KEY, String(id));
}

export async function ensureSettings(): Promise<AppSettings> {
  let settings = await db.settings.get(1);
  if (!settings) {
    settings = {
      id: 1,
      soundEnabled: true,
      parentPin: "1234",
      dailyGoal: 3,
      enabledModules: "math,language,logic,memory,english",
      taskParamsJson: serializeTaskParams(defaultTaskParams()),
      themeMode: "vivid",
      dailyPlayMinutesLimit: 0,
      adaptiveDifficulty: true,
      playlistJson: serializePlaylists(DEFAULT_PLAYLISTS),
    };
    await db.settings.put(settings);
    return settings;
  }

  let patched = false;
  if (!settings.taskParamsJson) {
    settings.taskParamsJson = serializeTaskParams(defaultTaskParams());
    patched = true;
  }
  if (!settings.themeMode) {
    settings.themeMode = "vivid";
    patched = true;
  }
  if (settings.dailyPlayMinutesLimit === undefined) {
    settings.dailyPlayMinutesLimit = 0;
    patched = true;
  }
  if (settings.adaptiveDifficulty === undefined) {
    settings.adaptiveDifficulty = true;
    patched = true;
  }
  if (!settings.playlistJson) {
    settings.playlistJson = serializePlaylists(DEFAULT_PLAYLISTS);
    patched = true;
  }
  if (patched) await db.settings.put(settings);

  return settings;
}

export async function updateSettings(
  patch: Partial<Omit<AppSettings, "id">>,
): Promise<AppSettings> {
  const current = await ensureSettings();
  const next = { ...current, ...patch };
  await db.settings.put(next);
  return next;
}

async function ensureProgress(profileId: number): Promise<Progress> {
  let progress = await db.progress.where("profileId").equals(profileId).first();
  if (!progress) {
    const id = await db.progress.add({
      profileId,
      totalPoints: 0,
      streak: 0,
      lastPlayedAt: null,
      dailyPoints: 0,
      dailyGoalDate: "",
      tasksCompletedToday: 0,
      completedTaskKeys: "",
    });
    progress = await db.progress.get(id);
  }
  if (!progress) throw new Error("Failed to create progress");

  const needsPatch =
    progress.dailyPoints === undefined ||
    progress.completedTaskKeys === undefined;
  if (needsPatch && progress.id) {
    await db.progress.update(progress.id, {
      dailyPoints: progress.dailyPoints ?? 0,
      dailyGoalDate: progress.dailyGoalDate ?? "",
      tasksCompletedToday: progress.tasksCompletedToday ?? 0,
      completedTaskKeys: progress.completedTaskKeys ?? "",
    });
    progress = (await db.progress.get(progress.id))!;
  }

  return progress;
}

export async function listProfiles(): Promise<Profile[]> {
  return db.profiles.orderBy("id").toArray();
}

export async function createProfile(
  name: string,
  avatar: string,
  avatarImage: string | null = null,
): Promise<Profile> {
  const id = await db.profiles.add({
    name: name.trim() || "Tanuló",
    avatar,
    avatarImage,
    createdAt: Date.now(),
  });
  if (id == null) throw new Error("Failed to create profile id");
  await ensureProgress(id);
  const profile = await db.profiles.get(id);
  if (!profile) throw new Error("Failed to create profile");
  return profile;
}

export async function updateProfile(
  id: number,
  patch: Partial<Pick<Profile, "name" | "avatar" | "avatarImage">>,
): Promise<Profile> {
  await db.profiles.update(id, patch);
  const profile = await db.profiles.get(id);
  if (!profile) throw new Error("Profile not found");
  return profile;
}

export async function ensureSeedProfile(): Promise<Profile[]> {
  const existing = await listProfiles();
  if (existing.length === 0) {
    await createProfile("Tanuló", "star");
    return listProfiles();
  }
  for (const p of existing) {
    if (p.id) await ensureProgress(p.id);
  }
  return existing;
}

export async function getProfileBundle(profileId: number) {
  const profile = await db.profiles.get(profileId);
  if (!profile) throw new Error("Profile not found");
  const progress = await ensureProgress(profileId);
  const achievements = await db.achievements.where("profileId").equals(profileId).toArray();
  const stickers = await db.stickers.where("profileId").equals(profileId).toArray();
  return { profile, progress, achievements, stickers };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function upsertDailyHistory(
  profileId: number,
  date: string,
  points: number,
  tasksCompleted: number,
  dailyGoal: number,
) {
  const existing = await db.dailyHistory
    .where("[profileId+date]")
    .equals([profileId, date])
    .first();
  const goalMet = tasksCompleted >= dailyGoal ? 1 : 0;
  if (existing?.id) {
    await db.dailyHistory.update(existing.id, {
      points,
      tasksCompleted,
      goalMet,
    });
  } else {
    await db.dailyHistory.add({
      profileId,
      date,
      points,
      tasksCompleted,
      goalMet,
    });
  }
}

export async function getDailyHistory(
  profileId: number,
  days = 30,
): Promise<DailyHistory[]> {
  const rows = await db.dailyHistory
    .where("profileId")
    .equals(profileId)
    .reverse()
    .sortBy("date");
  // sortBy returns ascending; reverse() on collection then sortBy may be wrong
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(-days);
}

/** Wipe progress data for a clean test slate. Keeps profiles, avatars, and parent settings. */
export async function resetAllProgressData(): Promise<void> {
  await db.transaction(
    "rw",
    db.progress,
    db.achievements,
    db.stickers,
    db.dailyHistory,
    db.profiles,
    async () => {
      await db.progress.clear();
      await db.achievements.clear();
      await db.stickers.clear();
      await db.dailyHistory.clear();
      const profiles = await db.profiles.toArray();
      for (const p of profiles) {
        if (p.id) await ensureProgress(p.id);
      }
    },
  );
}

export async function recordTaskCompletion(
  profileId: number,
  moduleId: string,
  taskId: string,
  points: number,
  dailyGoal: number,
  options?: { playlistSession?: boolean },
): Promise<{
  progress: Progress;
  newAchievements: Achievement[];
  newStickers: Sticker[];
  dailyGoalReached: boolean;
}> {
  const progress = await ensureProgress(profileId);
  if (!progress.id) throw new Error("Progress missing id");

  const today = todayKey();
  const lastDay = progress.lastPlayedAt
    ? new Date(progress.lastPlayedAt).toISOString().slice(0, 10)
    : null;

  let streak = progress.streak;
  if (lastDay !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);
    streak = lastDay === y ? streak + 1 : 1;
  }

  const isNewDay = progress.dailyGoalDate !== today;
  const dailyPoints = (isNewDay ? 0 : progress.dailyPoints) + points;
  const tasksCompletedToday = (isNewDay ? 0 : progress.tasksCompletedToday) + 1;

  const keys = new Set(
    (progress.completedTaskKeys || "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
  );
  keys.add(`${moduleId}:${taskId}`);

  await db.progress.update(progress.id, {
    totalPoints: progress.totalPoints + points,
    streak,
    lastPlayedAt: Date.now(),
    dailyPoints,
    dailyGoalDate: today,
    tasksCompletedToday,
    completedTaskKeys: [...keys].join(","),
  });

  const updated = (await db.progress.get(progress.id))!;
  await upsertDailyHistory(
    profileId,
    today,
    updated.dailyPoints,
    updated.tasksCompletedToday,
    dailyGoal,
  );

  const dailyGoalReached =
    updated.tasksCompletedToday >= dailyGoal &&
    (isNewDay || progress.tasksCompletedToday < dailyGoal);

  const { newAchievements, newStickers } = await evaluateRewards({
    profileId,
    moduleId,
    taskId,
    progress: updated,
    dailyGoalReached,
    playlistSession: options?.playlistSession,
  });

  return { progress: updated, newAchievements, newStickers, dailyGoalReached };
}

export async function unlockAchievement(
  profileId: number,
  key: string,
  title: string,
): Promise<Achievement | null> {
  const existing = await db.achievements.where({ profileId, key }).first();
  if (existing) return null;
  const id = await db.achievements.add({
    profileId,
    key,
    title,
    unlockedAt: Date.now(),
  });
  return (await db.achievements.get(id)) ?? null;
}

export async function unlockSticker(
  profileId: number,
  stickerId: string,
): Promise<Sticker | null> {
  const existing = await db.stickers.where({ profileId, stickerId }).first();
  if (existing) return null;
  const id = await db.stickers.add({
    profileId,
    stickerId,
    unlockedAt: Date.now(),
  });
  return (await db.stickers.get(id)) ?? null;
}

/** @deprecated use recordTaskCompletion */
export async function addPoints(profileId: number, points: number): Promise<Progress> {
  const settings = await ensureSettings();
  const result = await recordTaskCompletion(
    profileId,
    "general",
    "points",
    points,
    settings.dailyGoal,
  );
  return result.progress;
}

export async function ensureDefaultProfile(): Promise<{
  profile: Profile;
  progress: Progress;
}> {
  const profiles = await ensureSeedProfile();
  const profile = profiles[0];
  if (!profile?.id) throw new Error("No profile");
  const progress = await ensureProgress(profile.id);
  return { profile, progress };
}
