import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

const PRIORITIES: { value: Doc<"tasks">["priority"]; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const CADENCES: { value: Doc<"tasks">["cadence"]; label: string }[] = [
  { value: "none", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const priorityPill = {
  low: "bg-priority-low/15 text-priority-low border-priority-low/40",
  medium: "bg-priority-medium/15 text-priority-medium border-priority-medium/40",
  high: "bg-priority-high/15 text-priority-high border-priority-high/40",
} as const;

interface QuickAddProps {
  open: boolean;
  onClose: () => void;
}

export function QuickAdd({ open, onClose }: QuickAddProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Doc<"tasks">["priority"]>("medium");
  const [cadence, setCadence] = useState<Doc<"tasks">["cadence"]>("none");

  const createTask = useMutation(api.tasks.create);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      triggerRef.current = document.activeElement;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClose = () => {
    setTitle("");
    setPriority("medium");
    setCadence("none");
    onClose();
    if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    await createTask({
      title: trimmedTitle,
      cadence,
      priority,
    });
    setTitle("");
    setPriority("medium");
    setCadence("none");
    onClose();
    if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="rounded-lg p-4 backdrop:bg-black/50 max-w-md w-[calc(100%-2rem)] sm:w-full bg-dialog-bg border border-dialog-border"
    >
      <form onSubmit={handleSubmit}>
        <h3 className="text-sm font-semibold text-dialog-title mb-3">
          Quick Add Task
        </h3>
        <input
          type="text"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="w-full border border-input-border rounded px-3 py-2 text-sm bg-input-bg text-input-text placeholder:text-input-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg"
        />

        {/* Priority pills */}
        <div className="mt-3">
          <span className="text-xs font-medium text-dialog-label">Priority</span>
          <div className="flex gap-2 mt-1">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                aria-pressed={priority === p.value}
                className={`px-3 py-2 sm:py-1 text-xs font-medium rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg ${
                  priority === p.value
                    ? priorityPill[p.value]
                    : "bg-filter-bg text-filter-text border-filter-border"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cadence pills */}
        <div className="mt-3">
          <span className="text-xs font-medium text-dialog-label">Cadence</span>
          <div className="flex gap-2 mt-1">
            {CADENCES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCadence(c.value)}
                aria-pressed={cadence === c.value}
                className={`px-3 py-2 sm:py-1 text-xs font-medium rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg ${
                  cadence === c.value
                    ? "bg-filter-bg-active text-filter-text-active border-filter-border-active"
                    : "bg-filter-bg text-filter-text border-filter-border"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 w-full bg-nav-btn-bg text-nav-btn-text rounded px-3 py-2 text-sm hover:opacity-90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg"
        >
          Add Task
        </button>
      </form>
    </dialog>
  );
}
