import { useState, useEffect } from "react";
import { Board } from "./components/Board";
import { QuickAdd } from "./components/QuickAdd";

export default function App() {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

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
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Board />
      <QuickAdd open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </>
  );
}
