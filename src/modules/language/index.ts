import type { EducationalModule } from "../../types/module";
import { LetterRecognitionTask } from "./tasks/LetterRecognitionTask";
import { WordBuilderTask } from "./tasks/WordBuilderTask";
import { ReadingCardsTask } from "./tasks/ReadingCardsTask";
import { RhymeFinderTask } from "./tasks/RhymeFinderTask";

export const languageModule: EducationalModule = {
  id: "language",
  title: "Nyelv",
  description: "Betűk, szavak és olvasás",
  icon: "📚",
  accentColor: "from-amber-400/80 to-rose-500/80",
  tasks: [
    { id: "letter-recognition", title: "Betűfelismerés", component: LetterRecognitionTask },
    { id: "word-builder", title: "Szóépítő", component: WordBuilderTask },
    { id: "reading-cards", title: "Olvasó-kártyák", component: ReadingCardsTask },
    { id: "rhyme-finder", title: "Rímkereső", component: RhymeFinderTask },
  ],
};
