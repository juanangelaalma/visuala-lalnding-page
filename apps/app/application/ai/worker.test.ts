import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  createSignedAssetUrls: vi.fn(),
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/ai/providers", () => ({
  AtlasImageAdapter: class { generate = mocks.generate },
  AtlasVideoAdapter: class {},
  AtlasOperationError: class extends Error {},
}));
vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: mocks.createSignedAssetUrls }));
vi.mock("@/infrastructure/supabase/service-role-client", () => ({ createSupabaseServiceRoleClient: mocks.createSupabaseServiceRoleClient }));

import { runAiWorker } from "./worker";

function query(data: unknown[] = []) {
  const result = Promise.resolve({ error: null, data });
  return Object.assign(result, { eq: vi.fn(), in: vi.fn(), limit: vi.fn(), update: vi.fn() });
}

describe("AI worker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("signs private input paths before submitting image generation", async () => {
    const work = { id: "generation", project_id: "project", type: "image", logical_model_key: "image_fast", provider_generation_id: null, prompt: "prompt", negative_prompt: null, input_assets: ["ai/user/references/file.png"], requested_duration_seconds: null, resolution: null };
    const emptyQuery = query();
    for (const method of ["eq", "in", "limit", "update"] as const) emptyQuery[method].mockReturnValue(emptyQuery);
    mocks.createSupabaseServiceRoleClient.mockReturnValue({
      rpc: vi.fn().mockResolvedValueOnce({ error: null, data: [work] }),
      from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue(emptyQuery), update: vi.fn().mockReturnValue(emptyQuery) }),
    });
    mocks.createSignedAssetUrls.mockResolvedValue(["https://signed.example/file.png"]);
    mocks.generate.mockResolvedValue({ externalId: "atlas-generation", status: "processing", raw: {} });

    await runAiWorker();

    expect(mocks.createSignedAssetUrls).toHaveBeenCalledWith(["ai/user/references/file.png"]);
    expect(mocks.generate).toHaveBeenCalledWith(expect.objectContaining({ references: ["https://signed.example/file.png"] }));
  });
});
