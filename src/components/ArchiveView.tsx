import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { SearchBar } from "./SearchBar";
import { TaskModal } from "./TaskModal";
import { useDebounce } from "../hooks/useDebounce";

interface ArchiveViewProps {
  onSearchInputRef?: (el: HTMLInputElement | null) => void;
}

export function ArchiveView({ onSearchInputRef }: ArchiveViewProps) {
  const archivedTasks = useQuery(api.tasks.listArchived);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedTerm = useDebounce(searchTerm, 300);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);

  if (archivedTasks === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-board-bg">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  const typedTasks = archivedTasks as Doc<"tasks">[];

  const isSearchActive = debouncedTerm.trim().length > 0;

  const filtered = isSearchActive
    ? typedTasks.filter((task) =>
        task.searchText
          .toLowerCase()
          .includes(debouncedTerm.trim().toLowerCase())
      )
    : typedTasks;

  const selectedTask =
    typedTasks.find((t) => t._id === selectedTaskId) ?? null;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-board-bg">
        {/* Toolbar */}
        <div className="flex items-center gap-4 px-6 pt-4 pb-2">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            inputRef={onSearchInputRef}
          />
        </div>

        {/* Archive list */}
        <div className="px-6 py-4">
          <p className="text-xs text-slate-500 mb-3">
            {filtered.length} archived task{filtered.length !== 1 ? "s" : ""}
          </p>

          {filtered.length === 0 ? (
            isSearchActive ? (
              <p className="text-sm text-slate-500">
                No archived tasks match &ldquo;{debouncedTerm.trim()}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-slate-500">No archived tasks yet</p>
            )
          ) : (
            <div className="space-y-2 max-w-2xl">
              {filtered.map((task) => (
                <button
                  key={task._id}
                  onClick={() => setSelectedTaskId(task._id)}
                  className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">
                      {task.title}
                    </span>
                    {task.archivedAt && (
                      <span className="text-xs text-slate-400 ml-2">
                        {new Date(task.archivedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {task.notes && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {task.notes}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <TaskModal task={selectedTask} onClose={() => setSelectedTaskId(null)} />
    </>
  );
}
