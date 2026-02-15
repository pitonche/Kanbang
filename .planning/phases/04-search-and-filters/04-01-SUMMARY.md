---
phase: 04-search-and-filters
plan: 01
subsystem: ui, api
tags: [convex, search, bm25, debounce, react, full-text-search]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "tasks table with searchText field and search_text search index"
provides:
  - "tasks.search Convex query with BM25 full-text search"
  - "useDebounce generic hook"
  - "SearchBar component with clear button"
  - "Board toolbar with conditional search results view"
affects: [04-02 (keyboard shortcuts for search focus), 05-auto-archive (search includes archived tasks)]

# Tech tracking
tech-stack:
  added: []
  patterns: [debounced search with Convex skip pattern, conditional board view (search vs columns)]

key-files:
  created:
    - src/hooks/useDebounce.ts
    - src/components/SearchBar.tsx
  modified:
    - convex/tasks.ts
    - src/components/Board.tsx

key-decisions:
  - "No column filter on search query -- returns tasks from all columns including Done (SRCH-02 compliance)"
  - "Debounce delay set to 300ms -- responsive without excessive queries"
  - "Search results capped at 20 via .take(20) -- sufficient for personal kanban"
  - "HTML entities for curly quotes in empty-state message for typographic consistency"

patterns-established:
  - "useDebounce hook pattern: generic typed hook at src/hooks/ for value debouncing"
  - "Toolbar pattern: flex items-center gap-4 div above board content for toolbar widgets"
  - "Conditional view pattern: isSearchActive toggles between search results and board columns"
  - "Convex skip pattern: useQuery(api.x.y, condition ? args : 'skip') for conditional queries"

# Metrics
duration: 2min
completed: 2026-02-15
---

# Phase 4 Plan 1: Full-Text Search Summary

**BM25 full-text search via Convex withSearchIndex, debounced SearchBar in toolbar, conditional search results view replacing board columns**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-15T10:52:15Z
- **Completed:** 2026-02-15T10:54:08Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Full-text search query using Convex's withSearchIndex returning BM25-ranked results across all tasks
- Debounced search input (300ms) with magnifying glass icon and clear button
- Board toolbar with SearchBar; search results displayed as clickable card list replacing column view
- Search results show task title, column label, and truncated notes; clicking opens TaskModal

## Task Commits

Each task was committed atomically:

1. **Task 1: Add search query and useDebounce hook** - `5eac9e5` (feat)
2. **Task 2: Add SearchBar component and integrate search into Board** - `426e9e3` (feat)

## Files Created/Modified
- `convex/tasks.ts` - Added `search` query using withSearchIndex for BM25 full-text search (takes 20 results)
- `src/hooks/useDebounce.ts` - Generic useDebounce hook with configurable delay
- `src/components/SearchBar.tsx` - Controlled search input with magnifying glass SVG icon and clear button
- `src/components/Board.tsx` - Added toolbar with SearchBar, conditional rendering of search results vs board columns

## Decisions Made
- No column filter on search query -- all tasks (including Done) are searchable, satisfying SRCH-02
- 300ms debounce delay balances responsiveness with query efficiency
- Search results capped at 20 -- sufficient for a personal kanban tool
- Used HTML entities (&ldquo;/&rdquo;) for curly quotes in the empty-state message

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Search foundation complete, ready for Plan 04-02 (keyboard shortcuts, "/" to focus search)
- SearchBar placeholder already hints at "/" shortcut
- Board toolbar div ready to receive additional filter widgets in future

## Self-Check: PASSED

All 5 files verified present. Both task commits (5eac9e5, 426e9e3) verified in git log.

---
*Phase: 04-search-and-filters*
*Completed: 2026-02-15*
