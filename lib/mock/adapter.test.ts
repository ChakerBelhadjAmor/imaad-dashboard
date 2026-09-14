import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockClient, __resetMockStore } from "./adapter";
// Import order matters here: "./adapter" is imported above BEFORE "@/lib/api/client" below.
// This is the exact ordering that previously triggered a circular-import bug where
// `apiClient` in lib/api/client.ts resolved to `undefined` (see the regression test below).
import { ApiError, apiClient } from "@/lib/api/client";

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

  // Regression test for a circular-import bug: when "./adapter" is imported before
  // "@/lib/api/client" (the exact order used at the top of this file), the old
  // client.ts/adapter.ts structure caused `apiClient` to permanently capture
  // `undefined` because client.ts's `export const apiClient = mockClient;`
  // executed while adapter.ts's `mockClient` export had not been assigned yet.
  it("apiClient resolves to a working client even when adapter is imported first", async () => {
    expect(typeof apiClient.get).toBe("function");
    const org = await apiClient.get<{ id: string }>("/api/organization");
    expect(org.id).toBe("org_1");
  });
});
