import type { ApiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
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

// Mock-only credential for the demo login flow — not real auth, never used against a real backend.
const KNOWN_PASSWORD = "demo1234";
let idCounter = 100;
const nextId = (prefix: string) => `${prefix}_${idCounter++}`;

// Tracks pending KB-processing timers so tests can reset the mock store without
// leaking a previous test's setTimeout callbacks into a later test's store/idCounter state.
let pendingTimers: ReturnType<typeof setTimeout>[] = [];

export function __resetMockStore() {
  for (const timer of pendingTimers) clearTimeout(timer);
  pendingTimers = [];
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
  pendingTimers.push(
    setTimeout(() => {
      const doc = store.kbDocuments.find((d) => d.id === id);
      if (doc) doc.status = "processing";
    }, 1000)
  );
  pendingTimers.push(
    setTimeout(() => {
      const doc = store.kbDocuments.find((d) => d.id === id);
      if (doc) doc.status = "ready";
    }, 4000)
  );
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
