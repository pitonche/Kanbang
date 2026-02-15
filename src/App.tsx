import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Board } from "./components/Board";
import { ArchiveView } from "./components/ArchiveView";
import { QuickAdd } from "./components/QuickAdd";

type AppView = "board" | "archive";

export default function App() {
  const [view, setView] = useState<AppView>("board");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Archive Done tasks older than 14 days on mount (StrictMode guard)
  const archiveOldDone = useMutation(api.tasks.archiveOldDone);
  const archiveTriggered = useRef(false);

  useEffect(() => {
    if (!archiveTriggered.current) {
      archiveTriggered.current = true;
      archiveOldDone();
    }
  }, [archiveOldDone]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Don't trigger shortcut when typing in input fields
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't trigger shortcut when inside a dialog
      if (target.closest("dialog")) {
        return;
      }

      // Don't trigger with modifier keys
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      if ((e.key === "n" || e.key === "N") && view === "board") {
        e.preventDefault();
        setQuickAddOpen(true);
      }

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [view]);

  return (
    <>
      <nav className="flex items-center gap-6 px-6 py-3 bg-white border-b border-slate-200">
        <span className="text-lg font-bold text-slate-800">Kanbang</span>
        <button
          onClick={() => setView("board")}
          className={
            view === "board"
              ? "text-sm font-medium text-slate-800 border-b-2 border-slate-800 pb-0.5"
              : "text-sm text-slate-500 hover:text-slate-700 pb-0.5"
          }
        >
          Board
        </button>
        <button
          onClick={() => setView("archive")}
          className={
            view === "archive"
              ? "text-sm font-medium text-slate-800 border-b-2 border-slate-800 pb-0.5"
              : "text-sm text-slate-500 hover:text-slate-700 pb-0.5"
          }
        >
          Archive
        </button>
      </nav>

      {view === "board" ? (
        <Board onSearchInputRef={(el) => { searchInputRef.current = el; }} />
      ) : (
        <ArchiveView onSearchInputRef={(el) => { searchInputRef.current = el; }} />
      )}

      {view === "board" && (
        <QuickAdd open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      )}
    </>
  );
}
