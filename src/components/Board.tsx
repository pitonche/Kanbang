import { Column } from "./Column";

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
  return (
    <div className="flex gap-4 p-6 overflow-x-auto min-h-screen bg-board-bg">
      {COLUMNS.map((col) => (
        <Column key={col.id} id={col.id} label={col.label} />
      ))}
    </div>
  );
}
