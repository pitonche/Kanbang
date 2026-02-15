import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { Column } from "./Column";
import { TaskModal } from "./TaskModal";
import { TaskCardOverlay } from "./TaskCardOverlay";

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
  const [activeTask, setActiveTask] = useState<Doc<"tasks"> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const moveToColumn = useMutation(api.tasks.moveToColumn).withOptimisticUpdate(
    (localStore, args) => {
      const currentTasks = localStore.getQuery(api.tasks.list, {}) as
        | Doc<"tasks">[]
        | undefined;
      if (currentTasks === undefined) return;
      const now = Date.now();
      const updatedTasks = currentTasks.map((task) => {
        if (task._id !== args.id) return task;
        return {
          ...task,
          column: args.column,
          updatedAt: now,
          ...(args.column === "done"
            ? { completedAt: now }
            : { completedAt: undefined }),
        };
      });
      localStore.setQuery(api.tasks.list, {}, updatedTasks);
    },
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

  function handleDragStart(event: DragStartEvent) {
    const draggedTask = typedTasks.find((t) => t._id === event.active.id);
    setActiveTask(draggedTask ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);

    if (!event.over) return;

    const draggedTask = typedTasks.find((t) => t._id === event.active.id);
    if (!draggedTask) return;

    // Determine target column: check if over.id is a column id, otherwise find the task's column
    const columnIds = COLUMNS.map((c) => c.id as string);
    let targetColumn: string;

    if (columnIds.includes(event.over.id as string)) {
      targetColumn = event.over.id as string;
    } else {
      const overTask = typedTasks.find((t) => t._id === event.over!.id);
      if (!overTask) return;
      targetColumn = overTask.column;
    }

    if (draggedTask.column !== targetColumn) {
      moveToColumn({
        id: draggedTask._id,
        column: targetColumn as ColumnId,
      });
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
        </div>
        <DragOverlay>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
      <TaskModal
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
      />
    </>
  );
}
