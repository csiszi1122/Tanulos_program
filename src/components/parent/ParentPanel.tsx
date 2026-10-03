import { useMemo, useState } from "react";
import { useAppStore } from "../../core/store/AppStore";
import { getModules } from "../../modules/registry";
import { GlassCard } from "../ui/GlassCard";
import { PrimaryButton } from "../ui/PrimaryButton";
import { playClick } from "../../core/audio/sfx";
import {
  TASK_PARAM_SCHEMAS,
  parseTaskParams,
  serializeTaskParams,
  setTaskParam,
  type TaskParamsMap,
} from "../../data/taskParams";
import {
  createBackupQrDataUrl,
  downloadTextFile,
  exportBackupJson,
  exportProgressCsv,
} from "../../core/export/backup";

interface ParentPanelProps {
  onClose: () => void;
}

type TabId = "general" | "modules" | "tasks" | "data" | "danger";

const TABS: { id: TabId; label: string; short: string }[] = [
  { id: "general", label: "Általános", short: "Ált." },
  { id: "modules", label: "Modulok", short: "Mod." },
  { id: "tasks", label: "Feladatok", short: "Fel." },
  { id: "data", label: "Mentés", short: "Ment." },
  { id: "danger", label: "Visszaállítás", short: "Reset" },
];

export function ParentPanel({ onClose }: ParentPanelProps) {
  const { settings, profile, patchSettings, resetProgress } = useAppStore();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("general");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const modules = useMemo(() => getModules(true), []);

  const taskParams: TaskParamsMap = useMemo(
    () => parseTaskParams(settings?.taskParamsJson),
    [settings?.taskParamsJson],
  );

  if (!settings) return null;

  const enabled = new Set(
    settings.enabledModules
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const tryUnlock = () => {
    playClick();
    if (pin === settings.parentPin) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Hibás PIN");
    }
  };

  const updateParam = (taskId: string, key: string, value: number) => {
    const next = setTaskParam(taskParams, taskId, key, value);
    void patchSettings({ taskParamsJson: serializeTaskParams(next) });
  };

  const doReset = async () => {
    if (resetConfirm.trim().toUpperCase() !== "RESET") return;
    setResetBusy(true);
    try {
      await resetProgress();
      setResetDone(true);
      setResetConfirm("");
      playClick();
    } finally {
      setResetBusy(false);
    }
  };

  if (!unlocked) {
    return (
      <GlassCard className="mx-auto w-full max-w-sm p-4 text-center sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Szülőpanel
        </h2>
        <p className="mt-2 text-sm text-white/75">
          Add meg a PIN-kódot (alapértelmezett: 1234)
        </p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="mt-4 w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-center text-2xl font-semibold tracking-widest text-white outline-none"
        />
        {error ? <p className="mt-2 text-sm font-medium text-rose-200">{error}</p> : null}
        <div className="mt-4 flex gap-3">
          <PrimaryButton className="flex-1" onClick={tryUnlock}>
            Belépés
          </PrimaryButton>
          <PrimaryButton variant="ghost" className="flex-1" onClick={onClose}>
            Mégse
          </PrimaryButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col !p-0 overflow-hidden">
      <div className="shrink-0 border-b border-white/15 px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            Szülő beállítások
          </h2>
          <PrimaryButton
            className="!min-h-10 shrink-0 !px-4 !py-2 text-sm md:hidden"
            onClick={onClose}
          >
            Kész
          </PrimaryButton>
        </div>

        {/* Mobile / tablet: horizontal category chips */}
        <nav
          className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Beállítás kategóriák"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  playClick();
                  setTab(t.id);
                }}
                className={`min-h-10 shrink-0 rounded-full px-3.5 text-sm font-semibold transition ${
                  active
                    ? "bg-white text-slate-900"
                    : "bg-white/15 text-white/80 active:bg-white/25"
                }`}
              >
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Tablet+: side nav */}
        <nav
          className="hidden w-44 shrink-0 flex-col gap-1 border-r border-white/15 p-3 md:flex lg:w-52"
          aria-label="Beállítás kategóriák"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  playClick();
                  setTab(t.id);
                }}
                className={`min-h-11 rounded-2xl px-3 text-left text-sm font-semibold transition ${
                  active
                    ? "bg-white text-slate-900"
                    : "bg-transparent text-white/80 hover:bg-white/10"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4">
          {tab === "general" && (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-white/10 px-3 py-2 sm:col-span-2">
                <span className="font-medium text-white">Hang</span>
                <button
                  type="button"
                  className={`min-h-10 rounded-xl px-4 py-2 text-sm font-semibold ${
                    settings.soundEnabled
                      ? "bg-emerald-500 text-white"
                      : "bg-white/20 text-white"
                  }`}
                  onClick={() => void patchSettings({ soundEnabled: !settings.soundEnabled })}
                >
                  {settings.soundEnabled ? "Be" : "Ki"}
                </button>
              </label>

              <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-white/10 px-3 py-2 sm:col-span-2">
                <span className="font-medium text-white">Adaptív nehézség</span>
                <button
                  type="button"
                  className={`min-h-10 rounded-xl px-4 py-2 text-sm font-semibold ${
                    settings.adaptiveDifficulty
                      ? "bg-emerald-500 text-white"
                      : "bg-white/20 text-white"
                  }`}
                  onClick={() =>
                    void patchSettings({
                      adaptiveDifficulty: !settings.adaptiveDifficulty,
                    })
                  }
                >
                  {settings.adaptiveDifficulty ? "Be" : "Ki"}
                </button>
              </label>

              <label className="block rounded-2xl bg-white/10 p-3 sm:col-span-2">
                <span className="mb-2 flex justify-between text-sm font-medium text-white">
                  <span>Napi cél (feladatok)</span>
                  <span>{settings.dailyGoal}</span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={settings.dailyGoal}
                  onChange={(e) =>
                    void patchSettings({ dailyGoal: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </label>

              <label className="block rounded-2xl bg-white/10 p-3">
                <span className="mb-2 block text-sm font-medium text-white">
                  Játékidő limit (perc, 0 = nincs)
                </span>
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={settings.dailyPlayMinutesLimit}
                  onChange={(e) =>
                    void patchSettings({
                      dailyPlayMinutesLimit: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full rounded-xl border border-white/30 bg-white/15 px-3 py-2.5 font-medium text-white outline-none"
                />
              </label>

              <label className="block rounded-2xl bg-white/10 p-3">
                <span className="mb-2 block text-sm font-medium text-white">Új PIN</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  defaultValue={settings.parentPin}
                  onBlur={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v.length >= 4) void patchSettings({ parentPin: v });
                  }}
                  className="w-full rounded-xl border border-white/30 bg-white/15 px-3 py-2.5 font-medium text-white outline-none"
                />
              </label>

              <div className="rounded-2xl bg-white/10 p-3 sm:col-span-2">
                <p className="mb-2 text-sm font-medium text-white">Megjelenés</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["vivid", "soft", "dark"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`min-h-11 rounded-xl px-2 py-2 text-sm font-semibold ${
                        settings.themeMode === mode
                          ? "bg-indigo-500 text-white"
                          : "bg-white/15 text-white/75"
                      }`}
                      onClick={() => void patchSettings({ themeMode: mode })}
                    >
                      {mode === "vivid" ? "Élénk" : mode === "soft" ? "Lágy" : "Sötét"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "modules" && (
            <div className="space-y-3">
              <p className="text-sm text-white/70">Kapcsold be a témákat a kezdőlapon.</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {modules.map((m) => {
                  const on = enabled.has(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left font-medium ${
                        on ? "bg-indigo-500/80 text-white" : "bg-white/15 text-white/70"
                      }`}
                      onClick={() => {
                        const next = new Set(enabled);
                        if (on) next.delete(m.id);
                        else next.add(m.id);
                        void patchSettings({
                          enabledModules: [...next].join(",") || m.id,
                        });
                      }}
                    >
                      <span className="truncate">
                        {m.icon} {m.title}
                      </span>
                      <span className="shrink-0 text-sm">{on ? "Be" : "Ki"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "tasks" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm text-white/70">
                  Nyiss ki egy feladatot a részletes értékekhez.
                </p>
                <PrimaryButton
                  variant="ghost"
                  className="!min-h-9 !px-3 !py-1.5 text-xs"
                  onClick={() =>
                    void patchSettings({
                      taskParamsJson: serializeTaskParams(parseTaskParams(null)),
                    })
                  }
                >
                  Alaphelyzet
                </PrimaryButton>
              </div>
              <div className="space-y-2">
                {TASK_PARAM_SCHEMAS.map((schema) => {
                  const open = openTaskId === schema.taskId;
                  return (
                    <div
                      key={schema.taskId}
                      className="overflow-hidden rounded-2xl border border-white/20 bg-white/10"
                    >
                      <button
                        type="button"
                        className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-white sm:px-4"
                        onClick={() => {
                          playClick();
                          setOpenTaskId(open ? null : schema.taskId);
                        }}
                      >
                        <span className="truncate">{schema.title}</span>
                        <span className="shrink-0 text-white/70">{open ? "▾" : "▸"}</span>
                      </button>
                      {open ? (
                        <div className="grid gap-3 border-t border-white/15 px-3 pb-3 pt-3 sm:grid-cols-2 sm:px-4">
                          {schema.params.map((param) => {
                            const value =
                              taskParams[schema.taskId]?.[param.key] ?? param.default;
                            return (
                              <label key={param.key} className="block">
                                <span className="mb-1 flex justify-between text-xs font-medium text-white/90 sm:text-sm">
                                  <span>{param.label}</span>
                                  <span>{value}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="range"
                                    min={param.min}
                                    max={param.max}
                                    step={param.step ?? 1}
                                    value={Math.min(value, param.max)}
                                    onChange={(e) =>
                                      updateParam(
                                        schema.taskId,
                                        param.key,
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-full min-w-0"
                                  />
                                  <input
                                    type="number"
                                    min={param.min}
                                    max={param.max}
                                    step={param.step ?? 1}
                                    value={value}
                                    onChange={(e) =>
                                      updateParam(
                                        schema.taskId,
                                        param.key,
                                        Number(e.target.value),
                                      )
                                    }
                                    className="w-16 shrink-0 rounded-xl border border-white/30 bg-white/15 px-2 py-1 text-right text-sm font-semibold text-white outline-none sm:w-20"
                                  />
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "data" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3 sm:p-4">
                <p className="font-semibold text-white">Export & mentés</p>
                <p className="mt-1 text-xs text-white/70 sm:text-sm">
                  CSV jelentés és teljes JSON backup (offline).
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <PrimaryButton
                    variant="ghost"
                    className="!min-h-10 !py-2 text-sm"
                    disabled={!profile?.id || exportBusy}
                    onClick={async () => {
                      if (!profile?.id) return;
                      setExportBusy(true);
                      try {
                        const csv = await exportProgressCsv(profile.id);
                        downloadTextFile(
                          `tanulos-report-${profile.name}.csv`,
                          csv,
                          "text/csv",
                        );
                        playClick();
                      } finally {
                        setExportBusy(false);
                      }
                    }}
                  >
                    CSV jelentés
                  </PrimaryButton>
                  <PrimaryButton
                    variant="ghost"
                    className="!min-h-10 !py-2 text-sm"
                    disabled={!profile || exportBusy}
                    onClick={async () => {
                      if (!profile) return;
                      setExportBusy(true);
                      try {
                        await exportBackupJson(profile);
                        if (profile.id) {
                          setQr(await createBackupQrDataUrl(profile.id));
                        }
                        playClick();
                      } finally {
                        setExportBusy(false);
                      }
                    }}
                  >
                    JSON backup
                  </PrimaryButton>
                </div>
                {qr ? (
                  <img
                    src={qr}
                    alt="Backup QR összefoglaló"
                    className="mx-auto mt-4 max-w-[180px] rounded-xl bg-white p-2 sm:max-w-[220px]"
                  />
                ) : null}
                <p className="mt-2 text-[10px] text-white/55 sm:text-xs">
                  A QR rövid összefoglaló; a teljes adat a JSON fájlban van.
                </p>
              </div>
            </div>
          )}

          {tab === "danger" && (
            <div className="rounded-2xl border border-rose-300/40 bg-rose-500/15 p-3 sm:p-4">
              <p className="font-semibold text-white">Haladás visszaállítása</p>
              <p className="mt-1 text-xs leading-relaxed text-white/75 sm:text-sm">
                Törli a pontokat, sorozatot, achievementeket, matricákat és a napi
                előzményeket minden profilnál. A profilok, avatárok és
                szülőbeállítások megmaradnak. Írd be:{" "}
                <span className="font-bold text-white">RESET</span>
              </p>
              <input
                value={resetConfirm}
                onChange={(e) => {
                  setResetConfirm(e.target.value);
                  setResetDone(false);
                }}
                placeholder="RESET"
                className="mt-3 w-full rounded-2xl border border-white/30 bg-white/15 px-4 py-3 font-semibold tracking-wide text-white outline-none placeholder:text-white/40"
              />
              <PrimaryButton
                variant="danger"
                className="mt-3 w-full"
                disabled={resetBusy || resetConfirm.trim().toUpperCase() !== "RESET"}
                onClick={() => void doReset()}
              >
                {resetBusy ? "Visszaállítás…" : "Minden haladás törlése"}
              </PrimaryButton>
              {resetDone ? (
                <p className="mt-2 text-sm font-medium text-emerald-200">
                  Kész — tiszta lappal indíthattok.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="hidden shrink-0 border-t border-white/15 p-3 md:block md:px-5">
        <PrimaryButton className="w-full" onClick={onClose}>
          Kész
        </PrimaryButton>
      </div>
    </GlassCard>
  );
}
