import { describe, expect, it, vi } from "vitest";
import { SupabaseAiAssetRepository } from "./supabase-ai-asset-repository";

describe("SupabaseAiAssetRepository", () => {
  it("uploads allowed asset to private bucket and maps result", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const repository = new SupabaseAiAssetRepository({ storage: { from: vi.fn().mockReturnValue({ upload }) } } as never);

    await expect(repository.upload({ userId: "user-id", body: new Uint8Array([1]), contentType: "image/png", path: "ai/user-id/references/file.png" })).resolves.toEqual({ path: "ai/user-id/references/file.png", contentType: "image/png" });
    expect(upload).toHaveBeenCalledWith("ai/user-id/references/file.png", expect.any(Uint8Array), { contentType: "image/png", upsert: false });
  });

  it("creates a private signed URL with a fifteen-minute lifetime", async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed.example/asset" }, error: null });
    const from = vi.fn().mockReturnValue({ createSignedUrl });
    const repository = new SupabaseAiAssetRepository({ storage: { from } } as never);

    await expect(repository.createSignedUrl("ai/project/generation/0")).resolves.toBe("https://signed.example/asset");
    expect(from).toHaveBeenCalledWith("ai-assets");
    expect(createSignedUrl).toHaveBeenCalledWith("ai/project/generation/0", 900);
  });

  it("rejects disallowed upload MIME types", async () => {
    const repository = new SupabaseAiAssetRepository({ storage: { from: vi.fn() } } as never);

    await expect(repository.upload({ userId: "user-id", body: new Uint8Array([1]), contentType: "text/html", path: "ai/user-id/references/file.html" })).rejects.toThrow("Asset rejected");
  });

  it("rejects oversized uploads", async () => {
    const repository = new SupabaseAiAssetRepository({ storage: { from: vi.fn() } } as never);

    await expect(repository.upload({ userId: "user-id", body: new Uint8Array(101 * 1024 * 1024), contentType: "image/png", path: "ai/user-id/references/file.png" })).rejects.toThrow("Asset rejected");
  });
});
