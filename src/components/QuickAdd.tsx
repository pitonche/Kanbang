import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface QuickAddProps {
  open: boolean;
  onClose: () => void;
}

export function QuickAdd({ open, onClose }: QuickAddProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");

  const createTask = useMutation(api.tasks.create);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClose = () => {
    setTitle("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    await createTask({
      title: trimmedTitle,
      cadence: "none",
      priority: "medium",
    });
    setTitle("");
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="rounded-lg p-4 backdrop:bg-black/50 max-w-md w-full"
    >
      <form onSubmit={handleSubmit}>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Quick Add Task
        </h3>
        <input
          type="text"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="mt-3 w-full bg-slate-700 text-white rounded px-3 py-2 text-sm hover:bg-slate-800"
        >
          Add Task
        </button>
      </form>
    </dialog>
  );
}
