---
phase: 05-auto-archive
plan: 01
subsystem: database, api
tags: [convex, compound-index, mutation, auto-archive, useEffect, useRef]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Convex schema with column union, archivedAt optional field, by_column index"
  - phase: 03-drag-and-drop
    provides: "moveToColumn mutation that sets completedAt on Done tasks"
provides:
  - "archived literal in column union for schema-level archive support"
  - "by_column_completedAt compound index for efficient date-range queries"
  - "archiveOldDone mutation to batch-archive Done tasks older than 14 days"
  - "listArchived query returning all archived tasks via by_column index"
  - "list query now excludes archived tasks from board results"
  - "App-level archive trigger on mount with StrictMode guard"
affects: [05-auto-archive plan 02 (archive view UI), search results (archived tasks show column=archived)]

# Tech tracking
tech-stack:
  added: []
  patterns: [compound index for date-range queries, useRef StrictMode guard for one-time mutations, fire-and-forget mutation pattern]

key-files:
  created: []
  modified:
    - convex/schema.ts
    - convex/tasks.ts
    - src/App.tsx

key-decisions:
  - "Regular mutation (not internalMutation) for archiveOldDone since it is called from client"
  - "moveToColumn validator unchanged -- users cannot drag to archived column"
  - "Fire-and-forget pattern for archive trigger -- no await needed, Board reactively updates"

patterns-established:
  - "Compound index pattern: by_column_completedAt enables eq+lt range queries"
  - "StrictMode guard: useRef(false) prevents double mutation in development"
  - "Server-side exclusion: list query filters archived tasks before sending to client"

# Metrics
duration: 1min
completed: 2026-02-15
---

# Phase 5 Plan 1: Auto-Archive Backend Summary

**Compound index by_column_completedAt, archiveOldDone mutation for 14-day Done tasks, list query excluding archived, and App.tsx mount trigger with StrictMode guard**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-15T12:01:56Z
- **Completed:** 2026-02-15T12:03:12Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Schema extended with "archived" column literal and by_column_completedAt compound index for efficient date-range queries
- archiveOldDone mutation finds Done tasks with completedAt older than 14 days and patches them to archived with archivedAt timestamp
- list query now excludes archived tasks so the board stays clean
- listArchived query returns all archived tasks for the upcoming Archive view (Plan 02)
- App.tsx triggers archiveOldDone once on mount with useRef StrictMode guard

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema update and Convex backend functions** - `3c072ab` (feat)
2. **Task 2: Trigger archive on app load in App.tsx** - `8800832` (feat)

## Files Created/Modified
- `convex/schema.ts` - Added "archived" to column union, added by_column_completedAt compound index
- `convex/tasks.ts` - Modified list to exclude archived, added archiveOldDone mutation and listArchived query
- `src/App.tsx` - Added useMutation import, archive trigger useEffect with StrictMode guard

## Decisions Made
- Used regular `mutation` (not `internalMutation`) for archiveOldDone since it is called from the client via useMutation
- Left moveToColumn mutation's column validator with only 6 board columns -- users cannot drag tasks to archived
- Fire-and-forget pattern for the archive trigger -- no need to await, Board reactively updates via useQuery subscription

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Archive backend is complete and working: archiveOldDone mutation, listArchived query, filtered list query
- Ready for Plan 02: Archive View UI with view switching, navigation, and archived task browsing
- The listArchived query is ready for the ArchiveView component to consume

## Self-Check: PASSED

All files exist, all commits verified, all key content confirmed in source files.

---
*Phase: 05-auto-archive*
*Completed: 2026-02-15*
