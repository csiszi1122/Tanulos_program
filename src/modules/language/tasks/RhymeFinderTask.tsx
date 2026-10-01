import { useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess } from "../../../core/audio/sfx";

type Cfg = { rounds?: number };

const ALL_ROUNDS = [
  { word: "ház", rhyme: "gáz", options: ["gáz", "kutya", "alma"] },
  { word: "tó", rhyme: "hó", options: ["asztal", "hó", "könyv"] },
  { word: "kör", rhyme: "tőr", options: ["tőr", "virág", "autó"] },
  { word: "pad", rhyme: "rad", options: ["rad", "macska", "labda"] },
  { word: "kép", rhyme: "lép", options: ["alma", "lép", "autó"] },
  { word: "szín", rhyme: "ín", options: ["ín", "ház", "virág"] },
];

export const RhymeFinderTask: FC<TaskProps<Cfg>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const rounds = Math.min(config.rounds ?? 3, ALL_ROUNDS.length);
  const playlist = useMemo(() => ALL_ROUNDS.slice(0, rounds), [rounds]);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const current = playlist[round] ?? playlist[0];
  const options = useMemo(
    () => [...current.options].sort(() => Math.random() - 0.5),
    [round, current.options],
  );

  const pick = (option: string) => {
    if (locked) return;
    setSelected(option);
    if (option === current.rhyme) {
      setLocked(true);
      playSuccess();
      if (round >= playlist.length - 1) {
        fireRewardConfetti();
        setTimeout(() => onComplete(100), 700);
        return;
      }
      setTimeout(() => {
        setRound((r) => r + 1);
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
        {round + 1}/{playlist.length}
      </p>
      <h2 className="text-center text-2xl font-extrabold text-white">
        Mi rímel erre: <span className="text-amber-200">{current.word}</span>?
      </h2>
      <div className="grid w-full max-w-sm gap-3">
        {options.map((option) => (
          <motion.button
            key={`${round}-${option}`}
            whileHover={{ scale: locked ? 1 : 1.03 }}
            whileTap={{ scale: locked ? 1 : 0.97 }}
            disabled={locked}
            onClick={() => pick(option)}
            className={`rounded-2xl px-6 py-4 text-xl font-extrabold shadow-lg ${
              selected === option
                ? option === current.rhyme
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                : "bg-violet-600 text-white hover:bg-violet-500"
            }`}
          >
            {option}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
