import { AnimatePresence, motion } from "motion/react";
import { useAppStore } from "../../core/store/AppStore";
import { PrimaryButton } from "../ui/PrimaryButton";

export function UnlockToast() {
  const { unlockQueue, dismissUnlock } = useAppStore();
  const current = unlockQueue[0];

  return (
    <AnimatePresence>
      {current ? (
        <motion.div
          key={`${current.kind}-${current.title}`}
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-x-0 bottom-6 z-50 mx-auto w-[min(92%,420px)] rounded-3xl border border-white/40 bg-slate-900/90 p-5 text-center shadow-2xl backdrop-blur-xl"
        >
          <p className="text-5xl">{current.emoji}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/60">
            {current.kind === "achievement" ? "Új achievement" : "Új matrica"}
          </p>
          <h3 className="mt-1 text-2xl font-black text-white">{current.title}</h3>
          <PrimaryButton className="mt-4" onClick={dismissUnlock}>
            Szuper!
          </PrimaryButton>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
