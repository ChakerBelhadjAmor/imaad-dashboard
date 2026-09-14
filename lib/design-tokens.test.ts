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
