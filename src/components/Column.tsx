import type { Doc, Id } from "../../convex/_generated/dataModel";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  id: string;
  label: string;
  tasks: Doc<"tasks">[];
  onTaskClick: (id: Id<"tasks">) => void;
}

export function Column({ label, tasks, onTaskClick }: ColumnProps) {
  return (
    <div className="flex flex-col w-72 shrink-0 rounded-lg bg-column-bg">
      <h2 className="px-3 py-2 text-sm font-semibold text-column-header uppercase tracking-wide">
        {label}
      </h2>
      <div className="flex-1 p-2 min-h-[200px]">
        {tasks.length === 0 ? (
          <p className="text-sm text-empty-state text-center mt-8">
            No tasks yet
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={onTaskClick} />
          ))
        )}
      </div>
    </div>
  );
}
