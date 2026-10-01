export type PlaylistItem = { moduleId: string; taskId: string; title?: string };

export type Playlist = {
  id: string;
  title: string;
  description: string;
  items: PlaylistItem[];
};

export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: "warmup-5",
    title: "Bemelegítő 5 perc",
    description: "Rövid matek + nyelv",
    items: [
      { moduleId: "math", taskId: "simple-addition", title: "Összeadás" },
      { moduleId: "language", taskId: "letter-recognition", title: "Betűk" },
      { moduleId: "math", taskId: "lightning-round", title: "Villámkör" },
    ],
  },
  {
    id: "full-session",
    title: "Teljes session",
    description: "Vegyes modulok",
    items: [
      { moduleId: "math", taskId: "progressive-math" },
      { moduleId: "logic", taskId: "pattern-match" },
      { moduleId: "memory", taskId: "card-memory" },
      { moduleId: "english", taskId: "english-words" },
      { moduleId: "language", taskId: "reading-cards" },
    ],
  },
];

export function parsePlaylists(json?: string | null): Playlist[] {
  if (!json) return DEFAULT_PLAYLISTS;
  try {
    const parsed = JSON.parse(json) as Playlist[];
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    /* defaults */
  }
  return DEFAULT_PLAYLISTS;
}

export function serializePlaylists(list: Playlist[]): string {
  return JSON.stringify(list);
}
