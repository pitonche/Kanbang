# Phase 3: Drag and Drop - Research

**Researched:** 2026-02-15
**Domain:** React drag-and-drop interaction, Convex optimistic updates
**Confidence:** HIGH

## Summary

Drag-and-drop for Kanban boards is a well-solved problem in the React ecosystem. The standard library is **dnd-kit** (`@dnd-kit/core` + `@dnd-kit/sortable`), which is mature, modular, accessible, and installs cleanly with React 19. The codebase uses a single `useQuery(api.tasks.list)` call with client-side `Object.groupBy` for column grouping (established in Phase 2), which simplifies the optimistic update story -- one query to update, not per-column queries.

The highest-risk item for this phase is **snap-back flicker**: the brief visual revert of a dragged card to its original position between the drop and the server roundtrip. Convex's built-in `.withOptimisticUpdate()` API directly addresses this by allowing the mutation to optimistically patch the local query cache before the server confirms. This eliminates the need for temporary local state or custom synchronization hooks that plague React Query / TanStack Query integrations.

**Primary recommendation:** Use `@dnd-kit/core` v6.3.1 + `@dnd-kit/sortable` v10.0.0 (stable API) with Convex optimistic updates. Do NOT use the new `@dnd-kit/react` package (pre-1.0, v0.2.4) -- it has fewer docs, fewer community examples, and a different API from all existing tutorials.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | 6.3.1 | DndContext, sensors, collision detection, DragOverlay | Most popular React DnD library, modular, accessible, actively maintained |
| `@dnd-kit/sortable` | 10.0.0 | SortableContext, useSortable for cross-container drag | Preset for list-based sorting/moving, handles empty columns |
| `@dnd-kit/utilities` | 3.2.2 | CSS.Transform helper for applying transforms | Small utility, standard companion package |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | Convex provides optimistic updates natively; no extra state management needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@dnd-kit/core` + `@dnd-kit/sortable` | `@dnd-kit/react` v0.2.4 (new API) | Explicitly supports React 19 in peer deps, but pre-1.0, sparse docs, different API from all tutorials. Installs fine but risky for production. |
| `@dnd-kit/core` + `@dnd-kit/sortable` | `@hello-pangea/dnd` v18.0.1 | Simpler API for Kanban, supports React 19 in peer deps. But less flexible, no grid support, community fork of deprecated library. |
| `@dnd-kit/core` + `@dnd-kit/sortable` | `@atlaskit/pragmatic-drag-and-drop` v1.7.7 | Atlassian's headless DnD, framework-agnostic core. But React-specific packages have React 19 issues, Vite module resolution problems, steeper learning curve. |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Architecture Patterns

### Recommended Component Changes
```
src/
├── components/
│   ├── Board.tsx          # MODIFY: wrap columns in DndContext, add DragOverlay, handle drag events
│   ├── Column.tsx         # MODIFY: wrap in useDroppable, pass droppable ref to column container
│   ├── TaskCard.tsx       # MODIFY: wrap in useSortable, apply transform/transition styles
│   ├── TaskCardOverlay.tsx # NEW: presentational-only card for DragOverlay (no drag hooks)
│   ├── TaskModal.tsx      # unchanged
│   └── QuickAdd.tsx       # unchanged
├── App.tsx                # unchanged
convex/
├── tasks.ts               # MODIFY: add moveToColumn mutation
├── schema.ts              # unchanged
```

### Pattern 1: DndContext at Board Level
**What:** Single DndContext wraps all columns, handles all drag events centrally in Board.tsx
**When to use:** Always -- there must be exactly one DndContext as ancestor of all draggable/droppable elements
**Example:**
```typescript
// Source: https://docs.dndkit.com/presets/sortable (verified)
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

function Board() {
  const [activeTask, setActiveTask] = useState<Doc<"tasks"> | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {COLUMNS.map(col => (
        <Column key={col.id} id={col.id} label={col.label} tasks={...} />
      ))}
      <DragOverlay>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### Pattern 2: Column as Droppable Container with SortableContext
**What:** Each Column wraps its task list in SortableContext + useDroppable, enabling drops into empty columns
**When to use:** Every column, including empty ones -- useDroppable ensures empty columns accept drops
**Example:**
```typescript
// Source: https://docs.dndkit.com/presets/sortable (verified)
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function Column({ id, label, tasks, onTaskClick }) {
  const { setNodeRef } = useDroppable({ id });
  const taskIds = tasks.map(t => t._id);

  return (
    <div className="flex flex-col w-72 shrink-0 rounded-lg bg-column-bg">
      <h2>...</h2>
      <div ref={setNodeRef} className="flex-1 p-2 min-h-[200px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task._id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
```

### Pattern 3: TaskCard with useSortable
**What:** Each task card uses useSortable to be both draggable and a drop target
**When to use:** Every TaskCard rendered in a column
**Example:**
```typescript
// Source: https://docs.dndkit.com/presets/sortable/usesortable (verified)
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-card-bg border ... ${priorityBorder[task.priority]}`}
      onClick={() => onClick(task._id)}
    >
      <p>{task.title}</p>
    </div>
  );
}
```

### Pattern 4: Convex Optimistic Update for Column Move
**What:** Use `.withOptimisticUpdate()` on the moveToColumn mutation to instantly update the local query cache
**When to use:** Every column move -- this is what prevents snap-back
**Example:**
```typescript
// Source: https://docs.convex.dev/client/react/optimistic-updates (verified)
const moveToColumn = useMutation(api.tasks.moveToColumn).withOptimisticUpdate(
  (localStore, args) => {
    const currentTasks = localStore.getQuery(api.tasks.list, {});
    if (currentTasks === undefined) return;

    const now = Date.now();
    const updatedTasks = currentTasks.map((task) => {
      if (task._id !== args.id) return task;
      return {
        ...task, // Always create new objects, never mutate
        column: args.column,
        updatedAt: now,
        ...(args.column === "done" ? { completedAt: now } : {}),
      };
    });
    localStore.setQuery(api.tasks.list, {}, updatedTasks);
  }
);
```

### Pattern 5: Separate Presentational Overlay Component
**What:** DragOverlay renders a pure presentational TaskCardOverlay, NOT the same component that uses useSortable
**When to use:** Always when using DragOverlay -- avoids duplicate hook IDs and rendering issues
**Example:**
```typescript
// TaskCardOverlay.tsx -- presentational only, no drag hooks
function TaskCardOverlay({ task }: { task: Doc<"tasks"> }) {
  return (
    <div className={`bg-card-bg border ... shadow-lg ${priorityBorder[task.priority]}`}>
      <p>{task.title}</p>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Rendering useSortable component inside DragOverlay:** Causes duplicate IDs and visual glitches. Always use a separate presentational component for the overlay.
- **Using both PointerSensor and MouseSensor/TouchSensor:** PointerSensor handles all input types (mouse, touch, pen). Using both causes conflicts.
- **Mutating objects in optimistic updates:** Convex docs explicitly warn: "Always create new objects inside of optimistic updates" -- mutating corrupts internal state.
- **Forgetting `useDroppable` on empty columns:** Without it, you cannot drop tasks into an empty column. The SortableContext alone does not create a drop target when it has zero items.
- **Using `onDragOver` for cross-container moves:** Since we don't need within-column reordering, we can handle everything in `onDragEnd` by checking which column the task was dropped on. This is simpler than the `onDragOver` pattern used for real-time position updates during drag.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop interaction | HTML5 drag events, custom mouse tracking | `@dnd-kit/core` sensors | Touch support, accessibility, activation constraints, pointer event normalization across browsers |
| Cross-column drop detection | Manual coordinate math to determine target column | `@dnd-kit/core` collision detection (`closestCorners`) | Edge cases with overlapping containers, empty containers, scrolled viewports |
| Drag preview / overlay | Cloning DOM node, absolute positioning | `DragOverlay` component | Handles portal rendering, cursor offset, z-index, scroll containers |
| Optimistic UI for server mutations | Local state sync, useEffect-based reconciliation | Convex `.withOptimisticUpdate()` | Automatic rollback on failure, automatic reconciliation when server confirms, no stale state bugs |

**Key insight:** The snap-back problem that plagues React Query + dnd-kit integrations is a non-issue with Convex because optimistic updates are first-class -- the local cache is updated synchronously before the mutation roundtrip, and Convex's reactive system automatically reconciles when the server confirms.

## Common Pitfalls

### Pitfall 1: Snap-Back Flicker After Drop
**What goes wrong:** After dropping a card in a new column, it briefly appears in the old column before jumping to the new one.
**Why it happens:** The drag library resets its internal state on drop, re-rendering from query data. If the query data hasn't updated yet (server roundtrip), the card renders in its old position.
**How to avoid:** Use Convex `.withOptimisticUpdate()` on the moveToColumn mutation. This updates `localStore` synchronously so `useQuery(api.tasks.list)` returns the updated array immediately.
**Warning signs:** Any delay between drop and card appearing in new column; card "teleporting" or "blinking."

### Pitfall 2: Click vs Drag Conflict on Task Cards
**What goes wrong:** Clicking a task card to open the edit modal also initiates a drag, or dragging doesn't start because the click handler fires first.
**Why it happens:** Both `onClick` and drag listeners are attached to the same element with no activation constraint.
**How to avoid:** Set `activationConstraint: { distance: 8 }` on PointerSensor. This requires 8px of movement before drag starts, allowing clicks to fire normally. The `onClick` handler fires when pointer up occurs without exceeding the distance threshold.
**Warning signs:** Modal opens when trying to drag; drag starts on tap; drag starts on accidental micro-movement.

### Pitfall 3: Cannot Drop into Empty Column
**What goes wrong:** Dragging the last task out of a column works, but you can't drop any task back into that now-empty column.
**Why it happens:** `SortableContext` with zero items has no sortable children to act as drop targets. Without a `useDroppable` wrapper, the column itself isn't a drop zone.
**How to avoid:** Always wrap the column's task area in `useDroppable({ id: columnId })` in addition to `SortableContext`. The droppable acts as the fallback target when there are no sortable items.
**Warning signs:** Test with 6 columns and only 1 task -- drag it through every column.

### Pitfall 4: DragOverlay Renders Sortable Component
**What goes wrong:** Drag preview looks wrong, has unexpected behavior, or creates duplicate IDs in the DOM.
**Why it happens:** Using the same component (with `useSortable` hook) both as a sortable item and as the DragOverlay content. The hook tries to register twice.
**How to avoid:** Create a separate `TaskCardOverlay` component that is purely presentational (no hooks, no listeners). Use it only inside `<DragOverlay>`.
**Warning signs:** Console warnings about duplicate keys/IDs; drag preview doesn't match the card; layout shifts during drag.

### Pitfall 5: completedAt Not Set When Moving to Done
**What goes wrong:** Task moves to Done column visually, but `completedAt` is never set. Phase 5 (Auto-Archive) will break because it depends on `completedAt` being set.
**Why it happens:** The `moveToColumn` mutation only updates `column` and forgets the `completedAt` business logic.
**How to avoid:** The Convex `moveToColumn` mutation must check: if `column === "done"`, set `completedAt = Date.now()`. If moving OUT of done, clear `completedAt`. The optimistic update must mirror this logic.
**Warning signs:** Moving task to Done and back, then checking if timestamps are correct.

### Pitfall 6: Convex Reactive Re-render During Drag
**What goes wrong:** While one user drags, another user's change triggers a Convex reactive update, causing the task list to re-render mid-drag and breaking the interaction.
**Why it happens:** Convex queries are fully reactive. Any server-side change to the tasks table triggers a re-render.
**How to avoid:** dnd-kit handles this gracefully through its transform/transition system -- items animate to new positions rather than jumping. The `activeId` state in `onDragStart` preserves the drag context even if the underlying list re-renders. No special handling needed, but worth testing.
**Warning signs:** Multi-tab testing -- drag in one tab while creating/editing in another.

## Code Examples

Verified patterns from official sources:

### Convex moveToColumn Mutation
```typescript
// convex/tasks.ts
// Source: project schema + https://docs.convex.dev/functions/mutation
export const moveToColumn = mutation({
  args: {
    id: v.id("tasks"),
    column: v.union(
      v.literal("inbox"),
      v.literal("backlog"),
      v.literal("in_progress"),
      v.literal("needs_info"),
      v.literal("blocked"),
      v.literal("done"),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updates: Record<string, unknown> = {
      column: args.column,
      updatedAt: now,
    };

    // Business logic: set/clear completedAt based on Done column
    if (args.column === "done") {
      updates.completedAt = now;
    } else {
      updates.completedAt = undefined; // Clear if moving out of Done
    }

    await ctx.db.patch(args.id, updates);
  },
});
```

### Board handleDragEnd with Column Detection
```typescript
// Source: https://docs.dndkit.com/presets/sortable (multi-container pattern)
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  setActiveTask(null);

  if (!over) return;

  const taskId = active.id as Id<"tasks">;
  const task = typedTasks.find(t => t._id === taskId);
  if (!task) return;

  // Determine target column: "over" could be a column ID or a task ID
  let targetColumn: ColumnId;
  if (COLUMNS.some(c => c.id === over.id)) {
    // Dropped directly on column droppable (empty column)
    targetColumn = over.id as ColumnId;
  } else {
    // Dropped on another task -- find which column that task is in
    const overTask = typedTasks.find(t => t._id === over.id);
    if (!overTask) return;
    targetColumn = overTask.column as ColumnId;
  }

  // Only mutate if column actually changed
  if (task.column !== targetColumn) {
    moveToColumn({ id: taskId, column: targetColumn });
  }
}
```

### Sensor Configuration
```typescript
// Source: https://docs.dndkit.com/api-documentation/sensors/pointer (verified)
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  })
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-beautiful-dnd` | Deprecated by Atlassian (2022), use dnd-kit or hello-pangea/dnd | 2022 | Don't use react-beautiful-dnd for new projects |
| `@dnd-kit/core` monolithic API | New `@dnd-kit/react` v0.2.x (framework-agnostic rewrite) | 2024-2025 | New API is pre-1.0; old API remains stable and supported |
| React Query + manual optimistic sync | Convex native `.withOptimisticUpdate()` | N/A (Convex-native) | Eliminates entire class of snap-back bugs |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Deprecated by Atlassian in 2022. Use `@hello-pangea/dnd` if you want the same API, or `@dnd-kit` for modern approach.
- `@dnd-kit/react` v0.0.x - v0.1.x: Rapid iteration phase. v0.2.4 is current but still pre-1.0.

## Open Questions

1. **Within-column reordering: needed or not?**
   - What we know: Phase 3 requirements (TASK-04, TASK-05) only mention moving between columns. No ordering field exists in the schema.
   - What's unclear: Whether users expect to reorder tasks within a column (drag task A above task B in the same column).
   - Recommendation: Implement cross-column movement only. Within-column reordering requires an `order` field in the schema and significantly more complex drag handling. The current schema has no ordering field, and the roadmap doesn't mention it. If needed later, it's a separate phase.

2. **Keyboard accessibility for drag-and-drop**
   - What we know: dnd-kit has built-in KeyboardSensor with `sortableKeyboardCoordinates`. The success criteria don't mention keyboard DnD.
   - What's unclear: Whether keyboard drag-and-drop is required for this phase.
   - Recommendation: Add KeyboardSensor as a secondary sensor alongside PointerSensor. It's minimal extra code and significantly improves accessibility. But don't block the phase on it if it proves complex with cross-column movement.

## Sources

### Primary (HIGH confidence)
- `@dnd-kit/core` v6.3.1 npm registry -- verified peer deps `react: '>=16.8.0'`, installs cleanly with React 19.2.4
- `@dnd-kit/sortable` v10.0.0 npm registry -- verified peer deps `@dnd-kit/core: '^6.3.0'`
- `@dnd-kit/react` v0.2.4 npm registry -- verified peer deps `react: '^18.0.0 || ^19.0.0'`, pre-1.0
- https://docs.dndkit.com/presets/sortable -- multi-container pattern, useSortable API, DragOverlay
- https://docs.convex.dev/client/react/optimistic-updates -- `.withOptimisticUpdate()`, localStore API
- Codebase: `convex/tasks.ts` (current mutations), `src/components/Board.tsx` (current column structure)

### Secondary (MEDIUM confidence)
- https://github.com/clauderic/dnd-kit/discussions/1522 -- snap-back problem analysis and local state workaround (Convex has better solution)
- https://radzion.com/blog/kanban/ -- dnd-kit Kanban implementation reference
- https://github.com/clauderic/dnd-kit/issues/1194 -- dnd-kit maintenance status, new API roadmap

### Tertiary (LOW confidence)
- https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react -- ecosystem comparison (blog, not official)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - npm registry data verified directly, packages install cleanly with React 19.2.4, extensive community usage
- Architecture: HIGH - patterns verified against official dnd-kit docs and Convex docs, aligned with existing codebase structure
- Pitfalls: HIGH - snap-back is well-documented problem; Convex optimistic update solution verified against official docs; empty column issue documented in dnd-kit issues

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable libraries, unlikely to change significantly)
