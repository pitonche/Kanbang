# Phase 1: Foundation - Context

**Gathered:** 2026-02-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Convex schema with all task fields and indexes, project scaffolding (React + Vite + TypeScript + Convex + Tailwind), and a static board rendering 6 labeled columns (Inbox, Backlog, In Progress, Needs Info, Blocked, Done). No task CRUD, no drag-and-drop, no search — those are later phases.

</domain>

<decisions>
## Implementation Decisions

### Project Scaffolding
- Use `npm create convex` starter template (React + Vite + Convex wired together)
- Package manager: bun
- Flat folder structure: all components in `src/components/` — app is small enough to stay flat
- Add Tailwind CSS v4 on top of the Convex starter template

### Claude's Discretion
- Board visual design (column headers, spacing, color palette)
- Column behavior (width, empty state appearance)
- Task card placeholder appearance
- Convex schema field types and index configuration
- Tailwind theme setup

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User wants minimal UI, Tailwind-only styling, and a clean starting point via the Convex starter template.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-15*
