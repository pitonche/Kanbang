import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Board } from "./components/Board";
import { QuickAdd } from "./components/QuickAdd";

export default function App() {
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

      if (e.key === "n" || e.key === "N") {
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
  }, []);

  return (
    <>
      <Board onSearchInputRef={(el) => { searchInputRef.current = el; }} />
      <QuickAdd open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  );
}
