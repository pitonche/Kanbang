import type { Doc } from "../../convex/_generated/dataModel";

const priorityBorder = {
  low: "border-l-priority-low",
  medium: "border-l-priority-medium",
  high: "border-l-priority-high",
} as const;

const priorityBadge = {
  low: "bg-priority-low/15 text-priority-low",
  medium: "bg-priority-medium/15 text-priority-medium",
  high: "bg-priority-high/15 text-priority-high",
} as const;

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface TaskCardContentProps {
  task: Doc<"tasks">;
  className?: string;
}

export function TaskCardContent({ task, className = "" }: TaskCardContentProps) {
  return (
    <div
      className={`bg-card-bg border border-card-border rounded-md p-3 border-l-4 ${priorityBorder[task.priority]} ${className}`}
    >
      <p className="text-sm font-medium text-card-title">{task.title}</p>
      {task.notes && task.notes.length > 0 && (
        <p className="text-xs text-card-subtitle mt-1 line-clamp-2">
          {task.notes}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="flex items-center gap-1 text-xs text-card-subtitle">
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {formatDate(task._creationTime)}
        </span>
        <span
          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${priorityBadge[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );
}
