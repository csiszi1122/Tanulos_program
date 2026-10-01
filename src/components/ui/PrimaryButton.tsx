import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";

interface PrimaryButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: "primary" | "ghost" | "success" | "danger";
  className?: string;
}

const variants: Record<NonNullable<PrimaryButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg hover:brightness-110",
  ghost: "bg-white/25 text-white border border-white/40 hover:bg-white/35",
  success: "bg-emerald-500 text-white shadow-lg",
  danger: "bg-rose-500 text-white shadow-lg",
};

export function PrimaryButton({
  children,
  variant = "primary",
  className = "",
  ...rest
}: PrimaryButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`min-h-11 rounded-2xl px-5 py-3 text-base font-semibold transition-colors disabled:opacity-50 sm:px-6 sm:text-lg ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
