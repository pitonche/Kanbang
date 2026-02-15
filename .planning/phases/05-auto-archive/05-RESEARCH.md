# Phase 5: Auto-Archive - Research

**Researched:** 2026-02-15
**Domain:** Convex mutations for batch archival, compound indexes for date-range queries, client-side view switching (board vs. archive), Convex search index filterFields for excluding archived tasks
**Confidence:** HIGH

## Summary

Phase 5 adds automatic archiving of Done tasks and a dedicated Archive view. The archiving mechanism runs on app load: a Convex mutation queries for Done tasks whose `completedAt` is older than 14 days, then patches each one with `column: "archived"` and `archivedAt: now`. The "archived" value must be added to the `column` union in the schema. The client triggers this mutation once via `useEffect` on mount. Archived tasks are then excluded from the main board's `tasks.list` query (by filtering out `column === "archived"`) and displayed in a separate Archive view accessible from the toolbar.

The schema already has `archivedAt: v.optional(v.number())` from Phase 1, so the only schema change is adding `"archived"` to the `column` union. A new compound index `by_column_completedAt` on `["column", "completedAt"]` enables the archive mutation to efficiently find Done tasks older than 14 days. The existing `by_column` index continues to serve the board query. The search index needs no changes -- archived tasks remain searchable (SRCH-02 compliance from Phase 4), though adding `column` to `filterFields` would allow future server-side filtering if needed (it is already listed there).

The Archive view is a simple state-based view switch in the App component (no router needed). A new `tasks.listArchived` query returns archived tasks. The Archive view shows them in a searchable, browsable list with the same search infrastructure (SearchBar + debounce) already built in Phase 4.

**Primary recommendation:** Add `"archived"` to the column union in the schema, create a compound index `by_column_completedAt`, write an `archiveOldDone` mutation that loops and patches matching tasks, trigger it once on app load via `useEffect`, modify `tasks.list` to exclude archived tasks, create a `tasks.listArchived` query, and add a view-switching mechanism in App.tsx with a toolbar link to the Archive view.

## Standard Stack

### Core (already installed -- no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `convex` | ^1.31.7 | Mutation for batch archive, new query for archived tasks, compound index | All archive logic is server-side Convex functions; no new libraries needed |
| `react` | ^19.2.4 | `useState` for view switching, `useEffect` for triggering archive on mount, `useRef` for StrictMode guard | Standard React patterns; no router library needed for two views |
| `tailwindcss` | ^4.1.18 | Archive view layout, toolbar navigation styling | Already installed; utility classes for list layouts and active nav states |

### Supporting (no new dependencies needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useDebounce` hook | Custom (already exists) | Debounce search within Archive view | Reuse from `src/hooks/useDebounce.ts` built in Phase 4 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side `useEffect` trigger on mount | Convex cron job (daily) | Cron runs even when nobody uses the app; `useEffect` runs exactly when user loads the app -- matches the "on app load" requirement literally. Cron is more appropriate for multi-user apps where you want consistent cleanup regardless of user activity |
| `useState` view switch | `react-router` | Only two views (Board and Archive); a router adds complexity, bundle size, and URL management for a personal tool with no deep-linking need |
| Adding `"archived"` to column union | Separate `status` field or `isArchived` boolean | Using the column union keeps the single-field model; no new field needed. The column already represents where a task "lives" -- archived is a valid location. The `archivedAt` timestamp is already in the schema for when it was archived |
| New compound index `by_column_completedAt` | Full table scan with `.filter()` | For a personal Kanban with likely < 1000 tasks, filter works fine. But the index is trivial to add and makes the archive query efficient by definition -- no scan limit concerns |

**Installation:**
```bash
# No new packages needed. All functionality uses existing Convex + React APIs.
```

## Architecture Patterns

### Recommended Project Structure

```
convex/
  schema.ts              # MODIFY: add "archived" to column union, add by_column_completedAt index
  tasks.ts               # MODIFY: add archiveOldDone mutation, add listArchived query, modify list to exclude archived
src/
  components/
    Board.tsx            # MODIFY: minor -- archive trigger removed from here (moved to App)
    ArchiveView.tsx      # NEW: archived tasks list with search/browse
    SearchBar.tsx        # NO CHANGES (reused in Archive view)
    CadenceFilter.tsx    # NO CHANGES
    Column.tsx           # NO CHANGES
    TaskCard.tsx         # NO CHANGES
    TaskModal.tsx        # NO CHANGES
    QuickAdd.tsx         # NO CHANGES
    TaskCardOverlay.tsx  # NO CHANGES
  hooks/
    useDebounce.ts       # NO CHANGES (reused in Archive view)
  App.tsx                # MODIFY: add view switching state, archive trigger on mount, nav UI
  index.css              # POSSIBLY MODIFY: add nav/archive theme tokens if needed
  main.tsx               # NO CHANGES
```

### Pattern 1: Schema Update -- Adding "archived" to Column Union

**What:** Extend the `column` field's `v.union()` to include `v.literal("archived")`. Add a compound index for efficient archive queries.
**When to use:** At the start of Phase 5 implementation.
**Example:**

```typescript
// Source: existing convex/schema.ts + Convex docs
column: v.union(
  v.literal("inbox"),
  v.literal("backlog"),
  v.literal("in_progress"),
  v.literal("needs_info"),
  v.literal("blocked"),
  v.literal("done"),
  v.literal("archived"),  // NEW
),

// New compound index for archive queries
.index("by_column_completedAt", ["column", "completedAt"])
```

**Key points:**
- Adding a new literal to an existing union is a non-breaking schema change in Convex
- The compound index `["column", "completedAt"]` allows: `.eq("column", "done")` then `.lt("completedAt", cutoff)` -- efficient index-based range query
- Convex will backfill the new index automatically on deploy (fast for small tables)
- The existing `by_column` index still works for the board query

### Pattern 2: Archive Mutation -- Batch Patch in a Transaction

**What:** A mutation that finds Done tasks with `completedAt` older than 14 days and patches each one to `column: "archived"` with an `archivedAt` timestamp.
**When to use:** Triggered once when the app loads.
**Example:**

```typescript
// Source: Convex docs on mutations, withIndex, and transaction semantics
// convex/tasks.ts
export const archiveOldDone = mutation({
  args: {},
  handler: async (ctx) => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const oldDoneTasks = await ctx.db
      .query("tasks")
      .withIndex("by_column_completedAt", (q) =>
        q.eq("column", "done").lt("completedAt", fourteenDaysAgo)
      )
      .collect();

    for (const task of oldDoneTasks) {
      await ctx.db.patch(task._id, {
        column: "archived",
        archivedAt: now,
        updatedAt: now,
      });
    }
  },
});
```

**Key points:**
- The entire mutation is a single Convex transaction -- all patches succeed or none do
- Transaction limits: 16,000 documents written, 32,000 scanned, 1 second execution time
- For a personal Kanban board, these limits will never be hit (unlikely to have >100 done tasks at once)
- The `archivedAt` timestamp records WHEN the task was archived (distinct from `completedAt` which records when it was Done)
- No arguments needed -- the mutation is self-contained with its own date math

### Pattern 3: Trigger Archive on App Load via useEffect

**What:** Call the `archiveOldDone` mutation once when the App component mounts. Use a `useRef` guard to prevent double-execution in React StrictMode.
**When to use:** In the top-level `App.tsx` component.
**Example:**

```typescript
// Source: React docs on StrictMode + Convex useMutation pattern
const archiveOldDone = useMutation(api.tasks.archiveOldDone);
const archiveTriggered = useRef(false);

useEffect(() => {
  if (!archiveTriggered.current) {
    archiveTriggered.current = true;
    archiveOldDone();
  }
}, [archiveOldDone]);
```

**Key points:**
- React StrictMode in development mounts components twice -- the `useRef` guard prevents the mutation from running twice
- The mutation is idempotent anyway (re-running it won't archive already-archived tasks since they are no longer `column: "done"`)
- Fire-and-forget: no need to await or handle the result -- the Board will reactively update via its `useQuery` subscription
- The mutation fires on every app load, but if no tasks qualify, it does nothing (no-op read transaction)

### Pattern 4: Exclude Archived Tasks from Board Query

**What:** Modify the existing `tasks.list` query to exclude tasks where `column === "archived"`.
**When to use:** Immediately, so the board never shows archived tasks.
**Example:**

```typescript
// Option A: Use by_column index with filter (efficient for small tables)
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .filter((q) => q.neq(q.field("column"), "archived"))
      .collect();
  },
});

// Option B: Query each active column separately and merge (uses index but more complex)
// Not recommended -- 6 separate index queries is more complex than one filtered scan
```

**Key points:**
- Option A is simplest: one query with a filter. For a personal Kanban with < 1000 tasks, the scan is negligible
- The `.filter()` applies after scanning the table. Since there is no "not equal" index range expression in Convex, a full scan with filter is the practical approach
- This is a behavior change to the existing `list` function -- archived tasks disappear from the board
- The `by_column` index could be used if we queried each column separately, but that is over-engineering for a personal tool

### Pattern 5: View Switching Without a Router

**What:** Use `useState` in App.tsx to toggle between "board" and "archive" views. Render the Board or ArchiveView component conditionally.
**When to use:** For navigating between the board and the archive.
**Example:**

```typescript
// App.tsx
type AppView = "board" | "archive";
const [view, setView] = useState<AppView>("board");

// In JSX:
{view === "board" ? (
  <Board onSearchInputRef={...} />
) : (
  <ArchiveView />
)}
```

**Key points:**
- No router library needed -- this is a personal tool with exactly two views
- A nav element in the toolbar (or a button) lets the user switch views
- The QuickAdd shortcut ("N") should only work on the board view (not archive)
- The "/" shortcut for search focus works on both views if both have a SearchBar

### Pattern 6: Archive View with Search and Browse

**What:** A dedicated component that queries archived tasks and displays them in a searchable list. Reuses the existing `SearchBar` and `useDebounce` from Phase 4.
**When to use:** When the user navigates to the Archive view.
**Example:**

```typescript
// ArchiveView.tsx
export function ArchiveView() {
  const archivedTasks = useQuery(api.tasks.listArchived);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedTerm = useDebounce(searchTerm, 300);

  // Client-side filtering of archived tasks by search term
  const filtered = debouncedTerm.trim()
    ? archivedTasks?.filter((t) =>
        t.searchText.toLowerCase().includes(debouncedTerm.trim().toLowerCase())
      )
    : archivedTasks;

  return (
    <div>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      {/* Render filtered archived tasks as a list */}
    </div>
  );
}
```

**Key points:**
- `tasks.listArchived` is a simple Convex query: `ctx.db.query("tasks").withIndex("by_column", q => q.eq("column", "archived")).collect()`
- Search within the archive can be either client-side (filter on `searchText` field) or server-side (reuse the `tasks.search` query). Client-side is simpler for a personal tool with limited archived tasks
- Alternatively, reuse the existing `tasks.search` Convex query which already searches ALL tasks (including archived) -- the search results already include column labels
- Browse means: show tasks in a scrollable list, possibly sorted by `archivedAt` descending (most recently archived first)

### Anti-Patterns to Avoid

- **Adding a separate `isArchived` boolean field:** The schema already has `archivedAt` (timestamp) and `column` (position). Adding another field creates redundancy. Use `column: "archived"` as the single source of truth for "is this task archived?" and `archivedAt` for "when was it archived?"
- **Using a Convex cron for archiving instead of on-load trigger:** The success criteria explicitly says "when the app loads." A cron would run even when no one is using the app, and tasks could appear archived before the user sees them age out. The on-load pattern is correct per requirements.
- **Querying all tasks then filtering client-side for the board:** Currently `tasks.list` returns everything. After adding archiving, it should exclude archived tasks server-side to avoid sending unnecessary data to the client.
- **Building a complex routing system:** Two views with `useState` is appropriate. react-router adds bundle size, URL management complexity, and deep-linking concerns that are irrelevant for a personal Kanban.
- **Forgetting to update the optimistic update in Board.tsx:** The `moveToColumn` optimistic update calls `localStore.getQuery(api.tasks.list, {})`. If `tasks.list` behavior changes (filtering out archived), the optimistic update logic should still work, but verify it handles the `column` type including "archived".
- **Not guarding the useEffect with useRef:** In React 19 StrictMode, effects run twice. Without a guard, the archive mutation fires twice on mount. While idempotent, it wastes a server round-trip.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Efficient date-range queries | Full table scan with JS Date comparison | Convex compound index `["column", "completedAt"]` with `.lt()` | Index makes the query O(matching docs) not O(total docs); Convex handles the range efficiently |
| Batch transaction safety | Manual rollback logic or partial updates | Convex mutation (automatic transaction) | Entire mutation is atomic; all patches succeed or none do |
| Real-time board update after archiving | Manual refetch or polling | Convex reactive `useQuery` subscription | Board auto-updates when archive mutation changes task columns |
| Full-text search in archive | Custom client-side search | Reuse existing `tasks.search` Convex query (already indexes all tasks) | BM25 ranking, prefix matching, handles all edge cases |

**Key insight:** The archive feature is predominantly a data operation (find old Done tasks, patch them). Convex's transactional mutations, compound indexes, and reactive queries handle the hard parts. The React side only needs a mount trigger, a view switch, and a new list component.

## Common Pitfalls

### Pitfall 1: Compound Index Field Order Matters

**What goes wrong:** Defining the index as `["completedAt", "column"]` instead of `["column", "completedAt"]`, then trying to do `.eq("column", "done").lt("completedAt", cutoff)`.
**Why it happens:** Convex requires index fields to be queried in order. If `completedAt` is first, you must use an equality or range on `completedAt` before accessing `column`.
**How to avoid:** Define the index as `["column", "completedAt"]` so you can `.eq("column", "done")` first, then `.lt("completedAt", fourteenDaysAgo)`.
**Warning signs:** TypeScript compilation error in the `withIndex` callback, or Convex runtime error about index field order.

### Pitfall 2: React StrictMode Double-Fires the Archive Mutation

**What goes wrong:** The archive mutation runs twice on app load in development because StrictMode mounts components twice.
**Why it happens:** React StrictMode intentionally double-invokes effects to surface side-effect bugs.
**How to avoid:** Guard the `useEffect` with a `useRef(false)` that flips to `true` on first execution. The mutation is idempotent (second run finds no matching tasks), but the guard avoids a wasted server call.
**Warning signs:** Seeing two `archiveOldDone` mutations in the Convex dashboard logs on a single page load during development.

### Pitfall 3: `tasks.list` Must Exclude Archived Tasks

**What goes wrong:** After archiving, archived tasks still appear on the board because `tasks.list` does `ctx.db.query("tasks").collect()` without filtering.
**Why it happens:** The existing `list` query was written before archiving existed and returns all tasks.
**How to avoid:** Add `.filter((q) => q.neq(q.field("column"), "archived"))` to the `list` query. This is a behavior change -- verify all consumers (Board, optimistic updates) still work correctly.
**Warning signs:** Archived tasks appearing in the Done column or other board columns after the archive mutation runs.

### Pitfall 4: Optimistic Update Type Mismatch After Adding "archived" Column

**What goes wrong:** TypeScript errors in the `moveToColumn` optimistic update because `ColumnId` type now includes `"archived"` but the `COLUMNS` array in Board.tsx only has 6 entries.
**Why it happens:** The `ColumnId` type is derived from the `COLUMNS` constant. Adding `"archived"` to the schema but not to `COLUMNS` creates a type inconsistency.
**How to avoid:** Keep `"archived"` out of the `COLUMNS` array (it is not a board column). The `ColumnId` type in Board.tsx only covers visible columns. The Convex schema's column union is broader -- it includes all valid column values. These are two different concerns. The `moveToColumn` mutation's `column` argument should NOT include `"archived"` (users don't drag to archive). Keep the mutation's argument validators as-is (6 board columns only).
**Warning signs:** TypeScript error saying `"archived"` is not assignable, or the archive column appearing on the board.

### Pitfall 5: `completedAt` is Optional -- Tasks Done Before Phase 3 May Lack It

**What goes wrong:** Tasks moved to Done before Phase 3 (which added `completedAt` logic) may have `completedAt: undefined`. The archive query filters on `completedAt < fourteenDaysAgo`, which would skip these tasks.
**Why it happens:** `completedAt` was added to the schema in Phase 1 but only set in Phase 3's `moveToColumn` mutation.
**How to avoid:** This is likely a non-issue since all phases were implemented on the same day (2026-02-15) and the app is personal. But if orphaned Done tasks exist without `completedAt`, they simply won't auto-archive -- which is actually safe behavior (we don't want to archive tasks with unknown completion dates). Document this as expected behavior.
**Warning signs:** Tasks stuck in Done that never get archived despite being old.

### Pitfall 6: Search Results Display Archived Tasks Without Context

**What goes wrong:** The existing `tasks.search` query returns ALL tasks including archived ones. Search results in the board view may show archived tasks, confusing the user who can't find them on the board.
**Why it happens:** Phase 4 decision: "No column filter on search query -- returns all tasks including Done for SRCH-02 compliance."
**How to avoid:** Search results already display a column label (e.g., "Done", "In Progress"). When a task is archived, its column is `"archived"`, so the label will show "Archived" -- this is correct and informative. The user sees it's archived and can navigate to the Archive view to find it.
**Warning signs:** None -- this is correct behavior. But ensure the `COLUMNS.find()` in the search results renderer handles the "archived" column label.

## Code Examples

Verified patterns from official sources:

### Schema Update

```typescript
// Source: Convex docs on schema, indexes
// convex/schema.ts -- add "archived" to union, add compound index
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    notes: v.optional(v.string()),
    column: v.union(
      v.literal("inbox"),
      v.literal("backlog"),
      v.literal("in_progress"),
      v.literal("needs_info"),
      v.literal("blocked"),
      v.literal("done"),
      v.literal("archived"),  // NEW
    ),
    cadence: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("none"),
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
    searchText: v.string(),
  })
    .index("by_column", ["column"])
    .index("by_column_completedAt", ["column", "completedAt"])  // NEW
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["column"],
    }),
});
```

### Archive Mutation

```typescript
// Source: Convex docs on mutations, withIndex, transaction semantics
// convex/tasks.ts -- add alongside existing exports
export const archiveOldDone = mutation({
  args: {},
  handler: async (ctx) => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const oldDoneTasks = await ctx.db
      .query("tasks")
      .withIndex("by_column_completedAt", (q) =>
        q.eq("column", "done").lt("completedAt", fourteenDaysAgo)
      )
      .collect();

    for (const task of oldDoneTasks) {
      await ctx.db.patch(task._id, {
        column: "archived",
        archivedAt: now,
        updatedAt: now,
      });
    }
  },
});
```

### Modified List Query (Exclude Archived)

```typescript
// Source: Convex docs on filters
// convex/tasks.ts -- modify existing list query
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .filter((q) => q.neq(q.field("column"), "archived"))
      .collect();
  },
});
```

### List Archived Query

```typescript
// Source: Convex docs on withIndex
// convex/tasks.ts -- add new query
export const listArchived = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_column", (q) => q.eq("column", "archived"))
      .collect();
  },
});
```

### App-Level Archive Trigger and View Switch

```typescript
// Source: React docs on useEffect, useRef for StrictMode guard
// src/App.tsx
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

  // Archive trigger on mount
  const archiveOldDone = useMutation(api.tasks.archiveOldDone);
  const archiveTriggered = useRef(false);

  useEffect(() => {
    if (!archiveTriggered.current) {
      archiveTriggered.current = true;
      archiveOldDone();
    }
  }, [archiveOldDone]);

  // Keyboard shortcuts (existing + modified)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ... existing guards for input/textarea/dialog/modifiers ...
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
      {/* Nav header with view toggle */}
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
```

### Archive View Component

```typescript
// Source: React patterns, reusing existing SearchBar + useDebounce
// src/components/ArchiveView.tsx
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { SearchBar } from "./SearchBar";
import { TaskModal } from "./TaskModal";
import { useDebounce } from "../hooks/useDebounce";

export function ArchiveView({ onSearchInputRef }: { onSearchInputRef?: (el: HTMLInputElement | null) => void }) {
  const archivedTasks = useQuery(api.tasks.listArchived);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedTerm = useDebounce(searchTerm, 300);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);

  if (archivedTasks === undefined) {
    return <p>Loading...</p>;
  }

  // Client-side search filter within archived tasks
  const filtered = debouncedTerm.trim()
    ? archivedTasks.filter((t) =>
        t.searchText.toLowerCase().includes(debouncedTerm.trim().toLowerCase())
      )
    : archivedTasks;

  const selectedTask = archivedTasks.find((t) => t._id === selectedTaskId) ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-board-bg">
      <div className="flex items-center gap-4 px-6 pt-4 pb-2">
        <SearchBar value={searchTerm} onChange={setSearchTerm} inputRef={onSearchInputRef} />
      </div>
      <div className="px-6 py-4">
        <p className="text-xs text-slate-500 mb-3">
          {filtered.length} archived task{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="space-y-2 max-w-2xl">
          {filtered.map((task) => (
            <button
              key={task._id}
              onClick={() => setSelectedTaskId(task._id)}
              className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <span className="text-sm font-medium text-slate-800">{task.title}</span>
              {task.notes && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.notes}</p>
              )}
            </button>
          ))}
        </div>
      </div>
      <TaskModal task={selectedTask} onClose={() => setSelectedTaskId(null)} />
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cron-based background archival | On-load mutation trigger via `useEffect` | Always valid for single-user apps | Archive happens exactly when user loads the app; no wasted background runs |
| Separate `isArchived` boolean + status field | Single `column` union including `"archived"` | Convex union types make this natural | One field controls both board position and archive status |
| Client-side routing library for multi-view | `useState` view switching | Always valid for 2-view apps | No bundle size or complexity overhead from a router |
| Full table scan for date queries | Compound index `["column", "completedAt"]` | Convex compound indexes available since early versions | Efficient range query, though the table is small enough that scan would also work |

**Deprecated/outdated:**
- None specific to this phase. The patterns used (mutations, indexes, useEffect) are stable and current.

## Open Questions

1. **Should the archive mutation be `internalMutation` instead of `mutation`?**
   - What we know: The archive mutation is called from the client via `useMutation`. An `internalMutation` cannot be called from the client -- it can only be called from other server functions (or crons).
   - What's unclear: Whether it matters that this mutation is publicly callable. In a personal Kanban with no auth, all mutations are public anyway.
   - Recommendation: Use regular `mutation` since it is called from the client. If auth is added later, it can be guarded with an auth check. No need for `internalMutation`.

2. **Should archived tasks be sorted by `archivedAt` or `completedAt`?**
   - What we know: Both timestamps will exist on archived tasks. `completedAt` is when the task was finished; `archivedAt` is when it was auto-archived.
   - What's unclear: Which sort order is more useful for browsing history.
   - Recommendation: Sort by `archivedAt` descending (most recently archived first). This groups tasks by "batch" of archival, which corresponds to natural time windows. If the user wants to see when tasks were done, that info can be displayed on each card.

3. **Should the nav between Board and Archive be in App.tsx or Board.tsx?**
   - What we know: Currently App.tsx renders Board directly. The nav needs to be visible on both views.
   - What's unclear: Whether the nav/toolbar should be extracted into a shared layout component.
   - Recommendation: Place the nav toggle in App.tsx above the conditional view rendering. This avoids duplicating the nav in both Board and ArchiveView. A simple header/nav bar with "Board" and "Archive" links is sufficient.

4. **How should search results on the board handle the "Archived" column label?**
   - What we know: Board.tsx search results use `COLUMNS.find((c) => c.id === task.column)?.label` to display column labels. The `COLUMNS` array does not include "archived".
   - What's unclear: Whether to add "Archived" to `COLUMNS` or handle it separately.
   - Recommendation: Do NOT add "archived" to the board `COLUMNS` array (it is not a visible board column). Instead, handle the fallback in the search results renderer: if `COLUMNS.find()` returns undefined, the existing code already falls back to `task.column` (the raw string), which would display "archived". This is acceptable. Alternatively, add a manual label mapping for "archived" -> "Archived" in the search results display.

## Sources

### Primary (HIGH confidence)
- [Convex Indexes](https://docs.convex.dev/database/reading-data/indexes/) -- Compound index definition, `.withIndex()` with `.eq()` and `.lt()` range expressions, field ordering requirements
- [Convex Writing Data](https://docs.convex.dev/database/writing-data) -- Mutation transaction semantics (entire mutation is single transaction), `ctx.db.patch()` for updates
- [Convex Filters](https://docs.convex.dev/database/reading-data/filters) -- `.filter()` syntax, `q.neq()` for excluding values, optional field handling (`undefined`)
- [Convex Production Limits](https://docs.convex.dev/production/state/limits) -- Transaction limits: 16,000 documents written, 32,000 scanned, 1 second execution, 16 MiB data
- [Convex Full Text Search](https://docs.convex.dev/search/text-search) -- `filterFields` in search index, `.eq()` within `withSearchIndex`, filtering for `undefined`
- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs) -- `convex/crons.ts` syntax for scheduled functions (considered but not chosen)
- [Convex Internal Functions](https://docs.convex.dev/functions/internal-functions) -- `internalMutation` syntax and constraints (considered but not chosen)
- Existing codebase: `convex/schema.ts` (schema with `archivedAt` already defined), `convex/tasks.ts` (existing list/search/moveToColumn functions), `src/components/Board.tsx` (current architecture), `src/App.tsx` (current keyboard shortcuts and component structure)

### Secondary (MEDIUM confidence)
- React StrictMode double-invocation behavior -- widely documented; `useRef` guard pattern is standard community practice for preventing double mutation calls
- `useState` view switching pattern -- standard React pattern for simple two-view apps without routing

### Tertiary (LOW confidence)
- None. All findings verified against official Convex documentation and the existing codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies needed; all functionality uses existing Convex index/mutation/query APIs and React hooks verified against official docs
- Architecture: HIGH -- Compound index pattern verified against Convex index docs; mutation transaction semantics verified; schema extension (adding union literal) is a documented non-breaking change; view switching with `useState` is trivial React
- Pitfalls: HIGH -- Index field ordering requirement verified in Convex docs; React StrictMode double-fire is well-documented; `tasks.list` behavior change and its ripple effects identified through codebase analysis
- Code examples: HIGH -- All Convex patterns follow documented APIs; React patterns are standard

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable stack, no fast-moving dependencies)
