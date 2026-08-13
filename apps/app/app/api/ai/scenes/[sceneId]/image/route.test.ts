import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), createSignedAssetUrls: vi.fn(), createSupabaseServiceRoleClient: vi.fn(), insert: vi.fn() }));

vi.mock("@/infrastructure/supabase/service-role-client", () => ({ createSupabaseServiceRoleClient: mocks.createSupabaseServiceRoleClient }));
vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: mocks.createSignedAssetUrls }));
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
    mocks.createSignedAssetUrls.mockResolvedValue(["https://signed.example/output"]);
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

  it("returns a signed URL instead of a private asset path for an owned existing generation", async () => {
    const scene = result({ id: "scene", project_id: "project", image_prompt: "prompt", negative_prompt: "" });
    scene.eq.mockReturnValue(scene); scene.single.mockReturnValue(scene);
    const project = result({ id: "project", reference_assets: [] });
    project.eq.mockReturnValue(project); project.single.mockReturnValue(project);
    const existing = result({ id: "generation", scene_id: "scene", type: "image", status: "succeeded", output_assets: ["ai/project/generation/0"], error_code: null, created_at: "2026-08-13T00:00:00.000Z", completed_at: "2026-08-13T00:01:00.000Z" });
    existing.eq.mockReturnValue(existing); existing.maybeSingle.mockReturnValue(existing);
    mocks.createSupabaseServiceRoleClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(scene) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(project) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(existing) }),
    });

    const response = await POST(new Request("https://visuala.test/api/ai/scenes/scene/image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idempotencyKey: "request-1", references: [] }),
    }), { params: Promise.resolve({ sceneId: "scene" }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ generation: { assets: ["https://signed.example/output"] } });
    expect(JSON.stringify(body)).not.toContain("ai/project/generation/0");
    expect(mocks.createSignedAssetUrls).toHaveBeenCalledWith(["ai/project/generation/0"]);
  });

  it("does not sign assets when the scene's project does not belong to the user", async () => {
    const scene = result({ id: "scene", project_id: "project", image_prompt: "prompt", negative_prompt: "" });
    scene.eq.mockReturnValue(scene); scene.single.mockReturnValue(scene);
    const project = result(null, new Error("not found"));
    project.eq.mockReturnValue(project); project.single.mockReturnValue(project);
    mocks.createSupabaseServiceRoleClient.mockReturnValue({
      from: vi.fn()
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(scene) })
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(project) }),
    });

    const response = await POST(new Request("https://visuala.test/api/ai/scenes/scene/image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idempotencyKey: "request-1", references: [] }),
    }), { params: Promise.resolve({ sceneId: "scene" }) });

    expect(response.status).toBe(404);
    expect(mocks.createSignedAssetUrls).not.toHaveBeenCalled();
  });
});
