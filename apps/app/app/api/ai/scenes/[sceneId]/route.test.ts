import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn() }));

vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: vi.fn() }));
vi.mock("@/infrastructure/supabase/service-role-client", () => ({ createSupabaseServiceRoleClient: vi.fn() }));
vi.mock("../../_shared", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../_shared")>()),
  authenticated: mocks.authenticated,
}));

import { ApiError } from "../../_shared";
import { DELETE, PATCH } from "./route";

const context = { params: Promise.resolve({ sceneId: "scene" }) };

describe("scene route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockRejectedValue(new ApiError(401, "AUTH_REQUIRED", "Authentication required"));
  });

  it("returns 401 when PATCH request has no user", async () => {
    const response = await PATCH(new Request("https://visuala.test/api/ai/scenes/scene", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    }), context);

    expect(response.status).toBe(401);
  });

  it("returns 401 when DELETE request has no user", async () => {
    const response = await DELETE(new Request("https://visuala.test/api/ai/scenes/scene", { method: "DELETE" }), context);

    expect(response.status).toBe(401);
  });
});
