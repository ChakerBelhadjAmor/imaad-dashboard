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
