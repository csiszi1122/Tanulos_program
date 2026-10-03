import { useEffect, useMemo, useRef, useState, type FC } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playClick, playSuccess } from "../../../core/audio/sfx";
import { PrimaryButton } from "../../../components/ui/PrimaryButton";
import {
  DRAWING_CATEGORIES,
  DRAWING_TEMPLATES,
  type DrawingTemplate,
} from "../data/templates";
import { TraceEngine } from "../engine/TraceEngine";

type Cfg = {
  winCoverage?: number;
  strokeWidth?: number;
  drawingsToWin?: number;
};

type Mode = "gallery" | "draw";

export const TraceDrawingTask: FC<TaskProps<Cfg>> = ({ config, onComplete }) => {
  const winCoverage = Math.min(0.95, Math.max(0.5, (config.winCoverage ?? 72) / 100));
  const strokeWidth = config.strokeWidth ?? 20;
  const drawingsToWin = Math.max(1, Math.round(config.drawingsToWin ?? 2));

  const [mode, setMode] = useState<Mode>("gallery");
  const [category, setCategory] = useState<string>("Mind");
  const [template, setTemplate] = useState<DrawingTemplate | null>(null);
  const [coverage, setCoverage] = useState(0);
  const [finishedCount, setFinishedCount] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [hintFlash, setHintFlash] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<TraceEngine | null>(null);
  const wonRef = useRef(false);

  const filtered = useMemo(() => {
    if (category === "Mind") return DRAWING_TEMPLATES;
    return DRAWING_TEMPLATES.filter((t) => t.category === category);
  }, [category]);

  useEffect(() => {
    if (mode !== "draw" || !canvasRef.current || !template) return;
    wonRef.current = false;
    const engine = new TraceEngine(canvasRef.current, {
      strokeWidth,
      winCoverage,
      hitRadius: 0.06,
      onCoverage: setCoverage,
      onWin: () => {
        if (wonRef.current) return;
        wonRef.current = true;
        playSuccess();
        fireRewardConfetti();
        setCelebrating(true);
        const scoreBoost = Math.round(engine.getCoverage() * 20);
        setFinishedCount((prev) => {
          const nextCount = prev + 1;
          window.setTimeout(() => {
            setCelebrating(false);
            if (nextCount >= drawingsToWin) {
              onComplete(Math.round(80 + scoreBoost));
            } else {
              setMode("gallery");
              setTemplate(null);
              setCoverage(0);
            }
          }, 1400);
          return nextCount;
        });
      },
    });
    engineRef.current = engine;
    engine.setTemplate(template);

    const resize = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      engine.resize(rect.width, rect.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("orientationchange", resize);

    const hintTimer = window.setTimeout(() => {
      engine.playGuide();
      setHintFlash(true);
      window.setTimeout(() => setHintFlash(false), 900);
    }, 700);

    return () => {
      window.clearTimeout(hintTimer);
      window.removeEventListener("orientationchange", resize);
      ro.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount per template
  }, [mode, template?.id, strokeWidth, winCoverage, drawingsToWin, onComplete]);

  const openTemplate = (t: DrawingTemplate) => {
    playClick();
    setTemplate(t);
    setCoverage(0);
    setCelebrating(false);
    setMode("draw");
  };

  const randomTemplate = () => {
    const pool = filtered.length ? filtered : DRAWING_TEMPLATES;
    openTemplate(pool[Math.floor(Math.random() * pool.length)]);
  };

  if (mode === "gallery") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-xl font-semibold text-white sm:text-2xl">Rajzműhely</h3>
            <p className="text-sm text-white/75">
              Kövesd a vonalat ujjal — {finishedCount}/{drawingsToWin} kép kész
            </p>
          </div>
          <PrimaryButton className="!min-h-12 !px-5" onClick={randomTemplate}>
            Véletlen kép
          </PrimaryButton>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["Mind", ...DRAWING_CATEGORIES].map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  playClick();
                  setCategory(cat);
                }}
                className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${
                  active ? "bg-white text-slate-900" : "bg-white/15 text-white/85"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((t, i) => (
              <motion.button
                key={t.id}
                type="button"
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: Math.min(i * 0.015, 0.35), type: "spring", stiffness: 380, damping: 28 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => openTemplate(t)}
                className="flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-3xl border border-white/25 bg-white/12 px-2 py-4 text-center shadow-lg backdrop-blur-md active:bg-white/20 sm:min-h-[8.5rem]"
                style={{ boxShadow: `0 0 0 1px ${t.color}33 inset` }}
              >
                <span className="text-4xl sm:text-5xl">{t.emoji}</span>
                <span className="text-sm font-semibold text-white sm:text-base">{t.title}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-white/55">
                  {t.category}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 sm:gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-white sm:text-xl">
            <span className="mr-2 text-2xl">{template?.emoji}</span>
            {template?.title}
          </p>
          <p className="text-xs text-white/70 sm:text-sm">
            Kövesd a szaggatott vonalat az ujjaddal
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton
            variant="ghost"
            className="!min-h-12 !px-4"
            onClick={() => {
              playClick();
              setMode("gallery");
              setTemplate(null);
            }}
          >
            Képek
          </PrimaryButton>
          <PrimaryButton
            variant="ghost"
            className={`!min-h-12 !px-4 ${hintFlash ? "!bg-white/30" : ""}`}
            onClick={() => {
              playClick();
              engineRef.current?.playGuide();
              setHintFlash(true);
              window.setTimeout(() => setHintFlash(false), 800);
            }}
          >
            Mutasd
          </PrimaryButton>
          <PrimaryButton
            variant="ghost"
            className="!min-h-12 !px-4"
            onClick={() => {
              playClick();
              wonRef.current = false;
              engineRef.current?.clearUser();
              setCoverage(0);
              setCelebrating(false);
            }}
          >
            Törlés
          </PrimaryButton>
        </div>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full rounded-full"
          style={{ background: template?.color ?? "#fff" }}
          initial={false}
          animate={{ width: `${Math.round(coverage * 100)}%` }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
        />
      </div>
      <p className="text-center text-xs font-semibold text-white/80 sm:text-sm">
        {Math.round(coverage * 100)}% · cél {Math.round(winCoverage * 100)}% · kész{" "}
        {finishedCount}/{drawingsToWin}
      </p>

      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden rounded-3xl border border-white/25 bg-slate-950/25 shadow-inner"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
        <AnimatePresence>
          {celebrating ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
            >
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="rounded-3xl bg-white/20 px-8 py-5 text-center shadow-xl"
              >
                <p className="text-4xl">{template?.emoji}</p>
                <p className="mt-2 text-2xl font-bold text-white">Szép rajz!</p>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
