import { useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess, playClick } from "../../../core/audio/sfx";
import { PrimaryButton } from "../../../components/ui/PrimaryButton";

type Cfg = { wordCount?: number };

const WORDS = [
  { word: "HAL", letters: ["H", "A", "L"], distractors: ["K", "O", "M"] },
  { word: "NAP", letters: ["N", "A", "P"], distractors: ["T", "E", "R"] },
  { word: "KÉZ", letters: ["K", "É", "Z"], distractors: ["B", "O", "S"] },
];

export const WordBuilderTask: FC<TaskProps<Cfg>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const wordCount = Math.min(config.wordCount ?? 3, WORDS.length);
  const playlist = useMemo(() => WORDS.slice(0, wordCount), [wordCount]);
  const [index, setIndex] = useState(0);
  const [built, setBuilt] = useState<string[]>([]);
  const [used, setUsed] = useState<number[]>([]);
  const target = playlist[index] ?? playlist[0];

  const pool = useMemo(
    () => [...target.letters, ...target.distractors].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, target.word],
  );

  const addLetter = (letter: string, poolIndex: number) => {
    if (used.includes(poolIndex) || built.length >= target.letters.length) return;
    playClick();
    const nextBuilt = [...built, letter];
    const nextUsed = [...used, poolIndex];
    setBuilt(nextBuilt);
    setUsed(nextUsed);

    if (nextBuilt.length < target.letters.length) return;

    if (nextBuilt.join("") === target.word) {
      playSuccess();
      if (index >= playlist.length - 1) {
        fireRewardConfetti();
        setTimeout(() => onComplete(110), 700);
      } else {
        setTimeout(() => {
          setIndex((i) => i + 1);
          setBuilt([]);
          setUsed([]);
        }, 500);
      }
    } else {
      playFail();
      onFail();
      setTimeout(() => {
        setBuilt([]);
        setUsed([]);
      }, 450);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-5 p-4">
      <h2 className="text-2xl font-extrabold text-white">Építsd fel a szót!</h2>
      <p className="text-sm font-bold text-white/70">
        Szó {index + 1}/{playlist.length}
      </p>
      <div className="flex min-h-16 gap-2">
        {target.letters.map((_, i) => (
          <div
            key={i}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-white/50 bg-white/10 text-2xl font-black text-white"
          >
            {built[i] ?? ""}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {pool.map((letter, i) => (
          <motion.button
            key={`${index}-${i}-${letter}`}
            whileTap={{ scale: 0.92 }}
            disabled={used.includes(i)}
            onClick={() => addLetter(letter, i)}
            className="rounded-2xl bg-rose-500 px-4 py-3 text-xl font-black text-white shadow disabled:opacity-30"
          >
            {letter}
          </motion.button>
        ))}
      </div>
      <PrimaryButton
        variant="ghost"
        onClick={() => {
          playClick();
          setBuilt([]);
          setUsed([]);
        }}
      >
        Törlés
      </PrimaryButton>
    </div>
  );
};
