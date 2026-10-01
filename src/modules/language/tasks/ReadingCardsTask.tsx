import { useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playSuccess, playClick } from "../../../core/audio/sfx";
import { PrimaryButton } from "../../../components/ui/PrimaryButton";

type Cfg = { cardCount?: number };

const ALL_CARDS = [
  { word: "nap", emoji: "☀️" },
  { word: "ház", emoji: "🏠" },
  { word: "virág", emoji: "🌸" },
  { word: "autó", emoji: "🚗" },
  { word: "kutya", emoji: "🐶" },
  { word: "macska", emoji: "🐱" },
  { word: "alma", emoji: "🍎" },
  { word: "labda", emoji: "⚽" },
];

export const ReadingCardsTask: FC<TaskProps<Cfg>> = ({ config, onComplete }) => {
  const cardCount = Math.min(config.cardCount ?? 4, ALL_CARDS.length);
  const cards = useMemo(() => ALL_CARDS.slice(0, cardCount), [cardCount]);
  const [index, setIndex] = useState(0);
  const card = cards[index];

  const next = () => {
    playClick();
    if (index >= cards.length - 1) {
      playSuccess();
      fireRewardConfetti();
      setTimeout(() => onComplete(90), 600);
      return;
    }
    setIndex((i) => i + 1);
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <p className="text-sm font-bold text-white/70">
        Kártya {index + 1}/{cards.length}
      </p>
      <motion.div
        key={index}
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        className="flex w-full max-w-xs flex-col items-center rounded-3xl bg-white/20 px-8 py-10 shadow-xl"
      >
        <p className="text-7xl">{card.emoji}</p>
        <p className="mt-4 text-4xl font-black tracking-wide text-white">{card.word}</p>
      </motion.div>
      <PrimaryButton onClick={next}>
        {index >= cards.length - 1 ? "Kész!" : "Következő"}
      </PrimaryButton>
    </div>
  );
};
