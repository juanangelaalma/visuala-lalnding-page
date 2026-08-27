import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/supabase/service-role-client", () => ({
  createSupabaseServiceRoleClient: mocks.createSupabaseServiceRoleClient,
}));

import { createAiServices } from "./services";

describe("createAiServices", () => {
  it("composes AI use cases with concrete adapters", () => {
    mocks.createSupabaseServiceRoleClient.mockReturnValue({});

    expect(createAiServices()).toEqual({
      analyzeProduct: expect.any(Function),
      approveSceneImage: expect.any(Function),
      createStoryboard: expect.any(Function),
      deleteScene: expect.any(Function),
      getProjectStatus: expect.any(Function),
      queueProjectVideo: expect.any(Function),
      queueSceneImage: expect.any(Function),
      runAiWorker: expect.any(Function),
      updateScene: expect.any(Function),
      uploadReferenceAssets: expect.any(Function),
    });
  });
});
