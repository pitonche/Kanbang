import type { Doc, Id } from "../../convex/_generated/dataModel";

const priorityBorder = {
  low: "border-l-priority-low",
  medium: "border-l-priority-medium",
  high: "border-l-priority-high",
} as const;

interface TaskCardProps {
  task: Doc<"tasks">;
  onClick: (id: Id<"tasks">) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div
      className={`bg-card-bg border border-card-border rounded-md p-3 mb-2 border-l-4 cursor-pointer hover:shadow-sm transition-shadow ${priorityBorder[task.priority]}`}
      onClick={() => onClick(task._id)}
    >
      <p className="text-sm font-medium text-slate-800">{task.title}</p>
      {task.notes && task.notes.length > 0 && (
        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
          {task.notes}
        </p>
      )}
    </div>
  );
}
