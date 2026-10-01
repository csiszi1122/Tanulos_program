import type { FC } from "react";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess } from "../../../core/audio/sfx";

export const NumberSequenceTask: FC<TaskProps<{ rounds?: number; maxStep?: number }>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const rounds = config.rounds ?? 4;
  const maxStep = config.maxStep ?? 3;
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const q = useMemo(() => {
    const start = 2 + Math.floor(Math.random() * 8);
    const step = 1 + Math.floor(Math.random() * maxStep);
    const seq = [start, start + step, start + step * 2, start + step * 3];
    return { seq, answer: start + step * 4, step };
  }, [round, maxStep]);

  const options = useMemo(() => {
    const set = new Set([q.answer]);
    while (set.size < 4) set.add(q.answer + Math.floor(Math.random() * 7) - 3);
    return [...set].sort(() => Math.random() - 0.5);
  }, [q.answer, round]);

  const pick = (n: number) => {
    setSelected(n);
    if (n === q.answer) {
      playSuccess();
      if (round + 1 >= rounds) {
        fireRewardConfetti();
        setTimeout(() => onComplete(110), 700);
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
      <h2 className="text-2xl font-semibold text-white">Mi jön ezután?</h2>
      <p className="text-3xl font-bold text-white">
        {q.seq.join(" · ")} · ?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <motion.button
            key={`${round}-${o}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => pick(o)}
            className={`rounded-2xl py-4 text-2xl font-bold ${
              selected === o
                ? o === q.answer
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-500 text-white"
                : "bg-indigo-600 text-white"
            }`}
          >
            {o}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
