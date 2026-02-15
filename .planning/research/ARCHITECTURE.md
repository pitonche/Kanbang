# Architecture Research

**Domain:** Personal Kanban board (React + Convex)
**Researched:** 2026-02-15
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React Frontend (Vite + TS)                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │ KanbanBoard│  │ TaskModal  │  │ SearchBar  │  │ ArchivedView│  │
│  │ (DndContext│  │ (detail    │  │ (full-text │  │ (read-only  │  │
│  │  + Columns)│  │  editing)  │  │  search)   │  │  list)      │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬─────┘  └──────┬──────┘  │
│        │               │                │               │          │
├────────┴───────────────┴────────────────┴───────────────┴──────────┤
│                   Convex React Hooks Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ useQuery     │  │ useMutation  │  │ ConvexProvider (WebSocket)│  │
│  │ (reactive    │  │ (optimistic  │  │ (auto-reconnect,         │  │
│  │  subscriptions│  │  updates)   │  │  consistent snapshots)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                     WebSocket (auto-managed)                        │
├─────────────────────────────────────────────────────────────────────┤
│                   Convex Backend (convex/ folder)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ tasks.ts     │  │ schema.ts    │  │ crons.ts     │             │
│  │ (queries +   │  │ (table defs  │  │ (auto-archive│             │
│  │  mutations)  │  │  + indexes)  │  │  scheduler)  │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                      │
├─────────┴─────────────────┴─────────────────┴──────────────────────┤
│                   Convex Database (document store)                   │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ tasks table  │  │ search index │                                │
│  │ (all fields) │  │ (searchText) │                                │
│  └──────────────┘  └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `App` | Root layout, ConvexProvider wrapper, route switching (board vs. archive) | All children via context |
| `KanbanBoard` | DndContext provider, renders columns, handles drag events | TaskColumn, Convex mutations |
| `TaskColumn` | SortableContext for a single column, renders task cards, droppable zone | TaskCard, KanbanBoard (via dnd-kit) |
| `TaskCard` | Draggable individual task, click-to-open modal | TaskModal (onClick), TaskColumn (drag) |
| `TaskModal` | Form for creating/editing task details | Convex mutations (save/delete) |
| `SearchBar` | Text input, triggers Convex search query | Convex search query, displays filtered results |
| `ArchivedView` | Read-only list of archived tasks, unarchive action | Convex queries + mutations |
| `convex/tasks.ts` | All queries and mutations for task CRUD, move, archive, search | Convex DB |
| `convex/schema.ts` | Table definitions, indexes, search index | Convex DB (schema enforcement) |
| `convex/crons.ts` | Scheduled auto-archive of Done tasks older than 14 days | `convex/tasks.ts` internal mutations |

## Recommended Project Structure

```
src/
├── components/
│   ├── board/
│   │   ├── KanbanBoard.tsx      # DndContext wrapper + column layout
│   │   ├── TaskColumn.tsx       # Single column (SortableContext + droppable)
│   │   └── TaskCard.tsx         # Draggable task card
│   ├── task/
│   │   ├── TaskModal.tsx        # Create/edit task detail modal
│   │   └── TaskForm.tsx         # Form fields inside modal
│   ├── search/
│   │   └── SearchBar.tsx        # Full-text search input + results
│   ├── archive/
│   │   └── ArchivedView.tsx     # Archived tasks list
│   └── ui/
│       ├── Button.tsx           # Shared button component
│       ├── Modal.tsx            # Generic modal shell
│       └── Badge.tsx            # Status/column badge
├── lib/
│   ├── columns.ts              # Column definitions (Inbox, Backlog, etc.)
│   └── utils.ts                # Shared helpers (date formatting, etc.)
├── App.tsx                     # Root: ConvexProvider, layout, routing
├── main.tsx                    # Vite entry point
└── index.css                   # Tailwind imports + custom styles

convex/
├── schema.ts                   # Table + index definitions
├── tasks.ts                    # All task queries and mutations
└── crons.ts                    # Auto-archive cron job
```

### Structure Rationale

- **`components/board/`:** Groups the three tightly-coupled drag-and-drop components. KanbanBoard owns the DndContext; TaskColumn and TaskCard are its direct children. These three form a single drag-and-drop unit and should be co-located.
- **`components/task/`:** Task modal and form are separate from the board because modals overlay the board rather than being part of the column/card hierarchy. The modal can be opened from both board view and search results.
- **`components/search/`:** Isolated because search uses a different Convex query pattern (withSearchIndex) and renders its own result list.
- **`components/archive/`:** Separate view with its own query (status === "archived") and no drag-and-drop.
- **`components/ui/`:** Shared presentational components with no business logic. Keeps the board/task/search components focused on behavior.
- **`lib/`:** Non-React utilities. Column definitions live here because they are static configuration used by both frontend rendering and Convex mutations.
- **`convex/`:** Convex convention. All backend functions in one folder. A single `tasks.ts` file is sufficient for this scope --- splitting into multiple files is premature for a personal tool.

## Architectural Patterns

### Pattern 1: Convex Reactive Queries as Single Source of Truth

**What:** All task state lives in Convex. The React frontend never maintains its own copy of task data. `useQuery` subscriptions automatically update when data changes.
**When to use:** Always. This is the core Convex pattern.
**Trade-offs:** Eliminates state synchronization bugs entirely. Slightly higher latency than local state for initial load, but Convex WebSocket push makes subsequent updates near-instant. For a personal single-user tool, this is a non-issue.

**Example:**
```typescript
// In KanbanBoard.tsx
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function KanbanBoard() {
  const tasks = useQuery(api.tasks.listActive);
  // tasks is undefined while loading, then auto-updates reactively
  if (tasks === undefined) return <Loading />;

  const tasksByColumn = groupByColumn(tasks);
  return (
    <div className="flex gap-4">
      {COLUMNS.map(col => (
        <TaskColumn key={col} column={col} tasks={tasksByColumn[col] ?? []} />
      ))}
    </div>
  );
}
```

### Pattern 2: Optimistic Drag-and-Drop with Mutation

**What:** When a user drags a card to a new column, immediately update the UI (via dnd-kit local state during drag) then commit via Convex mutation. Convex's reactive query will confirm the change and the UI converges.
**When to use:** For the drag-and-drop move operation specifically.
**Trade-offs:** During the drag, dnd-kit manages a local overlay. On drop, the mutation fires and the reactive query updates the board. There is a brief moment where local dnd-kit state and Convex state diverge, but Convex's fast reactive push (typically <100ms) makes this imperceptible. Formal Convex optimistic updates (via `withOptimisticUpdate`) can be added if the latency feels noticeable, but start without them.

**Example:**
```typescript
// In KanbanBoard.tsx
const moveTask = useMutation(api.tasks.move);

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return;

  const taskId = active.id as Id<"tasks">;
  const newColumn = over.id as string;

  // Fire mutation; reactive query handles UI update
  moveTask({ taskId, column: newColumn });
}
```

### Pattern 3: Combined searchText Field for Full-Text Search

**What:** Convex search indexes support one `searchField` per index. To search across title and description, maintain a denormalized `searchText` field that concatenates both. Update it in every mutation that modifies title or description.
**When to use:** When you need to search across multiple fields with a single search index.
**Trade-offs:** Slight write overhead (updating one extra field), but eliminates the need for multiple search indexes or client-side filtering. Convex search is reactive, so the search results update automatically.

**Example:**
```typescript
// In convex/tasks.ts
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const searchText = [args.title, args.description ?? ""].join(" ");
    await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description ?? "",
      column: "inbox",
      searchText,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
```

### Pattern 4: Cron-Based Auto-Archive

**What:** Use Convex cron jobs to periodically archive Done tasks older than 14 days, rather than running archive logic on every app load.
**When to use:** For any background cleanup that should happen regardless of whether the user has the app open.
**Trade-offs:** Cron is more reliable than "on app load" logic (which depends on the user visiting). A daily cron is simple and predictable. The tradeoff is that tasks may remain in Done for up to ~24 hours past the 14-day mark, which is perfectly acceptable for a personal tool.

**Example:**
```typescript
// In convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.daily(
  "archive old done tasks",
  { hourUTC: 3, minuteUTC: 0 },
  internal.tasks.autoArchiveDone,
);
export default crons;
```

## Data Flow

### Core Data Flow: Board Rendering

```
[App Load]
    │
    ▼
[ConvexProvider establishes WebSocket]
    │
    ▼
[KanbanBoard calls useQuery(api.tasks.listActive)]
    │
    ▼
[Convex executes query, returns tasks where column !== "archived"]
    │
    ▼
[KanbanBoard groups tasks by column]
    │
    ▼
[TaskColumn renders for each of 6 fixed columns]
    │
    ▼
[TaskCard renders for each task in column]
```

### Drag-and-Drop Flow

```
[User starts dragging TaskCard]
    │
    ▼
[dnd-kit onDragStart → store activeId in local state]
    │
    ▼
[DragOverlay renders floating card preview]
    │
    ▼
[User drops card on target TaskColumn]
    │
    ▼
[dnd-kit onDragEnd fires]
    │
    ▼
[Handler calls useMutation(api.tasks.move) with { taskId, newColumn }]
    │
    ▼
[Convex mutation updates task.column in DB]
    │
    ▼
[Convex reactive query reruns → pushes new task list via WebSocket]
    │
    ▼
[KanbanBoard re-renders with task in new column]
```

### Search Flow

```
[User types in SearchBar]
    │
    ▼
[useQuery(api.tasks.search, { query: text }) fires]
    │
    ▼
[Convex runs withSearchIndex("search_text", q => q.search("searchText", text))]
    │
    ▼
[Results returned reactively (BM25 ranked)]
    │
    ▼
[SearchBar renders matching tasks as clickable list]
    │
    ▼
[Click opens TaskModal for that task]
```

### Auto-Archive Flow

```
[Convex cron fires daily at 03:00 UTC]
    │
    ▼
[internal.tasks.autoArchiveDone mutation runs]
    │
    ▼
[Query tasks where column === "done" AND updatedAt < (now - 14 days)]
    │
    ▼
[Patch each matching task: column = "archived"]
    │
    ▼
[If user has app open, reactive query updates board automatically]
```

### Key Data Flows Summary

1. **Read path:** `useQuery` -> WebSocket subscription -> Convex query -> DB -> reactive push to UI. All reads are subscriptions, not one-shot fetches. The UI is always current.
2. **Write path:** User action -> `useMutation` -> Convex mutation (transactional) -> DB write -> triggers reactive query rerun -> UI update pushed. Writes are fire-and-forget from the UI perspective.
3. **Search path:** `useQuery` with search args -> Convex `withSearchIndex` -> ranked results -> reactive push. Search is also a subscription, so results update as data changes.
4. **Background path:** Cron -> internal mutation -> DB write -> reactive push (if client connected).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 user (MVP) | Single `tasks` table, one search index, one cron. No auth. This architecture handles it trivially. |
| 1-10 users | Add Convex auth (Clerk integration). Add `userId` field to tasks, filter all queries by user. Add `by_user_column` index. Minimal structural change. |
| 10-100 users | Still fine with same architecture. Convex handles concurrent WebSocket connections well. Consider pagination if users accumulate thousands of tasks. |

### Scaling Priorities

1. **First bottleneck:** Large task lists. If a user has 500+ active tasks, `listActive` returning all tasks becomes slow. Fix: add `.paginate()` and render columns with virtual scrolling. Convex pagination is cursor-based and efficient.
2. **Second bottleneck:** Search relevance. With many tasks, BM25 ranking alone may not surface the right results. Fix: add filter fields (column, date range) to search index for scoped search.

## Anti-Patterns

### Anti-Pattern 1: Client-Side Task State

**What people do:** Store tasks in React state (useState/useReducer) and sync with Convex manually.
**Why it's wrong:** Creates two sources of truth. Leads to stale data, lost updates, and complex sync logic. Defeats the purpose of Convex's reactive queries.
**Do this instead:** Let Convex be the single source of truth. Use `useQuery` for all reads. The only local state should be ephemeral UI state (modal open/closed, active drag ID, search input text).

### Anti-Pattern 2: Using `Date.now()` in Queries

**What people do:** Call `Date.now()` inside a Convex query function to compute "tasks older than 14 days."
**Why it's wrong:** Convex caches and subscribes to queries. `Date.now()` makes the query non-deterministic, breaking caching and causing unnecessary reruns. The Convex docs explicitly warn against this.
**Do this instead:** Pass the current timestamp as an argument from the client, or use cron jobs/mutations for time-dependent operations. For the auto-archive, the cron mutation receives no time-based args --- it calls `Date.now()` inside a mutation (which is fine, since mutations are not cached/subscribed).

### Anti-Pattern 3: Splitting Backend into Many Files Prematurely

**What people do:** Create `convex/createTask.ts`, `convex/moveTask.ts`, `convex/archiveTask.ts`, etc. for a small app.
**Why it's wrong:** Each file adds import overhead, splits related logic, and makes it harder to see the full API surface. For a personal kanban board with ~8-10 functions, one file is clearer.
**Do this instead:** Keep all task functions in `convex/tasks.ts`. Split only if the file exceeds ~300 lines or you add a second entity type.

### Anti-Pattern 4: Over-Engineering Drag-and-Drop

**What people do:** Implement column reordering, nested subtask dragging, multi-select drag, or custom collision detection algorithms from day one.
**Why it's wrong:** Massive complexity for minimal value in a personal tool with fixed columns. dnd-kit's sortable preset with `rectIntersection` collision detection handles the core use case cleanly.
**Do this instead:** Start with simple card-between-columns dragging. Fixed columns mean you only need `useDroppable` on columns and `useDraggable` (or `useSortable` for within-column reorder) on cards.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Convex Cloud | WebSocket via `ConvexReactClient` | Auto-managed connection, reconnection, and subscription multiplexing. No manual WebSocket code needed. |
| Vercel | Static deployment of Vite build output | Convex backend is hosted separately on Convex Cloud. Vercel only serves the frontend. Set `VITE_CONVEX_URL` env var. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| React components <-> Convex | `useQuery` / `useMutation` hooks via generated `api` object | Type-safe end-to-end. Never call Convex functions directly; always go through hooks. |
| Board components <-> dnd-kit | DndContext events (`onDragStart`, `onDragEnd`) | dnd-kit manages drag state internally. Board components respond to events and call Convex mutations. |
| Board view <-> Archive view | Shared `api.tasks.*` functions, different query filters | Both views use the same backend functions but filter differently (`column !== "archived"` vs `column === "archived"`). |
| TaskModal <-> Board/Search | React state (selected task ID) + Convex query for task detail | Modal is stateless regarding task data. It receives a task ID, queries the task, and renders a form. |

## Build Order (Dependency Chain)

The following build order respects component dependencies --- each step builds on what came before:

| Order | Component | Depends On | Rationale |
|-------|-----------|------------|-----------|
| 1 | Convex schema + basic mutations | Nothing | Foundation. Everything else reads/writes tasks. Cannot build any UI without the data layer. |
| 2 | KanbanBoard + TaskColumn + TaskCard (static) | Schema | Render tasks in columns. Proves the data model works. No interactivity yet. |
| 3 | TaskModal (create + edit) | Schema, Board (to see results) | Users need to create tasks before drag-and-drop is useful. |
| 4 | Drag-and-drop (dnd-kit integration) | Board, mutations (move) | Requires columns and cards to exist. Adds the core interaction. |
| 5 | Full-text search | Schema (search index), TaskModal (to open results) | Requires tasks to exist to be searchable. Independent of drag-and-drop. |
| 6 | Auto-archive cron + Archived view | Schema, mutations (archive) | Cleanup feature. Needs tasks in "done" column to be meaningful. |

**Key dependency insight:** Steps 1-4 are strictly sequential. Steps 5 and 6 are independent of each other and can be built in either order after step 4, but both require steps 1-3.

## Sources

- [Convex Architecture Overview](https://docs.convex.dev/understanding/) --- HIGH confidence (official docs)
- [Convex React Client](https://docs.convex.dev/client/react) --- HIGH confidence (official docs)
- [Convex Queries](https://docs.convex.dev/functions/query-functions) --- HIGH confidence (official docs)
- [Convex Mutations](https://docs.convex.dev/functions/mutation-functions) --- HIGH confidence (official docs)
- [Convex Full Text Search](https://docs.convex.dev/search/text-search) --- HIGH confidence (official docs)
- [Convex Scheduled Functions](https://docs.convex.dev/scheduling/scheduled-functions) --- HIGH confidence (official docs)
- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs) --- HIGH confidence (official docs)
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) --- HIGH confidence (official docs)
- [Convex Database Schemas](https://docs.convex.dev/database/schemas) --- HIGH confidence (official docs)
- [Convex Optimistic Updates](https://docs.convex.dev/client/react/optimistic-updates) --- HIGH confidence (official docs)
- [Building a Kanban Board with dnd-kit](https://radzion.com/blog/kanban/) --- MEDIUM confidence (tutorial, verified against dnd-kit docs)
- [Build a Kanban Board with dnd-kit and React (LogRocket)](https://blog.logrocket.com/build-kanban-board-dnd-kit-react/) --- MEDIUM confidence (tutorial, verified against dnd-kit docs)
- [Kanban Board with Shadcn (Marmelab)](https://marmelab.com/blog/2026/01/15/building-a-kanban-board-with-shadcn.html) --- MEDIUM confidence (recent tutorial)
- [React dnd-kit + Tailwind + shadcn Kanban (GitHub)](https://github.com/Georgegriff/react-dnd-kit-tailwind-shadcn-ui) --- MEDIUM confidence (reference implementation)

---
*Architecture research for: Personal Kanban Board (React + Convex)*
*Researched: 2026-02-15*
