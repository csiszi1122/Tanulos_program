import { useState } from "react";
import { useAppStore } from "../../core/store/AppStore";
import { PrimaryButton } from "../ui/PrimaryButton";
import {
  createBackupQrDataUrl,
  downloadTextFile,
  exportBackupJson,
  exportProgressCsv,
} from "../../core/export/backup";
import { playClick } from "../../core/audio/sfx";

export function ParentAdvancedSettings() {
  const { settings, profile, patchSettings } = useAppStore();
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!settings) return null;

  return (
    <div className="space-y-5 border-t border-white/15 pt-5">
      <div>
        <p className="mb-2 font-medium text-white">Megjelenés</p>
        <div className="grid grid-cols-3 gap-2">
          {(["vivid", "soft", "dark"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`min-h-11 rounded-2xl px-2 py-2 text-sm font-semibold ${
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

      <label className="block">
        <span className="mb-2 block font-medium text-white">
          Napi játékidő limit (perc, 0 = nincs)
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
          className="w-full rounded-2xl border border-white/30 bg-white/15 px-4 py-3 font-medium text-white outline-none"
        />
      </label>

      <label className="flex items-center justify-between gap-4">
        <span className="font-medium text-white">Adaptív nehézség</span>
        <button
          type="button"
          className={`min-h-11 rounded-2xl px-4 py-2 font-semibold ${
            settings.adaptiveDifficulty ? "bg-emerald-500 text-white" : "bg-white/20 text-white"
          }`}
          onClick={() =>
            void patchSettings({ adaptiveDifficulty: !settings.adaptiveDifficulty })
          }
        >
          {settings.adaptiveDifficulty ? "Be" : "Ki"}
        </button>
      </label>

      <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
        <p className="font-semibold text-white">Export & mentés</p>
        <p className="mt-1 text-xs text-white/70">
          Heti/havi jelentés CSV és teljes JSON backup (offline).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <PrimaryButton
            variant="ghost"
            className="!py-2 text-sm"
            disabled={!profile?.id || busy}
            onClick={async () => {
              if (!profile?.id) return;
              setBusy(true);
              try {
                const csv = await exportProgressCsv(profile.id);
                downloadTextFile(`tanulos-report-${profile.name}.csv`, csv, "text/csv");
                playClick();
              } finally {
                setBusy(false);
              }
            }}
          >
            CSV jelentés
          </PrimaryButton>
          <PrimaryButton
            variant="ghost"
            className="!py-2 text-sm"
            disabled={!profile || busy}
            onClick={async () => {
              if (!profile) return;
              setBusy(true);
              try {
                await exportBackupJson(profile);
                if (profile.id) {
                  setQr(await createBackupQrDataUrl(profile.id));
                }
                playClick();
              } finally {
                setBusy(false);
              }
            }}
          >
            JSON backup
          </PrimaryButton>
        </div>
        {qr ? (
          <img src={qr} alt="Backup QR összefoglaló" className="mx-auto mt-4 rounded-xl bg-white p-2" />
        ) : null}
        <p className="mt-2 text-[10px] text-white/55">
          A QR rövid összefoglalót tartalmaz; a teljes adat a JSON fájlban van.
        </p>
      </div>
    </div>
  );
}
