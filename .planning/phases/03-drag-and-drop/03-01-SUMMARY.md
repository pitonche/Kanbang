---
phase: 03-drag-and-drop
plan: 01
subsystem: ui
tags: [dnd-kit, convex, react, drag-and-drop]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Convex schema with column union type and tasks table"
  - phase: 02-task-management
    provides: "TaskCard component for visual reference"
provides:
  - "moveToColumn Convex mutation with completedAt business logic"
  - "TaskCardOverlay presentational component for DragOverlay"
  - "dnd-kit packages installed (@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities)"
affects: [03-drag-and-drop, 05-auto-archive]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/core@6.3.1", "@dnd-kit/sortable@10.0.0", "@dnd-kit/utilities@3.2.2"]
  patterns: ["Presentational overlay component (no drag hooks) for DragOverlay"]

key-files:
  created: ["src/components/TaskCardOverlay.tsx"]
  modified: ["convex/tasks.ts", "package.json"]

key-decisions:
  - "TaskCardOverlay is purely presentational -- no dnd-kit hooks to avoid duplicate IDs in DragOverlay"
  - "moveToColumn mutation uses undefined (not null) to clear completedAt, matching Convex optional field semantics"

patterns-established:
  - "Overlay components: separate presentational component for DragOverlay, mirroring the draggable but without hooks"
  - "Column move mutation: dedicated mutation for column changes, separate from general update (no searchText recompute needed)"

# Metrics
duration: 1min
completed: 2026-02-15
---

# Phase 3 Plan 1: DnD Foundation Summary

**dnd-kit packages installed with moveToColumn mutation (completedAt logic) and TaskCardOverlay presentational component**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-15T10:25:06Z
- **Completed:** 2026-02-15T10:26:33Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Installed @dnd-kit/core, @dnd-kit/sortable, and @dnd-kit/utilities as project dependencies
- Added moveToColumn mutation that sets completedAt on move to done and clears it on move out of done
- Created TaskCardOverlay presentational component matching TaskCard visuals with shadow-lg and rotate-[2deg] drag appearance

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dnd-kit packages and add moveToColumn mutation** - `fd1a22f` (feat)
2. **Task 2: Create TaskCardOverlay presentational component** - `05e60ac` (feat)

## Files Created/Modified
- `package.json` - Added @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities dependencies
- `bun.lock` - Updated lockfile with dnd-kit packages
- `convex/tasks.ts` - Added moveToColumn mutation with completedAt business logic
- `src/components/TaskCardOverlay.tsx` - Presentational task card for DragOverlay (no drag hooks)

## Decisions Made
- TaskCardOverlay is purely presentational with no dnd-kit hook imports, preventing duplicate ID issues when rendered inside DragOverlay
- moveToColumn uses `undefined` to clear completedAt (matching Convex optional field semantics) rather than null
- Dedicated moveToColumn mutation separate from general update mutation since column moves do not affect searchText

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- bun was not on PATH in the sandbox shell; resolved by adding `/Users/ciciban/.bun/bin` to PATH

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- dnd-kit packages ready for import in Board.tsx
- moveToColumn mutation deployed and ready for drag-end handler
- TaskCardOverlay ready for DragOverlay rendering in Plan 03-02

## Self-Check: PASSED

- FOUND: src/components/TaskCardOverlay.tsx
- FOUND: convex/tasks.ts
- FOUND: 03-01-SUMMARY.md
- FOUND: fd1a22f (Task 1 commit)
- FOUND: 05e60ac (Task 2 commit)

---
*Phase: 03-drag-and-drop*
*Completed: 2026-02-15*
