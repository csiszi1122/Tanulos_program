import { useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess } from "../../../core/audio/sfx";

type Cfg = { rounds?: number; optionCount?: number };

const LETTERS = [
  { letter: "A", word: "alma", emoji: "🍎" },
  { letter: "B", word: "béka", emoji: "🐸" },
  { letter: "C", word: "cica", emoji: "🐱" },
  { letter: "K", word: "kutya", emoji: "🐶" },
  { letter: "M", word: "maci", emoji: "🧸" },
  { letter: "S", word: "sapka", emoji: "🧢" },
  { letter: "H", word: "ház", emoji: "🏠" },
  { letter: "N", word: "nap", emoji: "☀️" },
];

export const LetterRecognitionTask: FC<TaskProps<Cfg>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const rounds = config.rounds ?? 3;
  const optionCount = config.optionCount ?? 4;
  const [wins, setWins] = useState(0);
  const [seed, setSeed] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const target = useMemo(() => LETTERS[seed % LETTERS.length], [seed]);
  const options = useMemo(() => {
    const others = LETTERS.filter((l) => l.letter !== target.letter)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(1, optionCount - 1))
      .map((l) => l.letter);
    return [target.letter, ...others].sort(() => Math.random() - 0.5);
  }, [target, seed, optionCount]);

  const pick = (letter: string) => {
    if (locked) return;
    setSelected(letter);
    if (letter === target.letter) {
      setLocked(true);
      playSuccess();
      const next = wins + 1;
      setWins(next);
      if (next >= rounds) {
        fireRewardConfetti();
        setTimeout(() => onComplete(100), 700);
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
      <p className="text-xs font-bold text-white/70">
        {wins}/{rounds}
      </p>
      <p className="text-5xl">{target.emoji}</p>
      <h2 className="text-center text-2xl font-extrabold text-white">
        Melyik betűvel kezdődik: <span className="text-amber-200">{target.word}</span>?
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {options.map((letter) => (
          <motion.button
            key={`${seed}-${letter}`}
            whileHover={{ scale: locked ? 1 : 1.05 }}
            whileTap={{ scale: locked ? 1 : 0.95 }}
            disabled={locked}
            onClick={() => pick(letter)}
            className={`rounded-2xl px-8 py-5 text-3xl font-black shadow-lg ${
              selected === letter
                ? letter === target.letter
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                : "bg-amber-500 text-white hover:bg-amber-400"
            }`}
          >
            {letter}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
