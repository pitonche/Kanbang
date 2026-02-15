import type { Doc } from "../../convex/_generated/dataModel";

const priorityBorder = {
  low: "border-l-priority-low",
  medium: "border-l-priority-medium",
  high: "border-l-priority-high",
} as const;

export function TaskCardOverlay({ task }: { task: Doc<"tasks"> }) {
  return (
    <div
      className={`bg-card-bg border border-card-border rounded-md p-3 border-l-4 shadow-lg rotate-[2deg] ${priorityBorder[task.priority]}`}
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
