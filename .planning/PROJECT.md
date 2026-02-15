# Kanbang

## What This Is

A lightweight personal Kanban board for daily/weekly/monthly task tracking. Fast capture, fast search across active and archived tasks, and a clean board that stays tidy through automatic archiving. Deployed on Vercel, powered by Convex.

## Core Value

Add a task in seconds, find any past task by keyword in seconds — the board stays clean because Done items auto-archive, but history is never lost.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Kanban board with 6 fixed columns (Inbox, Backlog, In Progress, Needs Info, Blocked, Done)
- [ ] Create tasks with title (required), notes (optional), cadence, and priority
- [ ] Edit tasks via modal/slide-out detail panel
- [ ] Delete tasks
- [ ] Drag and drop tasks between columns
- [ ] Moving to Done sets completedAt timestamp
- [ ] Full-text search across title + notes (using Convex search index with combined searchText field)
- [ ] Search includes both active and archived tasks
- [ ] Filter by column, cadence, date range (createdAt or completedAt), priority
- [ ] Separate Archived view (not a board column) with search and filters
- [ ] Auto-archive: on app load, move Done tasks older than 14 days to Archived (sets archivedAt)
- [ ] Keyboard shortcut "N" to quick-add a task
- [ ] "Today / This Week / This Month" quick filters using cadence + date ranges
- [ ] Deploy to Vercel

### Out of Scope

- Multi-user / collaboration — personal tool, single user
- Authentication — no auth for MVP (risk acknowledged: anonymous write access)
- Heavy analytics / dashboards — not needed for personal use
- Attachments / file uploads — keep tasks lightweight
- Notifications — personal board, no need to notify yourself
- Mobile app — web-first, responsive is sufficient
- Real-time collaboration features — single user
- Convex scheduled jobs for archiving — on-app-load trigger is sufficient

## Context

- **Personal tool**: No auth, no multi-user. The user is the only person using this.
- **Convex reactive backend**: Data syncs automatically to the UI. No manual refresh needed.
- **Convex Full Text Search**: Define a search index on a combined `searchText` field (`title + " " + notes`) for single-index search across both fields.
- **Task model fields**: id (Convex doc id), title, notes, column (enum), cadence (daily|weekly|monthly|none), priority (low|medium|high), createdAt, updatedAt, completedAt, archivedAt, searchText.
- **Column behavior**: A task exists in exactly one column at a time. Archived is a separate state, not a board column.
- **No auth risk**: Without authentication, Convex mutation functions are callable by any client. Mitigation deferred — keep sensitive content out of notes for now, add auth later if needed.

## Constraints

- **Tech stack**: React + Vite + TypeScript frontend, Convex backend/DB, Vercel deployment
- **Styling**: Tailwind CSS, minimal custom design (no component library)
- **Drag and drop**: Requires a DnD library (e.g., dnd-kit or similar)
- **Search**: Convex-native full-text search only (no external search service)
- **Scale**: Personal use — dozens to low hundreds of tasks, not thousands

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Convex over traditional DB | Reactive backend eliminates manual sync, built-in full-text search | — Pending |
| No auth for MVP | Personal tool, speed over security for now | — Pending |
| Archived as separate view | 7 columns too wide; keeps board focused on active work | — Pending |
| Drag and drop (not click-to-move) | More natural for Kanban interaction | — Pending |
| Modal for task detail | Keeps board layout stable while editing | — Pending |
| Tailwind minimal (no component lib) | Lightweight, full control, no dependency overhead | — Pending |
| Auto-archive on app load | Simple trigger, no cron/scheduler needed at personal scale | — Pending |
| Combined searchText field | Convex search indexes one field; combining title+notes enables single-index search | — Pending |

---
*Last updated: 2026-02-15 after initialization*
