import { motion } from "motion/react";

interface StreakCalendarProps {
  streak: number;
}

export function StreakCalendar({ streak }: StreakCalendarProps) {
  const days = Array.from({ length: 7 }, (_, i) => i);
  const lit = Math.min(streak, 7);

  return (
    <div className="rounded-3xl border border-white/25 bg-white/12 p-4 backdrop-blur-md sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">
          Heti sorozat
        </h3>
        <span className="text-sm font-semibold text-white/85">{streak} nap</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((d) => {
          const active = d < lit;
          return (
            <motion.div
              key={d}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: d * 0.03 }}
              className={`flex aspect-square items-center justify-center rounded-xl text-xs font-semibold sm:rounded-2xl sm:text-sm ${
                active
                  ? "bg-gradient-to-br from-teal-400 to-indigo-500 text-white shadow-md"
                  : "bg-white/10 text-white/40"
              }`}
            >
              {d + 1}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
