# Stack Research

**Domain:** Personal Kanban Board (task management SPA)
**Researched:** 2026-02-15
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| React | ^19.2.4 | UI framework | Stable, current major version. Hooks-based architecture is standard for SPAs. React 19's improved rendering and concurrent features are production-ready since Dec 2024. | HIGH |
| Vite | ^7.3.1 | Build tool / dev server | Current stable. 5x faster HMR than Webpack. First-class TypeScript support. Native ESM. Vite 7 requires Node 20.19+ (Node 18 EOL). Do NOT use Vite 8 beta (Rolldown bundler) -- it is not production-ready. | HIGH |
| TypeScript | ^5.9.3 | Type safety | Current stable release. TS 6.0 is in beta (Feb 2026) -- do NOT use it yet. 5.9 has full Vite 7 and React 19 compatibility. | HIGH |
| Convex | ^1.31.7 | Backend (database, functions, real-time sync) | Reactive database with real-time subscriptions, built-in full-text search, scheduled functions, and zero-config deployment. Eliminates the need for a separate API layer, ORM, or database server. TypeScript-native. | HIGH |
| Tailwind CSS | ^4.1.18 | Utility-first CSS | v4 is a full rewrite with a Rust engine (5x faster builds). Zero-config: just `@import "tailwindcss"` in CSS. Design tokens via `@theme` in CSS instead of `tailwind.config.js`. No config file needed for this project. | HIGH |

### Backend (Convex)

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| convex | ^1.31.7 | Client SDK + schema + functions | Single package covers client hooks (`useQuery`, `useMutation`), schema definition (`defineSchema`, `defineTable`), validators (`v.*`), and function definitions. Since 1.31.0, `db.get/patch/replace/delete` take table name as first param. | HIGH |
| convex-helpers | ^0.1.107 | Utility helpers for Convex | Validator reuse, relationship helpers, custom function wrappers. Official companion library from Convex team. Optional but useful for reducing boilerplate in schema/validator definitions. | MEDIUM |

### Drag and Drop

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| @dnd-kit/core | ^6.3.1 | Drag-and-drop primitives | Mature, well-documented, widely used for kanban boards. ~10kb with zero external dependencies. Extensive community examples for kanban-style boards. | HIGH |
| @dnd-kit/sortable | ^10.0.0 | Sortable list extension | Built on top of @dnd-kit/core. Provides SortableContext for column-based card ordering with smooth animations. Standard pairing for kanban implementations. | HIGH |
| @dnd-kit/utilities | ^3.2.2 | CSS transform utilities | Provides `CSS.Transform.toString()` for drag overlays. Small utility, typically needed alongside core+sortable. | HIGH |

**Note on @dnd-kit/react (v0.2.4):** A new rewrite of dnd-kit exists with `@dnd-kit/react` + `@dnd-kit/helpers` packages built on a layered architecture (@dnd-kit/abstract -> @dnd-kit/dom -> @dnd-kit/react). It is actively developed (last publish: 7 days ago) but only has 27 dependents on npm. The classic @dnd-kit/core + @dnd-kit/sortable combination has thousands of dependents, extensive tutorials, and proven kanban examples. **Recommendation: Use the classic packages (@dnd-kit/core + @dnd-kit/sortable).** The new packages can be evaluated later but are too new for a greenfield MVP where stable drag-and-drop is critical.

**Note on React 19 compatibility:** The classic @dnd-kit/core has peerDependencies of `react >=16.8.0`, which technically allows React 19. Community reports indicate it works with React 19 in practice. If peer dependency warnings appear during install, use `--legacy-peer-deps` or add an override in package.json. This is a known ecosystem-wide issue as libraries update their peer dependency ranges for React 19.

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| @vitejs/plugin-react | ^5.1.4 | Vite React integration | Always -- required for JSX transform, Fast Refresh in Vite | HIGH |
| clsx | ^2.1.1 | Conditional CSS class merging | When building reusable components with conditional Tailwind classes | HIGH |
| tailwind-merge | ^3.4.0 | Tailwind class conflict resolution | When composing Tailwind classes from multiple sources (e.g., base + override). Supports Tailwind v4. | HIGH |
| lucide-react | ^0.564.0 | Icon library | For UI icons (drag handles, close buttons, status indicators). Tree-shakeable, consistent design. | MEDIUM |

### Development Tools

| Tool | Purpose | Notes | Confidence |
|------|---------|-------|------------|
| Node.js | Runtime | >=20.19 required by Vite 7. Use LTS (22.x recommended). | HIGH |
| npm | Package manager | Default. pnpm also works but npm is simplest for a solo project. | HIGH |
| ESLint | Linting | Use `@eslint/js` + `typescript-eslint`. Vite scaffolds this. | MEDIUM |
| Prettier | Code formatting | Pair with `prettier-plugin-tailwindcss` for automatic class sorting. | MEDIUM |

## Installation

```bash
# Scaffold project
npm create vite@latest kanbang -- --template react-ts
cd kanbang

# Core backend
npm install convex

# Drag and drop
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Styling utilities
npm install clsx tailwind-merge

# Icons (optional but recommended)
npm install lucide-react

# Tailwind CSS v4 (Vite plugin handles PostCSS automatically)
npm install tailwindcss @tailwindcss/vite

# Dev dependencies (mostly scaffolded by Vite)
npm install -D typescript @types/react @types/react-dom

# Optional: convex-helpers for validator reuse
npm install convex-helpers

# Initialize Convex
npx convex init
```

**Tailwind v4 setup note:** With Tailwind v4 + Vite, add `@tailwindcss/vite` to your Vite config as a plugin. In your main CSS file, replace any v3 directives with a single `@import "tailwindcss";`. No `tailwind.config.js` needed.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @dnd-kit/core + @dnd-kit/sortable | @hello-pangea/dnd (v18.0.1) | Do NOT use -- peer dependencies cap at React 18. No React 19 support. Last published over a year ago. |
| @dnd-kit/core + @dnd-kit/sortable | @dnd-kit/react (v0.2.4) | Only if you want to experiment with the new API. Too few dependents (27) and too new (v0.2.x) for production MVP. Evaluate after it reaches v1.0. |
| @dnd-kit/core + @dnd-kit/sortable | @atlaskit/pragmatic-drag-and-drop | Only if you need framework-agnostic DnD. More verbose setup than dnd-kit. Peer dependencies also cap at React 18. Lower-level API requires more custom code. |
| @dnd-kit/core + @dnd-kit/sortable | react-dnd | Only for complex non-list drag scenarios (e.g., free-form canvas). Overkill and more complex API for a simple kanban board. |
| Convex | Supabase | If you need PostgreSQL, complex SQL queries, or row-level security. Convex is simpler for real-time reactive apps and provides TypeScript-native schema/functions with zero infrastructure management. |
| Convex | Firebase | If you are already in the Google Cloud ecosystem. Convex has a better DX for TypeScript projects: type-safe queries, schema-first design, built-in full-text search (Firebase requires Algolia or similar). |
| Tailwind CSS v4 | CSS Modules | If you prefer scoped CSS. Tailwind v4 is faster to iterate with for a solo project and produces minimal CSS via its new Rust engine. |
| Vite | Next.js | If you need SSR, file-based routing, or API routes. This is a client-side SPA with Convex as the backend -- no SSR needed. Vite is lighter and faster for SPAs. |
| Vercel | Netlify | If you prefer Netlify's workflow. Vercel has first-class Convex marketplace integration (Nov 2025) making deployment trivial. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-beautiful-dnd | Officially deprecated by Atlassian. No React 18+ support. Unmaintained since 2022. | @dnd-kit/core + @dnd-kit/sortable |
| @hello-pangea/dnd | Peer dependencies cap at React 18. Last published over 1 year ago. React 19 is blocked (GitHub issue #864 open). | @dnd-kit/core + @dnd-kit/sortable |
| Tailwind CSS v3 | v4 is the current release with dramatically better performance (Rust engine). v3 requires tailwind.config.js and @tailwind directives -- unnecessary complexity. | Tailwind CSS v4 |
| tailwind.config.js | Not needed in Tailwind v4. Design tokens are defined via `@theme` in CSS. Adding a JS config adds unnecessary tooling. | `@theme` directive in CSS |
| Vite 8 (beta) | Uses Rolldown bundler (Rust-based replacement for esbuild+Rollup). Still in beta as of Feb 2026. Breaking changes likely. | Vite 7.3.x (stable) |
| TypeScript 6.0 (beta) | Just entered beta (Feb 11, 2026). Last JS-based compiler before the Go rewrite (TS 7). Not production-ready. | TypeScript 5.9.x |
| Redux / Zustand | Convex provides reactive state via useQuery/useMutation hooks. Adding a separate state manager creates unnecessary indirection for data that lives in the database. | Convex React hooks (useQuery, useMutation) |
| React Router | This is a single-view app (board + archived view). A full router is overhead. If navigation is needed later, use simple conditional rendering or minimal hash-based routing. | Conditional rendering / useState |
| Prisma / Drizzle / any ORM | Convex has its own schema, query, and mutation system. ORMs are incompatible and unnecessary. | Convex schema + functions |
| Express / Hono / any HTTP server | Convex functions are your backend. There is no HTTP server to manage. | Convex queries + mutations + actions |
| create-react-app | Deprecated. Slow. No longer maintained. | Vite with react-ts template |
| Webpack | Slower dev server, more complex config. Vite replaced it as the standard React build tool. | Vite |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| vite@^7.3.1 | node@>=20.19 \|\| >=22.12 | Node 18 dropped in Vite 7. Use Node 22 LTS. |
| vite@^7.3.1 | @vitejs/plugin-react@^5.1.4 | Plugin version must match Vite major version range. |
| tailwindcss@^4.1.18 | @tailwindcss/vite@^4.1.18 | Vite plugin version should match Tailwind version. |
| tailwind-merge@^3.4.0 | tailwindcss@^4.x | tw-merge v3 supports Tailwind v4. If using Tailwind v3, use tw-merge v2. |
| convex@^1.31.7 | react@^18.0.0 \|\| ^19.0.0 | Convex client hooks work with React 18 and 19. |
| @dnd-kit/core@^6.3.1 | react@>=16.8.0 | Broad React compatibility. Works with React 19 in practice. |
| @dnd-kit/sortable@^10.0.0 | @dnd-kit/core@^6.3.1 | Sortable depends on core. Install both. |
| typescript@^5.9.3 | vite@^7.3.1 | Vite may ship incompatible TS changes between minors. Pin to 5.9.x. |

## Convex-Specific Stack Notes

### Full-Text Search
Convex has built-in full-text search via search indexes defined in your schema. No external search service (Algolia, Meilisearch) needed. Define a search index on a field, query with `.withSearchIndex()`. Results are reactive and consistent.

### Scheduled Functions / Cron Jobs
Convex supports cron jobs (`crons.daily()`, `crons.interval()`, etc.) defined at deploy time, and scheduled functions (`ctx.scheduler.runAfter()`) for dynamic scheduling. Use cron jobs for the 14-day auto-archive of Done tasks, OR run the archive check on app load via a mutation.

### Vercel Deployment
Convex has a Vercel Marketplace integration (Nov 2025). Deploy command: `npx convex deploy --cmd 'npm run build'`. Set `CONVEX_DEPLOY_KEY` as a Vercel environment variable. Convex functions deploy alongside your frontend automatically.

### No Auth for MVP
Convex supports auth (via Clerk, Auth0, etc.) but for MVP with no auth, simply skip the auth setup. Convex functions are open by default -- add auth later when needed.

## Sources

- [npm: convex@1.31.7](https://www.npmjs.com/package/convex) -- version verified
- [npm: @dnd-kit/core@6.3.1](https://www.npmjs.com/package/@dnd-kit/core) -- version verified
- [npm: @dnd-kit/sortable@10.0.0](https://www.npmjs.com/package/@dnd-kit/sortable) -- version verified
- [npm: @dnd-kit/react@0.2.4](https://www.npmjs.com/package/@dnd-kit/react) -- evaluated and deprioritized (too new)
- [npm: @hello-pangea/dnd@18.0.1](https://www.npmjs.com/package/@hello-pangea/dnd) -- rejected (no React 19 support)
- [GitHub: hello-pangea/dnd #864 - Support React 19](https://github.com/hello-pangea/dnd/issues/864) -- confirmed React 19 blocker
- [Vite 7.0 announcement](https://vite.dev/blog/announcing-vite7) -- Node 20+ requirement, version verified
- [Vite 8 Beta announcement](https://vite.dev/blog/announcing-vite8-beta) -- confirmed beta status, not for production
- [npm: vite@7.3.1](https://www.npmjs.com/package/vite) -- version verified
- [npm: tailwindcss@4.1.18](https://www.npmjs.com/package/tailwindcss) -- version verified
- [Tailwind CSS v4.0 blog post](https://tailwindcss.com/blog/tailwindcss-v4) -- architecture changes verified
- [npm: react@19.2.4](https://www.npmjs.com/package/react) -- version verified
- [npm: typescript@5.9.3](https://www.npmjs.com/package/typescript) -- version verified
- [TypeScript 6.0 Beta announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-beta/) -- confirmed beta, not for production
- [npm: @vitejs/plugin-react@5.1.4](https://www.npmjs.com/package/@vitejs/plugin-react) -- version verified
- [npm: tailwind-merge@3.4.0](https://www.npmjs.com/package/tailwind-merge) -- version verified, Tailwind v4 support confirmed
- [npm: clsx@2.1.1](https://www.npmjs.com/package/clsx) -- version verified
- [npm: lucide-react@0.564.0](https://www.npmjs.com/package/lucide-react) -- version verified
- [npm: convex-helpers@0.1.107](https://www.npmjs.com/package/convex-helpers) -- version verified
- [Convex React Quickstart](https://docs.convex.dev/quickstart/react) -- setup pattern verified
- [Convex Full Text Search docs](https://docs.convex.dev/search/text-search) -- search index API verified
- [Convex Cron Jobs docs](https://docs.convex.dev/scheduling/cron-jobs) -- scheduling API verified
- [Convex Vercel deployment guide](https://docs.convex.dev/production/hosting/vercel) -- deployment pattern verified
- [Convex Vercel Marketplace](https://vercel.com/marketplace/convex) -- integration confirmed (Nov 2025)
- [dnd-kit kanban board tutorial (LogRocket)](https://blog.logrocket.com/build-kanban-board-dnd-kit-react/) -- kanban pattern reference
- [Top 5 Drag-and-Drop Libraries for React in 2026 (Puck)](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) -- ecosystem survey

---
*Stack research for: Personal Kanban Board (Kanbang)*
*Researched: 2026-02-15*
