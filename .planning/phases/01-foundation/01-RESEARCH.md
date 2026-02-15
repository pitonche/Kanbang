# Phase 1: Foundation - Research

**Researched:** 2026-02-15
**Domain:** Project scaffolding (React + Vite + TypeScript + Convex + Tailwind CSS v4), Convex schema design, static Kanban board UI
**Confidence:** HIGH

## Summary

Phase 1 sets up the entire project foundation using the official `npm create convex` starter template (template-react-vite), which already ships with React 19, Vite 6, TypeScript 5.7, Convex 1.23+, and Tailwind CSS v4 pre-configured. The template includes a working `@tailwindcss/vite` plugin, `ConvexProvider` wiring, and a `convex/schema.ts` file -- meaning the scaffolding work is primarily about replacing the template's demo content with the Kanbang schema and board UI, not building from scratch.

The Convex schema needs to define a single `tasks` table with all fields needed across future phases (title, notes, column, cadence, priority, timestamps, searchText), a `by_column` database index for board queries, and a `searchIndex` on the `searchText` field for future full-text search. The board UI is a static layout of 6 fixed columns rendered with Tailwind utility classes -- no data fetching, no CRUD, no interactivity in this phase.

**Primary recommendation:** Use `npm create convex@latest` with the `react-vite` template, install with `bun install`, replace the demo schema/UI with the Kanbang schema and a 6-column board layout, and verify `bun run dev` starts the app with Convex connected.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use `npm create convex` starter template (React + Vite + Convex wired together)
- Package manager: bun
- Flat folder structure: all components in `src/components/` -- app is small enough to stay flat
- Add Tailwind CSS v4 on top of the Convex starter template

### Claude's Discretion
- Board visual design (column headers, spacing, color palette)
- Column behavior (width, empty state appearance)
- Task card placeholder appearance
- Convex schema field types and index configuration
- Tailwind theme setup

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `convex` | ^1.23.0 | Backend-as-a-service (database, server functions, real-time sync) | Included in template; provides schema, queries, mutations, real-time subscriptions |
| `react` | ^19.0.0 | UI framework | Included in template; latest stable React |
| `react-dom` | ^19.0.0 | React DOM renderer | Included in template |
| `vite` | ^6.2.0 | Dev server and bundler | Included in template; fast HMR, ESM-native |
| `tailwindcss` | ^4.0.14 | Utility-first CSS framework | Included in template as devDependency |
| `@tailwindcss/vite` | ^4.0.14 | First-party Tailwind Vite plugin | Included in template; zero-config, no PostCSS needed |
| `typescript` | ~5.7.2 | Type safety | Included in template |

### Supporting (already in template)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vitejs/plugin-react` | ^4.3.4 | React Fast Refresh for Vite | Included in template, enables HMR |
| `npm-run-all` | ^4.1.5 | Run frontend + backend dev servers in parallel | Included in template, used by `dev` script |
| `@types/node` | ^22.13.10 | Node.js type definitions | Included in template, needed for path resolution |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| N/A | N/A | All choices are locked by user decisions. Template already includes everything needed. |

**Installation:**
```bash
# Step 1: Create project from template
npm create convex@latest -- -t react-vite my-app
# Step 2: Switch to bun
cd my-app && bun install
# Step 3: Run dev (starts both frontend + backend)
bun run dev
```

**Important note about bun:** The `npm create convex` command itself uses npm (it is an npm initializer package). After scaffolding, switch to bun for all subsequent installs and script runs. The template's `.gitignore` already ignores `package-lock.json`, so the switch to bun is clean.

## Architecture Patterns

### Recommended Project Structure

```
kanbang/
├── convex/                    # Convex backend (auto-created by template)
│   ├── _generated/            # Auto-generated types and API (DO NOT EDIT)
│   ├── schema.ts              # Database schema with task table, indexes, search index
│   └── myFunctions.ts         # Template demo file (will be replaced in later phases)
├── src/
│   ├── components/            # All React components (flat, per user decision)
│   │   ├── Board.tsx          # Main board layout with 6 columns
│   │   └── Column.tsx         # Single column component
│   ├── App.tsx                # Root app component
│   ├── main.tsx               # Entry point with ConvexProvider
│   └── index.css              # Tailwind import + theme variables
├── index.html                 # Vite entry HTML
├── vite.config.ts             # Vite + React + Tailwind plugins
├── tsconfig.json              # TypeScript config (references app + node configs)
├── tsconfig.app.json          # App-specific TS config with @/* path alias
└── package.json               # Scripts: dev, build, lint
```

### Pattern 1: Convex Schema with Validators

**What:** Define the complete task schema upfront using Convex's `v` validator builder, even though most fields won't be used until later phases.
**When to use:** Always -- Convex schema provides runtime validation AND TypeScript types.
**Example:**

```typescript
// Source: https://docs.convex.dev/database/schemas
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    notes: v.optional(v.string()),
    column: v.union(
      v.literal("inbox"),
      v.literal("backlog"),
      v.literal("in_progress"),
      v.literal("needs_info"),
      v.literal("blocked"),
      v.literal("done"),
    ),
    cadence: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("none"),
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
    searchText: v.string(),
  })
    .index("by_column", ["column"])
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["column"],
    }),
});
```

### Pattern 2: Convex Provider Wiring (from template)

**What:** The template already wires `ConvexProvider` in `main.tsx`. No changes needed.
**When to use:** This is the standard pattern for all Convex React apps.
**Example:**

```typescript
// Source: https://github.com/get-convex/template-react-vite/blob/main/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
);
```

### Pattern 3: Tailwind CSS v4 Theme Variables

**What:** Tailwind v4 uses CSS-first configuration via `@theme` directive in your CSS file. No `tailwind.config.js` needed.
**When to use:** For custom colors, spacing, fonts -- all defined in `src/index.css`.
**Example:**

```css
/* Source: https://tailwindcss.com/docs/installation/using-vite + template index.css */
@import "tailwindcss";

@theme {
  --color-board-bg: #f1f5f9;
  --color-column-bg: #e2e8f0;
  --color-column-header: #334155;
  --color-card-bg: #ffffff;
  --color-card-border: #cbd5e1;
}
```

These become usable as `bg-board-bg`, `bg-column-bg`, `text-column-header`, etc.

### Pattern 4: Static Board with Column Constants

**What:** Define the 6 columns as a typed constant array and map over them to render the board. No data fetching needed for Phase 1.
**When to use:** Phase 1 -- board is purely presentational.
**Example:**

```typescript
// Column definitions as a const for type safety and reuse
export const COLUMNS = [
  { id: "inbox", label: "Inbox" },
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In Progress" },
  { id: "needs_info", label: "Needs Info" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
] as const;

export type ColumnId = (typeof COLUMNS)[number]["id"];
```

### Anti-Patterns to Avoid
- **Editing `convex/_generated/`:** These files are auto-generated by `npx convex dev`. Never modify them manually -- they regenerate on every schema change.
- **Creating a `tailwind.config.js`:** Tailwind v4 does not use a JS config file. All configuration goes in CSS via `@theme` directive. Creating a config file will cause confusion.
- **Using `v.number()` for timestamps and expecting Date objects:** Convex stores numbers as IEEE 754 doubles. Use `Date.now()` (milliseconds since epoch) and store as `v.number()`. Convex has no native Date type.
- **Putting search/filter logic in the schema phase:** The schema defines the search index structure, but the actual search queries belong in later phases.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Project scaffolding | Manual Vite + React + Convex setup | `npm create convex@latest -- -t react-vite` | Template handles Convex wiring, Vite config, Tailwind plugin, TypeScript config, dev scripts |
| Schema validation | Manual type checking | Convex `v` validators in `schema.ts` | Runtime validation + TypeScript type generation in one place |
| Full-text search infrastructure | Custom search logic | Convex `searchIndex` | Built on Tantivy (Rust), handles indexing, ranking (BM25), prefix matching automatically |
| CSS build pipeline | PostCSS setup, purge config | `@tailwindcss/vite` plugin | v4 plugin handles everything: scanning, building, HMR -- zero config |
| Dev server orchestration | Manual terminal management | `npm-run-all` (in template's `dev` script) | Runs `vite` and `convex dev` in parallel with a single command |

**Key insight:** The `npm create convex` template with the `react-vite` variant already solves the hardest integration problems. The work is replacing demo content, not configuring build tools.

## Common Pitfalls

### Pitfall 1: Convex Search Index Limitation -- Single searchField

**What goes wrong:** Trying to search across both `title` and `notes` fields simultaneously with a single search index.
**Why it happens:** Convex's `searchIndex` only supports exactly ONE `searchField`. You cannot index multiple fields.
**How to avoid:** Use a composite `searchText` field that concatenates `title + " " + notes` at write time. The schema already includes this field. When creating/updating tasks (in later phases), always recompute `searchText` from title and notes.
**Warning signs:** If someone tries to create two search indexes (one for title, one for notes) and merge results client-side -- this works but is more complex and less efficient than the composite field approach.

### Pitfall 2: Missing `convex dev` During Development

**What goes wrong:** Schema changes don't take effect, types are stale, `_generated/` files are outdated.
**Why it happens:** `convex dev` must be running continuously to sync schema and generate types. The template's `dev` script handles this, but if you run only `vite` without `convex dev`, nothing syncs.
**How to avoid:** Always use `bun run dev` (which runs both). Never run `bun run dev:frontend` alone during active development.
**Warning signs:** TypeScript errors about missing API functions, or schema changes not appearing in the Convex dashboard.

### Pitfall 3: `predev` Script Requires Convex Login

**What goes wrong:** First `bun run dev` fails because `convex dev --until-success` in the `predev` script needs authentication.
**Why it happens:** The template's `predev` script runs `convex dev --until-success && convex dashboard` before the main `dev` script. This requires a Convex account and project setup.
**How to avoid:** On first run, run `bunx convex dev` separately to complete the login/project-creation flow. After that, `bun run dev` works normally.
**Warning signs:** Error messages about authentication or missing project configuration on first run.

### Pitfall 4: Column ID Naming Convention Mismatch

**What goes wrong:** Using display labels ("In Progress") as column IDs in the database, leading to spaces in enum values and awkward queries.
**Why it happens:** Natural tendency to use human-readable names everywhere.
**How to avoid:** Use snake_case IDs (`in_progress`, `needs_info`) in the schema and a separate label mapping for display. The `COLUMNS` constant maps `id` to `label`.
**Warning signs:** Schema validators with spaces in literal values, or inconsistent casing between code and database.

### Pitfall 5: Tailwind v4 Config File Confusion

**What goes wrong:** Creating a `tailwind.config.js` or `tailwind.config.ts` file and expecting it to work.
**Why it happens:** Most Tailwind v3 tutorials and examples show a JS config file.
**How to avoid:** Tailwind v4 is CSS-first. All theme customization goes in the CSS file using `@theme { }`. The `@tailwindcss/vite` plugin handles everything else. No config file, no PostCSS config, no content globs.
**Warning signs:** Theme values not applying, or Tailwind not detecting utility classes.

## Code Examples

Verified patterns from official sources:

### Complete Schema for Kanbang Tasks

```typescript
// Source: https://docs.convex.dev/database/schemas + https://docs.convex.dev/search/text-search
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    // Core fields
    title: v.string(),
    notes: v.optional(v.string()),

    // Board position
    column: v.union(
      v.literal("inbox"),
      v.literal("backlog"),
      v.literal("in_progress"),
      v.literal("needs_info"),
      v.literal("blocked"),
      v.literal("done"),
    ),

    // Task metadata
    cadence: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("none"),
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
    ),

    // Timestamps (milliseconds since epoch via Date.now())
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),

    // Composite search field (title + notes, computed at write time)
    searchText: v.string(),
  })
    // Database index: query tasks by column (for board rendering)
    .index("by_column", ["column"])
    // Full-text search index: search across title+notes via searchText
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["column"],
    }),
});
```

### Vite Config (from template, no changes needed)

```typescript
// Source: https://github.com/get-convex/template-react-vite/blob/main/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Tailwind CSS Setup (index.css)

```css
/* Source: https://tailwindcss.com/docs/installation/using-vite */
@import "tailwindcss";

@theme {
  --color-board-bg: #f1f5f9;
  --color-column-bg: #e2e8f0;
  --color-column-header: #334155;
  --color-card-bg: #ffffff;
  --color-card-border: #cbd5e1;
  --color-empty-state: #94a3b8;
}
```

### Static Board Component

```tsx
// Board.tsx - Static board for Phase 1
import { Column } from "./Column";

const COLUMNS = [
  { id: "inbox", label: "Inbox" },
  { id: "backlog", label: "Backlog" },
  { id: "in_progress", label: "In Progress" },
  { id: "needs_info", label: "Needs Info" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
] as const;

export function Board() {
  return (
    <div className="flex gap-4 p-4 overflow-x-auto min-h-screen bg-board-bg">
      {COLUMNS.map((col) => (
        <Column key={col.id} id={col.id} label={col.label} />
      ))}
    </div>
  );
}
```

### Static Column Component

```tsx
// Column.tsx - Single column for Phase 1
export function Column({ id, label }: { id: string; label: string }) {
  return (
    <div className="flex flex-col w-72 shrink-0 bg-column-bg rounded-lg">
      <h2 className="px-3 py-2 text-sm font-semibold text-column-header">
        {label}
      </h2>
      <div className="flex-1 p-2 min-h-[200px]">
        <p className="text-sm text-empty-state text-center mt-8">
          No tasks
        </p>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3: `tailwind.config.js` + PostCSS + content globs | Tailwind v4: `@tailwindcss/vite` plugin + `@import "tailwindcss"` in CSS + `@theme` for config | Jan 2025 (v4.0 release) | No config files needed; 5x faster builds; theme in CSS not JS |
| Convex manual setup: `npm create vite` + `npm install convex` + manual wiring | `npm create convex@latest -- -t react-vite` | 2025 (template-react-vite) | One command gives working full-stack app with Tailwind v4 included |
| React 18 + `createRoot` | React 19 + `createRoot` (same API) | Dec 2024 (React 19) | Template already uses React 19; no migration needed |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts`: Replaced by CSS-first `@theme` directive in Tailwind v4. Do not create this file.
- `postcss.config.js` with `tailwindcss` plugin: Replaced by `@tailwindcss/vite` plugin. Do not create this file.
- `content` array in Tailwind config: v4 auto-detects content sources. No configuration needed.
- `.eslintrc.cjs`: Template uses the new flat ESLint config format (`eslint.config.js`).

## Open Questions

1. **Column ordering within each column**
   - What we know: Tasks within a column will need an order for future drag-and-drop (Phase with TASK-04). The schema could include a `position` or `order` field.
   - What's unclear: Whether to add an `order` field now or defer to the drag-and-drop phase.
   - Recommendation: Defer. The current schema uses `_creationTime` (auto-added to all indexes by Convex) as the implicit sort order. Adding explicit ordering is a concern for the drag-and-drop phase and would require an additional index. The `by_column` index already sorts by `_creationTime` within each column.

2. **`searchText` population strategy**
   - What we know: `searchText` must be populated at write time by concatenating `title + " " + (notes ?? "")`. The schema defines it as `v.string()` (required).
   - What's unclear: Whether to set a default empty string for `searchText` in Phase 1 (since no tasks exist yet) or to only address this when task creation (TASK-01) is implemented.
   - Recommendation: Define the field as required (`v.string()`) now. Task creation logic in a later phase will be responsible for computing it. Since no tasks are created in Phase 1, there is no conflict.

## Sources

### Primary (HIGH confidence)
- [Convex React Quickstart](https://docs.convex.dev/quickstart/react) -- project setup steps, ConvexProvider pattern
- [Convex Schemas](https://docs.convex.dev/database/schemas) -- `defineSchema`, `defineTable`, `v` validators, optional fields, unions, literals
- [Convex Indexes](https://docs.convex.dev/database/reading-data/indexes/) -- `index()` method, index definition, `_creationTime` auto-append, limits (32 indexes, 16 fields)
- [Convex Full Text Search](https://docs.convex.dev/search/text-search) -- `searchIndex()`, `searchField` (singular), `filterFields`, query pattern with `.withSearchIndex()`
- [get-convex/template-react-vite (GitHub)](https://github.com/get-convex/template-react-vite) -- template structure, package.json, vite.config.ts, schema.ts, App.tsx, main.tsx, index.css
- [Tailwind CSS v4 Vite Installation](https://tailwindcss.com/docs/installation/using-vite) -- `@tailwindcss/vite` plugin, `@import "tailwindcss"`, no config file
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode) -- `prefers-color-scheme` default, `@custom-variant dark` for manual toggle

### Secondary (MEDIUM confidence)
- [Tailwind CSS v4.0 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4) -- release notes, performance improvements, CSS-first approach
- [Convex Bun Quickstart](https://docs.convex.dev/quickstart/bun) -- `bunx convex dev` usage confirmed

### Tertiary (LOW confidence)
- None. All findings verified against official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions and configurations verified against the actual template-react-vite repository on GitHub (last commit Jan 7, 2026)
- Architecture: HIGH -- Schema patterns verified against Convex official docs; Tailwind v4 patterns verified against official installation guide
- Pitfalls: HIGH -- Search index single-field limitation confirmed in official docs; Tailwind v4 migration well-documented

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable stack, template updated recently)
