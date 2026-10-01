import { ACHIEVEMENT_CATALOG, STICKER_CATALOG, stickerEmoji } from "../../data/catalog";
import { useAppStore } from "../../core/store/AppStore";
import { GlassCard } from "../ui/GlassCard";

export function CollectionPanel() {
  const { achievements, stickers } = useAppStore();
  const unlockedKeys = new Set(achievements.map((a) => a.key));
  const unlockedStickers = new Set(stickers.map((s) => s.stickerId));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <GlassCard>
        <h3 className="mb-3 text-xl font-black text-white">Achievement-ek</h3>
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENT_CATALOG.map((a) => {
            const on = unlockedKeys.has(a.key);
            return (
              <div
                key={a.key}
                className={`rounded-2xl p-3 ${on ? "bg-white/25" : "bg-white/5 opacity-50"}`}
              >
                <p className="text-2xl">{a.emoji}</p>
                <p className="mt-1 text-sm font-extrabold text-white">{a.title}</p>
              </div>
            );
          })}
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="mb-3 text-xl font-black text-white">Matricák</h3>
        <div className="grid grid-cols-3 gap-2">
          {STICKER_CATALOG.map((s) => {
            const on = unlockedStickers.has(s.id);
            return (
              <div
                key={s.id}
                className={`flex flex-col items-center rounded-2xl p-3 ${
                  on ? "bg-white/25" : "bg-white/5 opacity-40"
                }`}
              >
                <span className="text-3xl">{on ? stickerEmoji(s.id) : "❔"}</span>
                <span className="mt-1 text-xs font-bold text-white">{s.title}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
