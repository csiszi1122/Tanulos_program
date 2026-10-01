export const AVATARS = [
  { id: "star", emoji: "⭐", label: "Csillag" },
  { id: "fox", emoji: "🦊", label: "Róka" },
  { id: "cat", emoji: "🐱", label: "Cica" },
  { id: "lion", emoji: "🦁", label: "Oroszlán" },
  { id: "unicorn", emoji: "🦄", label: "Unikornis" },
  { id: "rocket", emoji: "🚀", label: "Rakéta" },
  { id: "rainbow", emoji: "🌈", label: "Szivárvány" },
  { id: "panda", emoji: "🐼", label: "Panda" },
  { id: "dog", emoji: "🐶", label: "Kutyus" },
  { id: "frog", emoji: "🐸", label: "Béka" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export function avatarEmoji(id: string): string {
  return AVATARS.find((a) => a.id === id)?.emoji ?? "⭐";
}

/** Resize & compress an image file to a square JPEG data URL for IndexedDB. */
export async function fileToAvatarDataUrl(
  file: File,
  size = 256,
  quality = 0.82,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Csak képfájl választható");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("A kép túl nagy (max 8 MB)");
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nem elérhető");

  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, x, y, w, h);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", quality);
}
