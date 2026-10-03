import type { FC } from "react";
import type { ColorTemplate } from "../data/colorTemplates";

type Props = {
  template: ColorTemplate;
  className?: string;
};

function polyD(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  return (
    points
      .map((p, i) => `${i === 0 ? "M" : "L"}${(p.x * 100).toFixed(2)} ${(p.y * 100).toFixed(2)}`)
      .join(" ") + " Z"
  );
}

function strokeD(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(p.x * 100).toFixed(2)} ${(p.y * 100).toFixed(2)}`)
    .join(" ");
}

const TINTS = ["#fda4af", "#fcd34d", "#86efac", "#7dd3fc", "#c4b5fd", "#fdba74", "#f9a8d4"];

/** Soft multi-region thumbnail for coloring-book gallery cards. */
export const ColorPreview: FC<Props> = ({ template, className = "" }) => {
  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full ${className}`} aria-hidden>
      <rect x="0" y="0" width="100" height="100" fill="#f8fafc" rx="12" />
      {template.regions.map((r, i) => (
        <path
          key={r.id}
          d={polyD(r.points)}
          fill={TINTS[i % TINTS.length]}
          fillOpacity={0.35}
          stroke="#334155"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      ))}
      {template.strokes.map((s) => (
        <path
          key={s.id}
          d={strokeD(s.points)}
          fill="none"
          stroke="#334155"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
};
