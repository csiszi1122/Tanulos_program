import type { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "", ...rest }: GlassCardProps) {
  return (
    <motion.div
      className={`rounded-3xl border border-white/35 bg-white/20 p-6 shadow-xl backdrop-blur-md ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
