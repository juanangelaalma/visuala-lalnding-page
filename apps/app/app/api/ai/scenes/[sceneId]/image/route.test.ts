import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), createSupabaseServiceRoleClient: vi.fn(), insert: vi.fn() }));

vi.mock("@/infrastructure/supabase/service-role-client", () => ({ createSupabaseServiceRoleClient: mocks.createSupabaseServiceRoleClient }));
vi.mock("../../../_shared", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../_shared")>()),
  authenticated: mocks.authenticated,
}));

import { POST } from "./route";

function result(data: unknown, error: unknown = null) {
  const query = Promise.resolve({ data, error });
  return Object.assign(query, { eq: vi.fn(), maybeSingle: vi.fn(), single: vi.fn(), order: vi.fn(), limit: vi.fn() });
}

describe("scene image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000000" });
    const scene = result({ id: "scene", project_id: "project", image_prompt: "prompt", negative_prompt: "" });
    scene.eq.mockReturnValue(scene); scene.single.mockReturnValue(scene);
    const project = result({ id: "project", reference_assets: [] });
    project.eq.mockReturnValue(project); project.single.mockReturnValue(project);
    const existing = result(null);
    existing.eq.mockReturnValue(existing); existing.maybeSingle.mockReturnValue(existing);
    const previous = result(null);
    previous.eq.mockReturnValue(previous); previous.order.mockReturnValue(previous); previous.limit.mockReturnValue(previous); previous.maybeSingle.mockReturnValue(previous);
    mocks.createSupabaseServiceRoleClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(scene) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(project) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(existing) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(previous) })
        .mockReturnValue({ insert: mocks.insert }),
    });
  });

  it("rejects another user's reference path before persisting a generation", async () => {
    const response = await POST(new Request("https://visuala.test/api/ai/scenes/scene/image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idempotencyKey: "request-1", references: ["ai/11111111-1111-4111-8111-111111111111/references/file.png"] }),
    }), { params: Promise.resolve({ sceneId: "scene" }) });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: { code: "REFERENCE_ASSET_FORBIDDEN", message: "Reference assets must belong to the authenticated user" } });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
