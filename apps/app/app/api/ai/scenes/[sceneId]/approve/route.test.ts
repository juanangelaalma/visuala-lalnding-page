import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticated: vi.fn(),
  approveSceneImage: vi.fn(),
  createAiServices: vi.fn(),
}));

vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: vi.fn() }));
vi.mock("@/infrastructure/ai/services", () => ({ createAiServices: mocks.createAiServices }));
vi.mock("../../../_shared", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../_shared")>()),
  authenticated: mocks.authenticated,
}));

import { ApiError } from "../../../_shared";
import { POST } from "./route";

const context = { params: Promise.resolve({ sceneId: "scene" }) };

describe("approve scene image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockRejectedValue(new ApiError(401, "AUTH_REQUIRED", "Authentication required"));
    mocks.createAiServices.mockReturnValue({ approveSceneImage: mocks.approveSceneImage });
  });

  it("returns 401 when request has no user", async () => {
    const response = await POST(new Request("https://visuala.test/api/ai/scenes/scene/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ generationId: "a40f9bd9-7da7-4b8c-a2ce-2e2b6ea60fa9" }),
    }), context);

    expect(response.status).toBe(401);
  });
});
