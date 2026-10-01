import { useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess } from "../../../core/audio/sfx";
import { speakText } from "../../../core/audio/tts";

const WORDS = [
  { en: "cat", hu: "cica", emoji: "🐱" },
  { en: "dog", hu: "kutya", emoji: "🐶" },
  { en: "sun", hu: "nap", emoji: "☀️" },
  { en: "book", hu: "könyv", emoji: "📘" },
  { en: "apple", hu: "alma", emoji: "🍎" },
  { en: "house", hu: "ház", emoji: "🏠" },
  { en: "water", hu: "víz", emoji: "💧" },
  { en: "star", hu: "csillag", emoji: "⭐" },
];

export const EnglishWordsTask: FC<TaskProps<{ rounds?: number; optionCount?: number }>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const rounds = config.rounds ?? 5;
  const optionCount = config.optionCount ?? 4;
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const target = WORDS[round % WORDS.length];

  const options = useMemo(() => {
    const others = WORDS.filter((w) => w.en !== target.en)
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(1, optionCount - 1))
      .map((w) => w.hu);
    return [target.hu, ...others].sort(() => Math.random() - 0.5);
  }, [round, target, optionCount]);

  const pick = (hu: string) => {
    setSelected(hu);
    if (hu === target.hu) {
      playSuccess();
      speakText(target.en, "en-US");
      if (round + 1 >= rounds) {
        fireRewardConfetti();
        setTimeout(() => onComplete(110), 800);
        return;
      }
      setTimeout(() => {
        setRound((r) => r + 1);
        setSelected(null);
      }, 500);
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
      <p className="text-5xl">{target.emoji}</p>
      <h2 className="text-3xl font-semibold text-white">{target.en}</h2>
      <p className="text-sm text-white/65">Válaszd ki a magyar jelentést</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <motion.button
            key={`${round}-${o}`}
            whileTap={{ scale: 0.97 }}
            onClick={() => pick(o)}
            className={`rounded-2xl px-4 py-3 text-lg font-semibold ${
              selected === o
                ? o === target.hu
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-500 text-white"
                : "bg-white/20 text-white"
            }`}
          >
            {o}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
