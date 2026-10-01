import { useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playClick, playFail, playSuccess } from "../../../core/audio/sfx";

type Card = { id: number; pairId: number; label: string };

const EMOJIS = ["🍎", "🐶", "🌟", "🎸", "🚗", "🌈", "⚽", "🎈", "🦋", "🍕", "🎁", "🎵", "🧩", "📘", "🌸", "🔑"];

function buildCards(pairCount: number): Card[] {
  const pairs = EMOJIS.slice(0, Math.min(pairCount, EMOJIS.length));
  const cards: Card[] = [];
  pairs.forEach((e, i) => {
    cards.push({ id: i * 2, pairId: i, label: e });
    cards.push({ id: i * 2 + 1, pairId: i, label: e });
  });
  return cards.sort(() => Math.random() - 0.5);
}

export const CardMemoryTask: FC<TaskProps<{ pairCount?: number }>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const pairCount = config.pairCount ?? 4;
  const cards = useMemo(() => buildCards(pairCount), [pairCount]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [lock, setLock] = useState(false);
  const cols = pairCount <= 3 ? 3 : pairCount <= 6 ? 4 : 4;

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
      const nm = [...matched, a.id, b.id];
      setMatched(nm);
      setFlipped([]);
      setLock(false);
      if (nm.length === cards.length) {
        fireRewardConfetti();
        setTimeout(() => onComplete(120), 700);
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
      <h2 className="text-center text-xl font-semibold text-white">Kártyapárosítás</h2>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {cards.map((c) => {
          const open = flipped.includes(c.id) || matched.includes(c.id);
          return (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => flip(c.id)}
              className={`flex h-16 items-center justify-center rounded-2xl text-2xl ${
                matched.includes(c.id)
                  ? "bg-emerald-500"
                  : open
                    ? "bg-white"
                    : "bg-indigo-600"
              }`}
            >
              {open ? c.label : "?"}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
