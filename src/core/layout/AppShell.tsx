import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useAppStore } from "../store/AppStore";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { AvatarView } from "../../components/profile/AvatarView";

interface AppShellProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onSwitchProfile?: () => void;
  onOpenParent?: () => void;
  onToggleSound?: () => void;
  children: ReactNode;
}

export function AppShell({
  title,
  subtitle,
  onBack,
  onSwitchProfile,
  onOpenParent,
  onToggleSound,
  children,
}: AppShellProps) {
  const { profile, progress, settings, ready } = useAppStore();
  const dailyGoal = settings?.dailyGoal ?? 3;
  const todayDone = progress?.tasksCompletedToday ?? 0;

  return (
    <div className="app-safe flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {onBack ? (
            <PrimaryButton
              variant="ghost"
              className="!min-h-11 shrink-0 !px-3 !py-2 text-sm sm:text-base"
              onClick={onBack}
            >
              Vissza
            </PrimaryButton>
          ) : null}
          <div className="min-w-0">
            <motion.h1
              layout
              className="truncate text-xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-2xl md:text-3xl"
            >
              {title ?? "Tanulós Program"}
            </motion.h1>
            {subtitle ? (
              <p className="truncate text-xs font-medium text-white/75 sm:text-sm">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {onToggleSound ? (
            <PrimaryButton
              variant="ghost"
              className="!min-h-11 !px-3 !py-2 text-sm"
              onClick={onToggleSound}
              title="Hang"
              aria-label="Hang ki/be"
            >
              {settings?.soundEnabled ? "Hang" : "Néma"}
            </PrimaryButton>
          ) : null}
          {onOpenParent ? (
            <PrimaryButton
              variant="ghost"
              className="!min-h-11 !px-3 !py-2 text-sm"
              onClick={onOpenParent}
              aria-label="Szülőpanel"
            >
              Szülő
            </PrimaryButton>
          ) : null}
          <button
            type="button"
            onClick={onSwitchProfile}
            className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-2.5 py-1.5 text-left backdrop-blur-md sm:gap-3 sm:px-3 sm:py-2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/20 sm:h-10 sm:w-10">
              {ready ? (
                <AvatarView
                  avatar={profile?.avatar ?? "star"}
                  avatarImage={profile?.avatarImage}
                  alt={profile?.name ?? "Profil"}
                  emojiClassName="text-xl sm:text-2xl"
                />
              ) : (
                "…"
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-white/70">
                {ready ? profile?.name : "…"}
              </p>
              <p className="text-sm font-semibold text-white">
                {progress?.totalPoints ?? 0} pont · {progress?.streak ?? 0} nap
              </p>
              <p className="text-[10px] font-medium text-white/65">
                Mai cél: {todayDone}/{dailyGoal}
              </p>
            </div>
          </button>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-auto overscroll-contain px-4 pb-4 sm:px-6 sm:pb-6">
        {children}
      </main>
    </div>
  );
}
