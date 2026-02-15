import type { Doc } from "../../convex/_generated/dataModel";
import { TaskCardContent } from "./TaskCardContent";

export function TaskCardOverlay({ task }: { task: Doc<"tasks"> }) {
  return <TaskCardContent task={task} className="shadow-lg rotate-[2deg]" />;
}
