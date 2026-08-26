import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn() }));

vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: vi.fn() }));
vi.mock("@/infrastructure/supabase/service-role-client", () => ({ createSupabaseServiceRoleClient: vi.fn() }));
vi.mock("../../../_shared", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../_shared")>()),
  authenticated: mocks.authenticated,
}));

import { ApiError } from "../../../_shared";
import { POST } from "./route";

describe("approve scene image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockRejectedValue(new ApiError(401, "AUTH_REQUIRED", "Authentication required"));
  });

  it("returns 401 when request has no user", async () => {
    const response = await POST(new Request("https://visuala.test/api/ai/scenes/scene/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ generationId: "00000000-0000-4000-8000-000000000000" }),
    }), { params: Promise.resolve({ sceneId: "scene" }) });

    expect(response.status).toBe(401);
  });
});
