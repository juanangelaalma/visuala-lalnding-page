import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServiceRoleClient: vi.fn(),
  upload: vi.fn(),
  createSignedUrl: vi.fn(),
  fetch: vi.fn(),
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
    vi.stubGlobal("fetch", mocks.fetch);
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

  it("copies an allowed remote asset to the private bucket", async () => {
    mocks.fetch.mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      headers: { "content-length": "3", "content-type": "image/png" },
    }));
    mocks.upload.mockImplementation(async (_key, body) => {
      const chunks: Buffer[] = [];
      for await (const chunk of body) chunks.push(chunk);
      expect(Buffer.concat(chunks)).toEqual(Buffer.from([1, 2, 3]));
      return { error: null };
    });

    await expect(copyRemoteAsset("https://assets.atlas.example/file.png", "ai/project/output/0")).resolves.toBe("ai/project/output/0");

    expect(mocks.fetch).toHaveBeenCalledWith(new URL("https://assets.atlas.example/file.png"), expect.objectContaining({ redirect: "manual" }));
    expect(mocks.upload).toHaveBeenCalledWith("ai/project/output/0", expect.anything(), {
      contentType: "image/png",
      upsert: false,
    });
  });

  it("rejects provider redirects", async () => {
    mocks.fetch.mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://other.example/file.png" } }));

    await expect(copyRemoteAsset("https://assets.atlas.example/file.png", "ai/project/output/0")).rejects.toThrow("Provider asset redirect rejected");
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("maps non-OK provider responses to a safe error", async () => {
    mocks.fetch.mockResolvedValue(new Response(null, { status: 502 }));

    await expect(copyRemoteAsset("https://assets.atlas.example/file.png", "ai/project/output/0")).rejects.toThrow("Could not copy provider asset (502)");
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("rejects provider assets with disallowed MIME types", async () => {
    mocks.fetch.mockResolvedValue(new Response(new Uint8Array([1]), { headers: { "content-type": "text/html" } }));

    await expect(copyRemoteAsset("https://assets.atlas.example/file.html", "ai/project/output/0")).rejects.toThrow("Provider asset rejected");
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("rejects provider assets with an oversized declared content length", async () => {
    mocks.fetch.mockResolvedValue(new Response(new Uint8Array([1]), {
      headers: { "content-length": String(101 * 1024 * 1024), "content-type": "image/png" },
    }));

    await expect(copyRemoteAsset("https://assets.atlas.example/file.png", "ai/project/output/0")).rejects.toThrow("Provider asset rejected");
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("rejects provider assets whose streamed body exceeds the limit", async () => {
    mocks.fetch.mockResolvedValue(new Response(new ReadableStream({
      start(controller) {
        for (let index = 0; index < 101; index += 1) controller.enqueue(new Uint8Array(1024 * 1024));
        controller.close();
      },
    }), { headers: { "content-type": "image/png" } }));
    mocks.upload.mockImplementation(async (_key, body) => {
      for await (const _chunk of body) {
        void _chunk;
      }
      return { error: null };
    });

    await expect(copyRemoteAsset("https://assets.atlas.example/file.png", "ai/project/output/0")).rejects.toThrow("Provider asset is too large");
  });

  it("maps Supabase remote-copy upload failures to a safe error", async () => {
    mocks.fetch.mockResolvedValue(new Response(new Uint8Array([1]), { headers: { "content-type": "image/png" } }));
    mocks.upload.mockResolvedValue({ error: new Error("internal storage detail") });

    await expect(copyRemoteAsset("https://assets.atlas.example/file.png", "ai/project/output/0")).rejects.toThrow("Could not store asset");
  });

  it("maps provider network failures to a safe error", async () => {
    mocks.fetch.mockRejectedValue(new Error("upstream DNS failure"));

    await expect(copyRemoteAsset("https://assets.atlas.example/file.png", "ai/project/output/0")).rejects.toThrow("Could not copy provider asset");
  });

  it("rejects failed signed URL creation", async () => {
    mocks.createSignedUrl.mockResolvedValue({ data: null, error: new Error("storage error") });

    await expect(createSignedAssetUrl("ai/project/output/0")).rejects.toThrow("Could not sign asset");
  });
});
