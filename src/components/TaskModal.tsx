import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

interface TaskModalProps {
  task: Doc<"tasks"> | null;
  onClose: () => void;
}

export function TaskModal({ task, onClose }: TaskModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [cadence, setCadence] = useState<Doc<"tasks">["cadence"]>("none");
  const [priority, setPriority] = useState<Doc<"tasks">["priority"]>("medium");

  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (task && !dialog.open) {
      dialog.showModal();
    } else if (!task && dialog.open) {
      dialog.close();
    }
  }, [task]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? "");
      setCadence(task.cadence);
      setPriority(task.priority);
    }
  }, [task]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    await updateTask({
      id: task._id,
      title: trimmedTitle,
      notes: notes || undefined,
      cadence,
      priority,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!task) return;
    await removeTask({ id: task._id });
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="rounded-lg p-0 backdrop:bg-black/50 max-w-lg w-full"
    >
      <form onSubmit={handleSave} className="p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Edit Task
        </h2>

        <label className="block mb-3">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium text-slate-700">Cadence</span>
          <select
            value={cadence}
            onChange={(e) =>
              setCadence(e.target.value as Doc<"tasks">["cadence"])
            }
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="none">None</option>
          </select>
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium text-slate-700">Priority</span>
          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as Doc<"tasks">["priority"])
            }
            className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-slate-700 text-white rounded hover:bg-slate-800"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
