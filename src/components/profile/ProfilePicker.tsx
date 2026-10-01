import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useAppStore } from "../../core/store/AppStore";
import { AVATARS, fileToAvatarDataUrl } from "../../data/avatars";
import { PrimaryButton } from "../ui/PrimaryButton";
import { playClick } from "../../core/audio/sfx";
import { AvatarView } from "./AvatarView";
import type { Profile } from "../../core/db";

interface ProfilePickerProps {
  onEntered: () => void;
}

export function ProfilePicker({ onEntered }: ProfilePickerProps) {
  const { profiles, selectProfile, addProfile, editProfile } = useAppStore();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("star");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setCreating(true);
    setEditingId(null);
    setName("");
    setAvatar("star");
    setAvatarImage(null);
    setUploadError("");
  };

  const openEdit = (p: Profile) => {
    if (!p.id) return;
    setEditingId(p.id);
    setCreating(false);
    setName(p.name);
    setAvatar(p.avatar);
    setAvatarImage(p.avatarImage ?? null);
    setUploadError("");
  };

  const save = async () => {
    playClick();
    if (editingId != null) {
      await editProfile(editingId, name || "Tanuló", avatar, avatarImage);
      setEditingId(null);
    } else {
      const created = await addProfile(name || "Tanuló", avatar, avatarImage);
      setCreating(false);
      if (created.id) {
        await selectProfile(created.id);
        onEntered();
      }
    }
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarImage(dataUrl);
      playClick();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Nem sikerült a kép");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const showForm = creating || editingId != null;

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10">
      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-4xl font-black text-white drop-shadow md:text-5xl"
      >
        Ki tanul ma?
      </motion.h1>
      <p className="mb-8 text-center text-base font-medium text-white/75 sm:mb-10 sm:text-lg">
        Válassz egy profilt
      </p>

      {!showForm && (
        <div className="flex flex-wrap items-start justify-center gap-8">
          {profiles.map((p, index) => (
            <motion.button
              key={p.id}
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ scale: 1.06, y: -6 }}
              whileTap={{ scale: 0.96 }}
              className="group flex w-36 flex-col items-center gap-3"
              onClick={async () => {
                if (!p.id) return;
                playClick();
                await selectProfile(p.id);
                onEntered();
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                openEdit(p);
              }}
            >
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-white/35 to-white/10 text-6xl shadow-xl ring-4 ring-transparent transition group-hover:ring-white/50">
                <AvatarView
                  avatar={p.avatar}
                  avatarImage={p.avatarImage}
                  alt={p.name}
                  emojiClassName="text-6xl"
                />
              </div>
              <span className="text-xl font-extrabold text-white drop-shadow">
                {p.name}
              </span>
              <button
                type="button"
                className="text-xs font-bold text-white/60 underline-offset-2 hover:text-white hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(p);
                }}
              >
                Szerkesztés
              </button>
            </motion.button>
          ))}

          {profiles.length < 4 && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.06, y: -6 }}
              whileTap={{ scale: 0.96 }}
              className="flex w-36 flex-col items-center gap-3"
              onClick={openCreate}
            >
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-dashed border-white/50 bg-white/10 text-5xl text-white/80">
                +
              </div>
              <span className="text-xl font-extrabold text-white/80">Új profil</span>
            </motion.button>
          )}
        </div>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-white/30 bg-white/15 p-6 backdrop-blur-xl"
        >
          <h2 className="mb-4 text-2xl font-black text-white">
            {editingId != null ? "Profil szerkesztése" : "Új profil"}
          </h2>
          <label className="mb-2 block text-sm font-bold text-white/80">Név</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="Pl. Marci"
            className="mb-4 w-full rounded-2xl border border-white/30 bg-white/20 px-4 py-3 text-lg font-bold text-white outline-none placeholder:text-white/50 focus:ring-2 focus:ring-white/50"
          />

          <p className="mb-2 text-sm font-bold text-white/80">Saját kép</p>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white/20 text-4xl ring-2 ring-white/40">
              <AvatarView
                avatar={avatar}
                avatarImage={avatarImage}
                alt="Előnézet"
                emojiClassName="text-4xl"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onPickFile(e.target.files?.[0])}
              />
              <PrimaryButton
                className="!py-2 text-sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "Feltöltés…" : "Kép választása"}
              </PrimaryButton>
              {avatarImage ? (
                <PrimaryButton
                  variant="ghost"
                  className="!py-2 text-sm"
                  onClick={() => setAvatarImage(null)}
                >
                  Kép törlése
                </PrimaryButton>
              ) : null}
            </div>
          </div>
          {uploadError ? (
            <p className="mb-3 text-sm font-bold text-rose-200">{uploadError}</p>
          ) : (
            <p className="mb-3 text-xs font-semibold text-white/65">
              JPG / PNG / WEBP, max 8 MB — négyzetre vágva mentjük.
            </p>
          )}

          <p className="mb-2 text-sm font-bold text-white/80">Vagy emoji avatar</p>
          <div className="mb-6 grid grid-cols-5 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setAvatar(a.id);
                  // Keep custom image if set — emoji is fallback when image cleared
                }}
                className={`flex h-14 items-center justify-center rounded-2xl text-2xl transition ${
                  !avatarImage && avatar === a.id
                    ? "bg-white text-slate-900 ring-2 ring-white"
                    : "bg-white/15 hover:bg-white/25"
                }`}
                title={a.label}
              >
                {a.emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <PrimaryButton className="flex-1" onClick={() => void save()}>
              Mentés
            </PrimaryButton>
            <PrimaryButton
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setCreating(false);
                setEditingId(null);
              }}
            >
              Mégse
            </PrimaryButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}
