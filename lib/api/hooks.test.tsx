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
