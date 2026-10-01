import type { EducationalModule } from "../../types/module";
import { SimpleAdditionTask } from "./tasks/SimpleAdditionTask";
import { ProgressiveMathTask } from "./tasks/ProgressiveMathTask";
import { NumberLineTask } from "./tasks/NumberLineTask";
import { MemoryMatchTask } from "./tasks/MemoryMatchTask";
import { LightningRoundTask } from "./tasks/LightningRoundTask";
import { MultiplicationTask } from "./tasks/MultiplicationTask";

export const mathModule: EducationalModule = {
  id: "math",
  title: "Matek",
  description: "Számolás, játékok és fejtörők",
  icon: "🧮",
  accentColor: "from-sky-400/80 to-indigo-500/80",
  tasks: [
    { id: "simple-addition", title: "Egyszerű összeadás", component: SimpleAdditionTask },
    { id: "progressive-math", title: "Nehezedő szintek", component: ProgressiveMathTask },
    { id: "number-line", title: "Számegyenes ugrás", component: NumberLineTask },
    { id: "memory-match", title: "Memória párosító", component: MemoryMatchTask },
    { id: "lightning-round", title: "Villámkör (45 mp)", component: LightningRoundTask },
    { id: "multiplication", title: "Szorzótábla", component: MultiplicationTask },
  ],
};
