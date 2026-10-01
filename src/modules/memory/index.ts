import type { EducationalModule } from "../../types/module";
import { CardMemoryTask } from "./tasks/CardMemoryTask";

export const memoryModule: EducationalModule = {
  id: "memory",
  title: "Memória",
  description: "Kártyák, párosítás, koncentráció",
  icon: "🧠",
  accentColor: "from-cyan-500/80 to-blue-600/80",
  tasks: [{ id: "card-memory", title: "Kártyamemória", component: CardMemoryTask }],
};
