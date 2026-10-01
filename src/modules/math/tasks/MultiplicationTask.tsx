import { useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess } from "../../../core/audio/sfx";

type Cfg = { rounds?: number; maxFactor?: number };

function makeMul(maxFactor: number) {
  const a = 1 + Math.floor(Math.random() * maxFactor);
  const b = 1 + Math.floor(Math.random() * maxFactor);
  const answer = a * b;
  const opts = new Set([answer]);
  while (opts.size < 4) {
    opts.add(Math.max(1, answer + Math.floor(Math.random() * 7) - 3));
  }
  return { a, b, answer, options: [...opts].sort(() => Math.random() - 0.5) };
}

export const MultiplicationTask: FC<TaskProps<Cfg>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const rounds = config.rounds ?? 4;
  const maxFactor = config.maxFactor ?? 5;
  const [wins, setWins] = useState(0);
  const [seed, setSeed] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const q = useMemo(() => makeMul(maxFactor), [seed, maxFactor]);

  const pick = (n: number) => {
    if (locked) return;
    setSelected(n);
    if (n === q.answer) {
      setLocked(true);
      playSuccess();
      const next = wins + 1;
      setWins(next);
      if (next >= rounds) {
        fireRewardConfetti();
        setTimeout(() => onComplete(130), 800);
        return;
      }
      setTimeout(() => {
        setSeed((s) => s + 1);
        setSelected(null);
        setLocked(false);
      }, 450);
    } else {
      playFail();
      onFail();
      setTimeout(() => setSelected(null), 400);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-5 p-4">
      <p className="text-sm font-bold text-white/70">
        {wins}/{rounds} helyes
      </p>
      <motion.h2
        key={seed}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-4xl font-extrabold text-white"
      >
        {q.a} × {q.b} = ?
      </motion.h2>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((o) => (
          <motion.button
            key={`${seed}-${o}`}
            whileHover={{ scale: locked ? 1 : 1.05 }}
            whileTap={{ scale: locked ? 1 : 0.95 }}
            disabled={locked}
            onClick={() => pick(o)}
            className={`min-w-[110px] rounded-2xl px-6 py-5 text-2xl font-bold shadow-lg ${
              selected === o
                ? o === q.answer
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                : "bg-fuchsia-600 text-white hover:bg-fuchsia-500"
            }`}
          >
            {o}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
