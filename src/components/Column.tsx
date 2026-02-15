import { useState } from "react";
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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col rounded-lg bg-column-bg w-full sm:w-72 sm:min-w-[256px] sm:shrink-0">
      {/* Mobile: clickable accordion header / Desktop: static h2-like header */}
      <button
        type="button"
        className="w-full text-left px-3 py-2 text-sm font-semibold text-column-header uppercase tracking-wide flex items-center gap-2 bg-transparent border-0 cursor-pointer sm:cursor-default sm:pointer-events-none"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        {label}
        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium rounded-full bg-count-bg text-count-text">
          {tasks.length}
        </span>
        {/* Chevron — only visible on mobile */}
        <svg
          className={`ml-auto h-4 w-4 text-column-header transition-transform duration-200 sm:hidden ${collapsed ? "" : "rotate-180"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Task list — collapsible on mobile, always visible on desktop */}
      <div
        ref={setNodeRef}
        className={`p-2 min-h-[80px] ${collapsed ? "hidden sm:block" : "block"}`}
      >
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
