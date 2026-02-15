import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Board } from "./components/Board";
import { ArchiveView } from "./components/ArchiveView";
import { QuickAdd } from "./components/QuickAdd";
import { useTheme } from "./hooks/useTheme";

type AppView = "board" | "archive";

export default function App() {
  const [view, setView] = useState<AppView>("board");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { theme, toggleTheme } = useTheme();

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
    <div className="flex flex-col h-dvh overflow-hidden">
      <nav className="flex items-center gap-3 sm:gap-6 px-3 sm:px-6 py-3 bg-nav-bg border-b border-nav-border shrink-0">
        <span className="text-lg font-bold text-nav-title">Kanbang</span>
        <button
          onClick={() => setView("board")}
          className={`transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg ${
            view === "board"
              ? "text-sm font-medium text-nav-text-active border-b-2 border-nav-text-active pb-0.5"
              : "text-sm text-nav-text hover:text-nav-text-active pb-0.5"
          }`}
        >
          Board
        </button>
        <button
          onClick={() => setView("archive")}
          className={`transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg ${
            view === "archive"
              ? "text-sm font-medium text-nav-text-active border-b-2 border-nav-text-active pb-0.5"
              : "text-sm text-nav-text hover:text-nav-text-active pb-0.5"
          }`}
        >
          Archive
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-nav-text hover:text-nav-text-active transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
          {view === "board" && (
            <button
              onClick={() => setQuickAddOpen(true)}
              className="text-sm font-medium text-nav-btn-text bg-nav-btn-bg hover:opacity-90 rounded-md px-3 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-btn-bg"
            >
              + New Task
            </button>
          )}
        </div>
      </nav>

      {view === "board" ? (
        <Board onSearchInputRef={(el) => { searchInputRef.current = el; }} />
      ) : (
        <ArchiveView onSearchInputRef={(el) => { searchInputRef.current = el; }} />
      )}

      {view === "board" && (
        <QuickAdd open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
      )}
    </div>
  );
}
