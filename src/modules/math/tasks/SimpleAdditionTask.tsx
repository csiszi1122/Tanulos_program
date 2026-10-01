import { useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess } from "../../../core/audio/sfx";

type Cfg = { maxAddend?: number; optionCount?: number };

function buildQuestion(maxAddend: number, optionCount: number) {
  const a = 1 + Math.floor(Math.random() * maxAddend);
  const b = 1 + Math.floor(Math.random() * maxAddend);
  const answer = a + b;
  const opts = new Set<number>([answer]);
  while (opts.size < optionCount) {
    opts.add(Math.max(0, answer + Math.floor(Math.random() * 9) - 4));
  }
  return { a, b, answer, options: [...opts].sort(() => Math.random() - 0.5) };
}

export const SimpleAdditionTask: FC<TaskProps<Cfg>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const maxAddend = config.maxAddend ?? 5;
  const optionCount = config.optionCount ?? 4;
  const q = useMemo(
    () => buildQuestion(maxAddend, optionCount),
    [maxAddend, optionCount],
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  const handleSelect = (option: number) => {
    if (locked) return;
    setSelected(option);
    if (option === q.answer) {
      setLocked(true);
      playSuccess();
      fireRewardConfetti();
      setTimeout(() => onComplete(100), 1000);
    } else {
      playFail();
      onFail();
      setTimeout(() => setSelected(null), 450);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      <motion.h2
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-4xl font-extrabold text-white drop-shadow"
      >
        Mennyi {q.a} + {q.b}?
      </motion.h2>

      <div className="grid grid-cols-2 gap-4">
        {q.options.map((option) => (
          <motion.button
            key={option}
            whileHover={{ scale: locked ? 1 : 1.05 }}
            whileTap={{ scale: locked ? 1 : 0.95 }}
            onClick={() => handleSelect(option)}
            disabled={locked}
            className={`rounded-2xl px-8 py-6 text-2xl font-bold shadow-lg transition-colors ${
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
