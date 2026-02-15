import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  id: string;
  label: string;
  tasks: Doc<"tasks">[];
  onTaskClick: (id: Id<"tasks">) => void;
}

export function Column({ id, label, tasks, onTaskClick }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });
  const taskIds = tasks.map((t) => t._id);

  return (
    <div className="flex flex-col w-72 shrink-0 rounded-lg bg-column-bg">
      <h2 className="px-3 py-2 text-sm font-semibold text-column-header uppercase tracking-wide">
        {label}
        <span className="ml-2 text-xs font-normal text-slate-400">{tasks.length}</span>
      </h2>
      <div ref={setNodeRef} className="flex-1 p-2 min-h-[200px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className="text-sm text-empty-state text-center mt-8">
              No tasks yet
            </p>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task._id} task={task} onClick={onTaskClick} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
