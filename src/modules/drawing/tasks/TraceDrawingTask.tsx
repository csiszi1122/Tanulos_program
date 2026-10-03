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
import { TraceEngine } from "../engine/TraceEngine";
import { ColorPreview } from "../components/ColorPreview";

type Cfg = {
  partCoverage?: number;
  strokeWidth?: number;
  drawingsToWin?: number;
};

type Mode = "gallery" | "draw" | "alive";

export const TraceDrawingTask: FC<TaskProps<Cfg>> = ({ config, onComplete }) => {
  const partCoverage = Math.min(0.92, Math.max(0.45, (config.partCoverage ?? 62) / 100));
  const strokeWidth = config.strokeWidth ?? 16;
  const drawingsToWin = Math.max(1, Math.round(config.drawingsToWin ?? 2));

  const [mode, setMode] = useState<Mode>("gallery");
  const [category, setCategory] = useState("Mind");
  const [template, setTemplate] = useState<ColorTemplate | null>(null);
  const [color, setColor] = useState(COLOR_PALETTE[7].hex);
  const [progress, setProgress] = useState(0);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [finishedCount, setFinishedCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [lifeReady, setLifeReady] = useState(false);
  const [hintFlash, setHintFlash] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<TraceEngine | null>(null);

  const filtered = useMemo(() => {
    if (category === "Mind") return COLOR_TEMPLATES;
    return COLOR_TEMPLATES.filter((t) => t.category === category);
  }, [category]);

  useEffect(() => {
    engineRef.current?.setColor(color);
  }, [color]);

  useEffect(() => {
    if (mode !== "draw" && mode !== "alive") return;
    if (!canvasRef.current || !template) return;

    setLifeReady(false);
    const engine = new TraceEngine(canvasRef.current, {
      strokeWidth,
      partCoverage,
      onProgress: (ratio, label) => {
        setProgress(ratio);
        setActiveLabel(label);
      },
      onPartComplete: (label, c) => {
        playClick();
        setToast(`${label} — kész (${c})`);
        window.setTimeout(() => setToast(null), 1100);
      },
      onAllComplete: () => {
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
      engine.resize(wrap.getBoundingClientRect().width, wrap.getBoundingClientRect().height);
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
  }, [mode === "gallery" ? "off" : template?.id, strokeWidth, partCoverage]);

  const open = (t: ColorTemplate) => {
    playClick();
    setTemplate(t);
    setProgress(0);
    setActiveLabel(t.regions[0]?.label ?? null);
    setLifeReady(false);
    setMode("draw");
  };

  const finishPicture = () => {
    playClick();
    setFinishedCount((prev) => {
      const next = prev + 1;
      if (next >= drawingsToWin) {
        onComplete(100);
      } else {
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
            <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">Vonalrajz műhely</h3>
            <p className="text-sm text-slate-600">
              Válassz színt, kövesd a részt, kitöltődik — majd életre kel · {finishedCount}/
              {drawingsToWin}
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
                className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-square bg-slate-50 p-3">
                  <ColorPreview template={t} className="h-full w-full" />
                </div>
                <div className="px-3 py-2 text-left">
                  <p className="font-semibold text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-500">{t.regions.length} rész</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 rounded-3xl bg-gradient-to-b from-slate-100 to-white p-2 sm:p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-slate-900">
            {template?.title}
            {activeLabel && mode === "draw" ? (
              <span className="ml-2 text-sm font-medium text-indigo-600">
                · {activeLabel}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-slate-500">
            {mode === "alive"
              ? lifeReady
                ? "Kész — folytathatod, ha szeretnéd"
                : "A rajz életre kel…"
              : "Rajzold körül a kiemelt részt a választott színnel"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          {mode === "draw" ? (
            <>
              <PrimaryButton
                variant="ghost"
                className={`!min-h-11 !border !border-slate-200 !bg-white !text-slate-800 ${
                  hintFlash ? "!bg-indigo-100" : ""
                }`}
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
                className="!min-h-11 !border !border-slate-200 !bg-white !text-slate-800"
                onClick={() => {
                  playClick();
                  engineRef.current?.clearUser();
                  setProgress(0);
                  setLifeReady(false);
                }}
              >
                Újra
              </PrimaryButton>
            </>
          ) : null}
        </div>
      </div>

      {/* Color dock */}
      {mode === "draw" ? (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ecsetszín
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span
                className="h-4 w-4 rounded-full border border-slate-300"
                style={{ background: color }}
              />
              Aktív
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  className={`h-12 w-12 shrink-0 rounded-2xl border-2 sm:h-14 sm:w-14 ${
                    active
                      ? "scale-105 border-slate-900 shadow-md"
                      : "border-slate-200"
                  }`}
                  style={{ background: sw.hex }}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
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
              initial={{ opacity: 0, y: 10 }}
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
            className="absolute inset-x-0 bottom-4 flex justify-center px-4"
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
