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
import { ColorPreview } from "../components/ColorPreview";

type Cfg = {
  picturesToWin?: number;
  strokeWidth?: number;
};

type Mode = "gallery" | "paint";

export const ColorFillTask: FC<TaskProps<Cfg>> = ({ config, onComplete }) => {
  const picturesToWin = Math.max(1, Math.round(config.picturesToWin ?? 2));
  const strokeWidth = config.strokeWidth ?? 16;

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
        setToast(`${label} kész`);
        window.setTimeout(() => setToast(null), 850);
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
          }, 1400);
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
            <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Színező stúdió
            </h3>
            <p className="text-sm text-white/70">
              Koppints a részekre — {finishedCount}/{picturesToWin} kép
            </p>
          </div>
          <PrimaryButton
            className="!min-h-12 !px-5"
            onClick={() =>
              open(filtered[Math.floor(Math.random() * filtered.length)] ?? COLOR_TEMPLATES[0])
            }
          >
            Véletlen
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
              className={`min-h-11 shrink-0 rounded-2xl px-4 text-sm font-semibold transition-colors ${
                category === cat
                  ? "bg-white text-slate-900 shadow-md"
                  : "bg-white/12 text-white/85 hover:bg-white/18"
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
                transition={{ delay: Math.min(i * 0.015, 0.28) }}
                whileTap={{ scale: 0.97 }}
                onClick={() => open(t)}
                className="flex min-h-[8.5rem] flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/10 text-left shadow-lg sm:min-h-[9.5rem]"
              >
                <div className="relative mx-2 mt-2 aspect-square overflow-hidden rounded-2xl bg-white shadow-inner">
                  <ColorPreview template={t} />
                </div>
                <div className="flex flex-1 flex-col justify-center px-3 py-2">
                  <span className="truncate text-sm font-semibold text-white">{t.title}</span>
                  <span className="text-[10px] text-white/50">
                    {t.regions.length} rész
                    {t.strokes.length ? ` · ${t.strokes.length} vonal` : ""}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-white sm:text-xl">
            {template?.title}
          </p>
          <p className="text-xs text-white/65 sm:text-sm">
            Koppints a részekre · {Math.round(progress * 100)}% · {finishedCount}/
            {picturesToWin}
          </p>
        </div>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-white/15 sm:w-40">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400"
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
          />
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden rounded-[1.75rem] border border-white/25 bg-[#f4efe6] shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
        <AnimatePresence>
          {toast ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-slate-200/80 bg-white/95 px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-lg"
            >
              {toast}
            </motion.p>
          ) : null}
          {celebrating ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/15 backdrop-blur-[1px]"
            >
              <div className="rounded-3xl border border-white/50 bg-white/90 px-8 py-5 text-center shadow-2xl">
                <p className="text-2xl font-bold text-slate-800">Gyönyörű!</p>
                <p className="mt-1 text-sm text-slate-500">A festék szépen szétterült</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Floating bottom color + tool dock */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center px-2 sm:bottom-3">
        <motion.div
          initial={{ y: 28, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto flex w-full max-w-3xl flex-col gap-2 rounded-[1.75rem] border border-white/40 bg-white/93 p-2 shadow-2xl backdrop-blur-md sm:p-2.5"
        >
          <div className="flex items-center gap-2 overflow-x-auto px-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  className={`relative h-11 w-11 shrink-0 rounded-2xl border-2 transition-transform sm:h-12 sm:w-12 ${
                    active
                      ? "scale-105 border-slate-800 shadow-md"
                      : "border-slate-200/80 hover:scale-105"
                  }`}
                  style={{ background: sw.hex }}
                >
                  {active ? (
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow">
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-2">
            <PrimaryButton
              variant="ghost"
              className="!min-h-11 !border-slate-200 !bg-slate-100 !px-4 !text-slate-800"
              onClick={() => {
                playClick();
                setMode("gallery");
                setTemplate(null);
              }}
            >
              Képek
            </PrimaryButton>
            <span className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:inline-flex">
              <span
                className="h-3.5 w-3.5 rounded-full border border-slate-300"
                style={{ background: color }}
              />
              Aktív szín
            </span>
            <PrimaryButton
              variant="ghost"
              className="!min-h-11 !border-slate-200 !bg-slate-100 !px-4 !text-slate-800"
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
        </motion.div>
      </div>
    </div>
  );
};
