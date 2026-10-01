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
import { ParentAdvancedSettings } from "./ParentAdvancedSettings";

interface ParentPanelProps {
  onClose: () => void;
}

export function ParentPanel({ onClose }: ParentPanelProps) {
  const { settings, patchSettings, resetProgress } = useAppStore();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const modules = useMemo(() => getModules(true), []);

  const taskParams: TaskParamsMap = useMemo(
    () => parseTaskParams(settings?.taskParamsJson),
    [settings?.taskParamsJson],
  );

  if (!settings) return null;

  const enabled = new Set(settings.enabledModules.split(",").filter(Boolean));

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
      <GlassCard className="mx-auto w-full max-w-sm text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Szülőpanel</h2>
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
    <GlassCard className="mx-auto w-full max-w-lg space-y-5">
      <h2 className="text-2xl font-semibold tracking-tight text-white">Szülő beállítások</h2>

      <label className="flex items-center justify-between gap-4">
        <span className="font-medium text-white">Hang</span>
        <button
          type="button"
          className={`min-h-11 rounded-2xl px-4 py-2 font-semibold ${
            settings.soundEnabled ? "bg-emerald-500 text-white" : "bg-white/20 text-white"
          }`}
          onClick={() => void patchSettings({ soundEnabled: !settings.soundEnabled })}
        >
          {settings.soundEnabled ? "Be" : "Ki"}
        </button>
      </label>

      <label className="block">
        <span className="mb-2 block font-medium text-white">
          Napi cél (feladatok): {settings.dailyGoal}
        </span>
        <input
          type="range"
          min={1}
          max={10}
          value={settings.dailyGoal}
          onChange={(e) => void patchSettings({ dailyGoal: Number(e.target.value) })}
          className="w-full"
        />
      </label>

      <label className="block">
        <span className="mb-2 block font-medium text-white">Új PIN</span>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          defaultValue={settings.parentPin}
          onBlur={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (v.length >= 4) void patchSettings({ parentPin: v });
          }}
          className="w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 font-medium text-white outline-none"
        />
      </label>

      <div>
        <p className="mb-2 font-medium text-white">Aktív modulok</p>
        <div className="space-y-2">
          {modules.map((m) => {
            const on = enabled.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                className={`flex min-h-12 w-full items-center justify-between rounded-2xl px-4 py-3 font-medium ${
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
                <span>
                  {m.icon} {m.title}
                </span>
                <span>{on ? "Be" : "Ki"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 font-medium text-white">Feladat paraméterek</p>
        <p className="mb-3 text-xs text-white/65">
          Memória párok, számegyenes hossza, körök száma stb.
        </p>
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
                  className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left font-semibold text-white"
                  onClick={() => {
                    playClick();
                    setOpenTaskId(open ? null : schema.taskId);
                  }}
                >
                  <span>{schema.title}</span>
                  <span className="text-white/70">{open ? "▾" : "▸"}</span>
                </button>
                {open ? (
                  <div className="space-y-4 border-t border-white/15 px-4 pb-4 pt-3">
                    {schema.params.map((param) => {
                      const value =
                        taskParams[schema.taskId]?.[param.key] ?? param.default;
                      return (
                        <label key={param.key} className="block">
                          <span className="mb-1 flex justify-between text-sm font-medium text-white/90">
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
                              className="w-full"
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
                              className="w-20 rounded-xl border border-white/30 bg-white/15 px-2 py-1 text-right text-sm font-semibold text-white outline-none"
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
        <PrimaryButton
          variant="ghost"
          className="mt-3 w-full !py-2 text-sm"
          onClick={() =>
            void patchSettings({
              taskParamsJson: serializeTaskParams(parseTaskParams(null)),
            })
          }
        >
          Feladat-paraméterek alaphelyzet
        </PrimaryButton>
      </div>

      <div className="rounded-2xl border border-rose-300/40 bg-rose-500/15 p-4">
        <p className="font-semibold text-white">Haladás visszaállítása</p>
        <p className="mt-1 text-xs leading-relaxed text-white/75">
          Törli a pontokat, sorozatot, achievementeket, matricákat és a napi
          előzményeket minden profilnál. A profilok, avatárok és szülőbeállítások
          megmaradnak. Írd be: <span className="font-bold text-white">RESET</span>
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

      <ParentAdvancedSettings />

      <PrimaryButton className="w-full" onClick={onClose}>
        Kész
      </PrimaryButton>
    </GlassCard>
  );
}
