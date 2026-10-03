import type { EducationalModule } from "../types/module";
import { mathModule } from "./math";
import { languageModule } from "./language";
import { logicModule } from "./logic";
import { memoryModule } from "./memory";
import { englishModule } from "./english";
import { drawingModule } from "./drawing";

const ALL_MODULES: EducationalModule[] = [
  mathModule,
  languageModule,
  drawingModule,
  logicModule,
  memoryModule,
  englishModule,
];

export function getModules(includeDisabled = false, enabledCsv?: string): EducationalModule[] {
  if (includeDisabled || !enabledCsv) return ALL_MODULES;
  const enabled = new Set(
    enabledCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  // If settings are empty/corrupt, show everything rather than a blank home.
  if (enabled.size === 0) return ALL_MODULES;
  return ALL_MODULES.filter((m) => enabled.has(m.id));
}

export function getModuleById(id: string): EducationalModule | undefined {
  return ALL_MODULES.find((m) => m.id === id);
}

export function getTask(moduleId: string, taskId: string) {
  const mod = getModuleById(moduleId);
  return mod?.tasks.find((t) => t.id === taskId);
}

export function allTaskRefs(): { moduleId: string; taskId: string; title: string }[] {
  return ALL_MODULES.flatMap((m) =>
    m.tasks.map((t) => ({ moduleId: m.id, taskId: t.id, title: t.title })),
  );
}
