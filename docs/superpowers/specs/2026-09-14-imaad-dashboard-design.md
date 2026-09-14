# IMAAD Staff Dashboard — Phase 1 Design

Status: Approved by user 2026-09-14. Source requirements: `prompt.md`, `PROJECT_OVERVIEW.md`, brand board `t3L4in0K.jpg` (all three live in `freelance_project/`, outside the git repo — not to be committed, per user instruction; this spec doc is likewise kept outside the repo for the same reason).

## What this covers

Phase 1 of the IMAAD staff dashboard only: application shell, design system, Login/Register, Overview, AI Employee, Conversations, Knowledge Base. Customers, Requests, Analytics, Settings, and the customer-facing widget are explicitly out of scope for this pass (per prompt.md's own phasing and user confirmation).

## Repo

New git repo at `imaad-dashboard/` (sibling to `freelance_project`'s reference docs, not inside them). Package manager: pnpm. No co-author line on commits (overrides default Claude Code attribution).

## Stack

- Next.js 14, App Router, TypeScript, Tailwind CSS
- Radix UI primitives wrapped in a custom `components/ui/*` design system (not a copied shadcn set, not a heavy component library)
- TanStack Query for all server-shaped data (loading/error states, cache, swappable transport)
- Zustand for client-only UI state (sidebar collapse state, active conversation selection, socket connection status) — never for server data
- Recharts for the Overview's minimal charts
- GSAP for entrance/sidebar/auth motion (ScrollTrigger not needed yet — no scroll-driven landing page in phase 1)
- `socket.io-client` wired through a `lib/realtime/*` module with the real event names from PROJECT_OVERVIEW.md, pointed at a stub/no-op transport for phase 1 (no backend exists yet) — the integration seam exists, nothing is faked in the UI
- Fonts: IBM Plex Sans + IBM Plex Sans Arabic via `next/font/google`, self-hosted at build time (no runtime CDN dependency, and Arabic weights pre-wired for the future i18n pass)

## Data layer

`lib/types/*` — TypeScript interfaces mirroring PROJECT_OVERVIEW.md models exactly: Organization, User, AgentConfig, Customer, Conversation, Message, KBDocument, Request, AnalyticsEvent.

`lib/api/*` — one module per resource (`auth.ts`, `agentConfig.ts`, `conversations.ts`, `messages.ts`, `kb.ts`), each exporting typed functions matching the real endpoint contract (method, path, params, response shape, error shape) 1:1.

`lib/api/client.ts` — the only thing each resource module calls through. Phase 1 implementation is `lib/mock/adapter.ts`: seeded in-memory data, artificial latency, and deliberately reproduces backend behaviors the UI must handle — KB upload returns pending → processing → ready/failed over time, validation errors shaped as `{ error, details: [{ field, message }] }`, 401/403/404/409/429 paths reachable via mock triggers. Swapping to a real backend later means writing a `fetch`-based adapter with the same interface — zero changes to components or resource modules.

## Auth

`lib/auth/*` — token storage (memory + refresh via httpOnly-cookie-shaped mock), `AuthProvider` React context gating `app/(dashboard)/*`. Mock login validates against seeded org/user records and issues a fake JWT-shaped token so real UI paths (expired session → redirect to login, 403 on role-gated actions) are exercised without a live backend.

## i18n readiness (not implemented, just not blocked)

All UI copy sourced from `lib/copy/en.ts` — a flat string table, not literals inline in JSX. No locale switching, no RTL, no Arabic strings this phase. Structured so a future `ar.ts` + a locale provider + `dir="rtl"` pass doesn't require touching component internals.

## Folder shape

```
imaad-dashboard/
  app/
    (auth)/login/, register/
    (dashboard)/overview/, ai-employee/, conversations/, knowledge-base/
    layout.tsx, globals.css
  components/
    ui/            - button, input, select, dialog, tabs, table, status-badge, toast, empty-state, skeleton
    shell/         - sidebar, header, app-shell
    conversations/ - list, detail, composer, message-bubble
    ai-employee/   - identity/behavior/services/policies/availability/escalation/actions sections + live preview
    kb/            - document list, upload dialog, status indicator
  lib/
    types/, api/, mock/, auth/, realtime/, copy/, utils/
  public/
    fonts or next/font handles this — brand assets if any exported from board
```

## Design tokens (Tailwind theme extension)

Colors: `#060505` (primary black), `#CAE51B` (electric lime — CTAs/active states/status only), `#86D6C9` (mint), `#D9B9F2` (lavender), `#FAFAFA` (light neutral), `#212121` (dark gray). Lime is never a background fill for large surfaces. Typography scale built around IBM Plex Sans weights (Regular/Medium/SemiBold/Bold). Radius/shadow scale kept restrained — flat where possible, elevation only where it communicates layering (dialogs, dropdowns), not decoration.

## Screens (phase 1)

1. **Shell** — persistent compact sidebar (Overview, AI Employee, Conversations, Knowledge Base, plus Customers/Requests/Analytics/Settings nav entries present but can point at "coming soon" placeholders since routes don't exist yet this phase), header, responsive collapse to icon-rail → drawer on mobile.
2. **Login/Register** — stronger visual composition than the dashboard, brand-led (typography/composition/icon), no generic AI hero copy. Field-level errors mapped from the mock `{ error, details }` shape.
3. **Overview** — operational, not decorative: escalations needing attention prioritized visually, recent conversations visible, one or two prominent metrics (not six equal-weight KPI cards), quieter secondary stats. Only real events (`conversation_started`, `resolved_by_ai`, `escalated`, `response_time`) drive numbers.
4. **AI Employee** — Identity → Behavior → Services → Policies → Availability → Escalation → Actions, sectioned form UX with a side live-preview panel (avatar, name, status, tone, one example response) — not a giant fake chatbot.
5. **Conversations** — list + detail split view. List: customer, last message, status, channel, time, assignment, escalation flag. Detail: message history with subtle sender distinction (typography/spacing, not colored bubbles), reply composer, assignment/status controls. Real-time seam wired via `lib/realtime` (mock emits synthetic events for demo purposes only in dev, clearly isolated from production adapter).
6. **Knowledge Base** — document list with pending/processing/ready/failed status indicators, upload (text + PDF) producing an immediate pending row that transitions via the mock's simulated async processing, reprocess/delete actions.

## Error/loading/empty states

Every resource module's TanStack Query hooks expose consistent `isLoading`/`isError`/`error` — `components/ui` provides shared `Skeleton`, `EmptyState`, and toast-based error surfacing for 400/401/403/404/409/429, matching PROJECT_OVERVIEW.md's documented shapes.

## Explicitly not building this phase

Customers, Requests, Analytics, Settings pages (nav entries only, non-functional placeholder), the customer chat widget, i18n/Arabic/RTL, Three.js, real backend integration, billing/marketplace/CRM features (never — out of scope permanently per prompt.md).

## Self-review notes

- No placeholders/TBDs in scope decisions — phase boundary is explicit and matches user's confirmed answer.
- No contradiction with PROJECT_OVERVIEW.md's model/endpoint contract — every field referenced above exists there.
- Scoped for one implementation plan (writing-plans skill next).
- One ambiguity resolved explicitly: "docs" and the 3 reference files are kept outside the git repo entirely (parent folder), not gitignored inside it — simplest way to honor "don't commit docs or these files" with zero risk of accidental staging.
