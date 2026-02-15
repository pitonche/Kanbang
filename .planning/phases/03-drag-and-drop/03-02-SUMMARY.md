---
phase: 03-drag-and-drop
plan: 02
subsystem: ui
tags: [dnd-kit, convex, react, drag-and-drop, optimistic-update]

# Dependency graph
requires:
  - phase: 03-drag-and-drop
    plan: 01
    provides: "dnd-kit packages, moveToColumn mutation, TaskCardOverlay component"
  - phase: 02-task-management
    provides: "Board/Column/TaskCard components and task CRUD"
provides:
  - "Fully functional cross-column drag-and-drop between all 6 columns"
  - "Optimistic update on moveToColumn preventing snap-back flicker"
  - "DragOverlay with TaskCardOverlay for smooth drag visual"
  - "PointerSensor with distance:8 differentiating click vs drag"
affects: [05-auto-archive]

# Tech tracking
tech-stack:
  added: []
  patterns: ["DndContext at Board level with centralized drag handlers", "Optimistic update via .withOptimisticUpdate() patching localStore", "useSortable per card + useDroppable per column for cross-column moves"]

key-files:
  created: []
  modified: ["src/components/Board.tsx", "src/components/Column.tsx", "src/components/TaskCard.tsx"]

key-decisions:
  - "PointerSensor distance:8 prevents click-vs-drag conflict without touch delay"
  - "Optimistic update casts getQuery result to Doc<tasks>[] for strict mode compatibility"
  - "Column detection in handleDragEnd checks COLUMNS ids first, then falls back to task lookup"

patterns-established:
  - "Drag handler pattern: handleDragStart sets activeTask for overlay, handleDragEnd resolves target column and calls mutation"
  - "Optimistic update pattern: getQuery -> map with column/timestamp patches -> setQuery"

# Metrics
duration: 2min
completed: 2026-02-15
---

# Phase 3 Plan 2: DnD Board Wiring Summary

**Cross-column drag-and-drop wired into Board/Column/TaskCard with DndContext, useSortable, useDroppable, and Convex optimistic updates**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-15T10:28:53Z
- **Completed:** 2026-02-15T10:31:20Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Wired DndContext into Board.tsx with closestCorners collision detection, PointerSensor (distance:8), drag start/end handlers, and DragOverlay rendering TaskCardOverlay
- Added optimistic moveToColumn mutation that patches local Convex cache with column, updatedAt, and completedAt changes to prevent snap-back
- Made each Column a droppable target via useDroppable and wrapped tasks in SortableContext for proper item tracking
- Made each TaskCard a sortable drag source via useSortable with CSS transform, transition, and opacity feedback

## Task Commits

Each task was committed atomically:

1. **Task 1: Add DndContext, DragOverlay, and optimistic moveToColumn to Board.tsx** - `892b677` (feat)
2. **Task 2: Add useDroppable and SortableContext to Column.tsx** - `c93e886` (feat)
3. **Task 3: Add useSortable to TaskCard.tsx for drag interaction** - `e9c4b61` (feat)

## Files Created/Modified
- `src/components/Board.tsx` - DndContext wrapper, PointerSensor, drag handlers, optimistic moveToColumn, DragOverlay with TaskCardOverlay
- `src/components/Column.tsx` - useDroppable with column id, SortableContext wrapping task list
- `src/components/TaskCard.tsx` - useSortable with task._id, CSS transform/transition/opacity for drag feedback

## Decisions Made
- PointerSensor with distance:8 activation constraint differentiates click from drag without adding touch delay
- Optimistic update explicitly casts localStore.getQuery result to Doc<"tasks">[] | undefined for tsc -b strict mode compatibility
- handleDragEnd checks if over.id matches a COLUMNS id first (empty column drop), then falls back to finding the over task's column
- TaskModal kept outside DndContext since it is a dialog overlay, not a drag participant

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed implicit any type in optimistic update callback**
- **Found during:** Task 3 verification (bun run build)
- **Issue:** `localStore.getQuery(api.tasks.list, {})` returned untyped result; `tsc --noEmit` passed but `tsc -b` (used by build) flagged implicit any on map callback parameter
- **Fix:** Added explicit cast: `as Doc<"tasks">[] | undefined`
- **Files modified:** src/components/Board.tsx
- **Verification:** `bun run build` passes after fix
- **Committed in:** `7f0e98e`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type cast necessary for strict build mode. No scope creep.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full drag-and-drop between all 6 columns is functional
- Optimistic updates prevent snap-back flicker with Convex reactive queries
- Phase 3 (Drag and Drop) is complete -- ready for Phase 4 (Search and Filters)

## Self-Check: PASSED

- FOUND: src/components/Board.tsx
- FOUND: src/components/Column.tsx
- FOUND: src/components/TaskCard.tsx
- FOUND: 03-02-SUMMARY.md
- FOUND: 892b677 (Task 1 commit)
- FOUND: c93e886 (Task 2 commit)
- FOUND: 7f0e98e (Deviation fix commit)
- FOUND: e9c4b61 (Task 3 commit)

---
*Phase: 03-drag-and-drop*
*Completed: 2026-02-15*
