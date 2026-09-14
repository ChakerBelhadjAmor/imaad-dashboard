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
