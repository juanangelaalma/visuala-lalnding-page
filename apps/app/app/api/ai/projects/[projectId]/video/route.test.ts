import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), createSignedAssetUrls: vi.fn(), createSupabaseServiceRoleClient: vi.fn() }));

vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: mocks.createSignedAssetUrls }));
vi.mock("@/infrastructure/supabase/service-role-client", () => ({ createSupabaseServiceRoleClient: mocks.createSupabaseServiceRoleClient }));
vi.mock("../../../_shared", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../_shared")>()), authenticated: mocks.authenticated }));

import { POST } from "./route";

function query(data: unknown, error: unknown = null) {
  const result = Promise.resolve({ data, error });
  return Object.assign(result, { eq: vi.fn(), in: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(), order: vi.fn() });
}

describe("project video route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockResolvedValue({ id: "user" });
    mocks.createSignedAssetUrls.mockResolvedValue(["https://signed.example/output"]);
  });

  it("returns signed URLs for an owned project's existing video generation", async () => {
    const project = query({ id: "project", quality: "standard" }); project.eq.mockReturnValue(project); project.single.mockReturnValue(project);
    const scenes = query([{ id: "scene", scene_type: "product", motion_complexity: "low", video_prompt: "prompt", duration_seconds: 5, approved_image_generation_id: "image" }]); scenes.eq.mockReturnValue(scenes); scenes.order.mockReturnValue(scenes);
    const images = query([{ id: "image", output_assets: ["ai/project/image/0"], status: "succeeded" }]); images.in.mockReturnValue(images); images.eq.mockReturnValue(images);
    const existing = query({ id: "generation", scene_id: "scene", type: "video", status: "succeeded", output_assets: ["ai/project/generation/0"], error_code: null, created_at: "2026-08-13T00:00:00.000Z", completed_at: null }); existing.eq.mockReturnValue(existing); existing.maybeSingle.mockReturnValue(existing);
    const update = query(null); update.eq.mockReturnValue(update);
    mocks.createSupabaseServiceRoleClient.mockReturnValue({ from: vi.fn().mockReturnValueOnce({ select: vi.fn().mockReturnValue(project) }).mockReturnValueOnce({ select: vi.fn().mockReturnValue(scenes) }).mockReturnValueOnce({ select: vi.fn().mockReturnValue(images) }).mockReturnValueOnce({ select: vi.fn().mockReturnValue(existing) }).mockReturnValueOnce({ update: vi.fn().mockReturnValue(update) }) });

    const response = await POST(new Request("https://visuala.test/api/ai/projects/project/video", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: "request-1", maxEstimatedCostUsd: 10 }) }), { params: Promise.resolve({ projectId: "project" }) });

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body).toMatchObject({ generations: [{ assets: ["https://signed.example/output"] }] });
    expect(JSON.stringify(body)).not.toContain("ai/project/generation/0");
  });

  it("does not sign assets when the project does not belong to the user", async () => {
    const project = query(null, new Error("not found")); project.eq.mockReturnValue(project); project.single.mockReturnValue(project);
    mocks.createSupabaseServiceRoleClient.mockReturnValue({ from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue(project) }) });

    const response = await POST(new Request("https://visuala.test/api/ai/projects/project/video", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: "request-1", maxEstimatedCostUsd: 10 }) }), { params: Promise.resolve({ projectId: "project" }) });

    expect(response.status).toBe(404);
    expect(mocks.createSignedAssetUrls).not.toHaveBeenCalled();
  });
});
