import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServiceRoleClient: vi.fn(),
  upload: vi.fn(),
  createSignedUrl: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/supabase/service-role-client", () => ({
  createSupabaseServiceRoleClient: mocks.createSupabaseServiceRoleClient,
}));

import {
  copyRemoteAsset,
  createSignedAssetUrl,
  createSignedAssetUrls,
  uploadAsset,
} from "./supabase-assets";

describe("Supabase AI assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ATLAS_ASSET_HOSTS", "assets.atlas.example");
    mocks.createSupabaseServiceRoleClient.mockReturnValue({
      storage: {
        from: vi.fn().mockReturnValue({
          upload: mocks.upload,
          createSignedUrl: mocks.createSignedUrl,
        }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uploads an allowed asset to the private bucket", async () => {
    mocks.upload.mockResolvedValue({ error: null });

    await expect(uploadAsset(new Uint8Array([1]), "image/png", "ai/user/references/file.png")).resolves.toBe("ai/user/references/file.png");

    expect(mocks.upload).toHaveBeenCalledWith("ai/user/references/file.png", expect.any(Uint8Array), {
      contentType: "image/png",
      upsert: false,
    });
  });

  it("creates a signed URL with a fifteen-minute lifetime", async () => {
    mocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed.example/asset" }, error: null });

    await expect(createSignedAssetUrl("ai/project/generation/0")).resolves.toBe("https://signed.example/asset");

    expect(mocks.createSignedUrl).toHaveBeenCalledWith("ai/project/generation/0", 900);
  });

  it("creates signed URLs for each asset path", async () => {
    mocks.createSignedUrl
      .mockResolvedValueOnce({ data: { signedUrl: "https://signed.example/first" }, error: null })
      .mockResolvedValueOnce({ data: { signedUrl: "https://signed.example/second" }, error: null });

    await expect(createSignedAssetUrls(["ai/project/generation/0", "ai/project/generation/1"])).resolves.toEqual([
      "https://signed.example/first",
      "https://signed.example/second",
    ]);
  });

  it("rejects oversized uploads", async () => {
    await expect(uploadAsset(new Uint8Array(101 * 1024 * 1024), "image/png", "ai/user/file.png")).rejects.toThrow("Asset rejected");
  });

  it("rejects remote assets from untrusted hosts", async () => {
    await expect(copyRemoteAsset("https://untrusted.example/file.png", "ai/project/output/0")).rejects.toThrow("Provider asset host rejected");
  });

  it("rejects failed signed URL creation", async () => {
    mocks.createSignedUrl.mockResolvedValue({ data: null, error: new Error("storage error") });

    await expect(createSignedAssetUrl("ai/project/output/0")).rejects.toThrow("Could not sign asset");
  });
});
