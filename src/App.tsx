import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { AppShell } from "./core/layout/AppShell";
import { ModuleGrid } from "./core/layout/ModuleGrid";
import { AppStoreProvider, useAppStore } from "./core/store/AppStore";
import { getModuleById, getModules, getTask } from "./modules/registry";
import { GlassCard } from "./components/ui/GlassCard";
import { MotionScreen } from "./components/ui/MotionScreen";
import { PrimaryButton } from "./components/ui/PrimaryButton";
import { ProfilePicker } from "./components/profile/ProfilePicker";
import { ParentPanel } from "./components/parent/ParentPanel";
import { StreakCalendar } from "./components/rewards/StreakCalendar";
import { CollectionPanel } from "./components/rewards/CollectionPanel";
import { HistoryPanel } from "./components/rewards/HistoryPanel";
import { UnlockToast } from "./components/rewards/UnlockToast";
import { fireCelebrationBurst } from "./components/effects/confetti";
import { playClick } from "./core/audio/sfx";
import { getTaskConfig, parseTaskParams } from "./data/taskParams";
import { PlaylistRunner, type ActivePlaylist } from "./components/playlist/PlaylistRunner";
import type { Playlist } from "./data/playlist";
import { addPlaySeconds, isPlayBlocked, remainingMinutes } from "./core/playtime";
import { applyAdaptive, recordAnswer } from "./core/adaptive";

type Screen =
  | { name: "profiles" }
  | { name: "home" }
  | { name: "module"; moduleId: string }
  | {
      name: "task";
      moduleId: string;
      taskId: string;
      playlist?: ActivePlaylist;
    }
  | {
      name: "reward";
      moduleId: string;
      taskId: string;
      score: number;
      dailyGoalReached: boolean;
      playlist?: ActivePlaylist;
    }
  | { name: "collection" }
  | { name: "history" }
  | { name: "playlists" }
  | { name: "parent" };

function AppRoutes() {
  const {
    ready,
    activeProfileId,
    progress,
    settings,
    clearActiveProfile,
    completeTask,
    patchSettings,
  } = useAppStore();
  const [screen, setScreen] = useState<Screen>({ name: "profiles" });

  useEffect(() => {
    if (!activeProfileId) return;
    const id = window.setInterval(() => addPlaySeconds(15), 15_000);
    return () => window.clearInterval(id);
  }, [activeProfileId]);

  useEffect(() => {
    if (settings?.themeMode) document.body.dataset.theme = settings.themeMode;
  }, [settings?.themeMode]);

  const playLimit = settings?.dailyPlayMinutesLimit ?? 0;
  const playBlocked = isPlayBlocked(playLimit);
  const playRemaining = remainingMinutes(playLimit);

  const startTask = (
    moduleId: string,
    taskId: string,
    playlist?: ActivePlaylist,
  ) => {
    if (playBlocked) {
      playClick();
      return;
    }
    playClick();
    setScreen({ name: "task", moduleId, taskId, playlist });
  };

  const advancePlaylist = async (
    playlist: ActivePlaylist,
    score: number,
    moduleId: string,
    taskId: string,
  ) => {
    const nextIndex = playlist.index + 1;
    const isLast = nextIndex >= playlist.items.length;
    if (!isLast) {
      await completeTask(moduleId, taskId, score);
      const next = playlist.items[nextIndex];
      setScreen({
        name: "task",
        moduleId: next.moduleId,
        taskId: next.taskId,
        playlist: { items: playlist.items, index: nextIndex },
      });
      return;
    }
    const result = await completeTask(moduleId, taskId, score, {
      playlistSession: true,
    });
    fireCelebrationBurst();
    setScreen({
      name: "reward",
      moduleId,
      taskId,
      score,
      dailyGoalReached: result.dailyGoalReached,
      playlist: undefined,
    });
  };

  if (!ready) {
    return (
      <AppShell subtitle="Betöltés…">
        <div className="flex h-full items-center justify-center text-xl font-bold text-white">
          Indítás…
        </div>
      </AppShell>
    );
  }

  if (!activeProfileId || screen.name === "profiles") {
    return (
      <MotionScreen key="profiles" className="h-full">
        <ProfilePicker onEntered={() => setScreen({ name: "home" })} />
      </MotionScreen>
    );
  }

  const modules = getModules(false, settings?.enabledModules);
  const goHome = () => setScreen({ name: "home" });
  const switchProfile = () => {
    clearActiveProfile();
    setScreen({ name: "profiles" });
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {screen.name === "home" && (
          <MotionScreen key="home" className="h-full">
            <AppShell
              subtitle="Válassz egy témát és kezdj el tanulni!"
              onSwitchProfile={switchProfile}
              onOpenParent={() => setScreen({ name: "parent" })}
              onToggleSound={() =>
                void patchSettings({ soundEnabled: !(settings?.soundEnabled ?? true) })
              }
            >
              <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:gap-5">
                <StreakCalendar streak={progress?.streak ?? 0} />
                <ModuleGrid
                  modules={modules}
                  onSelect={(moduleId) => {
                    playClick();
                    setScreen({ name: "module", moduleId });
                  }}
                />
                {playRemaining !== null ? (
                  <p className="text-center text-sm font-medium text-white/80">
                    Ma még kb. {Math.ceil(playRemaining)} perc játékidő
                    {playBlocked ? " — limit elérve" : ""}
                  </p>
                ) : null}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                  <PrimaryButton
                    variant="ghost"
                    className="!min-h-11"
                    onClick={() => {
                      playClick();
                      setScreen({ name: "playlists" });
                    }}
                  >
                    Sorozatok
                  </PrimaryButton>
                  <PrimaryButton
                    variant="ghost"
                    className="!min-h-11"
                    onClick={() => {
                      playClick();
                      setScreen({ name: "history" });
                    }}
                  >
                    Előzmények
                  </PrimaryButton>
                  <PrimaryButton
                    variant="ghost"
                    className="!min-h-11"
                    onClick={() => {
                      playClick();
                      setScreen({ name: "collection" });
                    }}
                  >
                    Gyűjtemény
                  </PrimaryButton>
                </div>
              </div>
            </AppShell>
          </MotionScreen>
        )}

        {screen.name === "module" && (
          <ModuleScreen
            key={`module-${screen.moduleId}`}
            moduleId={screen.moduleId}
            onBack={goHome}
            onStartTask={(taskId) => startTask(screen.moduleId, taskId)}
            playBlocked={playBlocked}
          />
        )}

        {screen.name === "playlists" && (
          <MotionScreen key="playlists" className="h-full">
            <AppShell
              title="Sorozatok"
              subtitle="Több feladat egymás után"
              onBack={goHome}
              onSwitchProfile={switchProfile}
            >
              <PlaylistRunner
                onBack={goHome}
                onStart={(pl: Playlist) => {
                  const first = pl.items[0];
                  if (!first) return;
                  startTask(first.moduleId, first.taskId, {
                    items: pl.items,
                    index: 0,
                  });
                }}
              />
            </AppShell>
          </MotionScreen>
        )}

        {screen.name === "task" && (
          <TaskScreen
            key={`task-${screen.taskId}-${screen.playlist?.index ?? "solo"}`}
            moduleId={screen.moduleId}
            taskId={screen.taskId}
            playlist={screen.playlist}
            onBack={() =>
              screen.playlist
                ? setScreen({ name: "playlists" })
                : setScreen({ name: "module", moduleId: screen.moduleId })
            }
            onComplete={async (score) => {
              if (screen.playlist) {
                await advancePlaylist(
                  screen.playlist,
                  score,
                  screen.moduleId,
                  screen.taskId,
                );
                return;
              }
              const result = await completeTask(screen.moduleId, screen.taskId, score);
              fireCelebrationBurst();
              setScreen({
                name: "reward",
                moduleId: screen.moduleId,
                taskId: screen.taskId,
                score,
                dailyGoalReached: result.dailyGoalReached,
              });
            }}
          />
        )}

        {screen.name === "reward" && (
          <RewardScreen
            key="reward"
            score={screen.score}
            dailyGoalReached={screen.dailyGoalReached}
            onAgain={() =>
              startTask(screen.moduleId, screen.taskId, screen.playlist)
            }
            onHome={goHome}
            onModule={() => setScreen({ name: "module", moduleId: screen.moduleId })}
          />
        )}

        {screen.name === "collection" && (
          <MotionScreen key="collection" className="h-full">
            <AppShell
              title="Gyűjtemény"
              subtitle="Achievement-ek és matricák"
              onBack={goHome}
              onSwitchProfile={switchProfile}
            >
              <CollectionPanel />
            </AppShell>
          </MotionScreen>
        )}

        {screen.name === "history" && (
          <MotionScreen key="history" className="h-full">
            <AppShell
              title="Előzmények"
              subtitle="Napi teljesítmény áttekintése"
              onBack={goHome}
              onSwitchProfile={switchProfile}
            >
              <div className="mx-auto max-w-3xl">
                <HistoryPanel days={14} />
              </div>
            </AppShell>
          </MotionScreen>
        )}

        {screen.name === "parent" && (
          <MotionScreen key="parent" className="h-full">
            <AppShell title="Szülőpanel" onBack={goHome}>
              <div className="mx-auto flex h-[calc(100dvh-7.5rem)] min-h-0 w-full max-w-4xl flex-col sm:h-[calc(100dvh-8.5rem)]">
                <ParentPanel onClose={goHome} />
              </div>
            </AppShell>
          </MotionScreen>
        )}
      </AnimatePresence>
      <UnlockToast />
    </>
  );
}

function ModuleScreen({
  moduleId,
  onBack,
  onStartTask,
  playBlocked,
}: {
  moduleId: string;
  onBack: () => void;
  onStartTask: (taskId: string) => void;
  playBlocked: boolean;
}) {
  const mod = getModuleById(moduleId);
  if (!mod) {
    return (
      <AppShell onBack={onBack} title="Hiba">
        <p className="text-white">Modul nem található.</p>
      </AppShell>
    );
  }

  return (
    <MotionScreen className="h-full">
      <AppShell onBack={onBack} title={mod.title} subtitle={mod.description}>
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {playBlocked ? (
            <GlassCard className="border-amber-400/40 bg-amber-500/15">
              <p className="font-semibold text-white">
                Ma elérted a napi játékidő limitet. Holnap folytathatod, vagy a szülő
                módosíthatja a limitet.
              </p>
            </GlassCard>
          ) : null}
          {mod.tasks.map((task) => (
            <GlassCard
              key={task.id}
              whileHover={{ scale: 1.02 }}
              className="flex cursor-pointer items-center justify-between gap-4"
              onClick={() => onStartTask(task.id)}
            >
              <div>
                <h3 className="text-xl font-extrabold text-white">{task.title}</h3>
                <p className="text-sm font-semibold text-white/80">Koppints a kezdéshez</p>
              </div>
              <PrimaryButton className="!px-4 !py-2">Kezdés</PrimaryButton>
            </GlassCard>
          ))}
        </div>
      </AppShell>
    </MotionScreen>
  );
}

function TaskScreen({
  moduleId,
  taskId,
  playlist,
  onBack,
  onComplete,
}: {
  moduleId: string;
  taskId: string;
  playlist?: ActivePlaylist;
  onBack: () => void;
  onComplete: (score: number) => void;
}) {
  const { settings } = useAppStore();
  const mod = getModuleById(moduleId);
  const task = getTask(moduleId, taskId);
  if (!mod || !task) {
    return (
      <AppShell onBack={onBack} title="Hiba">
        <p className="text-white">Feladat nem található.</p>
      </AppShell>
    );
  }

  const TaskComponent = task.component;
  const baseConfig = getTaskConfig(taskId, parseTaskParams(settings?.taskParamsJson));
  const config = applyAdaptive(
    taskId,
    baseConfig,
    settings?.adaptiveDifficulty ?? false,
  );

  const playlistLabel = playlist
    ? `Sorozat ${playlist.index + 1}/${playlist.items.length}`
    : mod.title;

  const isDrawing = moduleId === "drawing";

  return (
    <MotionScreen className="h-full">
      <AppShell onBack={onBack} title={task.title} subtitle={playlistLabel}>
        <GlassCard
          className={
            isDrawing
              ? "mx-auto flex h-[calc(100dvh-7.5rem)] min-h-0 w-full max-w-6xl flex-col !p-3 sm:h-[calc(100dvh-8.5rem)] sm:!p-4 md:!p-5"
              : "mx-auto max-w-xl p-4 sm:p-6"
          }
        >
          <TaskComponent
            key={`${taskId}-${JSON.stringify(config)}`}
            config={config}
            onComplete={(score) => {
              recordAnswer(taskId, true);
              onComplete(score);
            }}
            onFail={() => {
              recordAnswer(taskId, false);
            }}
          />
        </GlassCard>
      </AppShell>
    </MotionScreen>
  );
}

function RewardScreen({
  score,
  dailyGoalReached,
  onAgain,
  onHome,
  onModule,
}: {
  score: number;
  dailyGoalReached: boolean;
  onAgain: () => void;
  onHome: () => void;
  onModule: () => void;
}) {
  return (
    <MotionScreen className="h-full">
      <AppShell title="Szuper!" subtitle="Megcsináltad a feladatot">
        <div className="flex h-full items-center justify-center py-4">
          <GlassCard className="w-full max-w-md p-6 text-center sm:p-8">
            <p className="text-5xl sm:text-6xl">{dailyGoalReached ? "🏆" : "🎉"}</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              +{score} pont
            </h2>
            <p className="mt-2 font-medium text-white/85">
              {dailyGoalReached
                ? "Napi cél teljesítve – új matrica vár!"
                : "Szép munka – folytathatod, ha szeretnéd."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
              <PrimaryButton onClick={onAgain}>Újra</PrimaryButton>
              <PrimaryButton variant="ghost" onClick={onModule}>
                Feladatok
              </PrimaryButton>
              <PrimaryButton variant="ghost" onClick={onHome}>
                Kezdőlap
              </PrimaryButton>
            </div>
          </GlassCard>
        </div>
      </AppShell>
    </MotionScreen>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <AppRoutes />
    </AppStoreProvider>
  );
}
