# Requirements: Kanbang

**Defined:** 2026-02-15
**Core Value:** Add a task in seconds, find any past task by keyword in seconds — the board stays clean because Done items auto-archive, but history is never lost.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Board

- [ ] **BOARD-01**: User sees a Kanban board with 6 fixed columns: Inbox, Backlog, In Progress, Needs Info, Blocked, Done
- [ ] **BOARD-02**: Board layout is responsive and usable on mobile browsers
- [ ] **BOARD-03**: Each column displays a count of tasks it contains

### Tasks

- [ ] **TASK-01**: User can create a task with title (required), notes (optional), cadence (daily/weekly/monthly/none), and priority (low/medium/high)
- [ ] **TASK-02**: User can edit a task via a modal/slide-out detail panel
- [ ] **TASK-03**: User can delete a task
- [ ] **TASK-04**: User can drag and drop tasks between columns
- [ ] **TASK-05**: Moving a task to Done automatically sets completedAt timestamp
- [ ] **TASK-06**: Tasks display priority as a color indicator on the card
- [ ] **TASK-07**: User can press "N" to open quick-add with cursor in title field

### Search

- [ ] **SRCH-01**: User can search tasks by keyword across title and notes
- [ ] **SRCH-02**: Search results include both active and archived tasks
- [ ] **SRCH-03**: User can filter tasks by cadence using quick-filter buttons: Today / This Week / This Month

### Archive

- [ ] **ARCH-01**: Done tasks older than 14 days are automatically moved to Archived on app load
- [ ] **ARCH-02**: Archived tasks have archivedAt timestamp set
- [ ] **ARCH-03**: User can access a separate Archived view (not a board column)
- [ ] **ARCH-04**: User can search and browse archived tasks

### Deployment

- [ ] **DEPL-01**: App is deployed to Vercel and accessible via URL

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Search & Filtering

- **FILT-01**: User can filter by column, cadence, date range, and priority simultaneously
- **FILT-02**: User can sort tasks by priority, createdAt, or cadence

### Task Management

- **TMGT-01**: User can undo task deletion (toast-based undo)
- **TMGT-02**: User can drag and drop to reorder tasks within a column
- **TMGT-03**: User can un-archive a task (move back to board)

### Polish

- **PLSH-01**: Dark mode toggle
- **PLSH-02**: PWA manifest for installable app

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentication / login | Personal tool, no auth for MVP — add later if needed |
| Multi-user / collaboration | Single-user personal tool by design |
| Notifications / reminders | Personal board checked intentionally, cadence filters serve as "what now?" |
| Attachments / file uploads | Keep tasks lightweight, paste URLs in notes instead |
| Custom columns / workflow editor | Fixed columns enforce opinionated workflow, zero config |
| Subtasks / nested tasks | Flat list per column is simpler, break large tasks into cards |
| Recurring task auto-creation | Cadence tag provides concept without scheduler complexity |
| Analytics / dashboards | Board is the dashboard, archive is the history |
| Mobile native app | Responsive web is sufficient |
| Real-time collaboration | Single user, no value |
| Gantt / timeline views | Project management scope, not personal Kanban |
| AI features | Keep tool simple and fast |
| Integrations (Slack, email, calendar) | Standalone personal tool |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOARD-01 | Phase 1: Foundation | Pending |
| BOARD-02 | Phase 6: Polish and Deploy | Pending |
| BOARD-03 | Phase 6: Polish and Deploy | Pending |
| TASK-01 | Phase 2: Task Management | Pending |
| TASK-02 | Phase 2: Task Management | Pending |
| TASK-03 | Phase 2: Task Management | Pending |
| TASK-04 | Phase 3: Drag and Drop | Pending |
| TASK-05 | Phase 3: Drag and Drop | Pending |
| TASK-06 | Phase 2: Task Management | Pending |
| TASK-07 | Phase 2: Task Management | Pending |
| SRCH-01 | Phase 4: Search and Filters | Pending |
| SRCH-02 | Phase 4: Search and Filters | Pending |
| SRCH-03 | Phase 4: Search and Filters | Pending |
| ARCH-01 | Phase 5: Auto-Archive | Pending |
| ARCH-02 | Phase 5: Auto-Archive | Pending |
| ARCH-03 | Phase 5: Auto-Archive | Pending |
| ARCH-04 | Phase 5: Auto-Archive | Pending |
| DEPL-01 | Phase 6: Polish and Deploy | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-02-15*
*Last updated: 2026-02-15 after roadmap creation*
