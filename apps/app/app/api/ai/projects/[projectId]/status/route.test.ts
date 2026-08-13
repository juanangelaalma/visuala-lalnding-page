import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), createSignedAssetUrls: vi.fn(), createSupabaseServiceRoleClient: vi.fn() }));

vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: mocks.createSignedAssetUrls }));
vi.mock("@/infrastructure/supabase/service-role-client", () => ({ createSupabaseServiceRoleClient: mocks.createSupabaseServiceRoleClient }));
vi.mock("../../../_shared", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../_shared")>()), authenticated: mocks.authenticated }));

import { GET } from "./route";

function query(data: unknown, error: unknown = null) {
  const result = Promise.resolve({ data, error });
  return Object.assign(result, { eq: vi.fn(), single: vi.fn(), order: vi.fn() });
}

describe("project status route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockResolvedValue({ id: "user" });
    mocks.createSignedAssetUrls.mockResolvedValue(["https://signed.example/output"]);
  });

  it("returns signed assets only after the owner project query succeeds", async () => {
    const project = query({ id: "project", status: "complete", duration_seconds: 12, quality: "standard", created_at: "2026-08-13T00:00:00.000Z", updated_at: "2026-08-13T00:01:00.000Z" });
    project.eq.mockReturnValue(project); project.single.mockReturnValue(project);
    const scenes = query([]); scenes.eq.mockReturnValue(scenes); scenes.order.mockReturnValue(scenes);
    const generations = query([{ id: "generation", scene_id: "scene", type: "image", status: "succeeded", output_assets: ["ai/project/generation/0"], error_code: null, created_at: "2026-08-13T00:00:00.000Z", completed_at: null }]); generations.eq.mockReturnValue(generations); generations.order.mockReturnValue(generations);
    mocks.createSupabaseServiceRoleClient.mockReturnValue({ from: vi.fn().mockReturnValueOnce({ select: vi.fn().mockReturnValue(project) }).mockReturnValueOnce({ select: vi.fn().mockReturnValue(scenes) }).mockReturnValueOnce({ select: vi.fn().mockReturnValue(generations) }) });

    const response = await GET(new Request("https://visuala.test/api/ai/projects/project/status"), { params: Promise.resolve({ projectId: "project" }) });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ generations: [{ assets: ["https://signed.example/output"] }] });
    expect(JSON.stringify(body)).not.toContain("ai/project/generation/0");
  });

  it("does not sign assets when the project does not belong to the user", async () => {
    const project = query(null, new Error("not found")); project.eq.mockReturnValue(project); project.single.mockReturnValue(project);
    mocks.createSupabaseServiceRoleClient.mockReturnValue({ from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue(project) }) });

    const response = await GET(new Request("https://visuala.test/api/ai/projects/project/status"), { params: Promise.resolve({ projectId: "project" }) });

    expect(response.status).toBe(404);
    expect(mocks.createSignedAssetUrls).not.toHaveBeenCalled();
  });
});
