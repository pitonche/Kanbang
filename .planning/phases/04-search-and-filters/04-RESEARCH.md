# Phase 4: Search and Filters - Research

**Researched:** 2026-02-15
**Domain:** Convex full-text search (`withSearchIndex`), React search UI, client-side cadence filtering, debounced input patterns
**Confidence:** HIGH

## Summary

Phase 4 adds two complementary features to the board: (1) a full-text search bar that queries Convex's existing `search_text` index to find tasks by keyword across title and notes, and (2) quick-filter buttons (Today / This Week / This Month) that filter the already-loaded task list by cadence value client-side.

The critical architectural insight is that these are two different mechanisms. **Search** uses Convex's server-side full-text search index (`withSearchIndex`) to query the `searchText` composite field -- this is a separate Convex query function that returns results ranked by BM25 relevance. **Quick filters** operate entirely client-side on the task array already loaded by the existing `tasks.list` query, filtering by the `cadence` field (`daily` = Today, `weekly` = This Week, `monthly` = This Month). No schema changes are required; the search index and all fields already exist from Phase 1.

The UI adds a toolbar above the board containing a search input and three quick-filter buttons. When search is active, the board either highlights/filters matching tasks or shows results in a dedicated panel. When a cadence filter is active, only tasks with that cadence are shown on the board. Both can be cleared independently.

**Primary recommendation:** Create a `tasks.search` query function in `convex/tasks.ts` using `withSearchIndex`, add a `SearchBar` component with debounced input (300ms), add `CadenceFilter` toggle buttons, and integrate both into a toolbar above the board in `Board.tsx`. Use the `"skip"` pattern for `useQuery` when the search term is empty.

## Standard Stack

### Core (already installed -- no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `convex` | ^1.31.7 | Full-text search via `withSearchIndex`, `useQuery` with `"skip"` pattern | Search index already defined in schema; `withSearchIndex` is Convex's built-in full-text search API |
| `react` | ^19.2.4 | `useState` for search/filter state, `useEffect` for debounce, conditional rendering | Standard React patterns; no additional hooks library needed |
| `tailwindcss` | ^4.1.18 | Toolbar layout, search input styling, filter button states | Already installed; utility classes for active/inactive button states |

### Supporting (no new dependencies needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native `setTimeout`/`clearTimeout` | DOM standard | Debounce search input to avoid excessive Convex queries | Search input onChange handler; 300ms delay is standard |
| `Object.groupBy` | ES2024 | Group filtered tasks by column (already used in Board) | When cadence filter is active, group the filtered subset |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual debounce with `setTimeout` | `use-debounce` npm package | 4-line custom hook vs. adding a dependency; app has exactly one debounced input, library is overkill |
| Client-side cadence filter | Server-side query with `cadence` filterField in search index | Adding `cadence` to `filterFields` would enable server-side filtering but is unnecessary -- all tasks are already loaded client-side; adding it couples filter to search index |
| Flat search results list | Overlay/modal search results | A flat list below the toolbar is simpler and keeps the board visible; overlay adds complexity without value for a personal tool |

**Installation:**
```bash
# No new packages needed. All functionality uses existing Convex + React APIs.
```

## Architecture Patterns

### Recommended Project Structure

```
convex/
  schema.ts           # NO CHANGES (search index already exists)
  tasks.ts            # MODIFY: add search query function
src/
  components/
    Board.tsx          # MODIFY: add toolbar, integrate search/filter state
    SearchBar.tsx      # NEW: search input with debounce
    CadenceFilter.tsx  # NEW: Today/This Week/This Month toggle buttons
    Column.tsx         # NO CHANGES
    TaskCard.tsx       # NO CHANGES (may add highlight class for search matches)
    TaskModal.tsx      # NO CHANGES
    QuickAdd.tsx       # NO CHANGES
    TaskCardOverlay.tsx # NO CHANGES
  App.tsx              # NO CHANGES
  index.css            # MODIFY: add toolbar/filter theme tokens if needed
  main.tsx             # NO CHANGES
```

### Pattern 1: Convex Search Query with withSearchIndex

**What:** A query function that performs full-text search against the `searchText` composite field using the pre-existing `search_text` index. Returns up to a configurable limit of results, ordered by BM25 relevance.
**When to use:** When the user types a keyword in the search bar.
**Example:**

```typescript
// Source: https://docs.convex.dev/search/text-search
// convex/tasks.ts -- add this export alongside existing functions
export const search = query({
  args: {
    term: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withSearchIndex("search_text", (q) =>
        q.search("searchText", args.term)
      )
      .take(20);
  },
});
```

**Key points:**
- The `.search("searchText", term)` call is REQUIRED -- `withSearchIndex` always needs exactly one `.search()` expression
- No `.eq("column", ...)` filter is applied -- this means ALL tasks (active and archived) are included, satisfying SRCH-02
- Results are ordered by BM25 relevance (not by column or creation time)
- `.take(20)` limits results -- Convex can scan up to 1,024 documents from the search index, but we only need a reasonable subset
- The last term in the search string gets automatic prefix matching (typeahead behavior), so typing "des" will match "design"
- Search terms are lowercased and limited to 32 characters each
- Maximum 16 search terms per query

### Pattern 2: useQuery with "skip" for Conditional Search

**What:** Use Convex React's `"skip"` pattern to only run the search query when the user has entered a non-empty term. When skipped, `useQuery` returns `undefined` and does not contact the backend.
**When to use:** In the Board component to conditionally subscribe to search results.
**Example:**

```typescript
// Source: https://docs.convex.dev/client/react
const [searchTerm, setSearchTerm] = useState("");
const [debouncedTerm, setDebouncedTerm] = useState("");

const searchResults = useQuery(
  api.tasks.search,
  debouncedTerm.trim() ? { term: debouncedTerm.trim() } : "skip"
);
```

**Key points:**
- When `debouncedTerm` is empty or whitespace-only, the query is skipped entirely -- no backend call
- When a term is provided, Convex creates a real-time subscription -- results update live if tasks change
- `searchResults` is `undefined` while loading or while skipped
- The board should distinguish between "no search active" (`debouncedTerm === ""`) and "search returned no results" (`searchResults !== undefined && searchResults.length === 0`)

### Pattern 3: Debounced Search Input (Custom Hook)

**What:** A simple custom hook that delays updating the debounced value until the user stops typing for 300ms. This prevents firing a Convex search query on every keystroke.
**When to use:** Between the search input's `onChange` and the `useQuery` call.
**Example:**

```typescript
// src/hooks/useDebounce.ts (or inline in Board.tsx given flat structure)
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

// Usage in Board.tsx:
const [searchTerm, setSearchTerm] = useState("");
const debouncedTerm = useDebounce(searchTerm, 300);
```

**Why 300ms:** Standard UX research suggests 200-500ms as the sweet spot for typeahead debounce. 300ms feels responsive without excessive queries. Convex real-time subscriptions mean results appear instantly once the query fires.

### Pattern 4: Client-Side Cadence Filtering

**What:** Filter the already-loaded task array by cadence value. The mapping is: Today = `"daily"`, This Week = `"weekly"`, This Month = `"monthly"`. When a filter is active, only tasks with that cadence are shown on the board.
**When to use:** When the user clicks a quick-filter button (SRCH-03).
**Example:**

```typescript
const [cadenceFilter, setCadenceFilter] = useState<string | null>(null);

// Filter tasks before grouping by column
const filteredTasks = cadenceFilter
  ? typedTasks.filter((t) => t.cadence === cadenceFilter)
  : typedTasks;

const tasksByColumn = Object.groupBy(filteredTasks, (t) => t.column);
```

**Key points:**
- This is purely client-side -- no new Convex query needed
- The filter is a toggle: clicking the active filter again clears it
- All columns still render when filtered, but they may be empty
- The filter applies to the normal board view (not to search results)

### Pattern 5: Board State Machine -- Search vs. Filter vs. Normal

**What:** The board has three visual states depending on active features. Only one of search or normal-board can be active at a time, but cadence filter applies to the normal board view.
**When to use:** To manage the interaction between search and filter features.

| State | Search Term | Cadence Filter | Board Shows |
|-------|-------------|----------------|-------------|
| Normal | empty | null | All tasks, grouped by column |
| Cadence Filtered | empty | "daily"/"weekly"/"monthly" | Tasks matching cadence, grouped by column |
| Search Active | non-empty | (ignored) | Search results as a flat list or highlighted in columns |

**Design decision:** When search is active, cadence filter buttons should either be disabled or the filter should be cleared. This avoids confusing compound states. The search query itself does not filter by cadence -- it returns all matching tasks regardless.

### Anti-Patterns to Avoid

- **Adding cadence to the search index's filterFields:** This couples the quick-filter feature to the search index. Since all tasks are already loaded by `tasks.list`, client-side filtering is simpler and more performant. Only add filterFields if you need server-side filtering at scale.
- **Running search on every keystroke without debounce:** Each `useQuery` call creates a Convex subscription. Rapid-fire queries waste bandwidth and may cause flickering results. Always debounce.
- **Using search for cadence filtering:** The `.search()` call is REQUIRED for `withSearchIndex`. You cannot use `withSearchIndex` with only `.eq()` filters and no search term. Cadence filtering must use a different mechanism (client-side filter or a separate database index query).
- **Modifying the existing `tasks.list` query:** The `list` query is used by the board for all tasks. Don't add search/filter parameters to it. Create a separate `search` query function instead.
- **Forgetting the empty search state:** When `useQuery` returns `undefined`, it could mean "loading" or "skipped". Track whether search is active separately from query results.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text search engine | Custom keyword matching on client-side array | Convex `withSearchIndex` (BM25, prefix matching, tokenization) | Built on Tantivy (Rust); handles stemming, ranking, prefix search automatically |
| Search input debounce | Manual `setTimeout` in onChange handler | `useDebounce` custom hook (4 lines) | Cleanly separates concerns; handles cleanup on unmount via useEffect return |
| Search result ranking | Custom relevance sorting | Convex BM25 automatic ranking | Server handles term frequency, document length, proximity -- all edge cases solved |
| Typeahead/autocomplete | Custom prefix matching logic | Convex automatic prefix matching on last search term | "The final search term has prefix search enabled" -- built into the search index |

**Key insight:** Convex's search index handles all the hard search problems (tokenization, ranking, prefix matching). The React side only needs a debounced input and a conditional `useQuery` call. The cadence filter is a simple array `.filter()` on already-loaded data.

## Common Pitfalls

### Pitfall 1: Search Call is Required in withSearchIndex

**What goes wrong:** Attempting to use `withSearchIndex` with only `.eq()` filters and no `.search()` call, expecting it to work as a filtered query.
**Why it happens:** The API looks like it might allow optional search with just filter fields.
**How to avoid:** The search filter expression requires "1 search expression and 0 or more equality expressions." Always include `.search("searchText", term)`. For filtering without full-text search (like cadence), use client-side filtering or a regular database index with `.withIndex()`.
**Warning signs:** Runtime error or TypeScript type error when calling `withSearchIndex` without `.search()`.

### Pitfall 2: Debounce Creates Stale Subscriptions

**What goes wrong:** Each debounced search term creates a new Convex subscription. Old subscriptions may not be cleaned up promptly.
**Why it happens:** Convex `useQuery` manages subscriptions based on the query arguments. When arguments change, it subscribes to the new query and unsubscribes from the old one. Rapid changes can temporarily accumulate subscriptions.
**How to avoid:** The debounce hook naturally handles this -- only the final settled value triggers a subscription. Convex's client-side garbage collection handles stale subscriptions. The 300ms debounce window prevents rapid subscription churn.
**Warning signs:** Seeing multiple simultaneous search query logs in the Convex dashboard during rapid typing.

### Pitfall 3: Confusing "Skip" Undefined with "No Results" Undefined

**What goes wrong:** Treating `searchResults === undefined` as "no results found" when it actually means "query not running."
**Why it happens:** `useQuery` returns `undefined` for both "loading" and "skipped" states.
**How to avoid:** Track the search state explicitly. If `debouncedTerm` is empty, the query is skipped -- don't show "no results." If `debouncedTerm` is non-empty and `searchResults === undefined`, show a loading indicator. If `debouncedTerm` is non-empty and `searchResults` is an empty array, show "no results found."
**Warning signs:** "No results found" flashing briefly when clearing the search input.

### Pitfall 4: N Key Shortcut Fires When Typing in Search Bar

**What goes wrong:** The global "N" keyboard shortcut (from Phase 2) opens QuickAdd when the user types "n" in the search input.
**Why it happens:** The keyboard listener in `App.tsx` already checks for `INPUT` and `TEXTAREA` tag names and skips them. However, if this check is not robust, it could fail.
**How to avoid:** The existing keyboard shortcut handler in `App.tsx` already guards against input fields: `if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;`. This will correctly ignore keystrokes in the search input. Verify this works during implementation.
**Warning signs:** QuickAdd dialog opening when typing in the search bar.

### Pitfall 5: Search Results Don't Include Future Archived Tasks

**What goes wrong:** Concern that search won't cover archived tasks (SRCH-02).
**Why it happens:** Misunderstanding the scope of the search index.
**How to avoid:** The search query does NOT filter by `column` or `archivedAt`. It searches ALL documents in the tasks table. When Phase 5 adds archiving (setting `archivedAt` on tasks), those tasks remain in the table and remain searchable. SRCH-02 is satisfied automatically by not adding any column/archive filter to the search query.
**Warning signs:** None -- this is a non-issue as long as the search query doesn't add unnecessary filters.

### Pitfall 6: Cadence Filter Interaction with Search

**What goes wrong:** User activates a cadence filter, then searches, creating confusing compound behavior.
**Why it happens:** Two independent filter mechanisms operating on different data sources.
**How to avoid:** Define clear behavior: when search is active (non-empty search term), cadence filter is either cleared or disabled. Search returns its own results independent of the board's cadence filter. When the user clears the search, the cadence filter (if previously set) can be restored or remain cleared.
**Warning signs:** Confusing UI where search results are further filtered by cadence, or where the cadence filter appears to "break" search.

## Code Examples

Verified patterns from official sources:

### Convex Search Query Function

```typescript
// Source: https://docs.convex.dev/search/text-search
// convex/tasks.ts -- add alongside existing exports
import { query } from "./_generated/server";
import { v } from "convex/values";

export const search = query({
  args: {
    term: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withSearchIndex("search_text", (q) =>
        q.search("searchText", args.term)
      )
      .take(20);
  },
});
```

### useDebounce Custom Hook

```typescript
// Can be placed in src/hooks/useDebounce.ts or inlined in Board.tsx
// Source: Standard React pattern (React docs, widespread community usage)
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
```

### Search Integration in Board Component

```typescript
// Source: https://docs.convex.dev/client/react (useQuery skip pattern)
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// Inside Board component:
const [searchTerm, setSearchTerm] = useState("");
const debouncedTerm = useDebounce(searchTerm, 300);

const allTasks = useQuery(api.tasks.list);
const searchResults = useQuery(
  api.tasks.search,
  debouncedTerm.trim() ? { term: debouncedTerm.trim() } : "skip"
);

const isSearchActive = debouncedTerm.trim().length > 0;

// Determine which tasks to show
const tasksToDisplay = isSearchActive ? searchResults : allTasks;
```

### Cadence Filter Toggle Buttons

```tsx
// CadenceFilter.tsx
const CADENCE_FILTERS = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
] as const;

interface CadenceFilterProps {
  active: string | null;
  onFilter: (cadence: string | null) => void;
  disabled?: boolean;
}

export function CadenceFilter({ active, onFilter, disabled }: CadenceFilterProps) {
  return (
    <div className="flex gap-2">
      {CADENCE_FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilter(active === f.value ? null : f.value)}
          disabled={disabled}
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
            active === f.value
              ? "bg-slate-700 text-white border-slate-700"
              : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
```

### Search Bar Component

```tsx
// SearchBar.tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tasks..."
        className="w-64 pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md
                   focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
      />
      {/* Magnifying glass icon or clear button can be added */}
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          x
        </button>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side text search with array `.filter()` | Convex `withSearchIndex` (server-side BM25) | Available since Convex search indexes were introduced | Proper ranking, prefix matching, tokenization -- don't reinvent search |
| `lodash.debounce` for input debouncing | Simple `useDebounce` hook with `useState` + `useEffect` | React hooks era (2019+) | No dependency needed; 4-line hook replaces lodash import |
| Polling for search results | Convex real-time subscriptions via `useQuery` | Convex default behavior | Search results update live when tasks change -- no manual refresh |

**Deprecated/outdated:**
- `lodash.debounce` / `underscore.debounce`: A custom 4-line hook is simpler for a single use case
- Client-side full-text search libraries (Fuse.js, lunr.js): Unnecessary when the backend provides server-side search with proper indexing
- Manual WebSocket subscription management: Convex `useQuery` handles real-time subscriptions automatically

## Open Questions

1. **Search results display: inline vs. overlay**
   - What we know: When search is active, results need to be displayed. The requirements say "see matching tasks" but don't specify the display format.
   - What's unclear: Should search results appear inline (filtering the board columns to show only matches), as a separate results panel below the toolbar, or as an overlay?
   - Recommendation: Show search results as a flat list below the toolbar, replacing the board columns temporarily. This is simpler than highlighting within columns and makes it clear which tasks matched. Each result card shows the task's current column as a label. Clicking a result opens the TaskModal.

2. **Search + cadence filter interaction**
   - What we know: Search is server-side (full-text), cadence filter is client-side. Both could theoretically be active simultaneously.
   - What's unclear: Should they compose (search results filtered by cadence) or be mutually exclusive?
   - Recommendation: Make them mutually exclusive. When the user starts typing in search, clear the cadence filter. When the user clicks a cadence filter, clear the search input. This avoids compound state complexity and keeps the UI predictable for a personal tool.

3. **useDebounce hook file location**
   - What we know: The project uses a flat `src/components/` structure (per Phase 1 decision). A custom hook doesn't fit the "components" folder.
   - What's unclear: Whether to create a `src/hooks/` directory or inline the hook.
   - Recommendation: Create `src/hooks/useDebounce.ts`. This is a single utility hook that is clearly not a component. A `hooks` directory is the standard React convention and doesn't violate the "flat and simple" philosophy -- it's a separate concern from components.

4. **Keyboard shortcut for search focus**
   - What we know: The app already has "N" for quick-add. A "/" shortcut for focusing search is common in web apps.
   - What's unclear: Whether to add a keyboard shortcut for search focus in this phase.
   - Recommendation: Add "/" as a keyboard shortcut to focus the search input. This is a common pattern (GitHub, Slack, etc.) and is trivial to implement alongside the existing "N" shortcut handler.

## Sources

### Primary (HIGH confidence)
- [Convex Full Text Search](https://docs.convex.dev/search/text-search) -- `searchIndex` definition, `withSearchIndex` query API, `.search()` requirement, `.eq()` filter expressions, BM25 ranking, prefix matching, 1024 document scan limit, 16 filter fields max
- [Convex React Client](https://docs.convex.dev/client/react) -- `useQuery` hook, `"skip"` pattern for conditional queries, `undefined` return for loading/skipped states
- [Convex Database Indexes](https://docs.convex.dev/database/reading-data/indexes/) -- 32 index limit per table, `withIndex` for database queries
- Existing codebase: `convex/schema.ts` (search index definition), `convex/tasks.ts` (existing query/mutation functions), `src/components/Board.tsx` (current board architecture with `Object.groupBy` and `useQuery(api.tasks.list)`)

### Secondary (MEDIUM confidence)
- [Convex Search Limits](https://docs.convex.dev/search/text-search) -- 16 terms max, 32 char term limit, 8 equality filters max, 1024 scan limit -- all verified from official docs page
- Standard React debounce patterns -- widely documented across React ecosystem; no single authoritative source but the `useState` + `useEffect` + `setTimeout` pattern is universal

### Tertiary (LOW confidence)
- None. All findings verified against official Convex documentation and the existing codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies needed; all functionality uses existing Convex search index and React hooks verified against official docs
- Architecture: HIGH -- Search query pattern verified against Convex full-text search docs; client-side filtering is a trivial array operation on already-loaded data; `"skip"` pattern verified in Convex React docs
- Pitfalls: HIGH -- `.search()` requirement confirmed in docs ("1 search expression and 0 or more equality expressions"); debounce patterns are well-established; N-key guard already implemented in existing codebase
- Code examples: HIGH -- All Convex examples follow documented patterns; React hooks are standard patterns

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable stack, no fast-moving dependencies)
