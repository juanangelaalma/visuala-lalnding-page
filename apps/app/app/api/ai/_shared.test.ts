import { describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/ai/supabase-assets", () => {
  throw new Error("AI API shared helpers must not load storage");
});

import { ApiError, failure, workerAuthorized } from "./_shared";

describe("AI API boundary", () => {
  it("uses constant-time compatible worker auth behavior", () => {
    expect(workerAuthorized("Bearer correct", "correct")).toBe(true);
    expect(workerAuthorized("Bearer wrong", "correct")).toBe(false);
    expect(workerAuthorized(null, "correct")).toBe(false);
  });

  it("sanitizes unexpected failures", async () => {
    await expect((await failure(new Error("secret provider detail"))).json()).resolves.toEqual({ error: { code: "INTERNAL_ERROR", message: "The request could not be completed" } });
  });

  it("keeps stable expected errors", async () => {
    await expect((await failure(new ApiError(409, "CONFLICT", "Already queued"))).json()).resolves.toEqual({ error: { code: "CONFLICT", message: "Already queued" } });
  });

  it("loads shared API helpers without storage", () => {
    expect(workerAuthorized("Bearer correct", "correct")).toBe(true);
  });
});
