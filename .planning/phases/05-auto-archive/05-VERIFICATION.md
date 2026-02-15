---
phase: 05-auto-archive
verified: 2026-02-15T12:30:00Z
status: human_needed
score: 8/8
human_verification:
  - test: "14-day auto-archive behavior"
    expected: "Create a Done task, manually set completedAt to 15 days ago in Convex dashboard, reload app, task disappears from Done column and appears in Archive view"
    why_human: "Requires simulating old timestamps and observing runtime behavior across app reload"
  - test: "Archive view navigation"
    expected: "Click Archive nav link, Archive view renders with searchable task list, click Board nav link, returns to board"
    why_human: "Visual UI interaction and view state switching verification"
  - test: "Archive search filtering"
    expected: "Type search term in Archive view, task list filters to matching titles/notes, clear search shows all archived tasks"
    why_human: "Client-side debounced search with live filtering requires interactive testing"
  - test: "TaskModal in Archive view"
    expected: "Click archived task, TaskModal opens with task details (title, notes, cadence, priority, timestamps), close modal returns to Archive view"
    why_human: "Modal interaction and data display verification"
  - test: "Keyboard shortcuts scoping"
    expected: "Press N on board view opens QuickAdd, press N on Archive view does nothing, press / on either view focuses search input"
    why_human: "Keyboard event handling across view states requires interactive testing"
---

# Phase 5: Auto-Archive Verification Report

**Phase Goal:** The board stays clean automatically — Done tasks archive themselves, and users can browse their full history in a separate view

**Verified:** 2026-02-15T12:30:00Z

**Status:** human_needed

**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | When the app loads, Done tasks with completedAt older than 14 days are automatically moved to archived status | ✓ VERIFIED | App.tsx triggers archiveOldDone mutation on mount (L16, L19-24), mutation queries Done tasks older than 14 days via by_column_completedAt index (tasks.ts L146-151), patches to archived with archivedAt timestamp (L154-158) |
| 2 | Archived tasks have an archivedAt timestamp recorded | ✓ VERIFIED | archiveOldDone mutation sets archivedAt: now (tasks.ts L156), schema includes archivedAt: v.optional(v.number()) (schema.ts L38) |
| 3 | User can navigate to an Archived view that shows all archived tasks separate from the board columns | ✓ VERIFIED | App.tsx has Archive nav button (L78-87), view state toggles between "board" and "archive" (L8, L11, L90-94), ArchiveView component renders archived task list (ArchiveView.tsx L14, L69-93) |
| 4 | User can search and browse archived tasks within the Archived view | ✓ VERIFIED | ArchiveView has SearchBar component (L47-51), client-side filtering via searchText field and useDebounce (L15-16, L31-37), shows filtered count and task list (L56-93) |
| 5 | User can click an archived task to view its details in the TaskModal | ✓ VERIFIED | Each archived task button sets selectedTaskId on click (ArchiveView.tsx L73), TaskModal renders with selectedTask from archivedTasks array (L39-40, L98) |
| 6 | Keyboard shortcut N only opens QuickAdd on the board view, not in the archive view | ✓ VERIFIED | N shortcut handler checks view === "board" (App.tsx L49), QuickAdd component only renders when view === "board" (L96-98), useEffect depends on view state (L62) |
| 7 | Keyboard shortcut / focuses the search input on both views | ✓ VERIFIED | / shortcut handler has no view guard (App.tsx L54-57), searchInputRef forwarded to both Board and ArchiveView (L91, L93), ArchiveView accepts onSearchInputRef prop and passes to SearchBar (ArchiveView.tsx L10, L50) |
| 8 | Archived tasks do not appear on the board columns | ✓ VERIFIED | list query filters out archived tasks via .filter(q => q.neq(q.field("column"), "archived")) (tasks.ts L9), Board consumes list query for columns, archived tasks excluded from results |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `convex/schema.ts` | archived literal in column union, by_column_completedAt compound index | ✓ VERIFIED | v.literal("archived") at L18, .index("by_column_completedAt", ["column", "completedAt"]) at L45 |
| `convex/tasks.ts` | archiveOldDone mutation, listArchived query, list query excluding archived | ✓ VERIFIED | archiveOldDone export at L140-161 (141 lines), listArchived export at L163-171 (9 lines), list query excludes archived at L9, all substantive implementations |
| `src/App.tsx` | Archive trigger on mount via useEffect with StrictMode guard, view switching with nav UI | ✓ VERIFIED | archiveOldDone useMutation at L16, useEffect with archiveTriggered.current guard at L19-24, AppView type and view state at L8-11, nav bar at L66-88, conditional rendering at L90-94 |
| `src/components/ArchiveView.tsx` | Archive view with search and task list, TaskModal integration | ✓ VERIFIED | 102 lines, useQuery(api.tasks.listArchived) at L14, SearchBar at L47-51, client-side filtering at L31-37, task list at L69-93, TaskModal at L98, all wired and substantive |
| `src/hooks/useDebounce.ts` | Debounce hook for search filtering | ✓ VERIFIED | 13 lines, used by ArchiveView at L16, substantive implementation with setTimeout cleanup |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| src/App.tsx | convex/tasks.ts (archiveOldDone) | useMutation + useEffect on mount | ✓ WIRED | useMutation(api.tasks.archiveOldDone) at L16, called in useEffect at L22 with StrictMode guard |
| convex/tasks.ts (archiveOldDone) | convex/schema.ts (by_column_completedAt index) | withIndex query for done tasks older than 14 days | ✓ WIRED | withIndex("by_column_completedAt") at L148, eq("column", "done").lt("completedAt", fourteenDaysAgo) at L149, uses compound index efficiently |
| convex/tasks.ts (list) | board columns | filter excluding archived column | ✓ WIRED | .filter(q => q.neq(q.field("column"), "archived")) at L9, ensures archived tasks never appear on board |
| src/components/ArchiveView.tsx | convex/tasks.ts (listArchived) | useQuery | ✓ WIRED | useQuery(api.tasks.listArchived) at L14, result stored in archivedTasks state, rendered in task list |
| src/App.tsx | src/components/ArchiveView.tsx | conditional rendering based on view state | ✓ WIRED | view === "archive" conditional at L92-93, ArchiveView imported at L5, searchInputRef forwarded at L93 |
| src/components/ArchiveView.tsx | src/components/SearchBar.tsx | reused SearchBar component for archive search | ✓ WIRED | SearchBar imported at L5, rendered at L47-51 with value, onChange, inputRef props |
| src/components/ArchiveView.tsx | src/components/TaskModal.tsx | TaskModal for viewing archived task details | ✓ WIRED | TaskModal imported at L6, rendered at L98 with selectedTask from archivedTasks array (L39-40) |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| ARCH-01: Done tasks older than 14 days are automatically moved to Archived on app load | ✓ SATISFIED | All supporting truths verified: archiveOldDone mutation, compound index, App.tsx mount trigger |
| ARCH-02: Archived tasks have archivedAt timestamp set | ✓ SATISFIED | archivedAt field in schema, set in archiveOldDone mutation, displayed in ArchiveView |
| ARCH-03: User can access a separate Archived view (not a board column) | ✓ SATISFIED | ArchiveView component, nav bar with Archive link, view state switching in App.tsx |
| ARCH-04: User can search and browse archived tasks | ✓ SATISFIED | SearchBar in ArchiveView, client-side filtering, debounced search, task list rendering |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/components/SearchBar.tsx | 28 | placeholder text | ℹ️ Info | UI text, not a code stub |
| src/components/QuickAdd.tsx | 61 | placeholder text | ℹ️ Info | UI text, not a code stub |

**No blocker or warning anti-patterns found.** All implementations are substantive and wired.

### Human Verification Required

#### 1. 14-day auto-archive behavior

**Test:** Create a Done task, manually set its completedAt timestamp to 15 days ago in the Convex dashboard, reload the app, and observe the task's behavior.

**Expected:** The task disappears from the Done column on the board and appears in the Archive view with an archivedAt timestamp.

**Why human:** Requires simulating old timestamps in the database and observing runtime behavior across app reload. Automated tests cannot easily manipulate time-based database queries without mocking infrastructure.

#### 2. Archive view navigation

**Test:** Click the "Archive" nav link in the header, observe the Archive view renders, then click the "Board" nav link to return.

**Expected:** Clicking "Archive" shows the ArchiveView component with searchable archived task list. The "Archive" link has active styling (border-b-2 border-slate-800). Clicking "Board" returns to the board view. The "Board" link gets active styling.

**Why human:** Visual UI interaction, view state switching, and CSS active state styling require human observation. Nav bar layout and button styling can't be verified programmatically without a browser automation framework.

#### 3. Archive search filtering

**Test:** Navigate to the Archive view, type a search term in the search bar, observe the task list filtering, then clear the search to show all archived tasks.

**Expected:** Typing filters the task list to show only tasks matching the search term in their title or notes. The count updates (e.g., "3 archived tasks" → "1 archived task"). Clearing the search restores all archived tasks. Filtering is debounced (no lag on fast typing).

**Why human:** Client-side debounced search with live filtering requires interactive testing. Debounce behavior (300ms delay) and reactive UI updates can't be verified without a timing-sensitive test environment.

#### 4. TaskModal in Archive view

**Test:** Click an archived task in the Archive view list, observe the TaskModal opens, inspect the displayed data (title, notes, cadence, priority, completedAt, archivedAt timestamps), then close the modal.

**Expected:** TaskModal opens with full task details. All fields display correctly. The archivedAt timestamp is shown. Clicking close or outside the modal returns to the Archive view with the modal closed.

**Why human:** Modal interaction (open/close), data display accuracy, and timestamp formatting require visual inspection and user interaction testing.

#### 5. Keyboard shortcuts scoping

**Test:** Navigate to the board view, press "N" to verify QuickAdd opens. Navigate to the Archive view, press "N" to verify nothing happens. Press "/" on either view to verify the search input focuses.

**Expected:** 
- On board view: "N" opens QuickAdd dialog
- On Archive view: "N" does nothing (no QuickAdd)
- On both views: "/" focuses the search input

**Why human:** Keyboard event handling across view states requires interactive testing. Verifying that shortcuts are correctly scoped (N only on board, / on both) needs user input and focus state observation.

---

## Summary

**All automated checks passed.** Phase 05 goal achieved with all must-haves verified:

- **Backend archiving:** archiveOldDone mutation with compound index, 14-day threshold, archivedAt timestamp
- **Board exclusion:** list query filters out archived tasks, keeping board clean
- **Archive view UI:** Dedicated ArchiveView component with search, browse, and TaskModal integration
- **Navigation:** App-level view switching with nav bar and active state styling
- **Keyboard shortcuts:** N scoped to board view only, / works on both views

**Human verification required** for 5 items involving visual UI, user interaction, time-based behavior, and keyboard event handling. These are standard UI verification tasks that require a running app and human observation.

No gaps found. All requirements satisfied. Ready for Phase 06: Polish and Deploy.

---

_Verified: 2026-02-15T12:30:00Z_
_Verifier: Claude (gsd-verifier)_
