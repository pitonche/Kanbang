# Pitfalls Research

**Domain:** Personal Kanban board (React + Convex + Tailwind, no auth MVP)
**Researched:** 2026-02-15
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Drag-and-Drop Snap-Back / Flicker on Column Move

**What goes wrong:**
After a user drops a card into a new column, the card visually snaps back to its original position for a split second before settling into the correct spot. This happens because the drag-and-drop library releases the card, Convex's reactive query fires with stale data (the old position), and then the mutation result arrives to show the correct position. The brief revert creates a jarring, broken-feeling UX.

**Why it happens:**
Convex queries are real-time reactive. When a mutation fires to move a card, `useQuery` detects a data change and re-renders with the pre-mutation state before the mutation completes. Without optimistic updates or local state management, there is a window where the UI shows the old state.

**How to avoid:**
Maintain a separate local state layer for drag-and-drop that is the source of truth during drag operations. On `onDragEnd`, update local state immediately, fire the Convex mutation in the background, and sync local state back from `useQuery` only when no drag is active. Alternatively, implement Convex optimistic updates on the move mutation, but be aware that Convex optimistic updates require creating new objects (never mutate in place) or they will corrupt client state.

**Warning signs:**
- Cards flicker or jump during manual testing of column moves
- `useQuery` returns `undefined` briefly during drag operations
- Users report "laggy" or "glitchy" drag behavior

**Phase to address:**
Phase 1 (Core board with drag-and-drop). Must be solved during initial drag-and-drop implementation, not retrofitted.

---

### Pitfall 2: Time-Dependent Auto-Archive Query Returns Stale Results

**What goes wrong:**
The auto-archive feature (move Done tasks older than 14 days to archive on app load) requires comparing timestamps against the current time. If implemented as a Convex query using `Date.now()`, the query cache becomes unreliable. Convex queries are deterministic pure functions -- using `Date.now()` inside a query means the cached result may not reflect the actual current time, leading to tasks that should be archived remaining visible, or archive logic running inconsistently.

**Why it happens:**
Convex's reactivity engine caches query results and only re-runs them when their dependencies change. `Date.now()` is not a tracked dependency, so the query may serve a cached result where the time comparison is stale. Convex official docs explicitly warn: "If your query depends on the current time, it might return stale results."

**How to avoid:**
Do not use `Date.now()` in a Convex query for the archive check. Instead, implement auto-archive as a mutation triggered on app load from the client side. The client calls a mutation like `archiveOldTasks()` that internally uses `Date.now()` (mutations are not cached the same way). Alternatively, use a Convex cron job that runs daily to archive old Done tasks, avoiding the client-trigger dependency entirely. Add a boolean `isArchived` field to tasks rather than computing archive status from timestamps in queries.

**Warning signs:**
- Tasks in Done column persist longer than 14 days without archiving
- Archive behavior is inconsistent between page loads
- Archived tasks reappear briefly on load before disappearing

**Phase to address:**
Phase 2 (Archive functionality). The schema design decision (`isArchived` boolean vs. computed from timestamps) must be made in Phase 1 schema design to avoid a migration later.

---

### Pitfall 3: Search Index Design Forces Painful Migration

**What goes wrong:**
Convex full-text search indexes only support searching ONE field per index. If you initially create separate fields (title, description, tags) and try to search across them, you discover you need a combined `searchText` field. Retrofitting this onto an existing schema with data requires writing a migration to populate the combined field for all existing documents, and the search index definition change requires redeployment.

**Why it happens:**
Developers assume full-text search works like SQL `WHERE title LIKE '%x%' OR description LIKE '%x%'`. Convex search is fundamentally different: one search field per index, prefix matching only on the last term, maximum 16 terms per query, maximum 1024 results scanned, and results are always relevance-ordered (no custom sort).

**How to avoid:**
Design the `searchText` combined field from day one in the schema. Populate it in every `insert` and `patch` mutation by concatenating `title + " " + description` (and any other searchable text). Define the search index on this field in the initial schema. Also note: search terms are limited to 32 characters, fuzzy matching is deprecated (post Jan 2025), and only the final search term supports prefix matching.

**Warning signs:**
- Search returns no results for terms that exist in descriptions but not titles
- Users complain search "doesn't work" for partial words
- You find yourself wanting to query multiple search indexes and merge results

**Phase to address:**
Phase 1 (Schema design). The combined `searchText` field and search index must be in the initial `convex/schema.ts`.

---

### Pitfall 4: No Auth MVP Exposes All Data via Public Convex API

**What goes wrong:**
Without authentication, every Convex query and mutation is callable by anyone who discovers the deployment URL. Since Convex operates as a public API (not a traditional server-side database), anyone can call your `api.tasks.getAll`, `api.tasks.deleteTask`, or `api.tasks.updateTask` directly. For a personal kanban board, this means a stranger could read, modify, or delete all your tasks.

**Why it happens:**
Developers treat "no auth for MVP" as meaning "I'll add security later." But Convex's architecture means public functions are truly public -- they are network endpoints, not server-side code behind a web server. The Convex deployment URL is visible in the client-side JavaScript bundle.

**How to avoid:**
Accept this risk consciously for MVP with mitigations: (1) Do not put sensitive/private data in the board during no-auth phase. (2) Consider using Convex `internal` functions where possible and having a thin public layer. (3) Plan the auth integration (Clerk or Convex Auth) as an early post-MVP priority, not a distant future task. (4) When auth is added, every public function needs an authentication check -- design function signatures now to make adding `ctx.auth.getUserIdentity()` checks easy later.

**Warning signs:**
- You deployed to production and shared the URL publicly
- Someone else's tasks appear on your board
- Tasks are mysteriously deleted or modified

**Phase to address:**
Phase 1 (MVP scaffolding) for conscious risk acceptance and function structure. Phase 3 or early post-MVP for auth integration. Do not deploy to a public URL without understanding this risk.

---

### Pitfall 5: Treating Convex Like a REST API -- Client-Side Mutation Loops

**What goes wrong:**
When reordering multiple tasks (e.g., moving a card changes the order of several cards in the target column), developers loop over affected tasks on the client and call `mutate()` for each one. This creates N sequential network requests, each a separate transaction, with visible intermediate states where the board is partially updated.

**Why it happens:**
Habit from REST API patterns where you PATCH each resource individually. In Convex, mutations are transactional -- you can read and write multiple documents in a single mutation atomically.

**How to avoid:**
Write a single Convex mutation like `moveTask({ taskId, targetColumn, targetIndex })` that handles all reordering within one transaction: update the moved task's column and order, and update the order of all affected tasks in the target (and source) column. This is atomic, consistent, and requires one network round-trip. Convex mutations can read and write up to 16,000 documents per transaction, far more than needed for column reordering.

**Warning signs:**
- Multiple `useMutation` calls in the drag-end handler
- Visible intermediate states during reorder (cards briefly out of order)
- Race conditions where rapid drags produce inconsistent ordering

**Phase to address:**
Phase 1 (Drag-and-drop implementation). The mutation design must be correct from the start.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing task order as array index position | Simple ordering | Moving a card requires updating every task in the column (O(n) writes per move) | Never -- use fractional indexing or explicit `order` float field from the start |
| Skipping argument validators on mutations | Faster initial development | Any client can send malformed data; harder to add validation later without breaking calls | Only in first day of prototyping; add validators before any real data entry |
| Using `.collect()` without index filtering | Works fine with 10 tasks | Scans entire table; Convex charges bandwidth for all scanned docs even if filtered client-side; breaks at 1000+ docs | MVP only if you commit to adding indexes before 100 tasks |
| Putting all Convex functions in one file | Quick to find everything | Unmaintainable past 10 functions; no logical grouping; merge conflicts | Never -- start with `convex/tasks.ts`, `convex/columns.ts` from day one |
| Hardcoding column names in mutations | Fast to ship fixed columns | Cannot add/rename columns without code changes and redeployment | Acceptable for this project since columns are explicitly fixed by spec |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Convex + Vite | Using `CONVEX_URL` instead of `VITE_CONVEX_URL` for the deployment URL | Vite requires `VITE_` prefix for client-exposed env vars. Use `VITE_CONVEX_URL` in `.env.local` and reference via `import.meta.env.VITE_CONVEX_URL` |
| Convex + Vercel deploy | Running `npm run build` without `npx convex deploy` first | Override Vercel build command to `npx convex deploy --cmd 'npm run build'`. Set `CONVEX_DEPLOY_KEY` in Vercel environment variables. Use `--cmd-url-env-var-name VITE_CONVEX_URL` for Vite projects |
| Drag-and-drop library + Convex reactive queries | Letting `useQuery` re-render the board during an active drag | Use local state as source of truth during drag; sync from `useQuery` only when drag is inactive. Wrap board columns in `React.memo` to prevent unnecessary re-renders |
| Convex `useQuery` + conditional logic | Calling `useQuery` conditionally (e.g., inside an `if` block) | React hooks cannot be called conditionally. Use the `"skip"` sentinel value as the argument to disable the query: `useQuery(api.tasks.get, shouldLoad ? { id } : "skip")` |
| Convex search + user expectations | Assuming search supports substring matching or fuzzy search | Convex search is token-based with prefix matching only on the last term. "hel" matches "hello" but "llo" does not match "hello". Set user expectations in the UI (e.g., placeholder text: "Search by keyword...") |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Using `.filter()` instead of `.withIndex()` on queries | Slow queries; high bandwidth usage on dashboard | Always define database indexes for common access patterns (e.g., `by_column`, `by_status`). Use `.withIndex()` in queries. `.filter()` scans all documents | 500+ tasks in the database |
| Re-rendering entire board on any task change | UI feels sluggish; React DevTools shows full tree re-render on every keystroke in task modal | Memoize column components with `React.memo`; use `useMemo` to group tasks by column; keep task detail modal state local until save | 50+ visible cards across columns |
| Not implementing `useStableQuery` pattern | Loading flash/flicker when search query changes; brief `undefined` between searches | Wrap `useQuery` in a custom hook that preserves previous results during loading (uses `useRef` to hold last valid result) | Every search keystroke triggers a loading flash |
| Collecting all tasks to filter in JS | Works with 20 tasks; bandwidth charges for every document scanned | Write specific queries: `getTasksByColumn(column)`, `searchTasks(query)`. Each query should use an index and return only needed data | 200+ tasks; noticeable on Convex free tier bandwidth limits |
| Over-subscribing with too many `useQuery` calls | Each open subscription counts against concurrent query limit (16 on free tier) | Batch related data into fewer queries. One `getAllTasks` query returning grouped data is better than six `getTasksByColumn` subscriptions if all columns are always visible | 16+ active subscriptions (free tier limit) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Deploying no-auth MVP to a public, shared URL | Anyone can read/modify/delete all tasks; Convex functions are public API endpoints | Keep deployment URL private; do not share broadly; add auth before any public sharing; use `internal` functions where possible |
| Using function arguments for access control instead of `ctx.auth` | Arguments can be spoofed by any client calling the API directly | Even without auth now, structure functions so adding `ctx.auth.getUserIdentity()` checks is a single-line addition per function |
| Not validating mutation arguments | Malformed data can corrupt the database; no-auth means anyone can call mutations | Always use Convex argument validators (`v.string()`, `v.id("tasks")`, etc.) on every public mutation from day one |
| Storing sensitive personal data in task descriptions | No encryption, no auth, data visible to anyone with the deployment URL | During no-auth phase, treat all task data as potentially public. Do not store passwords, financial info, or private details in tasks |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No WIP limit indication on In Progress column | User piles up 15 "in progress" tasks, defeating Kanban's purpose; board becomes a glorified todo list | Add a soft WIP limit (e.g., visual warning at 5+ cards in In Progress). Not a hard block, but a color change or counter that nudges behavior |
| Search clears when clicking a task to edit | User searches, finds task, clicks to edit in modal, search resets on modal close | Preserve search state in a React context or URL parameter; modal should overlay without unmounting the search results |
| No visual feedback during drag | User drags a card but cannot tell where it will land; drops in wrong column | Use drag-and-drop library's built-in drop indicators/placeholders. Both dnd-kit and @hello-pangea/dnd support this out of the box -- do not skip the placeholder configuration |
| Done column fills up and obscures active work | After a week of use, Done has 30+ cards, pushing the board sideways or making columns uneven | Auto-archive (14-day rule) is the correct mitigation, but also consider collapsing Done column by default or showing only the 5 most recent Done items with a "show all" toggle |
| Modal blocks board interaction | User opens task detail modal and cannot see the board behind it to reference other tasks | Use a slide-over panel or a modal with semi-transparent backdrop instead of a full-screen blocker. Keep the board visible for context |

## "Looks Done But Isn't" Checklist

- [ ] **Drag-and-drop:** Often missing keyboard accessibility -- verify cards can be moved between columns using keyboard only (Tab, Enter, Arrow keys)
- [ ] **Search:** Often missing empty-state handling -- verify a "no results found" message appears (not just a blank board)
- [ ] **Auto-archive:** Often missing edge case where task was moved back from Done -- verify `movedToDoneAt` timestamp resets when a task leaves and re-enters Done
- [ ] **Task ordering:** Often missing persistence of order within a column -- verify that refreshing the page preserves the exact card order, not just column assignment
- [ ] **Column transitions:** Often missing validation -- verify a task cannot be moved to a nonsensical state (e.g., from Inbox directly to Done without passing through In Progress, if that is a desired constraint)
- [ ] **Search index:** Often missing combined field update -- verify that editing a task title or description also updates the `searchText` field used by the search index
- [ ] **Responsive layout:** Often missing mobile drag-and-drop -- verify touch drag works on mobile, or explicitly disable drag on mobile and provide a column-change dropdown instead

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Snap-back flicker on drag | MEDIUM | Add local state layer for drag operations; implement optimistic updates on move mutation; wrap columns in React.memo |
| Stale auto-archive from Date.now() in query | LOW | Move archive logic to a mutation called on app load or a cron job; add `isArchived` boolean field; write a one-time migration to set it on existing docs |
| Missing combined searchText field | MEDIUM | Add field to schema; write a migration mutation that iterates all tasks and populates `searchText`; update all insert/patch mutations to maintain the field |
| Client-side mutation loops for reorder | MEDIUM | Refactor to a single `moveTask` mutation that handles all reordering atomically; update the drag-end handler to call it once |
| No argument validators | LOW | Add `v.` validators to every public function; test with invalid inputs to catch edge cases |
| Data exposed without auth | HIGH if data was sensitive | Cannot un-expose already-leaked data. Add auth immediately; rotate Convex deploy keys; audit for any data that should not have been public |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Drag-and-drop snap-back flicker | Phase 1: Core board + DnD | Manual test: drag card between columns, verify no visual snap-back |
| Time-dependent auto-archive | Phase 1: Schema design (add `isArchived` field); Phase 2: Archive implementation | Create a Done task with fake old timestamp, trigger archive, verify it moves |
| Search index combined field design | Phase 1: Schema design | Create tasks with different titles/descriptions, search for description-only terms, verify results |
| No-auth data exposure | Phase 1: Conscious risk acceptance + function structure; Post-MVP: Auth integration | Review all public functions; verify no sensitive data stored; test calling mutations from browser console |
| Client-side mutation loops | Phase 1: Mutation design | Move a card and check Convex dashboard logs -- should show 1 mutation call, not N |
| Over-reactive re-renders on search | Phase 2: Search implementation | Type in search box, verify no loading flash between keystrokes (use `useStableQuery` pattern) |
| Missing WIP limit indication | Phase 1: Column rendering | Add 6+ cards to In Progress, verify visual indicator appears |
| Search empty state | Phase 2: Search implementation | Search for nonsense string, verify "no results" message |
| Auto-archive timestamp edge case | Phase 2: Archive implementation | Move task to Done, then back to In Progress, then back to Done -- verify 14-day timer resets |
| Convex + Vercel env var misconfiguration | Deployment phase | Verify `VITE_CONVEX_URL` is set in Vercel; verify `CONVEX_DEPLOY_KEY` is set; test production build locally first |

## Sources

- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) - Official documentation on anti-patterns and correct usage
- [10 Essential Tips for Convex Developers](https://www.schemets.com/blog/10-convex-developer-tips-pitfalls-productivity) - Community guide covering common pitfalls
- [Convex Full Text Search](https://docs.convex.dev/search/text-search) - Official search index constraints and limitations
- [Convex Limits](https://docs.convex.dev/production/state/limits) - Hard resource limits for transactions, documents, indexes
- [Help, My App Is Overreacting!](https://stack.convex.dev/help-my-app-is-overreacting) - Official guide on over-reactivity and useStableQuery pattern
- [Convex Optimistic Updates](https://docs.convex.dev/client/react/optimistic-updates) - Official guide on optimistic update patterns and immutability requirement
- [dnd-kit Snap-Back Discussion](https://github.com/clauderic/dnd-kit/discussions/1522) - Community discussion on the flicker/snap-back problem with optimistic updates
- [Convex + Vercel Deployment](https://docs.convex.dev/production/hosting/vercel) - Official deployment guide with env var requirements
- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs) - Official scheduling documentation
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization) - Security patterns for public API functions
- [Eficode: 7 Common Kanban Mistakes](https://www.eficode.com/blog/solving-the-7-most-common-kanban-mistakes-that-ruin-your-development) - UX/workflow pitfalls specific to Kanban methodology

---
*Pitfalls research for: Personal Kanban board (React + Convex + Tailwind)*
*Researched: 2026-02-15*
