import type { FC } from "react";
import type { Pt } from "../engine/pathMath";

type Props = {
  paths: Pt[][];
  color?: string;
  className?: string;
  strokeWidth?: number;
};

/** Compact SVG thumbnail of normalized (0..1) path art for gallery cards. */
export const PathPreview: FC<Props> = ({
  paths,
  color = "#334155",
  className = "",
  strokeWidth = 2.2,
}) => {
  const d = paths
    .map((path) => {
      if (path.length < 2) return "";
      return path
        .map((p, i) => `${i === 0 ? "M" : "L"}${(p.x * 100).toFixed(2)} ${(p.y * 100).toFixed(2)}`)
        .join(" ");
    })
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-full w-full ${className}`}
      aria-hidden
    >
      <rect x="0" y="0" width="100" height="100" fill="#f8fafc" rx="12" />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
