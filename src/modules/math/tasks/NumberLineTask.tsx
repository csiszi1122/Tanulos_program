import { useMemo, useState, type FC } from "react";
import { motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playFail, playSuccess } from "../../../core/audio/sfx";
import { PrimaryButton } from "../../../components/ui/PrimaryButton";

type Cfg = { lineMax?: number; start?: number; jump?: number };

export const NumberLineTask: FC<TaskProps<Cfg>> = ({
  config,
  onComplete,
  onFail,
}) => {
  const lineMax = config.lineMax ?? 10;
  const start = Math.min(config.start ?? 2, lineMax - 1);
  const jump = config.jump ?? 3;
  const target = Math.min(start + jump, lineMax);

  const ticks = useMemo(
    () => Array.from({ length: lineMax + 1 }, (_, i) => i),
    [lineMax],
  );

  const [pos, setPos] = useState(start);
  const [hops, setHops] = useState(0);

  const hop = (step: number) => {
    const next = pos + step;
    if (next > lineMax || next < 0) {
      playFail();
      onFail();
      return;
    }
    setPos(next);
    setHops((h) => h + 1);
    if (next === target) {
      playSuccess();
      fireRewardConfetti();
      setTimeout(() => onComplete(100), 700);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      <h2 className="text-center text-3xl font-extrabold text-white">
        Ugorj a {start}-ról a {target}-re!
      </h2>
      <p className="text-sm font-bold text-white/75">
        Ugrások: {hops} · Vonal: 0–{lineMax}
      </p>
      <div className="relative w-full max-w-2xl overflow-x-auto px-1 pb-2">
        <div
          className="relative flex justify-between"
          style={{ minWidth: `${Math.max(320, ticks.length * 28)}px` }}
        >
          {ticks.map((n) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <div
                className={`h-3 w-3 rounded-full ${
                  n === target ? "bg-amber-300" : "bg-white/40"
                }`}
              />
              <span className="text-[10px] font-bold text-white/70">{n}</span>
            </div>
          ))}
          <motion.div
            className="absolute -top-10 text-3xl"
            animate={{ left: `${(pos / lineMax) * 100}%`, x: "-50%" }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            🐸
          </motion.div>
        </div>
      </div>
      <div className="flex gap-3">
        <PrimaryButton onClick={() => hop(1)}>+1</PrimaryButton>
        <PrimaryButton onClick={() => hop(2)}>+2</PrimaryButton>
        <PrimaryButton variant="ghost" onClick={() => hop(-1)}>
          −1
        </PrimaryButton>
      </div>
    </div>
  );
};
