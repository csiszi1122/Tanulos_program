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

type Mode = "gallery" | "paint" | "alive";

export const ColorFillTask: FC<TaskProps<Cfg>> = ({ config, onComplete }) => {
  const picturesToWin = Math.max(1, Math.round(config.picturesToWin ?? 2));
  const strokeWidth = config.strokeWidth ?? 16;

  const [mode, setMode] = useState<Mode>("gallery");
  const [category, setCategory] = useState("Mind");
  const [template, setTemplate] = useState<ColorTemplate | null>(null);
  const [color, setColor] = useState(COLOR_PALETTE[7].hex);
  const [progress, setProgress] = useState(0);
  const [finishedCount, setFinishedCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [lifeReady, setLifeReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ColorEngine | null>(null);

  const filtered = useMemo(() => {
    if (category === "Mind") return COLOR_TEMPLATES;
    return COLOR_TEMPLATES.filter((t) => t.category === category);
  }, [category]);

  useEffect(() => {
    engineRef.current?.setColor(color);
  }, [color]);

  useEffect(() => {
    if (mode !== "paint" && mode !== "alive") return;
    if (!canvasRef.current || !template) return;

    setLifeReady(false);
    const engine = new ColorEngine(canvasRef.current, {
      strokeWidth,
      onProgress: setProgress,
      onRegionFill: (label) => {
        playClick();
        setToast(`${label} kiszínezve`);
        window.setTimeout(() => setToast(null), 1000);
      },
      onComplete: () => {
        playSuccess();
        fireRewardConfetti();
        setMode("alive");
        setToast("Életre kel…");
      },
      onLifeDone: () => {
        setLifeReady(true);
        setToast(null);
      },
    });
    engineRef.current = engine;
    engine.setColor(color);
    engine.setTemplate(template);

    const resize = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      engine.resize(r.width, r.height);
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
  }, [mode === "gallery" ? "off" : template?.id, strokeWidth]);

  const open = (t: ColorTemplate) => {
    playClick();
    setTemplate(t);
    setProgress(0);
    setLifeReady(false);
    setMode("paint");
  };

  const finishPicture = () => {
    playClick();
    setFinishedCount((prev) => {
      const next = prev + 1;
      if (next >= picturesToWin) onComplete(100);
      else {
        setMode("gallery");
        setTemplate(null);
        setProgress(0);
      }
      return next;
    });
  };

  if (mode === "gallery") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">Színező műhely</h3>
            <p className="text-sm text-slate-600">
              Koppints a részekre, vagy vezesd a vonalat — majd életre kel · {finishedCount}/
              {picturesToWin}
            </p>
          </div>
          <PrimaryButton
            className="!min-h-12 !bg-slate-900 !text-white"
            onClick={() =>
              open(filtered[Math.floor(Math.random() * filtered.length)] ?? COLOR_TEMPLATES[0])
            }
          >
            Véletlen
          </PrimaryButton>
        </div>
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {["Mind", ...COLOR_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                playClick();
                setCategory(cat);
              }}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${
                category === cat
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200/80 text-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((t) => (
              <motion.button
                key={t.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => open(t)}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-square bg-slate-50 p-3">
                  <ColorPreview template={t} className="h-full w-full" />
                </div>
                <div className="px-3 py-2 text-left">
                  <p className="font-semibold text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.regions.length} rész
                    {t.strokes.length ? ` · ${t.strokes.length} vonal` : ""}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 rounded-3xl bg-gradient-to-b from-indigo-50 to-white p-2 sm:p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <p className="text-lg font-semibold text-slate-900">{template?.title}</p>
          <p className="text-xs text-slate-500">
            {mode === "alive"
              ? lifeReady
                ? "Kész — folytathatod"
                : "A rajz életre kel…"
              : "Koppints a mezőkre · vezesd a szaggatott vonalat"}
          </p>
        </div>
        <div className="flex gap-2">
          <PrimaryButton
            variant="ghost"
            className="!min-h-11 !border !border-slate-200 !bg-white !text-slate-800"
            onClick={() => {
              playClick();
              setMode("gallery");
              setTemplate(null);
            }}
          >
            Képek
          </PrimaryButton>
          {mode === "paint" ? (
            <PrimaryButton
              variant="ghost"
              className="!min-h-11 !border !border-slate-200 !bg-white !text-slate-800"
              onClick={() => {
                playClick();
                engineRef.current?.reset();
                setProgress(0);
                setLifeReady(false);
              }}
            >
              Újra
            </PrimaryButton>
          ) : null}
        </div>
      </div>

      {mode === "paint" ? (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Színpaletta
            </span>
            <span
              className="h-4 w-4 rounded-full border border-slate-300"
              style={{ background: color }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {COLOR_PALETTE.map((sw) => (
              <button
                key={sw.id}
                type="button"
                title={sw.name}
                onClick={() => {
                  playClick();
                  setColor(sw.hex);
                }}
                className={`h-12 w-12 shrink-0 rounded-2xl border-2 sm:h-14 sm:w-14 ${
                  color === sw.hex
                    ? "scale-105 border-slate-900 shadow-md"
                    : "border-slate-200"
                }`}
                style={{ background: sw.hex }}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-400"
          animate={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-[1.75rem] border border-slate-200 shadow-inner"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
        <AnimatePresence>
          {toast ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-slate-900/80 px-4 py-1.5 text-sm font-semibold text-white"
            >
              {toast}
            </motion.p>
          ) : null}
        </AnimatePresence>
        {mode === "alive" && lifeReady ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-0 bottom-4 flex justify-center"
          >
            <PrimaryButton
              className="!min-h-14 !rounded-full !bg-slate-900 !px-8 !text-lg !text-white shadow-xl"
              onClick={finishPicture}
            >
              Tovább
            </PrimaryButton>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};
