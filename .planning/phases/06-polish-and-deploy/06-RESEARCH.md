# Phase 6: Polish and Deploy - Research

**Researched:** 2026-02-15
**Domain:** Responsive CSS layout, Tailwind CSS v4 responsive utilities, dnd-kit mobile touch support, Vercel + Convex deployment
**Confidence:** HIGH

## Summary

Phase 6 covers three distinct concerns: (1) making the Kanban board responsive on mobile, (2) adding task counts to column headers, and (3) deploying the Vite/Convex app to Vercel. The responsive work is the most involved piece -- the current board uses a fixed `w-72` column width with `overflow-x-auto` horizontal scroll, which already works on mobile as a horizontally-scrollable layout, but the toolbar (SearchBar + CadenceFilter) needs responsive treatment and touch-based drag-and-drop requires adding a TouchSensor alongside the existing PointerSensor. Column counts are trivial (render `tasks.length` in the header). Deployment is straightforward following Convex's official Vercel guide: push to GitHub, create Vercel project, set `CONVEX_DEPLOY_KEY`, override build command to `npx convex deploy --cmd 'npm run build'`.

**Primary recommendation:** Keep horizontal scroll for columns on mobile (do NOT stack vertically -- 6 stacked columns is unusable). Focus responsive work on the nav/toolbar, touch sensor for drag-and-drop, and ensuring the viewport meta tag and page title are correct.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | ^4.1.18 | Responsive utilities (sm:, md:, max-sm:) | Already installed; mobile-first breakpoint system built in |
| @dnd-kit/core | ^6.3.1 | TouchSensor for mobile drag-and-drop | Already installed; TouchSensor is the official mobile solution |
| Convex CLI | ^1.31.7 | `npx convex deploy` for production deployment | Already installed; official deployment tool |
| Vercel | (platform) | Static hosting with auto-deploy | Official Convex deployment target |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | No new libraries needed | Phase uses existing stack exclusively |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Horizontal scroll on mobile | Stacked columns (vertical) | 6 stacked columns creates excessive scrolling; horizontal scroll with fixed-width columns is standard for Kanban on mobile |
| Vercel | Netlify, Cloudflare Pages | Convex has first-class Vercel integration with documented deploy-key flow; other hosts require more manual configuration |

**Installation:**
```bash
# No new packages needed -- all dependencies are already in place
```

## Architecture Patterns

### Current Layout Structure (What Exists)
```
App.tsx
  <nav>                          -- fixed nav bar (Board | Archive)
  <Board>
    <div toolbar>                -- SearchBar + CadenceFilter (flex, gap-4, px-6)
    <div columns>                -- flex gap-4 px-6 overflow-x-auto
      <Column w-72 shrink-0>    -- fixed 288px width, each column
  <QuickAdd>                     -- dialog modal
  <TaskModal>                    -- dialog modal
```

### Pattern 1: Responsive Toolbar (Mobile-First)
**What:** The toolbar currently uses a `flex` row layout. On mobile (< 640px), the SearchBar has a fixed `w-64` which leaves no room for CadenceFilter pills. Make the toolbar stack vertically on mobile and row on desktop.
**When to use:** When toolbar items overflow on narrow viewports.
**Example:**
```typescript
// Source: https://tailwindcss.com/docs/responsive-design
// Mobile: stack vertically. sm+: horizontal row
<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 px-4 sm:px-6 pt-4 pb-2">
  <SearchBar />  {/* Make w-full on mobile, w-64 on sm+ */}
  <CadenceFilter />
</div>
```

### Pattern 2: Touch Sensor for Mobile Drag-and-Drop
**What:** The current Board uses only PointerSensor. On touch devices, PointerSensor can conflict with page scroll. Add TouchSensor with a delay constraint so users can scroll the board normally and long-press to drag.
**When to use:** Any app with drag-and-drop that must work on mobile/touch devices.
**Example:**
```typescript
// Source: https://docs.dndkit.com/legacy/api-documentation/sensors/touch
import { TouchSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  }),
);
```
Also add `touch-action: manipulation` CSS to draggable cards:
```typescript
// In TaskCard component
<div style={{ touchAction: "manipulation" }} ...>
```

### Pattern 3: Vercel + Convex Deployment Flow
**What:** The official deployment process: connect GitHub repo to Vercel, override build command, set deploy key environment variable.
**When to use:** Every Convex app deploying to Vercel.
**Example:**
```
Vercel Build Command: npx convex deploy --cmd 'npm run build'
Environment Variable: CONVEX_DEPLOY_KEY = <from Convex Dashboard>
```
The `npx convex deploy` command reads `CONVEX_DEPLOY_KEY` and automatically sets `VITE_CONVEX_URL` for the Vite build. The app's `main.tsx` already reads `import.meta.env.VITE_CONVEX_URL` which is exactly what Convex populates.

### Pattern 4: Column Count Badge
**What:** Display the number of tasks in each column header.
**When to use:** Always -- this is requirement BOARD-03.
**Example:**
```typescript
// In Column component header
<h2 className="px-3 py-2 text-sm font-semibold text-column-header uppercase tracking-wide">
  {label}
  <span className="ml-2 text-xs font-normal text-slate-400">
    {tasks.length}
  </span>
</h2>
```

### Anti-Patterns to Avoid
- **Stacking 6 columns vertically on mobile:** This creates an enormous scrollable page and defeats the Kanban board mental model. Horizontal scroll is standard for Kanban apps on mobile (Trello, Linear, Notion boards all use it).
- **Using PointerSensor alone on mobile:** PointerSensor intercepts touch events that should scroll the page, making the board unusable on touch devices.
- **Hardcoding the Convex URL:** The app correctly uses `import.meta.env.VITE_CONVEX_URL` -- do not change this to a hardcoded URL. The `npx convex deploy` command sets this automatically during the Vercel build.
- **Creating a `.env.local` file in git:** The `.gitignore` already excludes `*.local`. The `VITE_CONVEX_URL` for production is injected by `npx convex deploy` during Vercel builds, not from a committed env file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile drag-and-drop | Custom touch event handlers | dnd-kit TouchSensor | Edge cases with scroll vs drag detection, activation thresholds, browser quirks |
| Responsive breakpoints | Manual CSS media queries | Tailwind responsive prefixes (sm:, md:) | Already using Tailwind; utility classes are consistent and composable |
| SPA routing on Vercel | Custom server config | `vercel.json` with rewrites | Standard Vercel pattern for SPAs, one-time setup |
| Convex production deploy | Manual environment wiring | `npx convex deploy --cmd` | Handles VITE_CONVEX_URL injection, function deployment, and build orchestration |

**Key insight:** This phase adds no new libraries. All tooling (Tailwind responsive utilities, dnd-kit TouchSensor, Convex deploy CLI) is already installed. The work is configuration and CSS adjustments.

## Common Pitfalls

### Pitfall 1: PointerSensor Blocks Scrolling on Touch Devices
**What goes wrong:** On mobile, trying to scroll the board triggers drag instead of scroll, making the board unusable.
**Why it happens:** PointerSensor treats touch events the same as mouse events. Without a TouchSensor with delay, any finger movement starts a drag.
**How to avoid:** Add TouchSensor with `delay: 200, tolerance: 5` and set `touch-action: manipulation` on draggable elements.
**Warning signs:** Board works fine on desktop but cards "stick" or page won't scroll on mobile.

### Pitfall 2: Vercel Build Fails Due to Missing CONVEX_DEPLOY_KEY
**What goes wrong:** Build command `npx convex deploy --cmd 'npm run build'` fails with authentication error.
**Why it happens:** The `CONVEX_DEPLOY_KEY` environment variable wasn't set in Vercel project settings, or was scoped to the wrong environment (e.g., only Preview, not Production).
**How to avoid:** Generate a Production Deploy Key from Convex Dashboard > Project Settings. Set it in Vercel environment variables scoped to Production. For preview deployments, generate a separate Preview Deploy Key.
**Warning signs:** Build log shows "Error: Could not find credentials" or similar auth error.

### Pitfall 3: No vercel.json Causes 404 on Direct URL Access
**What goes wrong:** App works when navigating from the root, but refreshing the page or sharing a URL returns 404.
**Why it happens:** Vite SPAs serve a single `index.html`. Without a rewrite rule, Vercel tries to find a file matching the URL path.
**How to avoid:** Add `vercel.json` with `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`.
**Warning signs:** This app currently only uses root URL (no client-side routing), so this may not be critical for MVP, but it's good practice to include regardless.

### Pitfall 4: SearchBar Overflows on Narrow Mobile Screens
**What goes wrong:** The SearchBar has a fixed `w-64` (256px) width. On phones under 320px or with the CadenceFilter beside it, content overflows.
**Why it happens:** Fixed width doesn't adapt to available viewport space.
**How to avoid:** Use `w-full sm:w-64` so the search bar takes full width on mobile and fixed width on larger screens.
**Warning signs:** Horizontal scrollbar appears on the page body, or filter pills wrap awkwardly below the search bar.

### Pitfall 5: GitHub Repository Not Connected
**What goes wrong:** Cannot deploy to Vercel because there's no remote repository.
**Why it happens:** The project has no git remote set up (`git remote -v` returns empty).
**How to avoid:** Create a GitHub repository and add it as remote before attempting Vercel deployment. Vercel auto-deploys on push.
**Warning signs:** `git remote -v` shows no remotes.

### Pitfall 6: HTML Title Still Says "Vite + React + TS"
**What goes wrong:** Deployed app shows generic tab title instead of "Kanbang".
**Why it happens:** The `index.html` `<title>` was never updated from the Vite template default.
**How to avoid:** Change `<title>` in `index.html` to "Kanbang" before deploying.
**Warning signs:** Browser tab shows "Vite + React + TS".

## Code Examples

Verified patterns from official sources:

### Responsive Toolbar Layout
```typescript
// Source: Tailwind CSS v4 responsive design - https://tailwindcss.com/docs/responsive-design
// Mobile-first: stack toolbar items vertically, horizontal on sm+
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 px-4 sm:px-6 pt-4 pb-2">
  <SearchBar />  {/* Update to use w-full sm:w-64 */}
  <CadenceFilter />
</div>
```

### Responsive SearchBar Width
```typescript
// Source: Tailwind CSS responsive design - https://tailwindcss.com/docs/responsive-design
<input
  className="w-full sm:w-64 pl-9 pr-8 py-1.5 text-sm border border-slate-300 rounded-md
             bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
/>
```

### TouchSensor Configuration
```typescript
// Source: https://docs.dndkit.com/legacy/api-documentation/sensors/touch
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  }),
);
// Pass sensors to DndContext as before -- already done
```

### touch-action CSS for Draggable Cards
```typescript
// Source: https://docs.dndkit.com/legacy/api-documentation/sensors/touch#touch-action
// Add to TaskCard's draggable element
<div
  ref={setNodeRef}
  style={{ ...style, touchAction: "manipulation" }}
  {...attributes}
  {...listeners}
>
```

### Column Count in Header
```typescript
// Simple -- no external source needed
<h2 className="px-3 py-2 text-sm font-semibold text-column-header uppercase tracking-wide">
  {label}
  <span className="ml-2 text-xs font-normal text-slate-400">{tasks.length}</span>
</h2>
```

### vercel.json for Vite SPA
```json
// Source: https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Vercel Build Command
```
# Source: https://docs.convex.dev/production/hosting/vercel
# Vercel > Settings > Build & Development Settings > Build Command:
npx convex deploy --cmd 'npm run build'
```

### Updated index.html Title
```html
<!-- Fix the template default title -->
<title>Kanbang</title>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 config-based breakpoints | Tailwind v4 CSS-native `@theme` breakpoints | 2025 (v4 release) | Breakpoints now customized in CSS, not `tailwind.config.js`; default breakpoints unchanged |
| Convex manual production setup | `npx convex deploy --cmd` auto-injects env vars | Stable since Convex 1.x | Single command handles function deploy + frontend build + URL wiring |
| Vercel Marketplace integration | Available for Convex since 2024 | 2024 | Alternative to manual setup, but manual approach gives more control |
| dnd-kit legacy docs | dnd-kit docs at docs.dndkit.com (Mintlify) | 2025 | TouchSensor API unchanged; docs reorganized under `/legacy/` path |

**Deprecated/outdated:**
- None relevant to this phase. All APIs are stable.

## Open Questions

1. **GitHub repository setup**
   - What we know: The project has no git remote configured. Vercel deployment requires a connected Git repository.
   - What's unclear: Whether the user wants to create the repo manually or have the planner include repo creation steps.
   - Recommendation: Include `gh repo create` step in the deployment plan as a prerequisite, but note the user may prefer to do this manually.

2. **Convex project/deployment naming**
   - What we know: The Convex dev deployment was created when `npx convex dev` was first run. A separate production deployment exists on the Convex dashboard.
   - What's unclear: Whether the user has already visited the Convex dashboard and has a production deploy key ready.
   - Recommendation: Include instructions for generating a production deploy key from the Convex Dashboard in the plan.

3. **Favicon**
   - What we know: The app currently uses `convex.svg` as the favicon (from the template). The HTML `<title>` still says "Vite + React + TS".
   - What's unclear: Whether the user wants a custom favicon or is fine with a generic one.
   - Recommendation: At minimum update the `<title>` to "Kanbang". Favicon update can be deferred but is easy polish.

## Sources

### Primary (HIGH confidence)
- [Convex: Using Convex with Vercel](https://docs.convex.dev/production/hosting/vercel) - Full deployment guide including build command, CONVEX_DEPLOY_KEY, preview deployments
- [Convex: Configuring Deployment URL](https://docs.convex.dev/client/react/deployment-urls) - VITE_CONVEX_URL environment variable for Vite projects
- [Vercel: Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) - SPA rewrites, vercel.json configuration, environment variables
- [Tailwind CSS v4: Responsive Design](https://tailwindcss.com/docs/responsive-design) - Breakpoints (sm 640px, md 768px, lg 1024px), mobile-first approach, max-* variants
- [dnd-kit: Touch Sensor](https://docs.dndkit.com/legacy/api-documentation/sensors/touch) - TouchSensor activation constraints, touch-action CSS recommendation

### Secondary (MEDIUM confidence)
- [Vercel: SPA Routing Discussion](https://community.vercel.com/t/rewrite-to-index-html-ignored-for-react-vite-spa-404-on-routes/8412) - Confirms vercel.json rewrite pattern for Vite SPAs
- [dnd-kit GitHub Issue #435](https://github.com/clauderic/dnd-kit/issues/435) - PointerSensor issues on touch devices, recommends TouchSensor

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries; all tooling already installed and documented
- Architecture: HIGH - Responsive patterns are standard Tailwind; Vercel/Convex deployment is officially documented step-by-step
- Pitfalls: HIGH - Touch sensor conflicts, missing deploy keys, SPA routing issues are well-documented in official docs and issue trackers

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable -- all APIs mature, no fast-moving changes expected)
