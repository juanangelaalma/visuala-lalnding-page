import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), getProjectStatus: vi.fn(), createAiServices: vi.fn() }));

vi.mock("@/infrastructure/ai/services", () => ({ createAiServices: mocks.createAiServices }));
vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: vi.fn() }));
vi.mock("../../../_shared", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../_shared")>()), authenticated: mocks.authenticated }));

import { GET } from "./route";

describe("project status route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockResolvedValue({ id: "user" });
    mocks.createAiServices.mockReturnValue({ getProjectStatus: mocks.getProjectStatus });
  });

  it("returns status DTO from owner-scoped service", async () => {
    mocks.getProjectStatus.mockResolvedValue({ project: { id: "project" }, scenes: [], generations: [], finalComposition: { status: "waiting_for_composer", processed: false } });

    const response = await GET(new Request("https://visuala.test/api/ai/projects/project/status"), { params: Promise.resolve({ projectId: "project" }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ project: { id: "project" } });
    expect(mocks.getProjectStatus).toHaveBeenCalledWith({ ownerId: "user", projectId: "project" });
  });
});
