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

