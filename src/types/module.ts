import type { ComponentType } from "react";

export interface TaskProps<T = Record<string, number>> {
  config: T;
  onComplete: (score: number) => void;
  onFail: () => void;
}

export interface ModuleTask {
  id: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<TaskProps<any>>;
}

export interface EducationalModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  tasks: ModuleTask[];
}
