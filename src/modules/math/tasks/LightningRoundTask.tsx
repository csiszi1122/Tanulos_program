import { useEffect, useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess } from "../../../core/audio/sfx";

type Cfg = { seconds?: number; optionCount?: number; maxAddend?: number };

function makeQ(maxAddend: number, optionCount: number) {
  const a = 1 + Math.floor(Math.random() * maxAddend);
  const b = 1 + Math.floor(Math.random() * maxAddend);
  const answer = a + b;
  const opts = new Set([answer]);
  while (opts.size < optionCount) {
    opts.add(Math.max(0, answer + Math.floor(Math.random() * 5) - 2));
  }
  return { a, b, answer, options: [...opts].sort(() => Math.random() - 0.5) };
}

export const LightningRoundTask: FC<TaskProps<Cfg>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const seconds = config.seconds ?? 45;
  const optionCount = config.optionCount ?? 3;
  const maxAddend = config.maxAddend ?? 9;

  const [timeLeft, setTimeLeft] = useState(seconds);
  const [correct, setCorrect] = useState(0);
  const [seed, setSeed] = useState(0);
  const [done, setDone] = useState(false);
  const q = useMemo(
    () => makeQ(maxAddend, optionCount),
    [seed, maxAddend, optionCount],
  );

  useEffect(() => {
    if (done) return;
    if (timeLeft <= 0) {
      setDone(true);
      fireRewardConfetti();
      const score = Math.max(40, correct * 25);
      setTimeout(() => onComplete(score), 600);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, done, correct, onComplete]);

  const pick = (n: number) => {
    if (done) return;
    if (n === q.answer) {
      playSuccess();
      setCorrect((c) => c + 1);
      setSeed((s) => s + 1);
    } else {
      playFail();
      onFail();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-5 p-4">
      <div className="flex w-full max-w-sm justify-between text-sm font-extrabold text-white">
        <span>⏱️ {timeLeft}s</span>
        <span>✔ {correct}</span>
      </div>
      <motion.h2
        key={seed}
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-4xl font-extrabold text-white"
      >
        {q.a} + {q.b} = ?
      </motion.h2>
      <div className="flex flex-wrap justify-center gap-3">
        {q.options.map((o) => (
          <motion.button
            key={`${seed}-${o}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => pick(o)}
            className="rounded-2xl bg-indigo-600 px-8 py-5 text-2xl font-bold text-white shadow-lg hover:bg-indigo-500"
          >
            {o}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
