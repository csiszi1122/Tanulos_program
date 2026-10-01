import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createProfile,
  db,
  ensureSeedProfile,
  ensureSettings,
  getProfileBundle,
  getStoredActiveProfileId,
  listProfiles,
  recordTaskCompletion,
  resetAllProgressData,
  setStoredActiveProfileId,
  updateProfile,
  updateSettings,
  type Achievement,
  type AppSettings,
  type Profile,
  type Progress,
  type Sticker,
} from "../db";
import { stickerEmoji } from "../../data/catalog";
import { ACHIEVEMENT_CATALOG, STICKER_CATALOG } from "../../data/catalog";
import { setSoundMuted } from "../audio/sfx";

export interface UnlockToast {
  kind: "achievement" | "sticker";
  title: string;
  emoji: string;
}

interface AppStoreValue {
  ready: boolean;
  profiles: Profile[];
  activeProfileId: number | null;
  profile: Profile | null;
  progress: Progress | null;
  achievements: Achievement[];
  stickers: Sticker[];
  settings: AppSettings | null;
  unlockQueue: UnlockToast[];
  selectProfile: (id: number) => Promise<void>;
  clearActiveProfile: () => void;
  addProfile: (
    name: string,
    avatar: string,
    avatarImage?: string | null,
  ) => Promise<Profile>;
  editProfile: (
    id: number,
    name: string,
    avatar: string,
    avatarImage?: string | null,
  ) => Promise<void>;
  completeTask: (
    moduleId: string,
    taskId: string,
    score: number,
    options?: { playlistSession?: boolean },
  ) => Promise<{ dailyGoalReached: boolean }>;
  patchSettings: (patch: Partial<Omit<AppSettings, "id">>) => Promise<void>;
  resetProgress: () => Promise<void>;
  dismissUnlock: () => void;
  refresh: () => Promise<void>;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<number | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [unlockQueue, setUnlockQueue] = useState<UnlockToast[]>([]);

  const loadActive = useCallback(async (id: number | null) => {
    if (id == null) {
      setProfile(null);
      setProgress(null);
      setAchievements([]);
      setStickers([]);
      return;
    }
    const bundle = await getProfileBundle(id);
    setProfile(bundle.profile);
    setProgress(bundle.progress);
    setAchievements(bundle.achievements);
    setStickers(bundle.stickers);
  }, []);

  const refresh = useCallback(async () => {
    const [list, s] = await Promise.all([ensureSeedProfile(), ensureSettings()]);
    setProfiles(list);
    setSettings(s);
    setSoundMuted(!s.soundEnabled);
    document.body.dataset.theme = s.themeMode ?? "vivid";

    const stored = getStoredActiveProfileId();
    const valid = stored != null && list.some((p) => p.id === stored);
    const nextId = valid ? stored : null;
    setActiveProfileId(nextId);
    await loadActive(nextId);
    setReady(true);
  }, [loadActive]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectProfile = useCallback(
    async (id: number) => {
      setStoredActiveProfileId(id);
      setActiveProfileId(id);
      await loadActive(id);
    },
    [loadActive],
  );

  const clearActiveProfile = useCallback(() => {
    setStoredActiveProfileId(null);
    setActiveProfileId(null);
    setProfile(null);
    setProgress(null);
    setAchievements([]);
    setStickers([]);
  }, []);

  const addProfile = useCallback(
    async (name: string, avatar: string, avatarImage: string | null = null) => {
      const created = await createProfile(name, avatar, avatarImage);
      setProfiles(await listProfiles());
      return created;
    },
    [],
  );

  const editProfile = useCallback(
    async (
      id: number,
      name: string,
      avatar: string,
      avatarImage: string | null = null,
    ) => {
      await updateProfile(id, { name, avatar, avatarImage });
      setProfiles(await listProfiles());
      if (activeProfileId === id) await loadActive(id);
    },
    [activeProfileId, loadActive],
  );

  const completeTask = useCallback(
    async (
      moduleId: string,
      taskId: string,
      score: number,
      options?: { playlistSession?: boolean },
    ) => {
      if (!profile?.id || !settings) return { dailyGoalReached: false };
      const result = await recordTaskCompletion(
        profile.id,
        moduleId,
        taskId,
        score,
        settings.dailyGoal,
        options,
      );
      setProgress(result.progress);
      setAchievements(
        await db.achievements.where("profileId").equals(profile.id).toArray(),
      );
      setStickers(await db.stickers.where("profileId").equals(profile.id).toArray());

      const toasts: UnlockToast[] = [
        ...result.newAchievements.map((a) => ({
          kind: "achievement" as const,
          title: a.title,
          emoji:
            ACHIEVEMENT_CATALOG.find((c) => c.key === a.key)?.emoji ?? "🏅",
        })),
        ...result.newStickers.map((s) => ({
          kind: "sticker" as const,
          title:
            STICKER_CATALOG.find((c) => c.id === s.stickerId)?.title ?? s.stickerId,
          emoji: stickerEmoji(s.stickerId),
        })),
      ];
      if (toasts.length) setUnlockQueue((q) => [...q, ...toasts]);
      return { dailyGoalReached: result.dailyGoalReached };
    },
    [profile?.id, settings],
  );

  const patchSettings = useCallback(async (patch: Partial<Omit<AppSettings, "id">>) => {
    const next = await updateSettings(patch);
    setSettings(next);
    if (patch.soundEnabled !== undefined) setSoundMuted(!next.soundEnabled);
    if (patch.themeMode !== undefined) document.body.dataset.theme = next.themeMode;
  }, []);

  const resetProgress = useCallback(async () => {
    await resetAllProgressData();
    setUnlockQueue([]);
    await refresh();
  }, [refresh]);

  const dismissUnlock = useCallback(() => {
    setUnlockQueue((q) => q.slice(1));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      profiles,
      activeProfileId,
      profile,
      progress,
      achievements,
      stickers,
      settings,
      unlockQueue,
      selectProfile,
      clearActiveProfile,
      addProfile,
      editProfile,
      completeTask,
      patchSettings,
      resetProgress,
      dismissUnlock,
      refresh,
    }),
    [
      ready,
      profiles,
      activeProfileId,
      profile,
      progress,
      achievements,
      stickers,
      settings,
      unlockQueue,
      selectProfile,
      clearActiveProfile,
      addProfile,
      editProfile,
      completeTask,
      patchSettings,
      resetProgress,
      dismissUnlock,
      refresh,
    ],
  );

  return (
    <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
  );
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}
