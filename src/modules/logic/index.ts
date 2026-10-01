import type { EducationalModule } from "../../types/module";
import { PatternMatchTask } from "./tasks/PatternMatchTask";
import { NumberSequenceTask } from "./tasks/NumberSequenceTask";

export const logicModule: EducationalModule = {
  id: "logic",
  title: "Logika",
  description: "Minták, sorrendek, fejtörők",
  icon: "🧩",
  accentColor: "from-violet-500/80 to-fuchsia-600/80",
  tasks: [
    { id: "pattern-match", title: "Mintafelismerés", component: PatternMatchTask },
    { id: "number-sequence", title: "Számsor", component: NumberSequenceTask },
  ],
};
