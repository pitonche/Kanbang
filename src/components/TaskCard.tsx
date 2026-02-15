import type { Doc, Id } from "../../convex/_generated/dataModel";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCardContent } from "./TaskCardContent";

interface TaskCardProps {
  task: Doc<"tasks">;
  onClick: (id: Id<"tasks">) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: "none" as const,
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(task._id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="mb-2 cursor-pointer hover:shadow-sm transition-[box-shadow,opacity] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg rounded-md"
      onClick={() => onClick(task._id)}
    >
      <TaskCardContent task={task} />
    </div>
  );
}
