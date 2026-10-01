import { useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess } from "../../../core/audio/sfx";

type Level = "easy" | "medium" | "hard";
type Cfg = {
  winsNeeded?: number;
  easyMax?: number;
  mediumMax?: number;
  hardMax?: number;
};

function makeQuestion(
  level: Level,
  easyMax: number,
  mediumMax: number,
  hardMax: number,
) {
  if (level === "easy") {
    const a = 1 + Math.floor(Math.random() * easyMax);
    const b = 1 + Math.floor(Math.random() * easyMax);
    return { a, b, op: "+" as const, answer: a + b };
  }
  if (level === "medium") {
    const a = Math.ceil(easyMax / 2) + Math.floor(Math.random() * mediumMax);
    const b = 1 + Math.floor(Math.random() * Math.ceil(mediumMax / 2));
    return { a, b, op: "+" as const, answer: a + b };
  }
  const a = Math.ceil(mediumMax / 2) + Math.floor(Math.random() * hardMax);
  const b = 1 + Math.floor(Math.random() * Math.min(12, a));
  return { a, b, op: "-" as const, answer: a - b };
}

function distractors(answer: number) {
  const set = new Set<number>([answer]);
  while (set.size < 4) {
    const n = Math.max(0, answer + (Math.floor(Math.random() * 7) - 3));
    set.add(n);
  }
  return [...set].sort(() => Math.random() - 0.5);
}

export const ProgressiveMathTask: FC<TaskProps<Cfg>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const winsNeeded = config.winsNeeded ?? 3;
  const easyMax = config.easyMax ?? 5;
  const mediumMax = config.mediumMax ?? 15;
  const hardMax = config.hardMax ?? 25;

  const [level, setLevel] = useState<Level>("easy");
  const [wins, setWins] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [seed, setSeed] = useState(0);

  const q = useMemo(
    () => makeQuestion(level, easyMax, mediumMax, hardMax),
    [level, seed, easyMax, mediumMax, hardMax],
  );
  const options = useMemo(() => distractors(q.answer), [q.answer, seed]);

  const handleSelect = (option: number) => {
    if (locked) return;
    setSelected(option);
    if (option === q.answer) {
      setLocked(true);
      playSuccess();
      const nextWins = wins + 1;
      setWins(nextWins);
      if (nextWins >= winsNeeded) {
        fireRewardConfetti();
        setTimeout(() => onComplete(120), 800);
        return;
      }
      setTimeout(() => {
        const ratio = nextWins / winsNeeded;
        setLevel(ratio < 0.4 ? "easy" : ratio < 0.75 ? "medium" : "hard");
        setSelected(null);
        setLocked(false);
        setSeed((s) => s + 1);
      }, 500);
    } else {
      playFail();
      onFail();
      setTimeout(() => setSelected(null), 400);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-5 p-4">
      <p className="text-sm font-bold uppercase tracking-wide text-white/70">
        Szint: {level === "easy" ? "Könnyű" : level === "medium" ? "Közepes" : "Nehéz"} ·{" "}
        {wins}/{winsNeeded}
      </p>
      <motion.h2
        key={seed}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-4xl font-extrabold text-white"
      >
        {q.a} {q.op} {q.b} = ?
      </motion.h2>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => (
          <motion.button
            key={`${seed}-${option}`}
            whileHover={{ scale: locked ? 1 : 1.05 }}
            whileTap={{ scale: locked ? 1 : 0.95 }}
            disabled={locked}
            onClick={() => handleSelect(option)}
            className={`min-w-[110px] rounded-2xl px-6 py-5 text-2xl font-bold shadow-lg ${
              selected === option
                ? option === q.answer
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}
          >
            {option}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
