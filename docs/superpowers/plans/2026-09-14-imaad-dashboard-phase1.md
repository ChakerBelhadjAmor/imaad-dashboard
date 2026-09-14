# IMAAD Staff Dashboard Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the IMAAD staff dashboard's phase-1 surface: app shell, design system, mock-backed data layer, Login/Register, Overview, AI Employee, Conversations, Knowledge Base — matching the IMAAD brand identity and the PROJECT_OVERVIEW.md API contract, with a real backend swap-in seam but no real backend yet.

**Architecture:** Next.js App Router project with a strict layering: `lib/types` (backend-mirrored models) → `lib/mock` (seeded in-memory data + simulated async behavior) → `lib/api` (typed resource functions + TanStack Query hooks, calling through one swappable `ApiClient` interface) → `lib/auth` / `lib/realtime` (cross-cutting concerns built on the same client) → `components/ui` (design system primitives) → feature components → `app/*` routes. Nothing above `lib/api/client.ts` knows it's talking to a mock.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI primitives, TanStack Query, Zustand, Recharts, GSAP, socket.io-client, Vitest + React Testing Library, `next/font` (IBM Plex Sans / IBM Plex Sans Arabic).

**Spec:** `docs/superpowers/specs/2026-09-14-imaad-dashboard-design.md` (repo-relative)

## Global Constraints

- Brand colors, exact hex, used nowhere else: Primary Black `#060505`, Electric Lime `#CAE51B`, Mint `#86D6C9`, Lavender `#D9B9F2`, Light Neutral `#FAFAFA`, Dark Gray `#212121`.
- Electric Lime is reserved for CTAs, active states, and status indicators — never a large background fill.
- English only, LTR only, no i18n/RTL logic this phase — but all UI copy sourced from `lib/copy/en.ts`, never inline string literals in JSX.
- Do not build Customers, Requests, Analytics, or Settings functionality this phase — nav entries only, pointing at non-functional placeholder routes.
- Do not build the customer-facing widget this phase.
- No fabricated backend behavior presented as real — the mock adapter must be clearly isolated in `lib/mock/*` and swappable without touching callers.
- No massive UI library — Radix primitives wrapped in a small custom `components/ui/*` design system only.
- Package manager: pnpm. Repo root: `imaad-dashboard/` (new, separate git repo). No commit carries a co-author/attribution line.
- Every form's error handling must map from `{ error: string, details: [{ field, message }] }` (exact shape from PROJECT_OVERVIEW.md).
- Sender distinction in conversations (customer / ai_agent / human_agent) must use typography/spacing/labels — not colored chat bubbles.

---

## Task 1: Project Scaffold

**Files:**
- Create: `imaad-dashboard/` (via `pnpm create next-app`)
- Create: `imaad-dashboard/.gitignore`
- Create: `imaad-dashboard/vitest.config.ts`
- Create: `imaad-dashboard/vitest.setup.ts`
- Modify: `imaad-dashboard/package.json` (add vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, zustand, @tanstack/react-query, recharts, gsap, socket.io-client, @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-tabs, @radix-ui/react-toast)

**Interfaces:**
- Produces: a runnable `pnpm dev` Next.js app, a runnable `pnpm test` command, git repo initialized with first commit.

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /home/sunfyre/Desktop/freelance_project
pnpm create next-app@latest imaad-dashboard --typescript --tailwind --app --src-dir=false --import-alias "@/*" --eslint
cd imaad-dashboard
git init
```

- [ ] **Step 2: Install additional dependencies**

```bash
pnpm add zustand @tanstack/react-query recharts gsap socket.io-client @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-label
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Configure Vitest**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Run test command to verify empty setup works**

Run: `pnpm test`
Expected: "No test files found" or PASS (0 tests) — exits 0, not a config error.

- [ ] **Step 5: Verify dev server boots**

Run: `pnpm dev &` then `curl -sf http://localhost:3000 > /dev/null && echo OK`
Expected: `OK`. Kill the dev server after.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind, TypeScript, Vitest"
```

---

## Task 2: Design Tokens and Fonts

**Files:**
- Modify: `imaad-dashboard/tailwind.config.ts`
- Modify: `imaad-dashboard/app/globals.css`
- Modify: `imaad-dashboard/app/layout.tsx`
- Create: `imaad-dashboard/lib/design-tokens.test.ts`

**Interfaces:**
- Produces: Tailwind color tokens `brand.black`, `brand.lime`, `brand.mint`, `brand.lavender`, `brand.neutral`, `brand.gray`; CSS variable `--font-sans` bound to IBM Plex Sans.

- [ ] **Step 1: Write failing test asserting token values**

```ts
// lib/design-tokens.test.ts
import { describe, it, expect } from "vitest";
import tailwindConfig from "../tailwind.config";

describe("brand color tokens", () => {
  const colors = (tailwindConfig.theme?.extend as any).colors.brand;

  it("defines exact brand hex values", () => {
    expect(colors.black).toBe("#060505");
    expect(colors.lime).toBe("#CAE51B");
    expect(colors.mint).toBe("#86D6C9");
    expect(colors.lavender).toBe("#D9B9F2");
    expect(colors.neutral).toBe("#FAFAFA");
    expect(colors.gray).toBe("#212121");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/design-tokens.test.ts`
Expected: FAIL (colors undefined, tailwind.config has no `brand` key yet)

- [ ] **Step 3: Implement tokens**

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#060505",
          lime: "#CAE51B",
          mint: "#86D6C9",
          lavender: "#D9B9F2",
          neutral: "#FAFAFA",
          gray: "#212121",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(6,5,5,0.06)",
        md: "0 4px 12px rgba(6,5,5,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

`app/layout.tsx` (font wiring):
```tsx
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plexSans.variable}>
      <body className="bg-brand-neutral text-brand-black font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

`app/globals.css` — keep Tailwind directives, add base resets:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  height: 100%;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/design-tokens.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts app/globals.css app/layout.tsx lib/design-tokens.test.ts
git commit -m "feat: wire IMAAD brand tokens and IBM Plex Sans"
```

---

## Task 3: Domain Types

**Files:**
- Create: `imaad-dashboard/lib/types/models.ts`

**Interfaces:**
- Produces: `Organization`, `User`, `AgentConfig`, `Customer`, `Conversation`, `Message`, `KBDocument`, `Request`, `AnalyticsEvent`, `ApiErrorBody` — imported by every later task.

- [ ] **Step 1: Write the types**

```ts
// lib/types/models.ts

export type UserRole = "org_owner" | "org_admin" | "org_agent" | "super_admin";

export interface Organization {
  id: string;
  name: string;
  settings: {
    workingHours: { day: string; open: string; close: string }[];
    timezone: string;
    tone: string;
    language: "en";
  };
  contactInfo: { email: string; phone?: string };
  allowedOrigins: string[];
  whatsapp?: { phoneNumber: string; enabled: boolean };
  widgetKey: string;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AgentService {
  name: string;
  description: string;
  price: number;
}

export interface AgentPolicy {
  title: string;
  content: string;
}

export interface EscalationRule {
  condition: string;
  action: string;
}

export interface AgentConfig {
  id: string;
  organizationId: string;
  name: string;
  avatar: string;
  toneOfVoice: string;
  services: AgentService[];
  policies: AgentPolicy[];
  workingHours: { day: string; open: string; close: string }[];
  escalationRules: EscalationRule[];
  allowedActions: string[];
}

export type CustomerChannel = "web_widget" | "whatsapp";

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  phone?: string;
  email?: string;
  channel: CustomerChannel;
}

export type ConversationStatus = "active" | "escalated" | "resolved";

export interface Conversation {
  id: string;
  organizationId: string;
  customerId: string;
  customer: Pick<Customer, "id" | "name" | "channel">;
  status: ConversationStatus;
  channel: CustomerChannel;
  assignedTo?: string;
  lastMessagePreview: string;
  updatedAt: string;
  createdAt: string;
}

export type MessageSender = "customer" | "ai_agent" | "human_agent";

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  createdAt: string;
}

export type KBDocumentStatus = "pending" | "processing" | "ready" | "failed";

export interface KBDocument {
  id: string;
  organizationId: string;
  title: string;
  type: "text" | "pdf";
  status: KBDocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export type RequestType = "booking" | "inquiry" | "complaint" | "order_status" | "other";
export type RequestStatus = "open" | "in_progress" | "closed";

export interface Request {
  id: string;
  organizationId: string;
  conversationId: string;
  type: RequestType;
  status: RequestStatus;
  summary: string;
  createdAt: string;
}

export type AnalyticsEventType = "conversation_started" | "resolved_by_ai" | "escalated" | "response_time";

export interface AnalyticsEvent {
  id: string;
  organizationId: string;
  type: AnalyticsEventType;
  value?: number;
  createdAt: string;
}

export interface ApiErrorBody {
  error: string;
  details?: { field: string; message: string }[];
}
```

- [ ] **Step 2: Verify with typecheck**

Run: `pnpm tsc --noEmit`
Expected: no errors referencing `lib/types/models.ts`

- [ ] **Step 3: Commit**

```bash
git add lib/types/models.ts
git commit -m "feat: add domain types mirroring backend models"
```

---

## Task 4: Copy Table

**Files:**
- Create: `imaad-dashboard/lib/copy/en.ts`
- Create: `imaad-dashboard/lib/copy/en.test.ts`

**Interfaces:**
- Produces: `copy` object, one namespaced key per screen (`copy.auth.loginTitle`, `copy.overview.title`, etc.) — every later component imports strings from here, never inline.

- [ ] **Step 1: Write failing test**

```ts
// lib/copy/en.test.ts
import { describe, it, expect } from "vitest";
import { copy } from "./en";

describe("copy table", () => {
  it("has no empty string values", () => {
    const flatten = (obj: Record<string, unknown>): string[] =>
      Object.values(obj).flatMap((v) =>
        typeof v === "string" ? [v] : flatten(v as Record<string, unknown>)
      );
    const values = flatten(copy as unknown as Record<string, unknown>);
    expect(values.length).toBeGreaterThan(0);
    expect(values.every((v) => v.trim().length > 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/copy/en.test.ts`
Expected: FAIL (module `./en` doesn't exist)

- [ ] **Step 3: Implement copy table**

```ts
// lib/copy/en.ts
export const copy = {
  app: { name: "IMAAD", tagline: "AI Employees for Modern Business" },
  nav: {
    overview: "Overview",
    aiEmployee: "AI Employee",
    conversations: "Conversations",
    knowledgeBase: "Knowledge Base",
    customers: "Customers",
    requests: "Requests",
    analytics: "Analytics",
    settings: "Settings",
  },
  auth: {
    loginTitle: "Sign in to IMAAD",
    loginSubtitle: "Manage your AI employee and customer conversations.",
    registerTitle: "Create your IMAAD account",
    registerSubtitle: "Set up your organization in a few minutes.",
    emailLabel: "Work email",
    passwordLabel: "Password",
    nameLabel: "Full name",
    orgNameLabel: "Organization name",
    loginSubmit: "Sign in",
    registerSubmit: "Create account",
    switchToRegister: "New to IMAAD? Create an account",
    switchToLogin: "Already have an account? Sign in",
    genericError: "Something went wrong. Please try again.",
    rateLimited: "Too many attempts. Please wait a moment before trying again.",
  },
  overview: {
    title: "Overview",
    subtitle: "What's happening in your customer service right now.",
    escalationsHeading: "Needs attention",
    recentConversationsHeading: "Recent conversations",
    noEscalations: "No conversations are waiting on a human right now.",
  },
  aiEmployee: {
    title: "AI Employee",
    subtitle: "Configure the employee who represents your business.",
    sections: {
      identity: "Identity",
      behavior: "Behavior",
      services: "Services",
      policies: "Policies",
      availability: "Availability",
      escalation: "Escalation",
      actions: "Actions",
    },
    previewHeading: "Live preview",
    saveButton: "Save changes",
  },
  conversations: {
    title: "Conversations",
    listEmpty: "No conversations match this filter.",
    composerPlaceholder: "Write a reply…",
    sendButton: "Send",
    assignButton: "Assign to me",
    statusActive: "Active",
    statusEscalated: "Escalated",
    statusResolved: "Resolved",
    channelWebWidget: "Web Widget",
    channelWhatsapp: "WhatsApp",
  },
  knowledgeBase: {
    title: "Knowledge Base",
    subtitle: "What your AI employee knows about your business.",
    uploadButton: "Add document",
    uploadDialogTitle: "Add a knowledge base document",
    textTab: "Write text",
    pdfTab: "Upload PDF",
    statusPending: "Pending",
    statusProcessing: "Processing",
    statusReady: "Ready",
    statusFailed: "Failed",
    reprocessButton: "Reprocess",
    deleteButton: "Delete",
    empty: "No documents yet. Add your first one to teach your AI employee.",
  },
  placeholder: {
    comingSoon: "This section is coming soon.",
  },
  errors: {
    unauthorized: "Your session has expired. Please sign in again.",
    forbidden: "You don't have permission to do that.",
    notFound: "We couldn't find that.",
    conflict: "That already exists.",
  },
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/copy/en.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/copy/en.ts lib/copy/en.test.ts
git commit -m "feat: add English copy table for i18n-ready UI strings"
```

---

## Task 5: Mock Data, Adapter, and API Client Seam

**Files:**
- Create: `imaad-dashboard/lib/mock/seed.ts`
- Create: `imaad-dashboard/lib/mock/adapter.ts`
- Create: `imaad-dashboard/lib/mock/adapter.test.ts`
- Create: `imaad-dashboard/lib/api/client.ts`

**Interfaces:**
- Consumes: types from `lib/types/models.ts`.
- Produces: `ApiClient` interface (`get`, `post`, `patch`, `delete`, `upload`), `ApiError` class (`status: number`, `body: ApiErrorBody`), `apiClient: ApiClient` singleton — every resource module in Task 6 calls through this.

- [ ] **Step 1: Write seed data**

```ts
// lib/mock/seed.ts
import type {
  Organization, User, AgentConfig, Customer, Conversation, Message, KBDocument, Request, AnalyticsEvent,
} from "@/lib/types/models";

export const seedOrg: Organization = {
  id: "org_1",
  name: "Riyadh Home Services",
  settings: {
    workingHours: [{ day: "Sun-Thu", open: "09:00", close: "18:00" }],
    timezone: "Asia/Riyadh",
    tone: "professional",
    language: "en",
  },
  contactInfo: { email: "hello@riyadhhome.example", phone: "+966500000000" },
  allowedOrigins: ["https://riyadhhome.example"],
  widgetKey: "wk_demo_123",
};

export const seedUser: User = {
  id: "user_1",
  organizationId: "org_1",
  name: "Sara Al-Faisal",
  email: "sara@riyadhhome.example",
  role: "org_owner",
  createdAt: "2026-08-01T09:00:00.000Z",
};

export const seedAgentConfig: AgentConfig = {
  id: "agent_1",
  organizationId: "org_1",
  name: "Layla",
  avatar: "/avatars/layla.png",
  toneOfVoice: "warm and professional",
  services: [
    { name: "AC Repair", description: "Diagnose and fix residential AC units", price: 150 },
    { name: "Deep Cleaning", description: "Full home deep cleaning service", price: 300 },
  ],
  policies: [{ title: "Cancellation", content: "Cancellations within 24 hours are free of charge." }],
  workingHours: [{ day: "Sun-Thu", open: "09:00", close: "18:00" }],
  escalationRules: [{ condition: "Customer requests a refund", action: "Escalate to human agent" }],
  allowedActions: ["book_appointment", "quote_price"],
};

export const seedCustomers: Customer[] = [
  { id: "cust_1", organizationId: "org_1", name: "Omar Khaled", phone: "+966511111111", channel: "web_widget" },
  { id: "cust_2", organizationId: "org_1", name: "Nora Saeed", email: "nora@example.com", channel: "whatsapp" },
];

export const seedConversations: Conversation[] = [
  {
    id: "conv_1",
    organizationId: "org_1",
    customerId: "cust_1",
    customer: { id: "cust_1", name: "Omar Khaled", channel: "web_widget" },
    status: "escalated",
    channel: "web_widget",
    lastMessagePreview: "I want a refund for the last visit.",
    updatedAt: "2026-09-14T08:00:00.000Z",
    createdAt: "2026-09-14T07:50:00.000Z",
  },
  {
    id: "conv_2",
    organizationId: "org_1",
    customerId: "cust_2",
    customer: { id: "cust_2", name: "Nora Saeed", channel: "whatsapp" },
    status: "active",
    channel: "whatsapp",
    lastMessagePreview: "What time can you come tomorrow?",
    updatedAt: "2026-09-14T07:30:00.000Z",
    createdAt: "2026-09-14T07:20:00.000Z",
  },
];

export const seedMessages: Record<string, Message[]> = {
  conv_1: [
    { id: "msg_1", conversationId: "conv_1", sender: "customer", content: "I want a refund for the last visit.", createdAt: "2026-09-14T07:55:00.000Z" },
    { id: "msg_2", conversationId: "conv_1", sender: "ai_agent", content: "I understand — let me connect you with a team member.", createdAt: "2026-09-14T07:56:00.000Z" },
  ],
  conv_2: [
    { id: "msg_3", conversationId: "conv_2", sender: "customer", content: "What time can you come tomorrow?", createdAt: "2026-09-14T07:20:00.000Z" },
    { id: "msg_4", conversationId: "conv_2", sender: "ai_agent", content: "We have a slot at 10 AM or 2 PM — which works better?", createdAt: "2026-09-14T07:21:00.000Z" },
  ],
};

export const seedKbDocuments: KBDocument[] = [
  { id: "kb_1", organizationId: "org_1", title: "Service Area Coverage", type: "text", status: "ready", createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:02:00.000Z" },
];

export const seedRequests: Request[] = [
  { id: "req_1", organizationId: "org_1", conversationId: "conv_1", type: "complaint", status: "open", summary: "Refund request for last visit", createdAt: "2026-09-14T07:56:00.000Z" },
];

export const seedAnalyticsEvents: AnalyticsEvent[] = [
  { id: "ev_1", organizationId: "org_1", type: "conversation_started", createdAt: "2026-09-14T07:20:00.000Z" },
  { id: "ev_2", organizationId: "org_1", type: "resolved_by_ai", createdAt: "2026-09-13T12:00:00.000Z" },
  { id: "ev_3", organizationId: "org_1", type: "escalated", createdAt: "2026-09-14T07:55:00.000Z" },
  { id: "ev_4", organizationId: "org_1", type: "response_time", value: 42, createdAt: "2026-09-14T07:21:00.000Z" },
];
```

- [ ] **Step 2: Write the failing adapter test**

```ts
// lib/mock/adapter.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockClient, __resetMockStore } from "./adapter";
import { ApiError } from "@/lib/api/client";

describe("mockClient", () => {
  beforeEach(() => {
    __resetMockStore();
    vi.useRealTimers();
  });

  it("creating a KB text document returns status pending immediately", async () => {
    const doc = await mockClient.post<{ id: string; status: string }>("/api/kb", {
      title: "New Doc",
      content: "Some content",
    });
    expect(doc.status).toBe("pending");
  });

  it("KB document transitions pending -> processing -> ready over time", async () => {
    vi.useFakeTimers();
    const doc = await mockClient.post<{ id: string; status: string }>("/api/kb", {
      title: "New Doc",
      content: "Some content",
    });
    await vi.advanceTimersByTimeAsync(1500);
    const midway = await mockClient.get<{ status: string }>(`/api/kb/${doc.id}`);
    expect(midway.status).toBe("processing");
    await vi.advanceTimersByTimeAsync(3000);
    const done = await mockClient.get<{ status: string }>(`/api/kb/${doc.id}`);
    expect(done.status).toBe("ready");
  });

  it("throws ApiError with validation shape on missing required field", async () => {
    await expect(
      mockClient.post("/api/kb", { content: "no title" })
    ).rejects.toMatchObject({
      status: 400,
      body: { error: "Validation failed", details: [{ field: "title", message: expect.any(String) }] },
    });
  });

  it("throws ApiError 404 for unknown resource id", async () => {
    await expect(mockClient.get("/api/kb/does-not-exist")).rejects.toMatchObject({ status: 404 });
  });

  it("login with wrong password throws ApiError 401", async () => {
    await expect(
      mockClient.post("/api/auth/login", { email: "sara@riyadhhome.example", password: "wrong" })
    ).rejects.toMatchObject({ status: 401 });
  });

  it("login with correct seeded credentials succeeds", async () => {
    const result = await mockClient.post<{ accessToken: string; user: { email: string } }>(
      "/api/auth/login",
      { email: "sara@riyadhhome.example", password: "demo1234" }
    );
    expect(result.accessToken).toBeTruthy();
    expect(result.user.email).toBe("sara@riyadhhome.example");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test lib/mock/adapter.test.ts`
Expected: FAIL (`./adapter` and `@/lib/api/client` don't exist yet)

- [ ] **Step 4: Implement `lib/api/client.ts`**

```ts
// lib/api/client.ts
import type { ApiErrorBody } from "@/lib/types/models";

export interface ApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
  upload<T>(path: string, formData: FormData): Promise<T>;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

import { mockClient } from "@/lib/mock/adapter";
export const apiClient: ApiClient = mockClient;
```

- [ ] **Step 5: Implement `lib/mock/adapter.ts`**

```ts
// lib/mock/adapter.ts
import type { ApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/client";
import type { KBDocument } from "@/lib/types/models";
import {
  seedOrg, seedUser, seedAgentConfig, seedCustomers, seedConversations,
  seedMessages, seedKbDocuments, seedRequests, seedAnalyticsEvents,
} from "./seed";

let store = {
  org: { ...seedOrg },
  user: { ...seedUser },
  agentConfig: { ...seedAgentConfig },
  customers: [...seedCustomers],
  conversations: [...seedConversations],
  messages: { ...seedMessages },
  kbDocuments: [...seedKbDocuments] as KBDocument[],
  requests: [...seedRequests],
  analyticsEvents: [...seedAnalyticsEvents],
};

const KNOWN_PASSWORD = "demo1234";
let idCounter = 100;
const nextId = (prefix: string) => `${prefix}_${idCounter++}`;

export function __resetMockStore() {
  store = {
    org: { ...seedOrg },
    user: { ...seedUser },
    agentConfig: { ...seedAgentConfig },
    customers: [...seedCustomers],
    conversations: [...seedConversations],
    messages: { ...seedMessages },
    kbDocuments: [...seedKbDocuments] as KBDocument[],
    requests: [...seedRequests],
    analyticsEvents: [...seedAnalyticsEvents],
  };
  idCounter = 100;
}

function notFound(): never {
  throw new ApiError(404, { error: "Not found" });
}

function validationError(field: string, message: string): never {
  throw new ApiError(400, { error: "Validation failed", details: [{ field, message }] });
}

async function handleGet<T>(path: string): Promise<T> {
  if (path === "/api/organization") return store.org as unknown as T;
  if (path === "/api/agent-config") return store.agentConfig as unknown as T;
  if (path === "/api/kb") return store.kbDocuments as unknown as T;
  if (path.startsWith("/api/kb/")) {
    const id = path.split("/").pop();
    const doc = store.kbDocuments.find((d) => d.id === id);
    if (!doc) notFound();
    return doc as unknown as T;
  }
  if (path === "/api/conversations") return store.conversations as unknown as T;
  if (path.startsWith("/api/conversations/")) {
    const id = path.split("/").pop();
    const convo = store.conversations.find((c) => c.id === id);
    if (!convo) notFound();
    return convo as unknown as T;
  }
  if (path.startsWith("/api/messages/")) {
    const convoId = path.split("/").pop()!;
    return (store.messages[convoId] ?? []) as unknown as T;
  }
  if (path === "/api/customers") return store.customers as unknown as T;
  if (path === "/api/requests") return store.requests as unknown as T;
  if (path === "/api/analytics") return store.analyticsEvents as unknown as T;
  notFound();
}

async function handlePost<T>(path: string, body: any): Promise<T> {
  if (path === "/api/auth/login") {
    if (body?.email !== store.user.email || body?.password !== KNOWN_PASSWORD) {
      throw new ApiError(401, { error: "Invalid email or password" });
    }
    return { accessToken: "mock.jwt.token", user: store.user } as unknown as T;
  }
  if (path === "/api/kb") {
    if (!body?.title) validationError("title", "Title is required");
    const doc: KBDocument = {
      id: nextId("kb"),
      organizationId: store.org.id,
      title: body.title,
      type: "text",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.kbDocuments.push(doc);
    simulateKbProcessing(doc.id);
    return doc as unknown as T;
  }
  if (path.startsWith("/api/kb/") && path.endsWith("/reprocess")) {
    const id = path.split("/")[3];
    const doc = store.kbDocuments.find((d) => d.id === id);
    if (!doc) notFound();
    doc.status = "pending";
    simulateKbProcessing(doc.id);
    return doc as unknown as T;
  }
  if (path.startsWith("/api/messages/")) {
    const convoId = path.split("/").pop()!;
    const msg = {
      id: nextId("msg"),
      conversationId: convoId,
      sender: "human_agent" as const,
      content: body.content,
      createdAt: new Date().toISOString(),
    };
    store.messages[convoId] = [...(store.messages[convoId] ?? []), msg];
    return msg as unknown as T;
  }
  if (path.endsWith("/assign")) {
    const convoId = path.split("/")[3];
    const convo = store.conversations.find((c) => c.id === convoId);
    if (!convo) notFound();
    convo.assignedTo = store.user.id;
    return convo as unknown as T;
  }
  notFound();
}

function simulateKbProcessing(id: string) {
  setTimeout(() => {
    const doc = store.kbDocuments.find((d) => d.id === id);
    if (doc) doc.status = "processing";
  }, 1000);
  setTimeout(() => {
    const doc = store.kbDocuments.find((d) => d.id === id);
    if (doc) doc.status = "ready";
  }, 4000);
}

async function handlePatch<T>(path: string, body: any): Promise<T> {
  if (path.startsWith("/api/conversations/") && path.endsWith("/status")) {
    const id = path.split("/")[3];
    const convo = store.conversations.find((c) => c.id === id);
    if (!convo) notFound();
    convo.status = body.status;
    return convo as unknown as T;
  }
  if (path === "/api/organization") {
    store.org = { ...store.org, ...body };
    return store.org as unknown as T;
  }
  if (path === "/api/agent-config") {
    store.agentConfig = { ...store.agentConfig, ...body };
    return store.agentConfig as unknown as T;
  }
  notFound();
}

async function handleDelete<T>(path: string): Promise<T> {
  if (path.startsWith("/api/kb/")) {
    const id = path.split("/").pop();
    const before = store.kbDocuments.length;
    store.kbDocuments = store.kbDocuments.filter((d) => d.id !== id);
    if (store.kbDocuments.length === before) notFound();
    return undefined as unknown as T;
  }
  notFound();
}

export const mockClient: ApiClient = {
  get: (path) => handleGet(path),
  post: (path, body) => handlePost(path, body),
  patch: (path, body) => handlePatch(path, body),
  delete: (path) => handleDelete(path),
  upload: async (path, formData) => {
    const title = (formData.get("title") as string) ?? "Uploaded document";
    return handlePost(path.replace("/upload", ""), { title });
  },
};
```

Update `lib/api/client.ts`'s import order isn't circular in practice (client defines `ApiError` used by adapter, adapter default-imports nothing from client except the type) — if TypeScript flags a circular import, move `ApiError` into a new `lib/api/errors.ts` and have both `client.ts` and `adapter.ts` import from there. Verify at typecheck step below and apply that split if needed.

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test lib/mock/adapter.test.ts`
Expected: PASS (all 6 tests)

- [ ] **Step 7: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: no errors. If a circular import error appears between `client.ts` and `adapter.ts`, apply the `lib/api/errors.ts` split described in Step 5 and re-run.

- [ ] **Step 8: Commit**

```bash
git add lib/mock lib/api/client.ts lib/api/errors.ts 2>/dev/null; git add lib/mock lib/api/client.ts
git commit -m "feat: add seeded mock data, mock adapter, and swappable API client seam"
```

---

## Task 6: Resource API Modules and Query Hooks

**Files:**
- Create: `imaad-dashboard/lib/api/auth.ts`
- Create: `imaad-dashboard/lib/api/organization.ts`
- Create: `imaad-dashboard/lib/api/agentConfig.ts`
- Create: `imaad-dashboard/lib/api/conversations.ts`
- Create: `imaad-dashboard/lib/api/messages.ts`
- Create: `imaad-dashboard/lib/api/kb.ts`
- Create: `imaad-dashboard/lib/api/hooks.ts`
- Create: `imaad-dashboard/lib/api/hooks.test.ts`
- Create: `imaad-dashboard/app/providers.tsx`
- Modify: `imaad-dashboard/app/layout.tsx`

**Interfaces:**
- Consumes: `apiClient` from Task 5, types from Task 3.
- Produces: `useConversations()`, `useConversation(id)`, `useMessages(conversationId)`, `useSendMessage()`, `useKbDocuments()`, `useCreateKbDocument()`, `useUploadKbDocument()`, `useReprocessKbDocument()`, `useDeleteKbDocument()`, `useAgentConfig()`, `useUpdateAgentConfig()`, `useOrganization()`, `useUpdateOrganization()` — every screen task below calls these, not `lib/api/*` directly.

- [ ] **Step 1: Implement resource modules**

```ts
// lib/api/auth.ts
import { apiClient } from "./client";
import type { User } from "@/lib/types/models";

export function login(input: { email: string; password: string }) {
  return apiClient.post<{ accessToken: string; user: User }>("/api/auth/login", input);
}
export function register(input: { name: string; email: string; password: string; orgName: string }) {
  return apiClient.post<{ accessToken: string; user: User }>("/api/auth/register", input);
}
```

```ts
// lib/api/organization.ts
import { apiClient } from "./client";
import type { Organization } from "@/lib/types/models";

export function getOrganization() {
  return apiClient.get<Organization>("/api/organization");
}
export function updateOrganization(patch: Partial<Organization>) {
  return apiClient.patch<Organization>("/api/organization", patch);
}
```

```ts
// lib/api/agentConfig.ts
import { apiClient } from "./client";
import type { AgentConfig } from "@/lib/types/models";

export function getAgentConfig() {
  return apiClient.get<AgentConfig>("/api/agent-config");
}
export function updateAgentConfig(patch: Partial<AgentConfig>) {
  return apiClient.patch<AgentConfig>("/api/agent-config", patch);
}
```

```ts
// lib/api/conversations.ts
import { apiClient } from "./client";
import type { Conversation, ConversationStatus } from "@/lib/types/models";

export function listConversations(status?: ConversationStatus) {
  return apiClient.get<Conversation[]>("/api/conversations", status ? { status } : undefined);
}
export function getConversation(id: string) {
  return apiClient.get<Conversation>(`/api/conversations/${id}`);
}
export function updateConversationStatus(id: string, status: ConversationStatus) {
  return apiClient.patch<Conversation>(`/api/conversations/${id}/status`, { status });
}
export function assignConversation(id: string) {
  return apiClient.post<Conversation>(`/api/conversations/${id}/assign`);
}
```

```ts
// lib/api/messages.ts
import { apiClient } from "./client";
import type { Message } from "@/lib/types/models";

export function listMessages(conversationId: string) {
  return apiClient.get<Message[]>(`/api/messages/${conversationId}`);
}
export function sendMessage(conversationId: string, content: string) {
  return apiClient.post<Message>(`/api/messages/${conversationId}`, { content });
}
```

```ts
// lib/api/kb.ts
import { apiClient } from "./client";
import type { KBDocument } from "@/lib/types/models";

export function listKbDocuments() {
  return apiClient.get<KBDocument[]>("/api/kb");
}
export function createKbDocument(input: { title: string; content: string }) {
  return apiClient.post<KBDocument>("/api/kb", input);
}
export function uploadKbDocument(formData: FormData) {
  return apiClient.upload<KBDocument>("/api/kb/upload", formData);
}
export function getKbDocument(id: string) {
  return apiClient.get<KBDocument>(`/api/kb/${id}`);
}
export function reprocessKbDocument(id: string) {
  return apiClient.post<KBDocument>(`/api/kb/${id}/reprocess`);
}
export function deleteKbDocument(id: string) {
  return apiClient.delete<void>(`/api/kb/${id}`);
}
```

- [ ] **Step 2: Write failing hook test**

```ts
// lib/api/hooks.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { __resetMockStore } from "@/lib/mock/adapter";
import { useKbDocuments, useCreateKbDocument } from "./hooks";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("kb hooks", () => {
  beforeEach(() => __resetMockStore());

  it("useKbDocuments loads seeded documents", async () => {
    const { result } = renderHook(() => useKbDocuments(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it("useCreateKbDocument invalidates the list on success", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const localWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const list = renderHook(() => useKbDocuments(), { wrapper: localWrapper });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    const before = list.result.current.data!.length;

    const create = renderHook(() => useCreateKbDocument(), { wrapper: localWrapper });
    await create.result.current.mutateAsync({ title: "New Doc", content: "content" });
    await waitFor(() => expect(list.result.current.data!.length).toBe(before + 1));
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test lib/api/hooks.test.ts`
Expected: FAIL (`./hooks` doesn't exist)

- [ ] **Step 4: Implement hooks**

```tsx
// lib/api/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as kb from "./kb";
import * as conversations from "./conversations";
import * as messages from "./messages";
import * as agentConfig from "./agentConfig";
import * as organization from "./organization";
import type { ConversationStatus } from "@/lib/types/models";

export function useKbDocuments() {
  return useQuery({ queryKey: ["kb"], queryFn: kb.listKbDocuments });
}
export function useCreateKbDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kb.createKbDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}
export function useUploadKbDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kb.uploadKbDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}
export function useReprocessKbDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kb.reprocessKbDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}
export function useDeleteKbDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: kb.deleteKbDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kb"] }),
  });
}

export function useConversations(status?: ConversationStatus) {
  return useQuery({
    queryKey: ["conversations", status ?? "all"],
    queryFn: () => conversations.listConversations(status),
  });
}
export function useConversation(id: string) {
  return useQuery({ queryKey: ["conversations", id], queryFn: () => conversations.getConversation(id), enabled: !!id });
}
export function useUpdateConversationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ConversationStatus }) =>
      conversations.updateConversationStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}
export function useAssignConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversations.assignConversation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messages.listMessages(conversationId),
    enabled: !!conversationId,
  });
}
export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => messages.sendMessage(conversationId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }),
  });
}

export function useAgentConfig() {
  return useQuery({ queryKey: ["agent-config"], queryFn: agentConfig.getAgentConfig });
}
export function useUpdateAgentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: agentConfig.updateAgentConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agent-config"] }),
  });
}

export function useOrganization() {
  return useQuery({ queryKey: ["organization"], queryFn: organization.getOrganization });
}
export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: organization.updateOrganization,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["organization"] }),
  });
}
```

- [ ] **Step 5: Wire QueryClientProvider**

```tsx
// app/providers.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

In `app/layout.tsx`, wrap `{children}` with `<Providers>{children}</Providers>`.

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test lib/api/hooks.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/api app/providers.tsx app/layout.tsx
git commit -m "feat: add resource API modules and TanStack Query hooks"
```

---

## Task 7: Auth Module

**Files:**
- Create: `imaad-dashboard/lib/auth/token.ts`
- Create: `imaad-dashboard/lib/auth/AuthProvider.tsx`
- Create: `imaad-dashboard/lib/auth/useAuth.ts`
- Create: `imaad-dashboard/lib/auth/validation.ts`
- Create: `imaad-dashboard/lib/auth/auth.test.ts`

**Interfaces:**
- Consumes: `login`/`register` from `lib/api/auth.ts`, `ApiError` from `lib/api/client.ts`.
- Produces: `AuthProvider`, `useAuth()` returning `{ user, isAuthenticated, login, register, logout, isPending }`, `mapApiErrorToFieldErrors(error: unknown): Record<string, string>` — consumed by Task 11's forms.

- [ ] **Step 1: Write failing tests**

```ts
// lib/auth/auth.test.ts
import { describe, it, expect } from "vitest";
import { mapApiErrorToFieldErrors } from "./validation";
import { ApiError } from "@/lib/api/client";

describe("mapApiErrorToFieldErrors", () => {
  it("maps validation details to a field->message record", () => {
    const err = new ApiError(400, {
      error: "Validation failed",
      details: [{ field: "email", message: "Email is required" }],
    });
    expect(mapApiErrorToFieldErrors(err)).toEqual({ email: "Email is required" });
  });

  it("returns a form-level error under '_form' for non-validation ApiErrors", () => {
    const err = new ApiError(401, { error: "Invalid email or password" });
    expect(mapApiErrorToFieldErrors(err)).toEqual({ _form: "Invalid email or password" });
  });

  it("returns a generic form-level error for non-ApiError exceptions", () => {
    expect(mapApiErrorToFieldErrors(new Error("network down"))).toEqual({
      _form: "Something went wrong. Please try again.",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/auth/auth.test.ts`
Expected: FAIL (`./validation` doesn't exist)

- [ ] **Step 3: Implement `lib/auth/token.ts`**

```ts
// lib/auth/token.ts
const TOKEN_KEY = "imaad_access_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}
```

- [ ] **Step 4: Implement `lib/auth/validation.ts`**

```ts
// lib/auth/validation.ts
import { ApiError } from "@/lib/api/client";
import { copy } from "@/lib/copy/en";

export function mapApiErrorToFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError) {
    if (error.status === 400 && error.body.details?.length) {
      return Object.fromEntries(error.body.details.map((d) => [d.field, d.message]));
    }
    if (error.status === 429) return { _form: copy.auth.rateLimited };
    return { _form: error.body.error || copy.auth.genericError };
  }
  return { _form: copy.auth.genericError };
}
```

- [ ] **Step 5: Implement `lib/auth/AuthProvider.tsx` and `useAuth.ts`**

```tsx
// lib/auth/AuthProvider.tsx
"use client";
import { createContext, useEffect, useState, useCallback } from "react";
import type { User } from "@/lib/types/models";
import * as authApi from "@/lib/api/auth";
import { getToken, setToken, clearToken } from "./token";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isPending: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string; orgName: string }) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    setIsPending(false);
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const result = await authApi.login(input);
    setToken(result.accessToken);
    setUser(result.user);
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; password: string; orgName: string }) => {
      const result = await authApi.register(input);
      setToken(result.accessToken);
      setUser(result.user);
    },
    []
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user || !!getToken(), isPending, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

```ts
// lib/auth/useAuth.ts
import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

Wrap `<Providers>` around `<AuthProvider>` in `app/layout.tsx` (AuthProvider inside QueryClientProvider).

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test lib/auth/auth.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/auth app/layout.tsx
git commit -m "feat: add centralized auth provider, token storage, and error mapping"
```

---

## Task 8: Realtime Seam

**Files:**
- Create: `imaad-dashboard/lib/realtime/events.ts`
- Create: `imaad-dashboard/lib/realtime/socket.ts`
- Create: `imaad-dashboard/lib/realtime/useRealtimeEvent.ts`
- Create: `imaad-dashboard/lib/realtime/realtime.test.ts`

**Interfaces:**
- Produces: `RealtimeEventMap` (typed event name → payload), `getSocket()`, `useRealtimeEvent(event, handler)` hook — consumed by Task 14 (Conversations) and Task 15 (Knowledge Base) for live updates.

- [ ] **Step 1: Write failing test**

```ts
// lib/realtime/realtime.test.ts
import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "events";
import { __setSocketForTesting } from "./socket";
import { renderHook } from "@testing-library/react";
import { useRealtimeEvent } from "./useRealtimeEvent";

describe("useRealtimeEvent", () => {
  it("invokes the handler when the stub socket emits the event", () => {
    const stub = new EventEmitter();
    __setSocketForTesting(stub as any);
    const handler = vi.fn();
    renderHook(() => useRealtimeEvent("message:new", handler));

    stub.emit("message:new", { id: "msg_x" });
    expect(handler).toHaveBeenCalledWith({ id: "msg_x" });
  });

  it("stops invoking the handler after unmount", () => {
    const stub = new EventEmitter();
    __setSocketForTesting(stub as any);
    const handler = vi.fn();
    const { unmount } = renderHook(() => useRealtimeEvent("message:new", handler));
    unmount();
    stub.emit("message:new", { id: "msg_x" });
    expect(handler).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/realtime/realtime.test.ts`
Expected: FAIL (`./socket`, `./useRealtimeEvent` don't exist)

- [ ] **Step 3: Implement event types**

```ts
// lib/realtime/events.ts
import type { Message, Conversation, KBDocument } from "@/lib/types/models";

export interface RealtimeEventMap {
  "message:new": Message;
  "conversation:status": Pick<Conversation, "id" | "status">;
  "conversation:escalated": Pick<Conversation, "id">;
  "conversation:assigned": Pick<Conversation, "id" | "assignedTo">;
  "notification:escalation": { conversationId: string };
  "kb:document-status": Pick<KBDocument, "id" | "status">;
}
```

- [ ] **Step 4: Implement socket wrapper**

```ts
// lib/realtime/socket.ts
import { io, type Socket } from "socket.io-client";
import { getToken } from "@/lib/auth/token";

let socket: Pick<Socket, "on" | "off" | "emit"> | null = null;

export function getSocket() {
  if (socket) return socket;
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) {
    // Phase 1 has no real backend — expose a no-op socket so callers
    // never need to branch on whether realtime is "really" connected.
    socket = { on: () => {}, off: () => {}, emit: () => {} };
    return socket;
  }
  socket = io(url, { auth: { token: getToken() } });
  return socket;
}

export function __setSocketForTesting(stub: Pick<Socket, "on" | "off" | "emit">) {
  socket = stub;
}
```

- [ ] **Step 5: Implement the hook**

```ts
// lib/realtime/useRealtimeEvent.ts
import { useEffect } from "react";
import { getSocket } from "./socket";
import type { RealtimeEventMap } from "./events";

export function useRealtimeEvent<K extends keyof RealtimeEventMap>(
  event: K,
  handler: (payload: RealtimeEventMap[K]) => void
) {
  useEffect(() => {
    const socket = getSocket();
    const listener = (payload: RealtimeEventMap[K]) => handler(payload);
    socket.on(event, listener as any);
    return () => {
      socket.off(event, listener as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test lib/realtime/realtime.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/realtime
git commit -m "feat: add typed realtime event seam with no-op transport for phase 1"
```

---

## Task 9: Design System Primitives

**Files:**
- Create: `imaad-dashboard/components/ui/button.tsx`
- Create: `imaad-dashboard/components/ui/input.tsx`
- Create: `imaad-dashboard/components/ui/select.tsx`
- Create: `imaad-dashboard/components/ui/dialog.tsx`
- Create: `imaad-dashboard/components/ui/tabs.tsx`
- Create: `imaad-dashboard/components/ui/table.tsx`
- Create: `imaad-dashboard/components/ui/status-badge.tsx`
- Create: `imaad-dashboard/components/ui/toast.tsx`
- Create: `imaad-dashboard/components/ui/empty-state.tsx`
- Create: `imaad-dashboard/components/ui/skeleton.tsx`
- Create: `imaad-dashboard/components/ui/status-badge.test.tsx`
- Create: `imaad-dashboard/components/ui/button.test.tsx`
- Create: `imaad-dashboard/components/ui/dialog.test.tsx`

**Interfaces:**
- Produces: `<Button variant="primary"|"secondary"|"ghost" size="sm"|"md">`, `<Input>`, `<Select>`, `<Dialog>`/`<DialogTrigger>`/`<DialogContent>`, `<Tabs>`/`<TabsList>`/`<TabsTrigger>`/`<TabsContent>`, `<Table>` family, `getStatusBadgeVariant(status)` + `<StatusBadge status>`, `<ToastProvider>`/`useToast()`, `<EmptyState>`, `<Skeleton>` — every feature screen (Tasks 10-15) builds on these exclusively, no raw `<button>`/`<input>` in feature code.

- [ ] **Step 1: Write failing tests for the logic-bearing primitives**

```tsx
// components/ui/status-badge.test.tsx
import { describe, it, expect } from "vitest";
import { getStatusBadgeVariant } from "./status-badge";

describe("getStatusBadgeVariant", () => {
  it("maps escalated to the lime/attention variant", () => {
    expect(getStatusBadgeVariant("escalated")).toBe("attention");
  });
  it("maps active to the neutral variant", () => {
    expect(getStatusBadgeVariant("active")).toBe("neutral");
  });
  it("maps resolved to the muted variant", () => {
    expect(getStatusBadgeVariant("resolved")).toBe("muted");
  });
  it("maps ready to the success variant", () => {
    expect(getStatusBadgeVariant("ready")).toBe("success");
  });
  it("maps failed to the danger variant", () => {
    expect(getStatusBadgeVariant("failed")).toBe("danger");
  });
});
```

```tsx
// components/ui/button.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
  it("renders as an accessible button with its label", () => {
    render(<Button>Save changes</Button>);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });
  it("is disabled and non-interactive when isLoading is true", () => {
    render(<Button isLoading>Save changes</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

```tsx
// components/ui/dialog.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "./dialog";

describe("Dialog", () => {
  it("opens on trigger click and exposes an accessible title", async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open</button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Add document</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Add document")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test components/ui`
Expected: FAIL (none of the components exist yet)

- [ ] **Step 3: Implement `button.tsx`**

```tsx
// components/ui/button.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    const variants = {
      primary: "bg-brand-black text-brand-neutral hover:bg-brand-gray",
      secondary: "bg-transparent text-brand-black border border-brand-black/15 hover:border-brand-black/30",
      ghost: "bg-transparent text-brand-black hover:bg-brand-black/5",
    };
    const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm" };
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
```

```ts
// lib/utils.ts
export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
```

- [ ] **Step 4: Implement `input.tsx`**

```tsx
// components/ui/input.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "h-10 rounded-md border border-brand-black/15 bg-white px-3 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
);
Input.displayName = "Input";
```

- [ ] **Step 5: Implement `select.tsx`, `tabs.tsx`, `dialog.tsx` on Radix primitives**

```tsx
// components/ui/select.tsx
"use client";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }: SelectPrimitive.SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        "h-10 inline-flex items-center justify-between rounded-md border border-brand-black/15 bg-white px-3 text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime",
        className
      )}
      {...props}
    >
      {children}
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ children, ...props }: SelectPrimitive.SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className="rounded-md border border-brand-black/10 bg-white shadow-md" {...props}>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, children, ...props }: SelectPrimitive.SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn("rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-brand-black/5", className)}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
```

```tsx
// components/ui/tabs.tsx
"use client";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn("inline-flex gap-1 border-b border-brand-black/10", className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "px-3 py-2 text-sm text-brand-black/60 data-[state=active]:text-brand-black",
        "data-[state=active]:border-b-2 data-[state=active]:border-brand-lime",
        className
      )}
      {...props}
    />
  );
}
export function TabsContent(props: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className="pt-4" {...props} />;
}
```

```tsx
// components/ui/dialog.tsx
"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({ className, children, ...props }: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-brand-black/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
          "rounded-lg bg-white p-6 shadow-md",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
```

- [ ] **Step 6: Implement `table.tsx`, `status-badge.tsx`, `empty-state.tsx`, `skeleton.tsx`**

```tsx
// components/ui/table.tsx
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full text-sm", className)} {...props} />;
}
export function TableHead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="border-b border-brand-black/10 text-left text-brand-black/50" {...props} />;
}
export function TableBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}
export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-brand-black/5 last:border-0", className)} {...props} />;
}
export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("py-3 pr-4", className)} {...props} />;
}
export function TableHeaderCell({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("py-2 pr-4 font-medium", className)} {...props} />;
}
```

```tsx
// components/ui/status-badge.tsx
import { cn } from "@/lib/utils";

export type StatusBadgeVariant = "neutral" | "attention" | "muted" | "success" | "danger";

export function getStatusBadgeVariant(status: string): StatusBadgeVariant {
  switch (status) {
    case "escalated":
      return "attention";
    case "active":
    case "processing":
    case "pending":
      return "neutral";
    case "resolved":
    case "ready":
      return "success";
    case "failed":
      return "danger";
    default:
      return "muted";
  }
}

const variantClasses: Record<StatusBadgeVariant, string> = {
  neutral: "bg-brand-black/5 text-brand-black",
  attention: "bg-brand-lime/20 text-brand-black border border-brand-lime",
  muted: "bg-brand-black/5 text-brand-black/50",
  success: "bg-brand-mint/20 text-brand-black",
  danger: "bg-red-100 text-red-700",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  const variant = getStatusBadgeVariant(status);
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium", variantClasses[variant])}>
      {label}
    </span>
  );
}
```

```tsx
// components/ui/empty-state.tsx
export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
      <p className="text-sm font-medium text-brand-black">{title}</p>
      {description && <p className="text-sm text-brand-black/50">{description}</p>}
    </div>
  );
}
```

```tsx
// components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-brand-black/5", className)} />;
}
```

- [ ] **Step 7: Implement toast (`toast.tsx` + `use-toast.ts`)**

```tsx
// components/ui/toast.tsx
"use client";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: number;
  title: string;
  variant?: "default" | "error";
}

const ToastContext = createContext<{ push: (t: Omit<ToastItem, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((t: Omit<ToastItem, "id">) => {
    setItems((prev) => [...prev, { ...t, id: Date.now() }]);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {items.map((item) => (
          <ToastPrimitive.Root
            key={item.id}
            className={cn(
              "rounded-md border bg-white px-4 py-3 text-sm shadow-md",
              item.variant === "error" ? "border-red-300 text-red-700" : "border-brand-black/10"
            )}
            onOpenChange={(open) => {
              if (!open) setItems((prev) => prev.filter((i) => i.id !== item.id));
            }}
          >
            <ToastPrimitive.Title>{item.title}</ToastPrimitive.Title>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
```

Wrap `<ToastProvider>` inside `app/providers.tsx`, alongside `QueryClientProvider`.

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm test components/ui`
Expected: PASS (status-badge, button, dialog tests)

- [ ] **Step 9: Commit**

```bash
git add components/ui lib/utils.ts app/providers.tsx
git commit -m "feat: add IMAAD design system primitives on Radix"
```

---

## Task 10: Application Shell

**Files:**
- Create: `imaad-dashboard/lib/store/ui-store.ts`
- Create: `imaad-dashboard/lib/store/ui-store.test.ts`
- Create: `imaad-dashboard/components/shell/sidebar.tsx`
- Create: `imaad-dashboard/components/shell/header.tsx`
- Create: `imaad-dashboard/components/shell/app-shell.tsx`
- Create: `imaad-dashboard/app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `copy.nav`, `useAuth()`.
- Produces: `useUiStore()` zustand hook (`{ sidebarCollapsed, toggleSidebar }`), `<AppShell>` wrapping every dashboard route.

- [ ] **Step 1: Write failing store test**

```ts
// lib/store/ui-store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "./ui-store";

describe("useUiStore", () => {
  beforeEach(() => useUiStore.setState({ sidebarCollapsed: false }));

  it("toggles sidebarCollapsed", () => {
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/store/ui-store.test.ts`
Expected: FAIL (`./ui-store` doesn't exist)

- [ ] **Step 3: Implement the store**

```ts
// lib/store/ui-store.ts
import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/store/ui-store.test.ts`
Expected: PASS

- [ ] **Step 5: Implement sidebar, header, shell**

```tsx
// components/shell/sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { copy } from "@/lib/copy/en";
import { useUiStore } from "@/lib/store/ui-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/overview", label: copy.nav.overview },
  { href: "/ai-employee", label: copy.nav.aiEmployee },
  { href: "/conversations", label: copy.nav.conversations },
  { href: "/knowledge-base", label: copy.nav.knowledgeBase },
  { href: "/customers", label: copy.nav.customers },
  { href: "/requests", label: copy.nav.requests },
  { href: "/analytics", label: copy.nav.analytics },
  { href: "/settings", label: copy.nav.settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-brand-black/10 bg-white transition-[width]",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center px-4 font-semibold tracking-tight">
        {collapsed ? "I" : copy.app.name}
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm text-brand-black/70 hover:bg-brand-black/5 hover:text-brand-black",
                active && "bg-brand-black/5 text-brand-black font-medium border-l-2 border-brand-lime -ml-0.5 pl-[11px]"
              )}
            >
              {collapsed ? item.label.charAt(0) : item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

```tsx
// components/shell/header.tsx
"use client";
import { useAuth } from "@/lib/auth/useAuth";
import { useUiStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, logout } = useAuth();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <header className="flex h-14 items-center justify-between border-b border-brand-black/10 bg-white px-4">
      <Button variant="ghost" size="sm" onClick={toggleSidebar} aria-label="Toggle sidebar">
        ☰
      </Button>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-brand-black/70">{user?.name}</span>
        <Button variant="secondary" size="sm" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
```

```tsx
// components/shell/app-shell.tsx
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

```tsx
// app/(dashboard)/layout.tsx
import { AppShell } from "@/components/shell/app-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 6: Visual verification**

Run: `pnpm dev`. Use the Playwright browser tool to navigate to `http://localhost:3000/overview` (a stub page satisfies this — create a one-line placeholder if Task 12 hasn't run yet), screenshot at 1440px and 375px widths. Confirm: sidebar visible at desktop, hidden/collapsible at mobile per the `hidden md:flex` rule, no layout overflow, header controls reachable by keyboard (Tab to the sidebar toggle button, confirm visible focus ring from `focus-visible:ring-brand-lime` on Button).

- [ ] **Step 7: Commit**

```bash
git add lib/store components/shell "app/(dashboard)/layout.tsx"
git commit -m "feat: add application shell with sidebar, header, and collapse state"
```

---

## Task 11: Login and Register Pages

**Files:**
- Create: `imaad-dashboard/app/(auth)/login/page.tsx`
- Create: `imaad-dashboard/app/(auth)/register/page.tsx`
- Create: `imaad-dashboard/app/(auth)/layout.tsx`
- Create: `imaad-dashboard/components/auth/auth-form.test.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `mapApiErrorToFieldErrors`, `Input`, `Button`, `copy.auth`.
- Produces: working `/login` and `/register` routes redirecting to `/overview` on success.

- [ ] **Step 1: Write failing form-error-mapping integration test**

```tsx
// components/auth/auth-form.test.tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { __resetMockStore } from "@/lib/mock/adapter";

describe("LoginPage", () => {
  beforeEach(() => __resetMockStore());

  it("shows a form-level error on invalid credentials", async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    await userEvent.type(screen.getByLabelText(/work email/i), "sara@riyadhhome.example");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpassword");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/auth/auth-form.test.tsx`
Expected: FAIL (`app/(auth)/login/page.tsx` doesn't exist)

- [ ] **Step 3: Implement auth layout and pages**

```tsx
// app/(auth)/layout.tsx
import { copy } from "@/lib/copy/en";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-brand-black p-12 text-brand-neutral">
        <div className="text-lg font-semibold tracking-tight">{copy.app.name}</div>
        <div>
          <p className="max-w-sm text-2xl font-medium leading-snug">{copy.app.tagline}</p>
          <div className="mt-6 h-1 w-10 bg-brand-lime" />
        </div>
        <div />
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
```

```tsx
// app/(auth)/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { mapApiErrorToFieldErrors } from "@/lib/auth/validation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy/en";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    try {
      await login({ email, password });
      router.push("/overview");
    } catch (err) {
      setErrors(mapApiErrorToFieldErrors(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div>
        <h1 className="text-xl font-semibold">{copy.auth.loginTitle}</h1>
        <p className="mt-1 text-sm text-brand-black/60">{copy.auth.loginSubtitle}</p>
      </div>
      {errors._form && <p className="text-sm text-red-600">{errors._form}</p>}
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          {copy.auth.emailLabel}
        </label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          {copy.auth.passwordLabel}
        </label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
      </div>
      <Button type="submit" isLoading={isSubmitting}>
        {copy.auth.loginSubmit}
      </Button>
      <Link href="/register" className="text-center text-sm text-brand-black/60 hover:text-brand-black">
        {copy.auth.switchToRegister}
      </Link>
    </form>
  );
}
```

```tsx
// app/(auth)/register/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { mapApiErrorToFieldErrors } from "@/lib/auth/validation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy/en";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", orgName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);
    try {
      await register(form);
      router.push("/overview");
    } catch (err) {
      setErrors(mapApiErrorToFieldErrors(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div>
        <h1 className="text-xl font-semibold">{copy.auth.registerTitle}</h1>
        <p className="mt-1 text-sm text-brand-black/60">{copy.auth.registerSubtitle}</p>
      </div>
      {errors._form && <p className="text-sm text-red-600">{errors._form}</p>}
      {(["name", "email", "orgName", "password"] as const).map((field) => (
        <div key={field} className="flex flex-col gap-1">
          <label htmlFor={field} className="text-sm font-medium">
            {field === "name" && copy.auth.nameLabel}
            {field === "email" && copy.auth.emailLabel}
            {field === "orgName" && copy.auth.orgNameLabel}
            {field === "password" && copy.auth.passwordLabel}
          </label>
          <Input
            id={field}
            type={field === "password" ? "password" : field === "email" ? "email" : "text"}
            required
            value={form[field]}
            onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
            error={errors[field]}
          />
        </div>
      ))}
      <Button type="submit" isLoading={isSubmitting}>
        {copy.auth.registerSubmit}
      </Button>
      <Link href="/login" className="text-center text-sm text-brand-black/60 hover:text-brand-black">
        {copy.auth.switchToLogin}
      </Link>
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/auth/auth-form.test.tsx`
Expected: PASS

- [ ] **Step 5: Visual verification**

Run `pnpm dev`, use the Playwright browser tool on `/login` and `/register` at 1440px and 375px. Confirm the split composition collapses to a single column on mobile, field errors render under the correct input, and focus order is logical (email → password → submit → switch link).

- [ ] **Step 6: Commit**

```bash
git add "app/(auth)" components/auth
git commit -m "feat: add Login and Register pages with mapped validation errors"
```

---

## Task 12: Overview Page

**Files:**
- Create: `imaad-dashboard/lib/overview/prioritize.ts`
- Create: `imaad-dashboard/lib/overview/prioritize.test.ts`
- Create: `imaad-dashboard/components/overview/escalation-list.tsx`
- Create: `imaad-dashboard/components/overview/recent-conversations.tsx`
- Create: `imaad-dashboard/app/(dashboard)/overview/page.tsx`

**Interfaces:**
- Consumes: `useConversations()`, types from Task 3.
- Produces: `prioritizeConversations(conversations): { escalations: Conversation[]; recent: Conversation[] }` used by the page and by tests directly.

- [ ] **Step 1: Write failing test**

```ts
// lib/overview/prioritize.test.ts
import { describe, it, expect } from "vitest";
import { prioritizeConversations } from "./prioritize";
import type { Conversation } from "@/lib/types/models";

function convo(overrides: Partial<Conversation>): Conversation {
  return {
    id: "c",
    organizationId: "org_1",
    customerId: "cust",
    customer: { id: "cust", name: "Test", channel: "web_widget" },
    status: "active",
    channel: "web_widget",
    lastMessagePreview: "",
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("prioritizeConversations", () => {
  it("separates escalated conversations from the rest, most recent first", () => {
    const older = convo({ id: "c1", status: "active", updatedAt: "2026-09-14T06:00:00.000Z" });
    const newer = convo({ id: "c2", status: "active", updatedAt: "2026-09-14T07:00:00.000Z" });
    const escalated = convo({ id: "c3", status: "escalated", updatedAt: "2026-09-14T05:00:00.000Z" });

    const result = prioritizeConversations([older, newer, escalated]);

    expect(result.escalations.map((c) => c.id)).toEqual(["c3"]);
    expect(result.recent.map((c) => c.id)).toEqual(["c2", "c1"]);
  });

  it("caps recent conversations at 5", () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      convo({ id: `c${i}`, updatedAt: new Date(2026, 8, 14, i).toISOString() })
    );
    expect(prioritizeConversations(many).recent).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/overview/prioritize.test.ts`
Expected: FAIL (`./prioritize` doesn't exist)

- [ ] **Step 3: Implement**

```ts
// lib/overview/prioritize.ts
import type { Conversation } from "@/lib/types/models";

export function prioritizeConversations(conversations: Conversation[]) {
  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return {
    escalations: sorted.filter((c) => c.status === "escalated"),
    recent: sorted.filter((c) => c.status !== "escalated").slice(0, 5),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/overview/prioritize.test.ts`
Expected: PASS

- [ ] **Step 5: Implement page components**

```tsx
// components/overview/escalation-list.tsx
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { copy } from "@/lib/copy/en";
import type { Conversation } from "@/lib/types/models";

export function EscalationList({ conversations }: { conversations: Conversation[] }) {
  if (conversations.length === 0) {
    return <EmptyState title={copy.overview.noEscalations} />;
  }
  return (
    <ul className="flex flex-col divide-y divide-brand-black/5">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link href={`/conversations?id=${c.id}`} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">{c.customer.name}</p>
              <p className="text-sm text-brand-black/60">{c.lastMessagePreview}</p>
            </div>
            <StatusBadge status={c.status} label={copy.conversations.statusEscalated} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// components/overview/recent-conversations.tsx
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { copy } from "@/lib/copy/en";
import type { Conversation } from "@/lib/types/models";

const STATUS_LABEL: Record<Conversation["status"], string> = {
  active: copy.conversations.statusActive,
  escalated: copy.conversations.statusEscalated,
  resolved: copy.conversations.statusResolved,
};

export function RecentConversations({ conversations }: { conversations: Conversation[] }) {
  return (
    <ul className="flex flex-col divide-y divide-brand-black/5">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link href={`/conversations?id=${c.id}`} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">{c.customer.name}</p>
              <p className="text-sm text-brand-black/60">{c.lastMessagePreview}</p>
            </div>
            <StatusBadge status={c.status} label={STATUS_LABEL[c.status]} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// app/(dashboard)/overview/page.tsx
"use client";
import { useConversations } from "@/lib/api/hooks";
import { prioritizeConversations } from "@/lib/overview/prioritize";
import { EscalationList } from "@/components/overview/escalation-list";
import { RecentConversations } from "@/components/overview/recent-conversations";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy/en";

export default function OverviewPage() {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading || !conversations) {
    return <Skeleton className="h-64 w-full" />;
  }

  const { escalations, recent } = prioritizeConversations(conversations);

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">{copy.overview.title}</h1>
        <p className="text-sm text-brand-black/60">{copy.overview.subtitle}</p>
      </div>
      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-brand-black/50">
          {copy.overview.escalationsHeading}
        </h2>
        <EscalationList conversations={escalations} />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-brand-black/50">
          {copy.overview.recentConversationsHeading}
        </h2>
        <RecentConversations conversations={recent} />
      </section>
    </div>
  );
}
```

- [ ] **Step 6: Visual verification**

Run `pnpm dev`, navigate to `/overview` after logging in (mock credentials `sara@riyadhhome.example` / `demo1234`). Confirm escalation surfaces above recent conversations, lime appears only in the `StatusBadge` attention variant, and the page reads calmly at both 1440px and 375px.

- [ ] **Step 7: Commit**

```bash
git add lib/overview components/overview "app/(dashboard)/overview"
git commit -m "feat: add operational Overview page prioritizing escalations"
```

---

## Task 13: AI Employee Page

**Files:**
- Create: `imaad-dashboard/lib/ai-employee/form.ts`
- Create: `imaad-dashboard/lib/ai-employee/form.test.ts`
- Create: `imaad-dashboard/components/ai-employee/preview-panel.tsx`
- Create: `imaad-dashboard/components/ai-employee/sections.tsx`
- Create: `imaad-dashboard/app/(dashboard)/ai-employee/page.tsx`

**Interfaces:**
- Consumes: `useAgentConfig()`, `useUpdateAgentConfig()`, `AgentConfig` type.
- Produces: `agentConfigReducer(state, action)` and `validateAgentConfig(config)` — pure, independently testable.

- [ ] **Step 1: Write failing test**

```ts
// lib/ai-employee/form.test.ts
import { describe, it, expect } from "vitest";
import { agentConfigReducer, validateAgentConfig } from "./form";
import type { AgentConfig } from "@/lib/types/models";

const base: AgentConfig = {
  id: "agent_1",
  organizationId: "org_1",
  name: "Layla",
  avatar: "",
  toneOfVoice: "warm",
  services: [],
  policies: [],
  workingHours: [],
  escalationRules: [],
  allowedActions: [],
};

describe("agentConfigReducer", () => {
  it("updates a top-level field", () => {
    const next = agentConfigReducer(base, { type: "set_field", field: "name", value: "Nour" });
    expect(next.name).toBe("Nour");
  });

  it("adds a service", () => {
    const next = agentConfigReducer(base, {
      type: "add_service",
      service: { name: "Plumbing", description: "Fix leaks", price: 100 },
    });
    expect(next.services).toHaveLength(1);
    expect(next.services[0].name).toBe("Plumbing");
  });

  it("removes a service by index", () => {
    const withService = agentConfigReducer(base, {
      type: "add_service",
      service: { name: "Plumbing", description: "Fix leaks", price: 100 },
    });
    const next = agentConfigReducer(withService, { type: "remove_service", index: 0 });
    expect(next.services).toHaveLength(0);
  });
});

describe("validateAgentConfig", () => {
  it("requires a non-empty name", () => {
    expect(validateAgentConfig({ ...base, name: "" })).toEqual({ name: "Name is required" });
  });
  it("passes for a valid config", () => {
    expect(validateAgentConfig(base)).toEqual({});
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/ai-employee/form.test.ts`
Expected: FAIL (`./form` doesn't exist)

- [ ] **Step 3: Implement**

```ts
// lib/ai-employee/form.ts
import type { AgentConfig, AgentService } from "@/lib/types/models";

type Action =
  | { type: "set_field"; field: keyof AgentConfig; value: unknown }
  | { type: "add_service"; service: AgentService }
  | { type: "remove_service"; index: number };

export function agentConfigReducer(state: AgentConfig, action: Action): AgentConfig {
  switch (action.type) {
    case "set_field":
      return { ...state, [action.field]: action.value };
    case "add_service":
      return { ...state, services: [...state.services, action.service] };
    case "remove_service":
      return { ...state, services: state.services.filter((_, i) => i !== action.index) };
    default:
      return state;
  }
}

export function validateAgentConfig(config: AgentConfig): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!config.name.trim()) errors.name = "Name is required";
  return errors;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/ai-employee/form.test.ts`
Expected: PASS

- [ ] **Step 5: Implement preview panel and sectioned form**

```tsx
// components/ai-employee/preview-panel.tsx
import { copy } from "@/lib/copy/en";
import type { AgentConfig } from "@/lib/types/models";

export function PreviewPanel({ config }: { config: AgentConfig }) {
  return (
    <aside className="w-72 shrink-0 rounded-lg border border-brand-black/10 p-5">
      <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-brand-black/50">
        {copy.aiEmployee.previewHeading}
      </h3>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-brand-black/10" />
        <div>
          <p className="text-sm font-medium">{config.name || "Unnamed"}</p>
          <p className="text-xs text-brand-mint">● Active</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-brand-black/50">Tone</p>
      <p className="text-sm">{config.toneOfVoice || "—"}</p>
      <p className="mt-4 text-xs text-brand-black/50">Example response</p>
      <p className="mt-1 rounded-md bg-brand-black/5 p-3 text-sm">
        "Hi, I'm {config.name || "your AI employee"}. How can I help today?"
      </p>
    </aside>
  );
}
```

```tsx
// components/ai-employee/sections.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy/en";
import type { AgentConfig, AgentService } from "@/lib/types/models";

type Dispatch = (action: any) => void;

export function IdentitySection({ config, dispatch, errors }: { config: AgentConfig; dispatch: Dispatch; errors: Record<string, string> }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium">{copy.aiEmployee.sections.identity}</h2>
      <div className="flex flex-col gap-1">
        <label htmlFor="agent-name" className="text-sm font-medium">Name</label>
        <Input
          id="agent-name"
          value={config.name}
          onChange={(e) => dispatch({ type: "set_field", field: "name", value: e.target.value })}
          error={errors.name}
        />
      </div>
    </section>
  );
}

export function BehaviorSection({ config, dispatch }: { config: AgentConfig; dispatch: Dispatch }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium">{copy.aiEmployee.sections.behavior}</h2>
      <div className="flex flex-col gap-1">
        <label htmlFor="tone" className="text-sm font-medium">Tone of voice</label>
        <Input
          id="tone"
          value={config.toneOfVoice}
          onChange={(e) => dispatch({ type: "set_field", field: "toneOfVoice", value: e.target.value })}
        />
      </div>
    </section>
  );
}

export function ServicesSection({ config, dispatch }: { config: AgentConfig; dispatch: Dispatch }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-medium">{copy.aiEmployee.sections.services}</h2>
      <ul className="flex flex-col gap-2">
        {config.services.map((s: AgentService, i: number) => (
          <li key={i} className="flex items-center justify-between rounded-md border border-brand-black/10 p-3">
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-brand-black/50">{s.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">{s.price}</span>
              <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "remove_service", index: i })}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

```tsx
// app/(dashboard)/ai-employee/page.tsx
"use client";
import { useEffect, useReducer, useState } from "react";
import { useAgentConfig, useUpdateAgentConfig } from "@/lib/api/hooks";
import { agentConfigReducer, validateAgentConfig } from "@/lib/ai-employee/form";
import { IdentitySection, BehaviorSection, ServicesSection } from "@/components/ai-employee/sections";
import { PreviewPanel } from "@/components/ai-employee/preview-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { copy } from "@/lib/copy/en";
import type { AgentConfig } from "@/lib/types/models";

export default function AiEmployeePage() {
  const { data, isLoading } = useAgentConfig();
  const updateMutation = useUpdateAgentConfig();
  const { push } = useToast();
  const [config, dispatch] = useReducer(agentConfigReducer, null as unknown as AgentConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) dispatch({ type: "set_field", field: "id", value: data.id } as any);
  }, [data]);

  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;
  const current = config?.id ? config : data;

  async function handleSave() {
    const validationErrors = validateAgentConfig(current);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    await updateMutation.mutateAsync(current);
    push({ title: "AI Employee updated" });
  }

  return (
    <div className="flex gap-8">
      <div className="flex flex-1 flex-col gap-8 max-w-2xl">
        <div>
          <h1 className="text-xl font-semibold">{copy.aiEmployee.title}</h1>
          <p className="text-sm text-brand-black/60">{copy.aiEmployee.subtitle}</p>
        </div>
        <IdentitySection config={current} dispatch={dispatch} errors={errors} />
        <BehaviorSection config={current} dispatch={dispatch} />
        <ServicesSection config={current} dispatch={dispatch} />
        <Button onClick={handleSave} isLoading={updateMutation.isPending} className="self-start">
          {copy.aiEmployee.saveButton}
        </Button>
      </div>
      <PreviewPanel config={current} />
    </div>
  );
}
```

- [ ] **Step 6: Visual verification**

Run `pnpm dev`, navigate to `/ai-employee`. Confirm the preview panel updates live as the name field changes, sections read as one coherent form (not disconnected cards), and layout stacks to one column with the preview below the form on mobile (add a `flex-col md:flex-row` adjustment to the page wrapper if it doesn't already reflow — verify visually and fix before committing).

- [ ] **Step 7: Commit**

```bash
git add lib/ai-employee components/ai-employee "app/(dashboard)/ai-employee"
git commit -m "feat: add AI Employee configuration experience with live preview"
```

---

## Task 14: Conversations Page

**Files:**
- Create: `imaad-dashboard/lib/conversations/format.ts`
- Create: `imaad-dashboard/lib/conversations/format.test.ts`
- Create: `imaad-dashboard/components/conversations/conversation-list.tsx`
- Create: `imaad-dashboard/components/conversations/conversation-detail.tsx`
- Create: `imaad-dashboard/components/conversations/message-item.tsx`
- Create: `imaad-dashboard/components/conversations/composer.tsx`
- Create: `imaad-dashboard/app/(dashboard)/conversations/page.tsx`

**Interfaces:**
- Consumes: `useConversations`, `useConversation`, `useMessages`, `useSendMessage`, `useAssignConversation`, `useRealtimeEvent`.
- Produces: `formatChannelLabel(channel)`, `formatStatusLabel(status)`, `formatSenderLabel(sender)` — pure mapping functions covered by tests, used by list/detail/message components.

- [ ] **Step 1: Write failing test**

```ts
// lib/conversations/format.test.ts
import { describe, it, expect } from "vitest";
import { formatChannelLabel, formatStatusLabel, formatSenderLabel } from "./format";

describe("format helpers", () => {
  it("formats channel labels", () => {
    expect(formatChannelLabel("web_widget")).toBe("Web Widget");
    expect(formatChannelLabel("whatsapp")).toBe("WhatsApp");
  });
  it("formats status labels", () => {
    expect(formatStatusLabel("active")).toBe("Active");
    expect(formatStatusLabel("escalated")).toBe("Escalated");
    expect(formatStatusLabel("resolved")).toBe("Resolved");
  });
  it("formats sender labels distinctly for AI vs human vs customer", () => {
    expect(formatSenderLabel("ai_agent")).toBe("AI Employee");
    expect(formatSenderLabel("human_agent")).toBe("Team member");
    expect(formatSenderLabel("customer")).toBe("Customer");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/conversations/format.test.ts`
Expected: FAIL (`./format` doesn't exist)

- [ ] **Step 3: Implement**

```ts
// lib/conversations/format.ts
import { copy } from "@/lib/copy/en";
import type { ConversationStatus, CustomerChannel, MessageSender } from "@/lib/types/models";

export function formatChannelLabel(channel: CustomerChannel): string {
  return channel === "web_widget" ? copy.conversations.channelWebWidget : copy.conversations.channelWhatsapp;
}

export function formatStatusLabel(status: ConversationStatus): string {
  const map: Record<ConversationStatus, string> = {
    active: copy.conversations.statusActive,
    escalated: copy.conversations.statusEscalated,
    resolved: copy.conversations.statusResolved,
  };
  return map[status];
}

export function formatSenderLabel(sender: MessageSender): string {
  const map: Record<MessageSender, string> = {
    customer: "Customer",
    ai_agent: "AI Employee",
    human_agent: "Team member",
  };
  return map[sender];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/conversations/format.test.ts`
Expected: PASS

- [ ] **Step 5: Implement list, message item, composer, detail, page**

```tsx
// components/conversations/conversation-list.tsx
"use client";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatChannelLabel, formatStatusLabel } from "@/lib/conversations/format";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy/en";
import type { Conversation } from "@/lib/types/models";

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) return <EmptyState title={copy.conversations.listEmpty} />;

  return (
    <ul className="flex flex-col overflow-y-auto divide-y divide-brand-black/5">
      {conversations.map((c) => (
        <li key={c.id}>
          <button
            onClick={() => onSelect(c.id)}
            className={cn(
              "flex w-full flex-col gap-1 px-3 py-3 text-left hover:bg-brand-black/5",
              selectedId === c.id && "bg-brand-black/5"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{c.customer.name}</span>
              <StatusBadge status={c.status} label={formatStatusLabel(c.status)} />
            </div>
            <p className="truncate text-xs text-brand-black/50">{c.lastMessagePreview}</p>
            <p className="text-xs text-brand-black/40">{formatChannelLabel(c.channel)}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// components/conversations/message-item.tsx
import { formatSenderLabel } from "@/lib/conversations/format";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types/models";

export function MessageItem({ message }: { message: Message }) {
  const isCustomer = message.sender === "customer";
  return (
    <div className={cn("flex flex-col gap-1", isCustomer ? "items-start" : "items-end")}>
      <span className="text-xs font-medium text-brand-black/40">{formatSenderLabel(message.sender)}</span>
      <p
        className={cn(
          "max-w-md rounded-md px-3 py-2 text-sm",
          isCustomer ? "bg-brand-black/5" : "border border-brand-black/10"
        )}
      >
        {message.content}
      </p>
    </div>
  );
}
```

```tsx
// components/conversations/composer.tsx
"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy/en";

export function Composer({ onSend, isSending }: { onSend: (content: string) => void; isSending: boolean }) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t border-brand-black/10 p-3">
      <Input
        aria-label={copy.conversations.composerPlaceholder}
        placeholder={copy.conversations.composerPlaceholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" isLoading={isSending}>
        {copy.conversations.sendButton}
      </Button>
    </form>
  );
}
```

```tsx
// components/conversations/conversation-detail.tsx
"use client";
import { useEffect, useRef } from "react";
import { useMessages, useSendMessage, useAssignConversation } from "@/lib/api/hooks";
import { useRealtimeEvent } from "@/lib/realtime/useRealtimeEvent";
import { useQueryClient } from "@tanstack/react-query";
import { MessageItem } from "./message-item";
import { Composer } from "./composer";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatStatusLabel } from "@/lib/conversations/format";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy/en";
import type { Conversation } from "@/lib/types/models";

export function ConversationDetail({ conversation }: { conversation: Conversation }) {
  const { data: messages, isLoading } = useMessages(conversation.id);
  const sendMutation = useSendMessage(conversation.id);
  const assignMutation = useAssignConversation();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useRealtimeEvent("message:new", (msg) => {
    if (msg.conversationId === conversation.id) {
      queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] });
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-brand-black/10 p-4">
        <div>
          <p className="text-sm font-medium">{conversation.customer.name}</p>
          <StatusBadge status={conversation.status} label={formatStatusLabel(conversation.status)} />
        </div>
        {!conversation.assignedTo && (
          <Button variant="secondary" size="sm" onClick={() => assignMutation.mutate(conversation.id)}>
            {copy.conversations.assignButton}
          </Button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {isLoading && <Skeleton className="h-24 w-full" />}
        {messages?.map((m) => (
          <MessageItem key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>
      <Composer onSend={(content) => sendMutation.mutate(content)} isSending={sendMutation.isPending} />
    </div>
  );
}
```

```tsx
// app/(dashboard)/conversations/page.tsx
"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useConversations } from "@/lib/api/hooks";
import { ConversationList } from "@/components/conversations/conversation-list";
import { ConversationDetail } from "@/components/conversations/conversation-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { copy } from "@/lib/copy/en";

export default function ConversationsPage() {
  const { data: conversations, isLoading } = useConversations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get("id") ?? undefined;

  if (isLoading || !conversations) return <Skeleton className="h-96 w-full" />;

  const selected = conversations.find((c) => c.id === selectedId) ?? conversations[0];

  return (
    <div className="flex h-full gap-0 overflow-hidden rounded-lg border border-brand-black/10">
      <div className="flex w-80 shrink-0 flex-col border-r border-brand-black/10">
        <div className="p-4">
          <h1 className="text-sm font-semibold">{copy.conversations.title}</h1>
        </div>
        <ConversationList
          conversations={conversations}
          selectedId={selected?.id}
          onSelect={(id) => router.push(`/conversations?id=${id}`)}
        />
      </div>
      {selected ? (
        <ConversationDetail conversation={selected} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState title={copy.conversations.listEmpty} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Visual verification**

Run `pnpm dev`, navigate to `/conversations`. Confirm sender distinction reads via label + alignment + subtle surface (not colored bubbles), the list/detail split becomes a single focused screen on mobile widths (add conditional rendering — show list OR detail based on `selectedId` under a `md:` breakpoint check — verify and fix before committing), and sending a message appends it without a full page reload.

- [ ] **Step 7: Commit**

```bash
git add lib/conversations components/conversations "app/(dashboard)/conversations"
git commit -m "feat: add Conversations workspace with list/detail and realtime message seam"
```

---

## Task 15: Knowledge Base Page

**Files:**
- Create: `imaad-dashboard/lib/kb/status.ts`
- Create: `imaad-dashboard/lib/kb/status.test.ts`
- Create: `imaad-dashboard/components/kb/document-list.tsx`
- Create: `imaad-dashboard/components/kb/upload-dialog.tsx`
- Create: `imaad-dashboard/app/(dashboard)/knowledge-base/page.tsx`

**Interfaces:**
- Consumes: `useKbDocuments`, `useCreateKbDocument`, `useUploadKbDocument`, `useReprocessKbDocument`, `useDeleteKbDocument`, `useRealtimeEvent`.
- Produces: `getKbStatusLabel(status)`.

- [ ] **Step 1: Write failing test**

```ts
// lib/kb/status.test.ts
import { describe, it, expect } from "vitest";
import { getKbStatusLabel } from "./status";

describe("getKbStatusLabel", () => {
  it("maps every status to its copy label", () => {
    expect(getKbStatusLabel("pending")).toBe("Pending");
    expect(getKbStatusLabel("processing")).toBe("Processing");
    expect(getKbStatusLabel("ready")).toBe("Ready");
    expect(getKbStatusLabel("failed")).toBe("Failed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/kb/status.test.ts`
Expected: FAIL (`./status` doesn't exist)

- [ ] **Step 3: Implement**

```ts
// lib/kb/status.ts
import { copy } from "@/lib/copy/en";
import type { KBDocumentStatus } from "@/lib/types/models";

export function getKbStatusLabel(status: KBDocumentStatus): string {
  const map: Record<KBDocumentStatus, string> = {
    pending: copy.knowledgeBase.statusPending,
    processing: copy.knowledgeBase.statusProcessing,
    ready: copy.knowledgeBase.statusReady,
    failed: copy.knowledgeBase.statusFailed,
  };
  return map[status];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/kb/status.test.ts`
Expected: PASS

- [ ] **Step 5: Implement document list, upload dialog, page**

```tsx
// components/kb/document-list.tsx
"use client";
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getKbStatusLabel } from "@/lib/kb/status";
import { useReprocessKbDocument, useDeleteKbDocument } from "@/lib/api/hooks";
import { copy } from "@/lib/copy/en";
import type { KBDocument } from "@/lib/types/models";

export function DocumentList({ documents }: { documents: KBDocument[] }) {
  const reprocess = useReprocessKbDocument();
  const remove = useDeleteKbDocument();

  if (documents.length === 0) return <EmptyState title={copy.knowledgeBase.empty} />;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Title</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell></TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>{doc.title}</TableCell>
            <TableCell className="uppercase text-xs text-brand-black/50">{doc.type}</TableCell>
            <TableCell>
              <StatusBadge status={doc.status} label={getKbStatusLabel(doc.status)} />
            </TableCell>
            <TableCell className="flex justify-end gap-2">
              {doc.status === "failed" && (
                <Button variant="ghost" size="sm" onClick={() => reprocess.mutate(doc.id)}>
                  {copy.knowledgeBase.reprocessButton}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => remove.mutate(doc.id)}>
                {copy.knowledgeBase.deleteButton}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

```tsx
// components/kb/upload-dialog.tsx
"use client";
import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateKbDocument, useUploadKbDocument } from "@/lib/api/hooks";
import { copy } from "@/lib/copy/en";

export function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createMutation = useCreateKbDocument();
  const uploadMutation = useUploadKbDocument();

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({ title, content });
    setTitle("");
    setContent("");
    setOpen(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("title", file.name);
    formData.set("file", file);
    await uploadMutation.mutateAsync(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{copy.knowledgeBase.uploadButton}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="mb-4 text-base font-semibold">{copy.knowledgeBase.uploadDialogTitle}</DialogTitle>
        <Tabs defaultValue="text">
          <TabsList>
            <TabsTrigger value="text">{copy.knowledgeBase.textTab}</TabsTrigger>
            <TabsTrigger value="pdf">{copy.knowledgeBase.pdfTab}</TabsTrigger>
          </TabsList>
          <TabsContent value="text">
            <form onSubmit={handleTextSubmit} className="flex flex-col gap-3">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <textarea
                className="min-h-32 rounded-md border border-brand-black/15 p-3 text-sm"
                placeholder="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <Button type="submit" isLoading={createMutation.isPending}>
                {copy.knowledgeBase.uploadButton}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="pdf">
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

```tsx
// app/(dashboard)/knowledge-base/page.tsx
"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useKbDocuments } from "@/lib/api/hooks";
import { useRealtimeEvent } from "@/lib/realtime/useRealtimeEvent";
import { DocumentList } from "@/components/kb/document-list";
import { UploadDialog } from "@/components/kb/upload-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy/en";

export default function KnowledgeBasePage() {
  const { data: documents, isLoading } = useKbDocuments();
  const queryClient = useQueryClient();

  useRealtimeEvent("kb:document-status", () => {
    queryClient.invalidateQueries({ queryKey: ["kb"] });
  });

  if (isLoading || !documents) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{copy.knowledgeBase.title}</h1>
          <p className="text-sm text-brand-black/60">{copy.knowledgeBase.subtitle}</p>
        </div>
        <UploadDialog />
      </div>
      <DocumentList documents={documents} />
    </div>
  );
}
```

- [ ] **Step 6: Visual verification**

Run `pnpm dev`, navigate to `/knowledge-base`, add a text document, and confirm the status badge visibly progresses pending → processing → ready over the ~4 second mock delay without a manual refresh (TanStack Query's default refetch-on-window-focus won't catch this automatically — if the status doesn't update live, add a `refetchInterval: 2000` to `useKbDocuments` while any document is non-terminal, then verify again).

- [ ] **Step 7: Commit**

```bash
git add lib/kb components/kb "app/(dashboard)/knowledge-base"
git commit -m "feat: add Knowledge Base management with async status feedback"
```

---

## Task 16: Placeholder Nav Routes

**Files:**
- Create: `imaad-dashboard/components/shell/coming-soon.tsx`
- Create: `imaad-dashboard/app/(dashboard)/customers/page.tsx`
- Create: `imaad-dashboard/app/(dashboard)/requests/page.tsx`
- Create: `imaad-dashboard/app/(dashboard)/analytics/page.tsx`
- Create: `imaad-dashboard/app/(dashboard)/settings/page.tsx`

**Interfaces:**
- Consumes: `copy.placeholder.comingSoon`.
- Produces: four non-functional routes so every sidebar link resolves instead of 404ing.

- [ ] **Step 1: Implement shared placeholder and four pages**

```tsx
// components/shell/coming-soon.tsx
import { copy } from "@/lib/copy/en";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-brand-black/60">{copy.placeholder.comingSoon}</p>
    </div>
  );
}
```

```tsx
// app/(dashboard)/customers/page.tsx
import { ComingSoon } from "@/components/shell/coming-soon";
import { copy } from "@/lib/copy/en";
export default function CustomersPage() {
  return <ComingSoon title={copy.nav.customers} />;
}
```

```tsx
// app/(dashboard)/requests/page.tsx
import { ComingSoon } from "@/components/shell/coming-soon";
import { copy } from "@/lib/copy/en";
export default function RequestsPage() {
  return <ComingSoon title={copy.nav.requests} />;
}
```

```tsx
// app/(dashboard)/analytics/page.tsx
import { ComingSoon } from "@/components/shell/coming-soon";
import { copy } from "@/lib/copy/en";
export default function AnalyticsPage() {
  return <ComingSoon title={copy.nav.analytics} />;
}
```

```tsx
// app/(dashboard)/settings/page.tsx
import { ComingSoon } from "@/components/shell/coming-soon";
import { copy } from "@/lib/copy/en";
export default function SettingsPage() {
  return <ComingSoon title={copy.nav.settings} />;
}
```

- [ ] **Step 2: Visual verification**

Click every sidebar link in the running app; confirm none 404s and each placeholder reads intentionally minimal rather than broken.

- [ ] **Step 3: Commit**

```bash
git add components/shell/coming-soon.tsx "app/(dashboard)/customers" "app/(dashboard)/requests" "app/(dashboard)/analytics" "app/(dashboard)/settings"
git commit -m "feat: add placeholder routes for phase-2 sidebar sections"
```

---

## Task 17: Route Guard, Home Redirect, and Final Visual QA Pass

**Files:**
- Create: `imaad-dashboard/app/(dashboard)/dashboard-guard.tsx`
- Modify: `imaad-dashboard/app/(dashboard)/layout.tsx`
- Modify: `imaad-dashboard/app/page.tsx`

**Interfaces:**
- Consumes: `useAuth()`.
- Produces: unauthenticated visitors to any `(dashboard)` route are redirected to `/login`; `/` redirects to `/overview` or `/login`.

- [ ] **Step 1: Implement the guard**

```tsx
// app/(dashboard)/dashboard-guard.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isPending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !isAuthenticated) router.replace("/login");
  }, [isPending, isAuthenticated, router]);

  if (isPending || !isAuthenticated) return null;
  return <>{children}</>;
}
```

```tsx
// app/(dashboard)/layout.tsx
import { AppShell } from "@/components/shell/app-shell";
import { DashboardGuard } from "./dashboard-guard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardGuard>
      <AppShell>{children}</AppShell>
    </DashboardGuard>
  );
}
```

```tsx
// app/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";

export default function RootPage() {
  const { isAuthenticated, isPending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    router.replace(isAuthenticated ? "/overview" : "/login");
  }, [isPending, isAuthenticated, router]);

  return null;
}
```

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`
Expected: all tests across every task PASS.

- [ ] **Step 3: Typecheck and lint**

Run: `pnpm tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 4: Full visual QA pass**

Run `pnpm dev`. Using the Playwright browser tool, visit `/`, `/login`, `/register`, `/overview`, `/ai-employee`, `/conversations`, `/knowledge-base` at three widths: 1440px (desktop), 768px (tablet), 375px (mobile). For each, screenshot and check against the spec's quality bar: no unauthorized use of lime as a fill color, no more than one prominent metric per screen, sender distinction in Conversations reads as typography/spacing not colored bubbles, no layout overflow or horizontal scroll at 375px, focus rings visible when tabbing through interactive elements. Fix anything that fails this check directly in the relevant component file from Tasks 9-16.

- [ ] **Step 5: Commit**

```bash
git add "app/(dashboard)/dashboard-guard.tsx" "app/(dashboard)/layout.tsx" app/page.tsx
git commit -m "feat: add auth route guarding and root redirect"
```

If Step 4 required fixes, commit those separately per touched area:

```bash
git add <fixed files>
git commit -m "fix: address visual QA findings from phase 1 pass"
```

---

## Self-Review

**Spec coverage:** Shell (Task 10), Login/Register (Task 11), Overview (Task 12), AI Employee (Task 13), Conversations (Task 14), Knowledge Base (Task 15), design tokens/fonts (Task 2), design system primitives (Task 9), mock data layer with realistic async/error behavior (Task 5), auth centralization (Task 7), realtime seam (Task 8), i18n-ready copy table (Task 4), placeholder nav for out-of-scope sections (Task 16), route guarding (Task 17) — every phase-1 spec section maps to a task. Widget, Customers, Requests, Analytics, Settings functionality, and i18n/RTL are explicitly deferred per the spec's own phase boundary.

**Placeholder scan:** No TBD/TODO markers; every step carries runnable code and exact commands.

**Type consistency:** `ApiClient`/`ApiError` (Task 5) match their usage in every resource module (Task 6); `AgentConfig`/`Conversation`/`Message`/`KBDocument` fields (Task 3) are used identically across mock adapter, hooks, and components; `useKbDocuments`/`useConversations`/etc. names introduced in Task 6 match every later import.

**Note on TDD scope:** Presentational/layout code (shell composition, page JSX wiring) uses a "run and visually verify" step instead of a unit test, since correctness there is about visual/UX quality, not logic — matching the spec's own instruction to visually inspect rendered pages. Every piece of actual logic (mock adapter behavior, API hooks, auth error mapping, form reducers/validation, status/format mapping, realtime subscription, UI store) has a real failing-then-passing unit test.
