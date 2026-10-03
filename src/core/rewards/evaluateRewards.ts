import {
  db,
  unlockAchievement,
  unlockSticker,
  type Achievement,
  type Progress,
  type Sticker,
} from "../db";

export interface RewardContext {
  profileId: number;
  moduleId: string;
  taskId: string;
  progress: Progress;
  dailyGoalReached: boolean;
  playlistSession?: boolean;
}

const TASK_ACH: Record<string, { key: string; title: string; sticker?: string }> = {
  "number-line": { key: "number_line_pro", title: "Ugróművész", sticker: "flag" },
  "memory-match": { key: "memory_match_pro", title: "Párosító", sticker: "puzzle" },
  "progressive-math": { key: "progressive_pro", title: "Szintlépő", sticker: "bolt" },
  "letter-recognition": { key: "letter_pro", title: "ABC", sticker: "book" },
  "word-builder": { key: "word_builder_pro", title: "Szókovács", sticker: "key" },
  "reading-cards": { key: "reading_pro", title: "Olvasóka", sticker: "leaf" },
  "rhyme-finder": { key: "rhyme_pro", title: "Rímelő", sticker: "music" },
  "pattern-match": { key: "pattern_pro", title: "Mintavadász", sticker: "gem" },
  "number-sequence": { key: "sequence_pro", title: "Sorrendmester", sticker: "shield" },
  "card-memory": { key: "card_memory_pro", title: "Kártyamemória", sticker: "crystal" },
  "english-words": { key: "english_words_pro", title: "Word hero", sticker: "sun" },
  "trace-drawing": { key: "drawing_pro", title: "Vonalmester", sticker: "palette" },
  "color-fill": { key: "color_pro", title: "Színmester", sticker: "frame" },
  lightning: { key: "lightning", title: "Villámgyors", sticker: "comet" },
  multiplication: { key: "times_table", title: "Szorzótábla-mester", sticker: "medal" },
};

const MODULE_START = {
  math: { key: "math_starter", title: "Számolóka", sticker: "rocket" },
  language: { key: "language_starter", title: "Betűbarát", sticker: "book" },
  logic: { key: "logic_starter", title: "Logikus elme", sticker: "puzzle" },
  memory: { key: "memory_starter", title: "Emlékező", sticker: "owl" },
  english: { key: "english_starter", title: "Hello World", sticker: "flag" },
  drawing: { key: "drawing_starter", title: "Kis művész", sticker: "pencil" },
} as const;

async function tryAchieve(
  profileId: number,
  key: string,
  title: string,
  bag: Achievement[],
) {
  const a = await unlockAchievement(profileId, key, title);
  if (a) bag.push(a);
}

async function trySticker(
  profileId: number,
  stickerId: string,
  bag: Sticker[],
) {
  const s = await unlockSticker(profileId, stickerId);
  if (s) bag.push(s);
}

async function countDailyGoals(profileId: number) {
  const rows = await db.dailyHistory.where("profileId").equals(profileId).toArray();
  return rows.filter((r) => r.goalMet).length;
}

function modulesUsed(completedTaskKeys: string) {
  const mods = new Set<string>();
  for (const k of completedTaskKeys.split(",")) {
    const mod = k.split(":")[0];
    if (mod) mods.add(mod);
  }
  return mods.size;
}

export async function evaluateRewards(ctx: RewardContext): Promise<{
  newAchievements: Achievement[];
  newStickers: Sticker[];
}> {
  const { profileId, moduleId, taskId, progress, dailyGoalReached, playlistSession } =
    ctx;
  const newAchievements: Achievement[] = [];
  const newStickers: Sticker[] = [];

  await tryAchieve(profileId, "first_win", "Első siker!", newAchievements);

  const modStart = MODULE_START[moduleId as keyof typeof MODULE_START];
  if (modStart) {
    await tryAchieve(profileId, modStart.key, modStart.title, newAchievements);
    if (modStart.sticker) await trySticker(profileId, modStart.sticker, newStickers);
  }

  const taskAch = TASK_ACH[taskId];
  if (taskAch) {
    await tryAchieve(profileId, taskAch.key, taskAch.title, newAchievements);
    if (taskAch.sticker) await trySticker(profileId, taskAch.sticker, newStickers);
  }

  const pts = progress.totalPoints;
  if (pts >= 100) await tryAchieve(profileId, "first_100", "100 pont", newAchievements);
  if (pts >= 250) await tryAchieve(profileId, "points_250", "250 pont", newAchievements);
  if (pts >= 500) await tryAchieve(profileId, "points_500", "500 pont", newAchievements);
  if (pts >= 1000) await tryAchieve(profileId, "points_1000", "1000 pont", newAchievements);
  if (pts >= 2500) await tryAchieve(profileId, "points_2500", "2500 pont", newAchievements);

  const streak = progress.streak;
  if (streak >= 3) await tryAchieve(profileId, "streak_3", "3 napos sorozat", newAchievements);
  if (streak >= 7) {
    await tryAchieve(profileId, "streak_7", "7 napos sorozat", newAchievements);
    await trySticker(profileId, "crown", newStickers);
  }
  if (streak >= 14) await tryAchieve(profileId, "streak_14", "2 hetes sorozat", newAchievements);
  if (streak >= 30) {
    await tryAchieve(profileId, "streak_30", "Hónapos sorozat", newAchievements);
    await trySticker(profileId, "planet", newStickers);
  }

  if (dailyGoalReached) {
    await tryAchieve(profileId, "daily_goal", "Napi cél", newAchievements);
    await trySticker(profileId, "star-burst", newStickers);
    const goals = await countDailyGoals(profileId);
    if (goals >= 5) await tryAchieve(profileId, "daily_goal_5", "Célgép", newAchievements);
    if (goals >= 20) await tryAchieve(profileId, "daily_goal_20", "Kitartó", newAchievements);
  }

  if (progress.dailyPoints >= 300) {
    await tryAchieve(profileId, "perfect_day", "Tökéletes nap", newAchievements);
    await trySticker(profileId, "sun", newStickers);
  }

  const hour = new Date().getHours();
  if (hour < 9) await tryAchieve(profileId, "early_bird", "Korán kelő", newAchievements);
  if (hour >= 20) await tryAchieve(profileId, "night_owl", "Éjjeli bagoly", newAchievements);

  if (modulesUsed(progress.completedTaskKeys) >= 3) {
    await tryAchieve(profileId, "explorer", "Felfedező", newAchievements);
    await trySticker(profileId, "wave", newStickers);
  }

  const stickerCount = await db.stickers.where("profileId").equals(profileId).count();
  if (stickerCount >= 5) await tryAchieve(profileId, "collector_5", "Gyűjtő", newAchievements);
  if (stickerCount >= 15) await tryAchieve(profileId, "collector_15", "Nagyggyűjtő", newAchievements);

  if (playlistSession) {
    await tryAchieve(profileId, "playlist_done", "Lejátszási lista", newAchievements);
    await trySticker(profileId, "heart", newStickers);
  }

  if (newAchievements.some((a) => a.key === "first_win")) {
    await trySticker(profileId, "spark", newStickers);
  }

  return { newAchievements, newStickers };
}
