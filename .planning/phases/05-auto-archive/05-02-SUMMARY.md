---
phase: 05-auto-archive
plan: 02
subsystem: ui
tags: [react, convex, useQuery, view-switching, search, archive-view, keyboard-shortcuts]

# Dependency graph
requires:
  - phase: 05-auto-archive
    provides: "listArchived query, archived column in schema, searchText field on tasks"
  - phase: 04-search-and-filters
    provides: "SearchBar component with ref forwarding, useDebounce hook, toolbar pattern"
  - phase: 02-task-management
    provides: "TaskModal component for viewing/editing task details"
provides:
  - "ArchiveView component with searchable archived task list and TaskModal integration"
  - "App-level view switching between Board and Archive views via nav bar"
  - "QuickAdd guarded to board view only"
  - "N shortcut guarded to board view, / shortcut works on both views"
affects: [06-polish-and-deploy (UI polish, routing)]

# Tech tracking
tech-stack:
  added: []
  patterns: [AppView union type for view state, conditional rendering based on view state, nav bar with active tab styling]

key-files:
  created:
    - src/components/ArchiveView.tsx
  modified:
    - src/App.tsx

key-decisions:
  - "Client-side search filtering on searchText field rather than server-side query for archive search"
  - "Nav bar above view content with active border-b-2 styling pattern"
  - "useEffect dependency on view state for keyboard shortcut guard correctness"

patterns-established:
  - "View switching pattern: AppView union type + useState + conditional rendering"
  - "Nav active tab: border-b-2 border-slate-800 for active, text-slate-500 for inactive"
  - "Shortcut guarding: keyboard useEffect depends on view state to scope shortcuts per view"

# Metrics
duration: 1min
completed: 2026-02-15
---

# Phase 5 Plan 2: Archive View UI Summary

**ArchiveView component with client-side search filtering on archived tasks, plus App.tsx nav bar for board/archive view switching with keyboard shortcut scoping**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-15T12:05:31Z
- **Completed:** 2026-02-15T12:06:43Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- ArchiveView component consuming listArchived query with client-side search filtering via searchText field and useDebounce
- App.tsx nav bar with Kanbang branding and Board/Archive tab buttons with active state styling
- QuickAdd rendering and "N" shortcut scoped to board view only; "/" shortcut works on both views
- TaskModal integration in archive view for viewing archived task details

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ArchiveView component** - `a990649` (feat)
2. **Task 2: Add view switching and navigation to App.tsx** - `9186f9e` (feat)

## Files Created/Modified
- `src/components/ArchiveView.tsx` - Searchable archived task list with loading/empty states, TaskModal integration, SearchBar reuse
- `src/App.tsx` - AppView state, nav bar with Board/Archive tabs, conditional view rendering, QuickAdd and "N" shortcut guarded to board view

## Decisions Made
- Client-side search filtering on the existing `searchText` field rather than adding a server-side archive search query -- keeps it simple since archive volume is bounded
- Nav bar placed above view content (not inside Board/ArchiveView) for consistent positioning across views
- `useEffect` dependency array for keyboard handler includes `view` to ensure shortcut guard re-evaluates on view changes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Auto-archive feature is complete end-to-end: backend archiving (Plan 01) + archive view UI (Plan 02)
- Phase 05 complete -- ready for Phase 06: Polish and Deploy
- All ARCH requirements satisfied: auto-archive after 14 days, archive view with search, task detail viewing

## Self-Check: PASSED

All files exist, all commits verified, all key content confirmed in source files.

---
*Phase: 05-auto-archive*
*Completed: 2026-02-15*
