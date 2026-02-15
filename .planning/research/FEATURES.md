# Feature Research

**Domain:** Personal Kanban board / task management
**Researched:** 2026-02-15
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Board with columns (workflow stages) | Foundational Kanban mechanic. Every Kanban tool has columns representing To Do / Doing / Done or similar stages. | LOW | Kanbang uses 6 fixed columns (Inbox, Backlog, In Progress, Needs Info, Blocked, Done). Fixed columns eliminate configuration overhead. |
| Drag and drop between columns | Core interaction pattern. Trello, Kanri, KanbanFlow, Kanboard — all support drag and drop. Users expect this to "just work" with minimal latency. | MEDIUM | Requires a DnD library (dnd-kit recommended). Must handle optimistic UI updates with Convex reactive backend. |
| Task creation (title + optional details) | Every Kanban board allows creating cards with at minimum a title. Notes/description is standard. | LOW | Title required, notes optional. Keep creation fast — modal or inline form. |
| Task editing via detail view | Clicking a card to see/edit details is universal (Trello modal, Kanri side panel, etc.). Users expect to add more context after quick creation. | LOW | Modal or slide-out panel. Must not disrupt board layout. |
| Task deletion | Basic CRUD. Every tool supports removing tasks. | LOW | Confirm before delete or support undo. |
| Full-text search | Finding a past task by keyword is expected in any tool managing more than a few items. Trello, Notion, KanbanFlow all have search. | MEDIUM | Convex search index on combined searchText field (title + notes). Must return results from both active and archived tasks. |
| Priority levels | Most personal task tools (Todoist, Trello labels, KanbanFlow) provide priority indicators. Users need to distinguish urgent from non-urgent at a glance. | LOW | Three levels (low/medium/high) with color coding. Visual indicator on card (color stripe or badge). |
| Labels / color coding on cards | Color-coded visual indicators are standard across Trello (labels), Kanri (card colors), KanbanFlow (color-coded tags). Helps scan the board at a glance. | LOW | Priority-based color is sufficient for MVP. Separate tags/labels are a differentiator, not table stakes. |
| Responsive web layout | Users expect to access a web app from desktop and mobile browsers. Every SaaS Kanban tool is responsive. | MEDIUM | Tailwind makes responsive straightforward. Board may need horizontal scroll on mobile. |
| Archive / completed task history | Users expect to review past work. Trello has archive, Jira hides Done after 14 days, KanbanFlow groups completed by date. "Where did that task go?" must have an answer. | LOW | Separate Archived view with search and filters. Not a board column. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto-archive Done tasks (14-day rule) | Board stays clean without manual housekeeping. Only Kanban for WordPress and Jira next-gen boards do this — most tools require manual archiving. This is Kanbang's core value proposition: "the board stays clean because Done items auto-archive, but history is never lost." | LOW | Trigger on app load. Move Done tasks with completedAt > 14 days ago to Archived (set archivedAt). Simple query, no scheduler needed. |
| Cadence tagging (daily/weekly/monthly) | No Kanban competitor offers built-in cadence classification. This enables time-horizon quick filters ("What do I need to do today vs. this week vs. this month?") — a personal productivity concept that team Kanban tools ignore. | LOW | Enum field on task (daily/weekly/monthly/none). Powers quick-filter buttons. Unique to Kanbang. |
| Quick-filter buttons (Today / This Week / This Month) | Instant time-horizon views without complex filter UIs. Competitors require manual filter configuration. This makes Kanbang feel opinionated and personal-use optimized. | LOW | Combine cadence field with date ranges (createdAt). Three buttons, always visible. |
| Keyboard shortcut "N" for quick-add | Fast capture matters for personal tools. Kanboard uses this pattern for developers; Kanbang brings it to personal task management. Typing "N" → task title → Enter is faster than any click-based flow. | LOW | Global keydown listener, opens quick-add with cursor in title field. |
| Zero-config, no-auth startup | Most competitors require account creation (even Kanri needs a download). Kanbang is instantly usable — open the URL, start adding tasks. Removes all friction for a personal tool. | LOW (already planned) | Trade-off: no data privacy. Acceptable for MVP personal tool. Auth can be added later. |
| Combined active + archived search | Most Kanban tools search only active tasks. Kanbang's search covers everything — you never lose a task. "Find any past task by keyword in seconds." | LOW | Single Convex search index on searchText field covers both. Filter results by archived status in UI. |
| Filter by column, cadence, date range, priority | Richer filtering than most lightweight Kanban tools offer. KanbanFlow has filters but behind paid plans. Kanri and Kanboard have minimal filtering. | MEDIUM | Multiple filter dimensions. Can build incrementally — start with column + cadence, add date range + priority. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User authentication / multi-user | "I want my data private" / "I want to share boards" | Adds significant complexity (auth flow, user management, data isolation). Kanbang is a personal tool — auth is premature optimization for MVP. | Ship without auth, add later if needed. Keep sensitive content out of notes. |
| Real-time collaboration | Team Kanban tools have it (Trello, workstreams.ai) | Single-user tool. Collaboration features (comments, assignments, @mentions) add massive complexity with zero value for a personal board. | Not applicable — personal tool by design. |
| Notifications / reminders | "Remind me about due dates" | Requires push notification infrastructure, service workers, email integration. Overkill for a personal tool you check intentionally. | Cadence quick-filters serve as the "what should I do now?" mechanism. |
| Attachments / file uploads | "I want to attach screenshots to tasks" | File storage, upload UI, preview rendering, storage costs. Adds weight to a lightweight tool. | Keep notes text-only. Link to external files (paste a URL in notes). |
| Custom columns / workflow editor | "I want to rename or add columns" | Configuration UI, state management complexity, migration headaches. Fixed columns enforce an opinionated workflow that works for personal use. | Six fixed columns cover the full personal workflow (Inbox through Done). Users who need custom columns need a different tool. |
| Gantt charts / timeline views | "I want to see my schedule" | Requires date range per task, timeline rendering, drag-to-reschedule. This is project management, not personal Kanban. | Cadence tags + quick filters provide time-horizon awareness without timeline complexity. |
| WIP limits (enforced) | Core Kanban principle, KanbanFlow highlights this | For personal use, enforced WIP limits create friction without a team to coordinate. The person using the board is also the one deciding what to work on. | Visual column counts are sufficient awareness. No enforcement needed. |
| Subtasks / nested tasks | Trello checklists, Taskworld sub-cards | Adds a second level of hierarchy to the data model. For personal use, a flat list per column is simpler. Complex tasks should be broken into separate cards. | Break large tasks into multiple cards. Use notes for informal checklists (plain text). |
| Recurring tasks | "I do this every Monday" | Requires a scheduler or cron job, recurrence rules (daily/weekly/monthly with exceptions), auto-creation logic. Significant backend complexity. | Cadence tag provides the concept of "this is a weekly task" without auto-creation. Re-create manually or leave in Backlog. |
| AI-powered features | workstreams.ai generates subtasks, Trello AI extracts dates | Adds API dependency (OpenAI/Anthropic), cost, latency. Premature for a personal tool — the user knows their own tasks. | Keep the tool dumb and fast. The user is the intelligence. |
| Mobile native app | "I want an app on my phone" | Requires separate codebase or framework (React Native, Capacitor). Doubles maintenance surface. | Responsive web app works on mobile browsers. PWA manifest could be added later with minimal effort. |
| Analytics / dashboards | Throughput charts, burndown, cycle time (KanbanFlow, Kanban Tool) | Data visualization libraries, metrics calculations, additional UI surface. Overkill for personal use where you track dozens of tasks, not hundreds. | The board itself is the dashboard. Archive view provides historical reference. |
| Dark mode / theme customization | Kanri offers Catppuccin, dark mode, custom backgrounds | CSS complexity, theme state management, preference persistence. Not zero effort and not core value. | Tailwind minimal light theme. Can be added as a polish feature later with Tailwind's dark: variant. |
| Pomodoro timer / time tracking | KanbanFlow's signature feature | Scope creep into a different product category (time management vs. task management). | Use a separate Pomodoro tool. Kanbang is for task tracking, not time tracking. |
| Integrations (Slack, email, calendar) | Trello Power-Ups, workstreams.ai Slack integration | Integration infrastructure, OAuth flows, webhook handling. Massive complexity for minimal personal value. | Standalone personal tool. Copy-paste is fine for personal use. |

## Feature Dependencies

```
[Board with columns]
    └──requires──> [Task creation]
                       └──requires──> [Task data model]
                                          └──enables──> [Task editing]
                                          └──enables──> [Task deletion]
                                          └──enables──> [Full-text search]
                                          └──enables──> [Priority levels]
                                          └──enables──> [Cadence tagging]

[Drag and drop]
    └──requires──> [Board with columns]
    └──requires──> [Task data model with column field]

[Auto-archive]
    └──requires──> [completedAt timestamp on tasks]
    └──requires──> [Archived state in data model]
    └──enables──> [Archived view]

[Full-text search]
    └──requires──> [Convex search index on searchText]
    └──enables──> [Combined active + archived search]

[Quick filters (Today/This Week/This Month)]
    └──requires──> [Cadence field on tasks]
    └──requires──> [createdAt timestamp]

[Filter by column/cadence/date/priority]
    └──requires──> [All filter-relevant fields in data model]
    └──enhances──> [Board view]
    └──enhances──> [Archived view]

[Keyboard shortcut "N"]
    └──requires──> [Task creation form/modal]
```

### Dependency Notes

- **Drag and drop requires Board + Data model:** DnD updates the column field on a task. The board must render columns, and the data model must support column as a mutable field.
- **Auto-archive requires completedAt:** Moving to Done must set completedAt so the 14-day rule can be evaluated on next app load.
- **Quick filters require cadence:** The Today/This Week/This Month buttons are meaningless without cadence classification on tasks.
- **Search requires searchText index:** Convex full-text search operates on a single indexed field. The combined searchText field (title + notes) must be maintained on every create/update.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Board with 6 fixed columns — core visual layout
- [ ] Task CRUD (create, read, update, delete) — fundamental operations
- [ ] Drag and drop between columns — core Kanban interaction
- [ ] Task detail modal (title, notes, column, cadence, priority) — editing context
- [ ] Priority levels with color indicators — visual scanning
- [ ] Cadence field (daily/weekly/monthly/none) — enables quick filters
- [ ] Full-text search (active + archived) — "find any task in seconds"
- [ ] Auto-archive Done > 14 days — board stays clean
- [ ] Archived view with search — history is never lost
- [ ] Keyboard shortcut "N" for quick-add — fast capture
- [ ] Quick-filter buttons (Today / This Week / This Month) — time-horizon views
- [ ] Responsive layout — usable on mobile browsers
- [ ] Deploy to Vercel — accessible from anywhere

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Filter by column, cadence, date range, priority — when users accumulate enough tasks to need multi-dimensional filtering
- [ ] Undo for task deletion — when accidental deletes become frustrating
- [ ] Card count per column — lightweight visual WIP awareness
- [ ] Drag and drop reordering within columns — when users want to prioritize order within a column
- [ ] Sort options (by priority, by createdAt, by cadence) — when filtering alone is not enough
- [ ] Manual un-archive (move archived task back to board) — when users need to revive old tasks

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Dark mode — cosmetic polish, not core value
- [ ] PWA manifest (installable, offline splash) — when mobile usage patterns emerge
- [ ] Authentication (optional) — if data privacy becomes a real concern
- [ ] Bulk actions (multi-select and move/delete) — when task volume justifies it
- [ ] Export data (JSON/CSV) — if users want to move data out
- [ ] Board snapshots / activity log — if users want to review what changed when

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Board with columns | HIGH | LOW | P1 |
| Task CRUD | HIGH | LOW | P1 |
| Drag and drop | HIGH | MEDIUM | P1 |
| Task detail modal | HIGH | LOW | P1 |
| Priority levels (color) | MEDIUM | LOW | P1 |
| Cadence field | MEDIUM | LOW | P1 |
| Full-text search | HIGH | MEDIUM | P1 |
| Auto-archive (14 day) | HIGH | LOW | P1 |
| Archived view | MEDIUM | LOW | P1 |
| Keyboard "N" quick-add | MEDIUM | LOW | P1 |
| Quick-filter buttons | MEDIUM | LOW | P1 |
| Responsive layout | MEDIUM | MEDIUM | P1 |
| Multi-dimensional filters | MEDIUM | MEDIUM | P2 |
| Undo delete | LOW | LOW | P2 |
| Column card counts | LOW | LOW | P2 |
| Within-column reorder | LOW | MEDIUM | P2 |
| Sort options | LOW | LOW | P2 |
| Manual un-archive | LOW | LOW | P2 |
| Dark mode | LOW | LOW | P3 |
| PWA manifest | LOW | LOW | P3 |
| Authentication | LOW | HIGH | P3 |
| Bulk actions | LOW | MEDIUM | P3 |
| Data export | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Trello | KanbanFlow | Kanri | Kanboard | Kanbang (Our Approach) |
|---------|--------|------------|-------|----------|------------------------|
| Board + columns | Custom columns, unlimited | Custom columns, WIP limits | Custom columns | Custom columns | 6 fixed columns — opinionated, zero config |
| Drag and drop | Yes | Yes | Yes | Yes (+ keyboard) | Yes |
| Task detail | Modal with checklists, attachments, Power-Ups | Modal with subtasks, time tracking | Rich text, sub-tasks, due dates | Minimal card | Modal with title, notes, cadence, priority |
| Search | Full-text across boards | Filter + search | Basic | Command palette search | Full-text across active + archived (Convex) |
| Priority | Labels (manual color) | Color tags | Card colors | None | Built-in 3-level priority with color |
| Cadence / time horizon | None (use labels manually) | None | None | None | Built-in daily/weekly/monthly cadence — unique |
| Quick filters | None (saved filters in paid) | Filter panel | None | None | Today/This Week/This Month buttons — unique |
| Auto-archive | Manual only | Manual only | Manual only | None | Auto-archive Done > 14 days — rare feature |
| Keyboard shortcuts | Limited | None significant | Yes | Vim-style, command palette | "N" for quick-add |
| Auth requirement | Account required | Account required | None (desktop app) | Account or self-host | None — instant access |
| Price | Free (limited) / $5+/mo | Free (generous) | Free (open source) | Free (limited) / $4/mo | Free |
| Offline | No | No | Yes (desktop) | Desktop app option | No (Convex requires connection) |

## Sources

- [The 5 best Kanban tools in 2026 | Zapier](https://zapier.com/blog/best-kanban-apps/) — comprehensive comparison of top Kanban tools
- [Best Kanban Apps for Personal and Team Use in 2026 | Any.do](https://www.any.do/blog/best-kanban-apps-for-personal-and-team-use-in-2026/) — personal vs team Kanban feature breakdown
- [Kanri - Personal Offline Kanban Board App](https://www.kanriapp.com/) — minimalist offline competitor
- [Kanboard - Keyboard-First Kanban Board](https://kanboard.io/) — developer-focused Kanban with Vim shortcuts
- [KanbanFlow features](https://kanbanflow.com/features) — WIP limits, Pomodoro timer, free plan details
- [Kanban Tool auto-archive support](https://kanbantool.com/support/kanban-board/is-there-an-auto-archive-feature) — auto-archive feature comparison
- [Kanban for WordPress auto-archiving](https://kanbanwp.com/documentation/tasks/auto-archiving-tasks/) — age-based task cleanup precedent
- [Kanban anti-patterns | IM Wright's Hard Code](https://imwrightshardcode.com/kanban-anti-patterns/) — feature bloat and workflow anti-patterns
- [Best practices for Kanban columns | Multiboard](https://www.multiboard.dev/posts/best-practices-kanban-columns) — column design patterns
- [Personal Kanban guide | Todoist](https://www.todoist.com/productivity-methods/kanban) — personal Kanban methodology
- [Personal Kanban guide | Smartsheet](https://www.smartsheet.com/using-personal-kanban-find-new-job-jumpstart-your-career-or-accomplish-more-your-current-role) — cadence and review patterns
- [Brisqi - Offline-first Personal Kanban](https://brisqi.com/) — offline-first personal Kanban competitor

---
*Feature research for: Personal Kanban board (Kanbang)*
*Researched: 2026-02-15*
