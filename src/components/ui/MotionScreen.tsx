import type { ReactNode } from "react";
import { motion } from "motion/react";

interface MotionScreenProps {
  children: ReactNode;
  className?: string;
}

export function MotionScreen({ children, className = "" }: MotionScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
