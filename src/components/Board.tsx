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
import { SearchBar } from "./SearchBar";
import { useDebounce } from "../hooks/useDebounce";

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

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedTerm = useDebounce(searchTerm, 300);

  const searchResults = useQuery(
    api.tasks.search,
    debouncedTerm.trim() ? { term: debouncedTerm.trim() } : "skip"
  );

  const isSearchActive = debouncedTerm.trim().length > 0;

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
        <div className="flex flex-col min-h-screen bg-board-bg">
          {/* Toolbar */}
          <div className="flex items-center gap-4 px-6 pt-4 pb-2">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>

          {/* Content area: search results OR board columns */}
          {isSearchActive ? (
            <div className="px-6 py-4">
              {searchResults === undefined ? (
                <p className="text-sm text-slate-500">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-slate-500">No tasks found for &ldquo;{debouncedTerm.trim()}&rdquo;</p>
              ) : (
                <div className="space-y-2 max-w-2xl">
                  <p className="text-xs text-slate-500 mb-3">
                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                  </p>
                  {(searchResults as Doc<"tasks">[]).map((task) => {
                    const colLabel = COLUMNS.find((c) => c.id === task.column)?.label ?? task.column;
                    return (
                      <button
                        key={task._id}
                        onClick={() => setSelectedTaskId(task._id)}
                        className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-800">{task.title}</span>
                          <span className="text-xs text-slate-400 ml-2">{colLabel}</span>
                        </div>
                        {task.notes && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.notes}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-4 px-6 pb-6 overflow-x-auto flex-1">
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
          )}
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
