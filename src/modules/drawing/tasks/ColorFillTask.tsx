import { useEffect, useMemo, useRef, useState, type FC } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { TaskProps } from "../../../types/module";
import { fireRewardConfetti } from "../../../components/effects/confetti";
import { playClick, playSuccess } from "../../../core/audio/sfx";
import { PrimaryButton } from "../../../components/ui/PrimaryButton";
import { COLOR_PALETTE } from "../data/colorPalette";
import {
  COLOR_CATEGORIES,
  COLOR_TEMPLATES,
  type ColorTemplate,
} from "../data/colorTemplates";
import { ColorEngine } from "../engine/ColorEngine";

type Cfg = {
  picturesToWin?: number;
  strokeWidth?: number;
};

type Mode = "gallery" | "paint";

export const ColorFillTask: FC<TaskProps<Cfg>> = ({ config, onComplete }) => {
  const picturesToWin = Math.max(1, Math.round(config.picturesToWin ?? 2));
  const strokeWidth = config.strokeWidth ?? 18;

  const [mode, setMode] = useState<Mode>("gallery");
  const [category, setCategory] = useState("Mind");
  const [template, setTemplate] = useState<ColorTemplate | null>(null);
  const [color, setColor] = useState(COLOR_PALETTE[7].hex);
  const [progress, setProgress] = useState(0);
  const [finishedCount, setFinishedCount] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ColorEngine | null>(null);
  const wonRef = useRef(false);

  const filtered = useMemo(() => {
    if (category === "Mind") return COLOR_TEMPLATES;
    return COLOR_TEMPLATES.filter((t) => t.category === category);
  }, [category]);

  useEffect(() => {
    engineRef.current?.setColor(color);
  }, [color]);

  useEffect(() => {
    if (mode !== "paint" || !canvasRef.current || !template) return;
    wonRef.current = false;
    const engine = new ColorEngine(canvasRef.current, {
      strokeWidth,
      onProgress: setProgress,
      onRegionFill: (label) => {
        playClick();
        setToast(`${label} kiszínezve`);
        window.setTimeout(() => setToast(null), 900);
      },
      onComplete: () => {
        if (wonRef.current) return;
        wonRef.current = true;
        playSuccess();
        fireRewardConfetti();
        setCelebrating(true);
        setFinishedCount((prev) => {
          const next = prev + 1;
          window.setTimeout(() => {
            setCelebrating(false);
            if (next >= picturesToWin) {
              onComplete(100);
            } else {
              setMode("gallery");
              setTemplate(null);
              setProgress(0);
            }
          }, 1300);
          return next;
        });
      },
    });
    engineRef.current = engine;
    engine.setColor(color);
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

    return () => {
      ro.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, template?.id, strokeWidth, picturesToWin, onComplete]);

  const open = (t: ColorTemplate) => {
    playClick();
    setTemplate(t);
    setProgress(0);
    setCelebrating(false);
    setMode("paint");
  };

  if (mode === "gallery") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-xl font-semibold text-white sm:text-2xl">Színező műhely</h3>
            <p className="text-sm text-white/75">
              Koppints a részekre, vagy vezesd végig a vonalat — {finishedCount}/
              {picturesToWin} kép
            </p>
          </div>
          <PrimaryButton
            className="!min-h-12 !px-5"
            onClick={() =>
              open(filtered[Math.floor(Math.random() * filtered.length)] ?? COLOR_TEMPLATES[0])
            }
          >
            Véletlen kép
          </PrimaryButton>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["Mind", ...COLOR_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                playClick();
                setCategory(cat);
              }}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${
                category === cat ? "bg-white text-slate-900" : "bg-white/15 text-white/85"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((t, i) => (
              <motion.button
                key={t.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                whileTap={{ scale: 0.96 }}
                onClick={() => open(t)}
                className="flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-3xl border border-white/25 bg-white/12 px-2 py-4 sm:min-h-[8.5rem]"
              >
                <span className="text-4xl sm:text-5xl">{t.emoji}</span>
                <span className="text-sm font-semibold text-white">{t.title}</span>
                <span className="text-[10px] text-white/55">
                  {t.regions.length} rész
                  {t.strokes.length ? ` · ${t.strokes.length} vonal` : ""}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 sm:gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-white sm:text-xl">
            <span className="mr-2 text-2xl">{template?.emoji}</span>
            {template?.title}
          </p>
          <p className="text-xs text-white/70 sm:text-sm">
            Koppints a részekre · vezesd végig a szaggatott vonalat
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
            className="!min-h-12 !px-4"
            onClick={() => {
              playClick();
              wonRef.current = false;
              engineRef.current?.reset();
              setProgress(0);
              setCelebrating(false);
            }}
          >
            Törlés
          </PrimaryButton>
        </div>
      </div>

      {/* Color palette — tablet-first large swatches */}
      <div className="rounded-2xl border border-white/20 bg-white/10 p-2">
        <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Színek
          </p>
          <span
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white"
          >
            <span
              className="h-4 w-4 rounded-full border border-white/40"
              style={{ background: color }}
            />
            Kiválasztva
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {COLOR_PALETTE.map((sw) => {
            const active = color === sw.hex;
            return (
              <button
                key={sw.id}
                type="button"
                title={sw.name}
                aria-label={sw.name}
                onClick={() => {
                  playClick();
                  setColor(sw.hex);
                }}
                className={`relative h-12 w-12 shrink-0 rounded-2xl border-2 sm:h-14 sm:w-14 ${
                  active ? "border-white scale-105 shadow-lg" : "border-white/25"
                }`}
                style={{ background: sw.hex }}
              >
                {active ? (
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white drop-shadow">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400"
          animate={{ width: `${Math.round(progress * 100)}%` }}
          transition={{ type: "spring", stiffness: 220, damping: 28 }}
        />
      </div>

      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden rounded-3xl border border-white/25 bg-slate-950/25"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
        <AnimatePresence>
          {toast ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-sm font-semibold text-white"
            >
              {toast}
            </motion.p>
          ) : null}
          {celebrating ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
            >
              <div className="rounded-3xl bg-white/20 px-8 py-5 text-center">
                <p className="text-4xl">{template?.emoji}</p>
                <p className="mt-2 text-2xl font-bold text-white">Gyönyörű!</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
