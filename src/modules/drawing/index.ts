import type { EducationalModule } from "../../types/module";
import { TraceDrawingTask } from "./tasks/TraceDrawingTask";
import { ColorFillTask } from "./tasks/ColorFillTask";

export const drawingModule: EducationalModule = {
  id: "drawing",
  title: "Rajzolás",
  description: "Színes vonalrajz, részenkénti kitöltés, életre kelő animáció",
  icon: "✏️",
  accentColor: "from-rose-500/80 to-orange-500/80",
  tasks: [
    {
      id: "trace-drawing",
      title: "Vonalrajz stúdió",
      component: TraceDrawingTask,
    },
    {
      id: "color-fill",
      title: "Színező stúdió",
      component: ColorFillTask,
    },
  ],
};
