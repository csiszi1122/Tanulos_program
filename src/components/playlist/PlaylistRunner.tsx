import { useMemo } from "react";
import { parsePlaylists, type Playlist } from "../../data/playlist";
import { getTask } from "../../modules/registry";
import { useAppStore } from "../../core/store/AppStore";
import { GlassCard } from "../ui/GlassCard";
import { PrimaryButton } from "../ui/PrimaryButton";
import { playClick } from "../../core/audio/sfx";

interface PlaylistRunnerProps {
  onBack: () => void;
  onStart: (playlist: Playlist) => void;
}

export function PlaylistRunner({ onBack, onStart }: PlaylistRunnerProps) {
  const { settings } = useAppStore();
  const playlists = useMemo(
    () => parsePlaylists(settings?.playlistJson),
    [settings?.playlistJson],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {playlists.map((pl) => (
        <GlassCard key={pl.id} className="space-y-3">
          <div>
            <h3 className="text-xl font-semibold text-white">{pl.title}</h3>
            <p className="text-sm text-white/75">{pl.description}</p>
          </div>
          <ul className="space-y-1 text-sm text-white/80">
            {pl.items.map((it, i) => {
              const task = getTask(it.moduleId, it.taskId);
              return (
                <li key={`${it.moduleId}-${it.taskId}-${i}`}>
                  {i + 1}. {task?.title ?? it.taskId}
                </li>
              );
            })}
          </ul>
          <PrimaryButton
            onClick={() => {
              playClick();
              onStart(pl);
            }}
          >
            Indítás
          </PrimaryButton>
        </GlassCard>
      ))}
      <PrimaryButton variant="ghost" onClick={onBack}>
        Vissza
      </PrimaryButton>
    </div>
  );
}

export type ActivePlaylist = {
  items: Playlist["items"];
  index: number;
};
