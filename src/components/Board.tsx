import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Column } from "./Column";
import { TaskModal } from "./TaskModal";

export const COLUMNS = [
  { id: "inbox", label: "Inbox" },
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In Progress" },
  { id: "needs_info", label: "Needs Info" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
] as const;

export type ColumnId = (typeof COLUMNS)[number]["id"];

export function Board() {
  const tasks = useQuery(api.tasks.list);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(
    null,
  );

  if (tasks === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-board-bg">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  const typedTasks = tasks as Doc<"tasks">[];

  const tasksByColumn = Object.groupBy(typedTasks, (t) => t.column);
  const selectedTask = typedTasks.find((t) => t._id === selectedTaskId) ?? null;

  return (
    <div className="flex gap-4 p-6 overflow-x-auto min-h-screen bg-board-bg">
      {COLUMNS.map((col) => (
        <Column
          key={col.id}
          id={col.id}
          label={col.label}
          tasks={tasksByColumn[col.id] ?? []}
          onTaskClick={setSelectedTaskId}
        />
      ))}
      <TaskModal
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}
