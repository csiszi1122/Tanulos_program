import type { EducationalModule } from "../../types/module";
import { EnglishWordsTask } from "./tasks/EnglishWordsTask";

export const englishModule: EducationalModule = {
  id: "english",
  title: "Angol",
  description: "Szavak, jelentések, kiejtés",
  icon: "🇬🇧",
  accentColor: "from-rose-500/80 to-orange-500/80",
  tasks: [{ id: "english-words", title: "Angol szavak", component: EnglishWordsTask }],
};
