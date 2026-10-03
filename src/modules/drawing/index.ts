import type { EducationalModule } from "../../types/module";
import { TraceDrawingTask } from "./tasks/TraceDrawingTask";
import { ColorFillTask } from "./tasks/ColorFillTask";

export const drawingModule: EducationalModule = {
  id: "drawing",
  title: "Rajzolás",
  description: "Vonalrajz és színezés — részek, vonalak, sok szín, tablet-barát",
  icon: "✏️",
  accentColor: "from-rose-500/80 to-orange-500/80",
  tasks: [
    {
      id: "trace-drawing",
      title: "Vonalrajz műhely",
      component: TraceDrawingTask,
    },
    {
      id: "color-fill",
      title: "Színező műhely",
      component: ColorFillTask,
    },
  ],
};
