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
