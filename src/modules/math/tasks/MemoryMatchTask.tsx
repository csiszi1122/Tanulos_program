import { useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess, playClick } from "../../../core/audio/sfx";

type Card = { id: number; pairId: number; label: string };

type Cfg = { pairCount?: number };

const ALL_PAIRS = [
  { n: 1, qty: "🍎" },
  { n: 2, qty: "🐸🐸" },
  { n: 3, qty: "🍎🍎🍎" },
  { n: 4, qty: "🔵🔵🔵🔵" },
  { n: 5, qty: "⭐⭐⭐⭐⭐" },
  { n: 6, qty: "🍇🍇🍇🍇🍇🍇" },
  { n: 7, qty: "7️⃣" },
  { n: 8, qty: "🎱" },
];

function buildCards(pairCount: number): Card[] {
  const pairs = ALL_PAIRS.slice(0, Math.min(pairCount, ALL_PAIRS.length));
  const cards: Card[] = [];
  pairs.forEach((p, i) => {
    cards.push({ id: i * 2, pairId: i, label: String(p.n) });
    cards.push({ id: i * 2 + 1, pairId: i, label: p.qty });
  });
  return cards.sort(() => Math.random() - 0.5);
}

export const MemoryMatchTask: FC<TaskProps<Cfg>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const pairCount = config.pairCount ?? 4;
  const cards = useMemo(() => buildCards(pairCount), [pairCount]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [lock, setLock] = useState(false);

  const cols = pairCount <= 3 ? 3 : pairCount <= 4 ? 4 : 4;

  const flip = (id: number) => {
    if (lock || flipped.includes(id) || matched.includes(id)) return;
    playClick();
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length < 2) return;

    setLock(true);
    const [a, b] = next.map((cid) => cards.find((c) => c.id === cid)!);
    if (a.pairId === b.pairId) {
      playSuccess();
      const nextMatched = [...matched, a.id, b.id];
      setMatched(nextMatched);
      setFlipped([]);
      setLock(false);
      if (nextMatched.length === cards.length) {
        fireRewardConfetti();
        setTimeout(() => onComplete(110), 700);
      }
    } else {
      playFail();
      onFail();
      setTimeout(() => {
        setFlipped([]);
        setLock(false);
      }, 650);
    }
  };

  return (
    <div className="space-y-4 p-2">
      <h2 className="text-center text-2xl font-extrabold text-white">
        Párosítsd a számot a mennyiséggel!
      </h2>
      <p className="text-center text-xs font-bold text-white/70">{pairCount} pár</p>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => {
          const open = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <motion.button
              key={card.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => flip(card.id)}
              className={`flex h-20 items-center justify-center rounded-2xl px-1 text-center text-sm font-black shadow-md sm:text-lg ${
                matched.includes(card.id)
                  ? "bg-emerald-500 text-white"
                  : open
                    ? "bg-white text-slate-800"
                    : "bg-indigo-600 text-white"
              }`}
            >
              {open ? card.label : "?"}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
