import { avatarEmoji } from "../../data/avatars";

interface AvatarViewProps {
  avatar: string;
  avatarImage?: string | null;
  className?: string;
  emojiClassName?: string;
  alt?: string;
}

/** Renders a custom photo avatar if present, otherwise the emoji preset. */
export function AvatarView({
  avatar,
  avatarImage,
  className = "",
  emojiClassName = "text-5xl",
  alt = "Avatar",
}: AvatarViewProps) {
  if (avatarImage) {
    return (
      <img
        src={avatarImage}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <span className={`leading-none ${emojiClassName}`} aria-hidden>
      {avatarEmoji(avatar)}
    </span>
  );
}
