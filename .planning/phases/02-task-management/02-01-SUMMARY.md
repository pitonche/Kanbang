---
phase: 02-task-management
plan: 01
subsystem: api, ui
tags: [convex, crud, react, typescript, Object.groupBy]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Convex schema (tasks table), Board/Column components, CSS theme tokens"
provides:
  - "Convex task CRUD functions (list, create, update, remove)"
  - "TaskCard component with priority-colored left border"
  - "Board wired to live Convex data via useQuery"
  - "Column rendering TaskCard list with empty state fallback"
  - "Priority color tokens (low/medium/high) in CSS theme"
affects: [02-task-management, 03-drag-and-drop, 04-search-and-filters, 05-auto-archive]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Object.groupBy for client-side task grouping by column", "searchText computed at write time for full-text search", "Convex useQuery for reactive data fetching"]

key-files:
  created: [convex/tasks.ts, src/components/TaskCard.tsx]
  modified: [src/components/Board.tsx, src/components/Column.tsx, src/index.css, tsconfig.app.json]

key-decisions:
  - "Cast useQuery result to Doc<tasks>[] for Object.groupBy type inference -- Convex query return type loses specificity through groupBy"
  - "Used void selectedTaskId to satisfy noUnusedLocals -- state prepared for Plan 02-02 task modal"

patterns-established:
  - "Convex mutations recompute searchText from title+notes on every write"
  - "Priority border colors via Tailwind theme tokens (border-l-priority-{level})"
  - "Client-side column grouping via Object.groupBy rather than per-column queries"

# Metrics
duration: 2min
completed: 2026-02-15
---

# Phase 2 Plan 1: Task CRUD and Data-Driven Board Summary

**Convex task CRUD functions with reactive Board rendering and priority-colored TaskCard component**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-15T09:53:44Z
- **Completed:** 2026-02-15T09:55:52Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Convex backend with list, create, update, remove functions -- all mutations recompute searchText
- TaskCard component rendering priority-colored left border (green=low, amber=medium, red=high)
- Board fetches real task data from Convex via useQuery and groups by column with Object.groupBy
- Column renders TaskCard list or empty state fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Convex task functions and update TypeScript config** - `1fb9cb7` (feat)
2. **Task 2: Create TaskCard component and wire Board/Column to render real tasks** - `e1cfa06` (feat)

## Files Created/Modified
- `convex/tasks.ts` - Task CRUD functions (list, create, update, remove) with searchText computation
- `src/components/TaskCard.tsx` - Card component with priority-colored left border and notes preview
- `src/components/Board.tsx` - Fetches tasks via useQuery, groups by column, passes to Column components
- `src/components/Column.tsx` - Renders TaskCard list or empty state, accepts tasks and onTaskClick props
- `src/index.css` - Priority color tokens (low=#22c55e, medium=#f59e0b, high=#ef4444)
- `tsconfig.app.json` - Updated lib from ES2020 to ES2024 for Object.groupBy support

## Decisions Made
- Cast useQuery result to `Doc<"tasks">[]` for Object.groupBy -- TypeScript's `Object.groupBy` infers `unknown` values when the source array type comes from Convex's query return type, which wraps the actual document type. A type assertion resolves this cleanly.
- Used `void selectedTaskId` to suppress noUnusedLocals -- the state hook is prepared for Plan 02-02's task modal integration rather than being added later.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Object.groupBy type inference with useQuery result**
- **Found during:** Task 2 (Board.tsx update)
- **Issue:** `Object.groupBy(tasks, (t) => t.column)` failed with TS18046 "'t' is of type 'unknown'" because the Convex useQuery return type doesn't carry through Object.groupBy's generic inference
- **Fix:** Added type assertion: `tasks as Doc<"tasks">[]` before passing to Object.groupBy
- **Files modified:** src/components/Board.tsx
- **Verification:** `bun run build` passes with zero errors
- **Committed in:** e1cfa06 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Type assertion necessary for TypeScript strict mode compatibility. No scope creep.

## Issues Encountered
None beyond the type inference deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Task CRUD functions ready for modal form (Plan 02-02)
- Board renders real data -- quick-add and task editing can be layered on top
- selectedTaskId state already declared for Plan 02-02's task detail modal
- Column id prop available for drag-and-drop integration in Phase 3

## Self-Check: PASSED

All 6 files verified present. Both task commits (1fb9cb7, e1cfa06) verified in git log.

---
*Phase: 02-task-management*
*Completed: 2026-02-15*
