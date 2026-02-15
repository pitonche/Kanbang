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
      <div className="flex items-center justify-center flex-1 bg-board-bg">
        <p className="text-sm text-card-subtitle">Loading...</p>
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
      <div className="flex flex-col flex-1 bg-board-bg">
        {/* Toolbar */}
        <div className="flex items-center gap-4 px-3 sm:px-6 pt-4 pb-2">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            inputRef={onSearchInputRef}
          />
        </div>

        {/* Archive list */}
        <div className="px-3 sm:px-6 py-4">
          <p className="text-xs text-card-subtitle mb-3">
            {filtered.length} archived task{filtered.length !== 1 ? "s" : ""}
          </p>

          {filtered.length === 0 ? (
            isSearchActive ? (
              <p className="text-sm text-card-subtitle">
                No archived tasks match &ldquo;{debouncedTerm.trim()}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-card-subtitle">No archived tasks yet</p>
            )
          ) : (
            <div className="space-y-2 max-w-2xl">
              {filtered.map((task) => (
                <button
                  key={task._id}
                  onClick={() => setSelectedTaskId(task._id)}
                  className="w-full text-left p-3 bg-search-result-bg rounded-lg border border-search-result-border hover:border-input-placeholder transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-card-title">
                      {task.title}
                    </span>
                    {task.archivedAt && (
                      <span className="text-xs text-count-text ml-2">
                        {new Date(task.archivedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {task.notes && (
                    <p className="text-xs text-card-subtitle mt-1 line-clamp-1">
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
