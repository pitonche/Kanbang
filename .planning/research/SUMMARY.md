# Project Research Summary

**Project:** Kanbang - Personal Kanban Board
**Domain:** Task management SPA (single-page application)
**Researched:** 2026-02-15
**Confidence:** HIGH

## Executive Summary

Kanbang is a personal kanban board designed to address a specific pain point: boards fill up with completed tasks and become cluttered. Research confirms this is a common problem in existing tools (Trello, KanbanFlow, Kanri), which require manual archiving. The recommended approach is a React + Convex + Tailwind v4 stack with @dnd-kit for drag-and-drop, deployed to Vercel. This combination provides a reactive real-time backend with zero configuration, fast iteration with Tailwind's new Rust engine, and proven drag-and-drop patterns.

The core value proposition is auto-archive: Done tasks older than 14 days move to a separate archived view automatically, keeping the board clean while preserving history. This feature is rare among competitors. Research identifies cadence tagging (daily/weekly/monthly) and time-horizon quick filters (Today/This Week/This Month) as unique differentiators that optimize Kanbang for personal use rather than team collaboration.

Critical risks center on drag-and-drop UX (visual snap-back during column moves is the most common pitfall), Convex's reactive query model requiring careful state management during drag operations, and search index design requiring a combined searchText field from day one to avoid painful migrations. The no-auth MVP approach is acceptable for personal use but requires conscious awareness that Convex functions are public API endpoints. All risks have clear mitigation strategies documented in the pitfall research.

## Key Findings

### Recommended Stack

The stack research identified React 19.2.4 + Vite 7.3.1 + TypeScript 5.9.3 + Convex 1.31.7 + Tailwind CSS 4.1.18 as the optimal combination. All are current stable versions with verified compatibility. Critical version constraints: Vite 7 requires Node 20.19+, Tailwind v4 eliminates the config file entirely (zero-config design tokens via CSS), and beta versions (Vite 8, TypeScript 6.0) must be avoided.

**Core technologies:**
- **React 19.2.4**: Hooks-based architecture with improved concurrent rendering, production-ready since Dec 2024
- **Convex 1.31.7**: Reactive backend database with real-time subscriptions, built-in full-text search, scheduled functions, and zero infrastructure management — eliminates the need for a separate API, ORM, or database server
- **Tailwind CSS 4.1.18**: Utility-first CSS with new Rust engine (5x faster builds), zero-config with `@import "tailwindcss"` — no config file needed
- **@dnd-kit/core + @dnd-kit/sortable**: Mature drag-and-drop library (10kb, zero dependencies) with extensive kanban board examples — classic packages recommended over new @dnd-kit/react rewrite which has only 27 dependents
- **Vite 7.3.1**: Build tool with 5x faster HMR than Webpack, native ESM, first-class TypeScript support

**Critical rejections:**
- @hello-pangea/dnd (React 19 incompatible, peer dependencies cap at React 18)
- react-beautiful-dnd (officially deprecated, unmaintained since 2022)
- Redux/Zustand (Convex reactive queries eliminate need for separate state management)
- React Router (single-view app with conditional rendering is simpler)

### Expected Features

Feature research identified 9 table stakes features, 7 competitive differentiators, and 11 anti-features to deliberately avoid.

**Must have (table stakes):**
- Board with 6 fixed columns (Inbox, Backlog, In Progress, Needs Info, Blocked, Done) — every kanban tool has columns
- Drag and drop between columns — core interaction pattern, users expect sub-100ms latency
- Task CRUD (title + notes, priority, editing via modal) — fundamental operations
- Full-text search (active + archived) — finding past tasks is expected in any tool managing >10 items
- Priority levels (low/medium/high with color coding) — visual scanning for urgent vs. non-urgent
- Archive/completed task history — users expect to review past work
- Responsive web layout — usable on desktop and mobile browsers

**Should have (competitive differentiators):**
- **Auto-archive Done tasks (14-day rule)** — core value proposition, only Jira and Kanban for WordPress do this
- **Cadence tagging (daily/weekly/monthly)** — unique feature, no competitor offers built-in time-horizon classification
- **Quick-filter buttons (Today/This Week/This Month)** — instant views without complex filter UI
- **Keyboard shortcut "N" for quick-add** — fast capture optimized for personal use
- **Zero-config, no-auth startup** — instantly usable, removes all friction
- **Combined active + archived search** — most tools only search active tasks

**Defer to v2+ (anti-features for MVP):**
- User authentication / multi-user (adds significant complexity for zero MVP value in personal tool)
- Real-time collaboration (not a personal tool use case)
- Attachments / file uploads (file storage, upload UI, preview rendering, storage costs)
- Custom columns / workflow editor (configuration UI overhead, fixed columns are opinionated)
- Recurring tasks (requires scheduler, recurrence rules, auto-creation logic)
- AI-powered features (API dependency, cost, latency — premature)
- Analytics / dashboards (overkill for personal use tracking dozens of tasks)

### Architecture Approach

The architecture follows a reactive query pattern where Convex is the single source of truth and React components subscribe via useQuery hooks. All task state lives in Convex; the frontend never maintains its own copy. This eliminates state synchronization bugs but requires careful handling of drag-and-drop to avoid visual snap-back during column moves.

**Major components:**
1. **KanbanBoard** — DndContext provider, renders 6 columns, handles drag events, calls Convex move mutation
2. **TaskColumn** — SortableContext for a single column, droppable zone, renders task cards
3. **TaskCard** — Draggable card, click-to-open modal, displays title/priority/cadence
4. **TaskModal** — Form for creating/editing task details (title, notes, column, cadence, priority)
5. **SearchBar** — Full-text search input using Convex search index, filters results by active/archived
6. **ArchivedView** — Read-only list of archived tasks with search, unarchive action
7. **convex/tasks.ts** — All queries and mutations for task CRUD, move, archive, search
8. **convex/schema.ts** — Table definitions with combined searchText field, indexes for by_column and by_status
9. **convex/crons.ts** — Daily cron job at 03:00 UTC to auto-archive Done tasks older than 14 days

**Key architectural patterns:**
- **Combined searchText field** — Convex search indexes support one field per index, so title + notes concatenated into searchText field updated on every insert/patch
- **Cron-based auto-archive** — Daily background job moves Done tasks with completedAt > 14 days to archived status, more reliable than on-app-load trigger
- **Optimistic drag-and-drop** — Local dnd-kit state during drag, Convex mutation on drop, reactive query confirms change — requires careful state management to avoid snap-back
- **Fixed columns** — Hardcoded in lib/columns.ts and referenced by mutations, no column customization reduces configuration complexity

### Critical Pitfalls

Research identified 5 critical pitfalls that will break the UX if not addressed during initial implementation:

1. **Drag-and-drop snap-back/flicker on column move** — Cards visually revert to original position briefly after drop because Convex reactive query fires with stale data before mutation completes. Prevention: maintain local state during drag operations, sync from useQuery only when drag is inactive, wrap columns in React.memo. Must be solved in Phase 1 drag implementation, not retrofitted.

2. **Time-dependent auto-archive query returns stale results** — Using Date.now() in a Convex query breaks caching because queries are deterministic. Prevention: implement auto-archive as a cron mutation (not a query), use explicit isArchived boolean field rather than computing from timestamps. Schema decision must be made in Phase 1 to avoid migration.

3. **Search index design forces painful migration** — Convex search indexes support only ONE field per index. Prevention: design combined searchText field (title + notes concatenated) from day one in schema, populate it in every insert/patch mutation. Missing this requires a migration to populate searchText for all existing tasks.

4. **No-auth MVP exposes all data via public Convex API** — Convex functions are public network endpoints, anyone with deployment URL can call mutations directly. Mitigation: consciously accept risk for MVP, don't store sensitive data, structure functions to make adding ctx.auth.getUserIdentity() checks easy later. Auth should be early post-MVP priority, not distant future.

5. **Client-side mutation loops during reordering** — Looping over tasks to call mutate() for each one creates N sequential network requests with visible intermediate states. Prevention: write single atomic mutation that handles all reordering in one transaction (Convex supports up to 16,000 documents per transaction). Must be designed correctly in Phase 1.

## Implications for Roadmap

Based on combined research, suggested phase structure follows natural dependencies and isolates risk:

### Phase 1: Foundation (Schema + Static Board)
**Rationale:** Data model and static rendering must exist before any interactivity. Schema decisions (searchText combined field, isArchived boolean, completedAt timestamp) are difficult to change later and prevent pitfalls in Phases 2-3.

**Delivers:**
- Convex schema with tasks table, indexes (by_column, by_status), search index on searchText
- Static board rendering with 6 fixed columns
- Task data model with all required fields (title, notes, column, priority, cadence, createdAt, updatedAt, completedAt, isArchived, searchText)
- Basic task display (no editing yet)

**Addresses:**
- Table stakes: board with columns, task data model
- Pitfall prevention: combined searchText field from day one, isArchived boolean for archive logic, completedAt for 14-day rule

**Avoids:**
- Pitfall #2 (time-dependent query) by using boolean field
- Pitfall #3 (search index migration) by including searchText in initial schema

### Phase 2: Task CRUD + Modal
**Rationale:** Users need to create and edit tasks before drag-and-drop is meaningful. This phase validates the data model works and establishes the mutation patterns that Phase 3's drag-and-drop will follow.

**Delivers:**
- Task creation (keyboard shortcut "N" for quick-add)
- Task editing via detail modal (title, notes, column, priority, cadence)
- Task deletion with confirmation
- All mutations maintain searchText field
- Task detail modal (overlay, doesn't block board)

**Addresses:**
- Table stakes: task CRUD, task detail modal, keyboard shortcut
- Differentiator: keyboard "N" quick-add
- Architecture: TaskModal component, Convex create/update/delete mutations

**Uses:**
- Convex mutations with argument validators (v.string(), v.id("tasks"))
- Tailwind for modal styling
- React hooks (useState for modal open/closed)

### Phase 3: Drag-and-Drop
**Rationale:** Core kanban interaction. This is the highest-risk phase due to Pitfall #1 (snap-back) and Pitfall #5 (mutation loops). Requires careful state management to integrate dnd-kit with Convex reactive queries.

**Delivers:**
- Drag-and-drop cards between columns
- Visual drag preview/overlay
- Single atomic move mutation
- Optimistic UI updates during drag
- Smooth transitions without snap-back

**Addresses:**
- Table stakes: drag and drop between columns
- Architecture: KanbanBoard DndContext, TaskColumn SortableContext, TaskCard draggable

**Avoids:**
- Pitfall #1 (snap-back) via local state during drag + React.memo on columns
- Pitfall #5 (mutation loops) via single atomic moveTask mutation

**Uses:**
- @dnd-kit/core + @dnd-kit/sortable
- Convex useMutation for moveTask
- React.memo for performance

### Phase 4: Search + Filters
**Rationale:** Depends on searchText field from Phase 1 and task data from Phase 2. Search is independent of drag-and-drop so can be built in parallel with or after Phase 3.

**Delivers:**
- Full-text search across active and archived tasks
- Quick-filter buttons (Today/This Week/This Month based on cadence)
- Search results clickable to open task modal
- Empty state for no results

**Addresses:**
- Table stakes: full-text search
- Differentiators: combined active + archived search, quick-filter buttons for time horizons

**Uses:**
- Convex withSearchIndex query on searchText field
- Cadence field for quick filters
- SearchBar component

**Implements:**
- Architecture: SearchBar component with Convex search query

### Phase 5: Auto-Archive + Archive View
**Rationale:** Requires completedAt field (set when task moves to Done) and isArchived boolean from Phase 1 schema. Cron job is independent of UI so can be added anytime after schema exists.

**Delivers:**
- Daily cron job to archive Done tasks older than 14 days
- Archived view with read-only task list
- Unarchive action to move tasks back to board
- Search within archived tasks

**Addresses:**
- Table stakes: archive/completed task history
- Differentiator: auto-archive (core value proposition)

**Uses:**
- Convex cron jobs (daily at 03:00 UTC)
- ArchivedView component
- isArchived boolean + completedAt timestamp

**Avoids:**
- Pitfall #2 (time-dependent query) by using cron mutation with isArchived boolean

### Phase 6: Polish + Deployment
**Rationale:** All core features complete, final UX refinements and production deployment.

**Delivers:**
- Responsive layout for mobile browsers
- Column card counts (visual WIP awareness)
- Loading states and error handling
- Vercel deployment with Convex integration
- Production environment variables

**Addresses:**
- Table stakes: responsive web layout
- Deployment: Vercel + Convex Cloud

**Uses:**
- Tailwind responsive utilities (sm:, md:, lg:)
- Vercel CLI with Convex deploy key
- VITE_CONVEX_URL environment variable

### Phase Ordering Rationale

**Why Phase 1 (Schema) comes first:**
- Schema decisions are hardest to change later (search index, field types)
- Multiple pitfalls prevented by correct initial schema (combined searchText, isArchived boolean)
- All subsequent phases depend on task data model

**Why Phase 2 (CRUD) before Phase 3 (Drag):**
- Drag-and-drop moves tasks between columns via mutations — must validate mutations work first
- Provides data to test drag-and-drop with
- Task modal is needed regardless of drag-and-drop (can also be triggered from search)

**Why Phase 3 (Drag) is isolated:**
- Highest technical risk due to state management complexity
- Can be tested independently once CRUD exists
- Failure doesn't block other features (can fall back to dropdown column selector temporarily)

**Why Phase 4 (Search) is independent:**
- Not blocking for MVP (nice to have, but board is usable without it)
- Depends only on Phase 1 schema, not on drag-and-drop
- Can be built in parallel with Phase 3 if desired

**Why Phase 5 (Archive) comes late:**
- Core value prop but not blocking for initial use (board works without it)
- Cron jobs are fire-and-forget infrastructure, low testing surface
- Gives time to accumulate real "Done" tasks to test with

**Why Phase 6 (Polish) is last:**
- Deployment can't happen until features are complete
- Responsive refinements need real feature interactions to test
- Error handling addresses edge cases discovered during Phases 2-5

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Drag-and-Drop):** Complex state management to avoid snap-back. May need /gsd:research-phase to investigate dnd-kit optimistic update patterns with Convex reactive queries. This is the highest-risk integration point.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Schema):** Convex schema patterns are well-documented in official docs
- **Phase 2 (CRUD):** Standard React form + Convex mutations, no novel integration
- **Phase 4 (Search):** Convex full-text search API is documented with examples
- **Phase 5 (Archive):** Convex cron jobs are straightforward, official docs have examples
- **Phase 6 (Deployment):** Vercel + Convex deployment is documented in Convex's official Vercel integration guide

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified on npm, compatibility matrix confirmed, React 19 + Convex + Tailwind v4 is production-ready. Rejection of beta versions (Vite 8, TS 6.0) based on official release status. |
| Features | HIGH | Table stakes confirmed via comparison of 5+ kanban tools (Trello, KanbanFlow, Kanri, Kanboard). Differentiators (auto-archive, cadence) validated as rare in competitor analysis. Anti-features based on documented kanban anti-patterns. |
| Architecture | HIGH | Convex reactive query pattern is official recommended approach. Dnd-kit + kanban examples found in multiple tutorials. Combined searchText field is documented Convex pattern for multi-field search. Cron-based archive is official Convex scheduling pattern. |
| Pitfalls | HIGH | Snap-back pitfall confirmed in dnd-kit GitHub discussions. Time-dependent query pitfall documented in official Convex best practices. Search index limitation in official Convex search docs. No-auth exposure is inherent to Convex's public API architecture. |

**Overall confidence:** HIGH

All research is backed by official documentation or multiple converging secondary sources. Stack versions are current stable releases with verified compatibility. Feature expectations based on analysis of 5+ direct competitors. Architecture follows official Convex patterns and proven dnd-kit examples. Pitfalls are documented in official best practices and community discussions.

### Gaps to Address

**Drag-and-drop optimistic updates with Convex:**
- Research confirms snap-back is a known issue but solutions vary (local state vs. Convex optimistic updates vs. React.memo)
- Will need to prototype during Phase 3 planning to determine which approach works best
- Not a blocker: fallback is accepting brief visual flicker on slower connections (acceptable for personal tool)

**Mobile drag-and-drop UX:**
- Research focused on desktop browser drag-and-drop
- Touch drag-and-drop on mobile may need different UX (dropdown column selector as fallback)
- Will validate during Phase 6 responsive implementation
- Not a blocker: mobile users can use column dropdown if touch drag doesn't work well

**Convex free tier limits for production use:**
- Free tier has 1GB bandwidth limit per month (generous for personal use)
- Research didn't quantify how many tasks trigger bandwidth limits
- Will monitor during early use, upgrade to paid plan if needed ($25/mo)
- Not a blocker: unlimited local dev, and personal kanban unlikely to hit limits

## Sources

### Primary (HIGH confidence)
- Convex Official Documentation (docs.convex.dev) — architecture patterns, reactive queries, search API, cron jobs, best practices, deployment
- Vite Official Documentation (vite.dev) — Vite 7 release notes, version compatibility, React plugin
- Tailwind CSS v4 Blog (tailwindcss.com/blog/tailwindcss-v4) — zero-config architecture, Rust engine
- npm package registry — version verification for all dependencies (React 19.2.4, Convex 1.31.7, Tailwind 4.1.18, @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0)
- TypeScript Release Notes — TS 6.0 beta status confirmed, 5.9.3 as current stable

### Secondary (MEDIUM confidence)
- Zapier "5 Best Kanban Tools in 2026" — feature comparison across competitors (table stakes validation)
- Any.do "Best Kanban Apps for Personal and Team Use in 2026" — personal vs. team feature breakdown
- LogRocket "Build a Kanban Board with dnd-kit and React" — tutorial confirming dnd-kit patterns
- Marmelab "Building a Kanban Board with Shadcn" (Jan 2026) — recent kanban + dnd-kit example
- dnd-kit GitHub issue #1522 — snap-back problem discussion with workarounds
- Stack Convex "Help, My App Is Overreacting!" — official guide on over-reactivity patterns
- Stack Convex "Authorization Best Practices" — no-auth implications for public API
- KanbanFlow, Kanri, Kanboard official sites — feature verification for competitor analysis
- Kanban Tool support docs — auto-archive feature rarity confirmed
- Kanban for WordPress docs — age-based task cleanup precedent

### Tertiary (LOW confidence)
- Eficode "7 Common Kanban Mistakes" — UX anti-patterns (WIP limits, column design)
- Todoist Productivity Methods — personal kanban methodology guidance
- Smartsheet Personal Kanban Guide — cadence and review patterns

---
*Research completed: 2026-02-15*
*Ready for roadmap: yes*
