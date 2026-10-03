import { motion } from "motion/react";
import type { EducationalModule } from "../../types/module";
import { GlassCard } from "../../components/ui/GlassCard";

interface ModuleGridProps {
  modules: EducationalModule[];
  onSelect: (moduleId: string) => void;
}

export function ModuleGrid({ modules, onSelect }: ModuleGridProps) {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
      {modules.map((mod, index) => (
        <GlassCard
          key={mod.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06 }}
          whileHover={{ y: -3, scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className={`min-h-[6.75rem] cursor-pointer bg-gradient-to-br sm:min-h-[7.5rem] ${mod.accentColor}`}
          onClick={() => onSelect(mod.id)}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <motion.span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl sm:h-14 sm:w-14 sm:text-4xl">
              {mod.icon}
            </motion.span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {mod.title}
              </h2>
              <p className="mt-1 text-sm font-medium text-white/85">{mod.description}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-white/65">
                {mod.tasks.length} feladat
              </p>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
