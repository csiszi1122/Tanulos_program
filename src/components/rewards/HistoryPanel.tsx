import { useEffect, useMemo, useState } from "react";
import { getDailyHistory, type DailyHistory } from "../../core/db";
import { useAppStore } from "../../core/store/AppStore";
import { GlassCard } from "../ui/GlassCard";

function formatDay(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("hu-HU", { month: "short", day: "numeric" });
}

function weekday(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("hu-HU", { weekday: "short" });
}

/** Build a continuous last-N-days series (zeros for missing days). */
function fillSeries(rows: DailyHistory[], days: number): DailyHistory[] {
  const map = new Map(rows.map((r) => [r.date, r]));
  const out: DailyHistory[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const existing = map.get(key);
    out.push(
      existing ?? {
        profileId: 0,
        date: key,
        points: 0,
        tasksCompleted: 0,
        goalMet: 0,
      },
    );
  }
  return out;
}

export function HistoryPanel({ days = 14 }: { days?: number }) {
  const { profile, settings, progress } = useAppStore();
  const [rows, setRows] = useState<DailyHistory[]>([]);
  const dailyGoal = settings?.dailyGoal ?? 3;

  useEffect(() => {
    if (!profile?.id) return;
    void getDailyHistory(profile.id, days + 5).then(setRows);
  }, [profile?.id, days, progress?.totalPoints, progress?.tasksCompletedToday]);

  const series = useMemo(() => fillSeries(rows, days), [rows, days]);
  const maxPoints = Math.max(1, ...series.map((s) => s.points));
  const totalPoints = series.reduce((s, r) => s + r.points, 0);
  const activeDays = series.filter((s) => s.tasksCompleted > 0).length;
  const goalsHit = series.filter((s) => s.goalMet).length;

  return (
    <GlassCard className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-white md:text-xl">
            Napi teljesítmény
          </h3>
          <p className="text-sm text-white/70">Az elmúlt {days} nap</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-white/80">
          <span>{totalPoints} pont</span>
          <span>{activeDays} aktív nap</span>
          <span>
            {goalsHit}/{days} cél
          </span>
        </div>
      </div>

      <div className="flex h-36 items-end gap-1 sm:h-40 sm:gap-2">
        {series.map((day) => {
          const h = Math.max(4, Math.round((day.points / maxPoints) * 100));
          return (
            <div
              key={day.date}
              className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
              title={`${formatDay(day.date)}: ${day.points} pont, ${day.tasksCompleted} feladat`}
            >
              <div
                className={`w-full rounded-t-md transition-all ${
                  day.goalMet
                    ? "bg-gradient-to-t from-emerald-500 to-teal-300"
                    : day.points > 0
                      ? "bg-gradient-to-t from-indigo-500 to-sky-300"
                      : "bg-white/15"
                }`}
                style={{ height: `${h}%` }}
              />
              <span className="mt-1 hidden text-[9px] font-medium uppercase text-white/55 sm:block">
                {weekday(day.date)}
              </span>
            </div>
          );
        })}
      </div>

      <ul className="max-h-48 space-y-2 overflow-auto overscroll-contain pr-1 text-sm">
        {[...series].reverse().map((day) => (
          <li
            key={`row-${day.date}`}
            className="flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2"
          >
            <div>
              <p className="font-semibold text-white">{formatDay(day.date)}</p>
              <p className="text-xs text-white/65">
                {day.tasksCompleted} feladat · cél {dailyGoal}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-white">{day.points} pont</p>
              <p
                className={`text-xs font-medium ${
                  day.goalMet ? "text-emerald-300" : "text-white/50"
                }`}
              >
                {day.goalMet ? "Cél OK" : day.tasksCompleted ? "Folyamatban" : "—"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
