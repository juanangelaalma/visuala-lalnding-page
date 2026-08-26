import { describe, expect, it, vi } from "vitest";
import { SupabaseAiAssetRepository } from "./supabase-ai-asset-repository";

describe("SupabaseAiAssetRepository", () => {
  it("uploads allowed asset to private bucket and maps result", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const repository = new SupabaseAiAssetRepository({ storage: { from: vi.fn().mockReturnValue({ upload }) } } as never);

    await expect(repository.upload({ userId: "user-id", body: new Uint8Array([1]), contentType: "image/png", path: "ai/user-id/references/file.png" })).resolves.toEqual({ path: "ai/user-id/references/file.png", contentType: "image/png" });
    expect(upload).toHaveBeenCalledWith("ai/user-id/references/file.png", expect.any(Uint8Array), { contentType: "image/png", upsert: false });
  });
});
