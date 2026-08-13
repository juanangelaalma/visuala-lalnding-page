import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createSignedAssetUrls: vi.fn() }));

vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: mocks.createSignedAssetUrls }));

import { ApiError, failure, generationDto, workerAuthorized } from "./_shared";

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

  it("returns signed asset URLs without disclosing private paths", async () => {
    mocks.createSignedAssetUrls.mockResolvedValue(["https://signed.example/output"]);

    await expect(Promise.resolve(generationDto({ id: "generation", scene_id: "scene", type: "image", status: "succeeded", output_assets: ["ai/project/generation/0"], error_code: null, created_at: "2026-08-13T00:00:00.000Z", completed_at: "2026-08-13T00:01:00.000Z" })))
      .resolves.toMatchObject({ assets: ["https://signed.example/output"] });
    expect(mocks.createSignedAssetUrls).toHaveBeenCalledWith(["ai/project/generation/0"]);
  });

  it("keeps queued generation assets empty without signing persisted paths", async () => {
    mocks.createSignedAssetUrls.mockClear();
    await expect(generationDto({ id: "generation", scene_id: "scene", type: "image", status: "queued", output_assets: ["ai/project/generation/0"], error_code: null, created_at: "2026-08-13T00:00:00.000Z", completed_at: null }))
      .resolves.toMatchObject({ assets: [] });
    expect(mocks.createSignedAssetUrls).not.toHaveBeenCalled();
  });
});
