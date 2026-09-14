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

