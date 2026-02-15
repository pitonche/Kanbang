# Roadmap: Kanbang

## Overview

Kanbang delivers a personal Kanban board in 6 phases, progressing from data model and static board through task management, drag-and-drop interaction, search, auto-archiving, and finally responsive polish with production deployment. The sequence isolates drag-and-drop (highest technical risk) into its own phase and ensures the schema is correct from day one to prevent painful migrations around search indexes and archive logic.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Convex schema, project scaffolding, and static board with 6 columns (completed 2026-02-15)
- [x] **Phase 2: Task Management** - Full task CRUD with modal editing and keyboard quick-add (completed 2026-02-15)
- [ ] **Phase 3: Drag and Drop** - Move tasks between columns via drag-and-drop with optimistic UI
- [ ] **Phase 4: Search and Filters** - Full-text search across active and archived tasks with quick filters
- [ ] **Phase 5: Auto-Archive** - Automatic archiving of Done tasks and dedicated archive view
- [ ] **Phase 6: Polish and Deploy** - Responsive layout, column counts, and Vercel deployment

## Phase Details

### Phase 1: Foundation
**Goal**: User sees a working Kanban board with 6 columns and the entire data model is in place for all future phases
**Depends on**: Nothing (first phase)
**Requirements**: BOARD-01
**Success Criteria** (what must be TRUE):
  1. User opens the app and sees a board with 6 labeled columns: Inbox, Backlog, In Progress, Needs Info, Blocked, Done
  2. Convex schema exists with all task fields (title, notes, column, cadence, priority, createdAt, updatedAt, completedAt, archivedAt, searchText) and indexes (by_column, search on searchText)
  3. App runs locally via Vite dev server with Convex backend connected
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Scaffold project from Convex template, install with bun, replace schema with complete Kanbang tasks table
- [x] 01-02-PLAN.md -- Replace template UI with static 6-column Kanban board (Board + Column components, Tailwind theme)

### Phase 2: Task Management
**Goal**: User can create, view, edit, and delete tasks — the board becomes a functional tool for capturing and organizing work
**Depends on**: Phase 1
**Requirements**: TASK-01, TASK-02, TASK-03, TASK-06, TASK-07
**Success Criteria** (what must be TRUE):
  1. User can create a task with title (required), notes (optional), cadence, and priority, and it appears in the Inbox column
  2. User can click a task card to open a detail modal, edit any field, and see changes reflected on the board
  3. User can delete a task and it is permanently removed from the board
  4. Task cards display a color indicator for priority level (low/medium/high)
  5. User can press "N" anywhere on the board to open quick-add with cursor focused in the title field
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md -- Convex task CRUD functions, TaskCard with priority colors, Board/Column wired to real data
- [x] 02-02-PLAN.md -- TaskModal for edit/delete, QuickAdd form with N keyboard shortcut

### Phase 3: Drag and Drop
**Goal**: User can move tasks between columns by dragging and dropping, making the board feel like a real Kanban tool
**Depends on**: Phase 2
**Requirements**: TASK-04, TASK-05
**Success Criteria** (what must be TRUE):
  1. User can drag a task card from one column and drop it into another column, and the task stays in the new column
  2. Moving a task to the Done column automatically sets its completedAt timestamp
  3. Drag interaction is smooth with no visible snap-back or flicker after dropping
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md -- Install dnd-kit, add moveToColumn mutation with completedAt logic, create TaskCardOverlay
- [ ] 03-02-PLAN.md -- Wire DndContext into Board, useDroppable into Column, useSortable into TaskCard with optimistic updates

### Phase 4: Search and Filters
**Goal**: User can find any task — active or archived — by keyword, and quickly filter to today's/this week's/this month's work
**Depends on**: Phase 1 (schema with searchText field)
**Requirements**: SRCH-01, SRCH-02, SRCH-03
**Success Criteria** (what must be TRUE):
  1. User can type a keyword into a search bar and see matching tasks from both active and archived tasks
  2. Search matches against both task title and notes content
  3. User can click quick-filter buttons (Today / This Week / This Month) to filter tasks by cadence
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Auto-Archive
**Goal**: The board stays clean automatically — Done tasks archive themselves, and users can browse their full history in a separate view
**Depends on**: Phase 3 (completedAt set on Done move)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04
**Success Criteria** (what must be TRUE):
  1. When the app loads, Done tasks with completedAt older than 14 days are automatically moved to archived status
  2. Archived tasks have an archivedAt timestamp recorded
  3. User can navigate to an Archived view that shows all archived tasks (separate from the board columns)
  4. User can search and browse archived tasks within the Archived view
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Polish and Deploy
**Goal**: The app is responsive on mobile, visually polished, and deployed to a public URL
**Depends on**: Phase 5
**Requirements**: BOARD-02, BOARD-03, DEPL-01
**Success Criteria** (what must be TRUE):
  1. Board layout adapts to mobile browser viewports and remains usable (columns scrollable or stacked)
  2. Each column header displays the count of tasks it contains
  3. App is deployed to Vercel and accessible via a public URL with Convex backend connected
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | ✓ Complete | 2026-02-15 |
| 2. Task Management | 2/2 | ✓ Complete | 2026-02-15 |
| 3. Drag and Drop | 0/2 | Not started | - |
| 4. Search and Filters | 0/TBD | Not started | - |
| 5. Auto-Archive | 0/TBD | Not started | - |
| 6. Polish and Deploy | 0/TBD | Not started | - |
