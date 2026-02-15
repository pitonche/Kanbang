# Phase 2: Task Management - Research

**Researched:** 2026-02-15
**Domain:** Convex CRUD (queries + mutations), React forms/modals, keyboard shortcuts, task card UI with priority indicators
**Confidence:** HIGH

## Summary

Phase 2 transforms the static Phase 1 board into a functional task management tool. The work spans three layers: (1) Convex backend functions for task CRUD (create, read, update, delete), (2) React UI components for task cards, a detail/edit modal, and a quick-add form, and (3) a global keyboard shortcut ("N") for rapid task creation.

The Convex schema is already complete from Phase 1 -- all fields (`title`, `notes`, `column`, `cadence`, `priority`, `createdAt`, `updatedAt`, `completedAt`, `archivedAt`, `searchText`) and indexes (`by_column`, `search_text`) exist. No schema changes are needed. The work is purely additive: new Convex function files, new React components, and wiring them together with `useQuery`/`useMutation`.

The native HTML `<dialog>` element (with `.showModal()`) provides an accessible modal with built-in focus management, backdrop, Escape-to-close, and inert background -- all without a third-party library. For forms, React's built-in `useState` is sufficient given the small number of fields (title, notes, cadence, priority). No form library is needed.

**Primary recommendation:** Create a `convex/tasks.ts` file with query/mutation functions, build a `TaskCard` component, a `TaskModal` dialog, and a `QuickAdd` form, then wire them with `useQuery(api.tasks.list)` and `useMutation(api.tasks.create/update/remove)`. Use the native `<dialog>` element for the modal. Use `useEffect` with a `keydown` listener for the "N" shortcut.

## Standard Stack

### Core (already installed from Phase 1)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `convex` | ^1.31.7 | Backend queries, mutations, real-time subscriptions | Already installed; provides `useQuery`, `useMutation`, typed API generation |
| `react` | ^19.2.4 | UI framework with hooks | Already installed; `useState` for forms, `useRef` for dialog, `useEffect` for keyboard |
| `tailwindcss` | ^4.1.18 | Utility-first CSS | Already installed; priority color indicators, card styling, modal layout |

### Supporting (no new dependencies needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `<dialog>` | HTML standard | Accessible modal with backdrop, focus management, Escape key | Task detail/edit modal (TASK-02) |
| Native `KeyboardEvent` | DOM standard | Global keyboard shortcut detection | "N" key quick-add (TASK-07) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `<dialog>` | Headless UI `Dialog`, Radix `Dialog` | Extra dependency; native dialog is well-supported (baseline since March 2022), provides `::backdrop`, `inert`, Escape handling for free |
| `useState` for forms | react-hook-form, Formik | Overkill for 4 fields; adds bundle size and complexity; Convex mutations already validate on the server |
| `useEffect` for keyboard | react-hotkeys-hook | Single shortcut ("N") doesn't justify a library |
| Optimistic updates | Server-only updates | Convex real-time subscriptions already make updates feel near-instant (~50-100ms); optimistic updates add complexity. Can add later if needed. |

**Installation:**
```bash
# No new packages needed. Phase 1 dependencies cover everything.
```

## Architecture Patterns

### Recommended Project Structure

```
convex/
  schema.ts           # Existing (no changes)
  tasks.ts            # NEW: query + mutation functions for task CRUD
src/
  components/
    Board.tsx          # MODIFY: fetch tasks via useQuery, pass to columns
    Column.tsx         # MODIFY: receive tasks prop, render TaskCard list
    TaskCard.tsx       # NEW: single task card with priority indicator
    TaskModal.tsx      # NEW: detail/edit modal using <dialog>
    QuickAdd.tsx       # NEW: quick-add form (title field + optional extras)
  App.tsx              # MODIFY: add keyboard shortcut listener, QuickAdd state
  index.css            # MODIFY: add priority color tokens, modal styles
  main.tsx             # No changes
```

### Pattern 1: Convex Function File Per Table

**What:** Create `convex/tasks.ts` exporting all task-related queries and mutations. Convex auto-maps file exports to `api.tasks.*` paths.
**When to use:** Always -- one file per table is the standard Convex convention for small-to-medium apps.
**Example:**

```typescript
// convex/tasks.ts
// Source: https://docs.convex.dev/functions/query-functions + /mutation-functions
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: fetch all tasks grouped by column
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

// Mutation: create a new task
export const create = mutation({
  args: {
    title: v.string(),
    notes: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const searchText = `${args.title} ${args.notes ?? ""}`.trim();
    return await ctx.db.insert("tasks", {
      title: args.title,
      notes: args.notes,
      column: "inbox",           // New tasks always go to Inbox
      cadence: args.cadence,
      priority: args.priority,
      createdAt: now,
      updatedAt: now,
      searchText,
    });
  },
});

// Mutation: update an existing task
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    cadence: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("none"),
      ),
    ),
    priority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Task not found");

    const title = fields.title ?? existing.title;
    const notes = fields.notes ?? existing.notes;
    const searchText = `${title} ${notes ?? ""}`.trim();

    await ctx.db.patch(id, {
      ...fields,
      searchText,
      updatedAt: Date.now(),
    });
  },
});

// Mutation: delete a task permanently
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
```

**Key points:**
- Exports become `api.tasks.list`, `api.tasks.create`, `api.tasks.update`, `api.tasks.remove`
- `searchText` is recomputed on every write (title or notes change) per Phase 1 design
- New tasks default to `column: "inbox"` per requirement TASK-01
- `v.id("tasks")` validator ensures IDs belong to the tasks table
- Name the delete mutation `remove` to avoid shadowing the JS reserved word

### Pattern 2: useQuery for Real-Time Task Lists

**What:** Subscribe to task data with `useQuery` in the Board component. Convex automatically re-renders when any task changes.
**When to use:** Board component -- subscribes once, data flows down to columns.
**Example:**

```typescript
// Source: https://docs.convex.dev/client/react
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function Board() {
  const tasks = useQuery(api.tasks.list);

  if (tasks === undefined) return <div>Loading...</div>;

  // Group tasks by column for rendering
  const tasksByColumn = Object.groupBy(tasks, (t) => t.column);

  return (
    <div className="flex gap-4 p-6 overflow-x-auto min-h-screen bg-board-bg">
      {COLUMNS.map((col) => (
        <Column
          key={col.id}
          id={col.id}
          label={col.label}
          tasks={tasksByColumn[col.id] ?? []}
        />
      ))}
    </div>
  );
}
```

**Note on `Object.groupBy`:** This is a standard JavaScript method (ES2024, supported in all modern browsers). TypeScript needs `"lib": ["ES2024"]` or newer in `tsconfig.app.json` to recognize it. Alternatively, implement a simple `groupBy` helper function.

### Pattern 3: Native `<dialog>` Modal in React

**What:** Use the HTML `<dialog>` element with `useRef` for an accessible modal. `.showModal()` provides backdrop, focus management, Escape-to-close, and `inert` on background content -- all built-in.
**When to use:** Task detail/edit modal (TASK-02).
**Example:**

```tsx
// Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
import { useRef, useEffect } from "react";

interface TaskModalProps {
  task: Doc<"tasks"> | null;
  onClose: () => void;
}

export function TaskModal({ task, onClose }: TaskModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (task) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [task]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="rounded-lg p-0 backdrop:bg-black/50"
    >
      {task && (
        <div className="p-6 w-[480px]">
          {/* Form fields for editing task */}
        </div>
      )}
    </dialog>
  );
}
```

**Key behaviors (all automatic with `.showModal()`):**
- Backdrop overlay via `::backdrop` pseudo-element (styleable with Tailwind)
- Escape key closes the dialog (fires `close` event)
- Background content becomes `inert` (not interactive)
- Focus moves into dialog on open; the `autofocus` attribute can target a specific element
- No focus-trap library needed -- native dialog handles accessibility

### Pattern 4: Global Keyboard Shortcut with useEffect

**What:** Listen for the "N" key globally to open quick-add. Ignore when user is typing in an input/textarea.
**When to use:** TASK-07 requirement.
**Example:**

```typescript
// In App.tsx or Board.tsx
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // Ignore if user is typing in an input, textarea, or contentEditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    // Ignore if modifier keys are held
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      setQuickAddOpen(true);
    }
  }

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, []);
```

**Important:** Check `e.target.tagName` to avoid intercepting "N" when the user is typing in a form field. Also ignore when modifier keys are held (Cmd+N, Ctrl+N are browser shortcuts).

### Pattern 5: Priority Color Indicators

**What:** Display a colored left-border or dot on task cards to indicate priority level.
**When to use:** TASK-06 requirement -- every task card shows its priority visually.
**Example using Tailwind theme tokens:**

```css
/* index.css - add priority color tokens */
@theme {
  --color-priority-low: #22c55e;      /* green-500 */
  --color-priority-medium: #f59e0b;   /* amber-500 */
  --color-priority-high: #ef4444;     /* red-500 */
}
```

```tsx
// TaskCard.tsx
const PRIORITY_COLORS = {
  low: "border-l-priority-low",
  medium: "border-l-priority-medium",
  high: "border-l-priority-high",
} as const;

export function TaskCard({ task }: { task: Doc<"tasks"> }) {
  return (
    <div
      className={`bg-card-bg border border-card-border rounded-md p-3 mb-2
        border-l-4 ${PRIORITY_COLORS[task.priority]} cursor-pointer`}
    >
      <p className="text-sm font-medium">{task.title}</p>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Fetching tasks per-column:** Don't call `useQuery` 6 times (once per column). Fetch all tasks once in Board and group client-side. Convex subscriptions are per-query, and 6 subscriptions would be wasteful. The `by_column` index exists for future per-column pagination if needed.
- **Storing form state in Convex:** Don't write partial/draft state to the database. Keep form state local with `useState` and only call the mutation on submit.
- **Using `e.keyCode` for keyboard shortcuts:** Use `e.key` (string like `"n"`) instead of numeric keycodes. `keyCode` is deprecated.
- **Mutating objects in optimistic updates:** If adding optimistic updates later, always create new arrays/objects -- never mutate the existing ones from `localStore.getQuery()`.
- **Forgetting to recompute `searchText`:** Every mutation that changes `title` or `notes` must also update `searchText = title + " " + (notes ?? "")`. This is easy to forget in the update mutation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible modal | Custom overlay + focus trap + escape handler + aria attributes | Native `<dialog>` with `.showModal()` | Built-in backdrop, inert background, Escape key, focus management, ARIA `role="dialog"` + `aria-modal="true"` -- all free |
| Real-time data sync | WebSocket management, cache invalidation, retry logic | Convex `useQuery` subscriptions | Automatic real-time sync with consistency guarantees; re-renders component on data change |
| Server-side validation | Custom validation middleware | Convex `v` validators in mutation `args` | Runtime type checking + TypeScript types from a single source of truth |
| Document ID validation | String type checking, table membership checks | `v.id("tasks")` validator | Validates ID format AND table membership at the Convex layer |
| Unique ID generation | UUID libraries for temporary IDs | Convex auto-generated `_id` field | Every inserted document gets a globally unique `_id` automatically |

**Key insight:** Convex handles the entire backend complexity (validation, real-time sync, transactions). The React side only needs simple state management and DOM APIs. No middleware, no caching layer, no WebSocket setup.

## Common Pitfalls

### Pitfall 1: Forgetting searchText Computation on Create/Update

**What goes wrong:** Tasks are created or updated without recomputing `searchText`, making them invisible to future full-text search (Phase 4).
**Why it happens:** `searchText` is a derived field, not directly user-facing. Easy to forget.
**How to avoid:** Every mutation that touches `title` or `notes` must include: `searchText: \`${title} ${notes ?? ""}\`.trim()`. Consider extracting a helper function `computeSearchText(title, notes)` and calling it in both `create` and `update` mutations.
**Warning signs:** Tasks appear on the board but don't show up in search results (Phase 4).

### Pitfall 2: Dialog Not Opening/Closing Correctly in React

**What goes wrong:** The `<dialog>` element's `.showModal()` and `.close()` methods are imperative DOM calls, which can conflict with React's declarative rendering.
**Why it happens:** Calling `.showModal()` on an already-open dialog throws an `InvalidStateError`. Similarly, calling `.close()` on a closed dialog is a no-op but can cause confusion.
**How to avoid:** Guard calls with the dialog's `open` property: `if (!dialog.open) dialog.showModal()` or use the `task` prop as the source of truth (open when task is non-null, close when null). Use the `onClose` event handler (fired when Escape is pressed or `.close()` is called) to sync React state.
**Warning signs:** "InvalidStateError: Failed to execute 'showModal' on 'HTMLDialogElement'" in the console.

### Pitfall 3: Keyboard Shortcut Fires During Text Input

**What goes wrong:** Pressing "N" while typing in a form field opens the quick-add dialog instead of typing the letter.
**Why it happens:** The `keydown` listener is attached to `document`, so it catches all key presses.
**How to avoid:** Check `e.target.tagName` for "INPUT", "TEXTAREA", or `e.target.isContentEditable` before handling the shortcut. Also check for `e.target` being inside a `<dialog>` (which implies the user is in a modal).
**Warning signs:** Quick-add opens when user is editing a task title or notes.

### Pitfall 4: useQuery Returns undefined While Loading

**What goes wrong:** Destructuring or mapping over `useQuery` result before it loads causes a crash.
**Why it happens:** `useQuery` returns `undefined` on initial load, before Convex receives the first response.
**How to avoid:** Always handle the `undefined` case: `if (tasks === undefined) return <Loading />;` or use optional chaining. This is especially important in Board where tasks are grouped and passed to columns.
**Warning signs:** "Cannot read properties of undefined" errors on page load.

### Pitfall 5: Stale _generated Files After Adding New Convex Functions

**What goes wrong:** TypeScript cannot find `api.tasks.create` or other new function references.
**Why it happens:** The `convex/_generated/api.d.ts` file is only regenerated when `convex dev` is running. If you add new function files or exports without `convex dev` running, the generated types are stale.
**How to avoid:** Always have `bun run dev` (which runs both Vite and Convex dev) running during development. After creating `convex/tasks.ts`, the types will auto-regenerate.
**Warning signs:** "Property 'tasks' does not exist on type" or "Property 'create' does not exist" TypeScript errors.

### Pitfall 6: Object.groupBy TypeScript Support

**What goes wrong:** TypeScript reports `Object.groupBy` as not existing.
**Why it happens:** `Object.groupBy` is ES2024. The current `tsconfig.app.json` specifies `"lib": ["ES2020", "DOM", "DOM.Iterable"]`, which is too old.
**How to avoid:** Either update `lib` to include `"ES2024"` (or `"ESNext"`), or write a simple inline `groupBy` utility function. The runtime supports it (all modern browsers), so this is purely a TypeScript compiler issue.
**Warning signs:** "Property 'groupBy' does not exist on type 'ObjectConstructor'" TypeScript error.

## Code Examples

Verified patterns from official sources:

### Convex Mutation: Creating a Task

```typescript
// Source: https://docs.convex.dev/functions/mutation-functions
// convex/tasks.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    title: v.string(),
    notes: v.optional(v.string()),
    cadence: v.union(
      v.literal("daily"), v.literal("weekly"),
      v.literal("monthly"), v.literal("none"),
    ),
    priority: v.union(
      v.literal("low"), v.literal("medium"), v.literal("high"),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      title: args.title,
      notes: args.notes,
      column: "inbox",
      cadence: args.cadence,
      priority: args.priority,
      createdAt: now,
      updatedAt: now,
      searchText: `${args.title} ${args.notes ?? ""}`.trim(),
    });
  },
});
```

### Convex Query: Fetching All Tasks

```typescript
// Source: https://docs.convex.dev/functions/query-functions
// convex/tasks.ts
import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});
```

### React: Subscribing to Tasks and Calling Mutations

```typescript
// Source: https://docs.convex.dev/client/react
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function Board() {
  const tasks = useQuery(api.tasks.list);
  const createTask = useMutation(api.tasks.create);
  const deleteTask = useMutation(api.tasks.remove);

  if (tasks === undefined) return <div>Loading...</div>;

  const handleCreate = async () => {
    await createTask({
      title: "New task",
      cadence: "none",
      priority: "medium",
    });
  };
}
```

### React: Native Dialog Modal

```tsx
// Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
import { useRef, useEffect } from "react";
import { Doc } from "../convex/_generated/dataModel";

function TaskModal({ task, onClose }: { task: Doc<"tasks"> | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (task && !el.open) el.showModal();
    if (!task && el.open) el.close();
  }, [task]);

  return (
    <dialog ref={ref} onClose={onClose} className="rounded-lg p-0 backdrop:bg-black/50">
      {task && <form className="p-6 w-[480px]">{/* fields */}</form>}
    </dialog>
  );
}
```

### TypeScript: Using Doc Type for Component Props

```typescript
// Source: https://docs.convex.dev/database/schemas
import { Doc, Id } from "../convex/_generated/dataModel";

// For component props that receive a full task document
interface TaskCardProps {
  task: Doc<"tasks">;
  onClick: (id: Id<"tasks">) => void;
}

// Doc<"tasks"> includes all schema fields PLUS _id and _creationTime
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom modal with `react-modal` or Headless UI | Native `<dialog>` with `.showModal()` | Baseline March 2022 (all browsers) | No dependency needed; built-in a11y, backdrop, focus management |
| `forwardRef` for passing refs to child components | Direct `ref` prop on function components | React 19 (Dec 2024) | Simpler component signatures; no `forwardRef` wrapper needed |
| `e.keyCode` for keyboard events | `e.key` string property | Deprecated in DOM3 spec | More readable; locale-aware; `keyCode` is deprecated |
| Form libraries (Formik, react-hook-form) for simple forms | `useState` + controlled components | React 19 (stable, always valid) | 4-field form doesn't justify a library; Convex validates server-side |
| Separate `type` declarations matching schema | `Doc<"tasks">` from `_generated/dataModel` | Convex codegen (always) | Single source of truth; types auto-update when schema changes |

**Deprecated/outdated:**
- `forwardRef`: No longer needed in React 19 for passing refs to function components
- `e.keyCode`: Deprecated; use `e.key` instead
- `react-modal`: Unnecessary with native `<dialog>` support
- `focus-trap-react`: Unnecessary when using `<dialog>` with `.showModal()` (handles focus natively)

## Open Questions

1. **Quick-add form scope: minimal vs. full**
   - What we know: TASK-01 says title is required, notes/cadence/priority are optional. TASK-07 says "N" opens quick-add with cursor in title field.
   - What's unclear: Should quick-add show only the title field (minimal, fast) or all fields (title, notes, cadence, priority)?
   - Recommendation: Minimal quick-add with just title field and sensible defaults (`cadence: "none"`, `priority: "medium"`). User can set other fields by clicking the card to open the full detail modal. This keeps the quick-add experience fast and focused.

2. **Task ordering within columns**
   - What we know: No explicit `order` field in the schema. Convex's `by_column` index implicitly sorts by `_creationTime` (ascending).
   - What's unclear: Should tasks within a column sort newest-first or oldest-first?
   - Recommendation: Default to newest-first (descending `_creationTime`) so the most recent task appears at the top of the Inbox. This is the natural behavior for a task inbox. Can use `.order("desc")` in the query. Explicit ordering is deferred to Phase 3 (drag-and-drop).

3. **Object.groupBy vs. manual groupBy**
   - What we know: `Object.groupBy` is ES2024, supported in all modern browsers, but `tsconfig.app.json` currently targets `"lib": ["ES2020"]`.
   - What's unclear: Whether to update the TypeScript lib target or write a manual helper.
   - Recommendation: Update `lib` in `tsconfig.app.json` to `["ES2024", "DOM", "DOM.Iterable"]` since the runtime supports it. This is the simpler, forward-looking approach. Alternatively, a 3-line `groupBy` helper avoids any tsconfig changes.

4. **Stale `_generated/api.d.ts` referencing deleted `myFunctions.ts`**
   - What we know: Phase 1 deleted the template's `myFunctions.ts` but the generated `api.d.ts` still references it.
   - What's unclear: Whether `convex dev` will auto-regenerate correctly when `tasks.ts` is added.
   - Recommendation: This will self-resolve when `convex dev` runs and discovers the new `tasks.ts` file. The generated files will be rebuilt with the correct exports. No manual intervention needed.

## Convex Database API Reference

The installed Convex version (1.31.7) supports two calling conventions for database operations. Both are valid; the type definitions provide overloads for each:

**Short form (recommended for typed IDs):**
```typescript
await ctx.db.get(id);                    // id: Id<"tasks">
await ctx.db.insert("tasks", data);      // table name required for insert
await ctx.db.patch(id, partialData);     // id carries table type
await ctx.db.delete(id);                 // id carries table type
```

**Long form (table name explicit):**
```typescript
await ctx.db.get("tasks", id);           // redundant but valid
await ctx.db.patch("tasks", id, data);   // table name + id + data
await ctx.db.delete("tasks", id);        // table name + id
```

The short form is recommended because `v.id("tasks")` already encodes the table in the TypeScript type, making the table name argument redundant. The official Convex docs show both forms; the tutorial uses the short form.

## Sources

### Primary (HIGH confidence)
- [Convex Mutation Functions](https://docs.convex.dev/functions/mutation-functions) -- mutation pattern, args validation, ctx.db.insert/patch/delete
- [Convex Query Functions](https://docs.convex.dev/functions/query-functions) -- query pattern, ctx.db.query, .withIndex, .collect, .order
- [Convex React Client](https://docs.convex.dev/client/react) -- useQuery, useMutation, ConvexProvider hooks
- [Convex Database Reading](https://docs.convex.dev/database/reading-data) -- db.get, db.query, .first, .collect, .withIndex
- [Convex Database Writing](https://docs.convex.dev/database/writing-data) -- db.insert, db.patch, db.replace, db.delete, transaction semantics
- [Convex Document IDs](https://docs.convex.dev/database/document-ids) -- Id<"table"> type, v.id() validator
- [Convex Schema Types](https://docs.convex.dev/database/schemas) -- Doc<"table"> type, Infer helper
- [Convex Optimistic Updates](https://docs.convex.dev/client/react/optimistic-updates) -- localStore API, .withOptimisticUpdate pattern
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) -- function organization, helper functions, access control
- [MDN: HTML dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) -- showModal(), close(), ::backdrop, onClose event, autofocus, form[method=dialog]
- Convex installed type definitions at `node_modules/convex/dist/cjs-types/server/database.d.ts` -- verified actual API signatures for db.get, db.patch, db.delete, db.insert (both overload forms)
- Existing codebase files: `convex/schema.ts`, `src/components/Board.tsx`, `src/components/Column.tsx`, `src/index.css`, `src/App.tsx`

### Secondary (MEDIUM confidence)
- [CSS-Tricks: No Need to Trap Focus on Dialog](https://css-tricks.com/there-is-no-need-to-trap-focus-on-a-dialog-element/) -- native dialog focus behavior, W3C APAWG recommendation
- [Convex Tutorial](https://docs.convex.dev/tutorial/) -- file naming convention (convex/chat.ts -> api.chat.*), React usage patterns
- [Convex API Generation](https://stack.convex.dev/code-spelunking-uncovering-convex-s-api-generation-secrets) -- how file exports map to api.* paths via Proxy object

### Tertiary (LOW confidence)
- None. All findings verified against official documentation or installed source code.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies needed; all patterns verified against installed Convex 1.31.7 type definitions and official docs
- Architecture: HIGH -- Convex function organization verified via tutorial + API generation docs; native dialog verified via MDN baseline support data (March 2022)
- Pitfalls: HIGH -- searchText recomputation requirement confirmed from Phase 1 schema; dialog showModal() behavior verified from MDN; useQuery undefined behavior documented in Convex React docs
- Code examples: HIGH -- All examples verified against installed Convex type definitions and official documentation patterns

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable stack, no fast-moving dependencies)
