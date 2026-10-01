import type { FC } from "react";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess } from "../../../core/audio/sfx";

const PATTERNS = [
  { seq: ["🔴", "🔵", "🔴", "🔵"], next: "🔴", options: ["🔴", "🔵", "🟢", "🟡"] },
  { seq: ["🟢", "🟢", "🟡", "🟢"], next: "🟢", options: ["🟢", "🟡", "🔴", "🔵"] },
  { seq: ["🔵", "🟡", "🔵", "🟡"], next: "🔵", options: ["🔵", "🟡", "🟢", "🔴"] },
];

export const PatternMatchTask: FC<TaskProps<{ rounds?: number }>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const rounds = config.rounds ?? 4;
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const current = PATTERNS[round % PATTERNS.length];
  const options = useMemo(
    () => [...current.options].sort(() => Math.random() - 0.5),
    [round],
  );

  const pick = (opt: string) => {
    setSelected(opt);
    if (opt === current.next) {
      playSuccess();
      if (round + 1 >= rounds) {
        fireRewardConfetti();
        setTimeout(() => onComplete(100), 700);
        return;
      }
      setTimeout(() => {
        setRound((r) => r + 1);
        setSelected(null);
      }, 400);
    } else {
      playFail();
      onFail();
      setTimeout(() => setSelected(null), 400);
    }
  };

  return (
    <div className="space-y-5 p-4 text-center">
      <p className="text-sm text-white/70">
        {round + 1}/{rounds}
      </p>
      <div className="flex justify-center gap-2 text-3xl">
        {current.seq.map((s, i) => (
          <span key={i}>{s}</span>
        ))}
        <span className="text-white/40">?</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <motion.button
            key={o}
            whileTap={{ scale: 0.95 }}
            onClick={() => pick(o)}
            className={`rounded-2xl py-4 text-3xl ${
              selected === o
                ? o === current.next
                  ? "bg-emerald-500"
                  : "bg-rose-500"
                : "bg-white/20"
            }`}
          >
            {o}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
