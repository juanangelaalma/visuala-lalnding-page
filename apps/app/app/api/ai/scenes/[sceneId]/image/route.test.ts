import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), queueSceneImage: vi.fn(), createAiServices: vi.fn() }));
vi.mock("@/infrastructure/ai/services", () => ({ createAiServices: mocks.createAiServices }));
vi.mock("../../../_shared", () => ({ authenticated: mocks.authenticated, failure: vi.fn() }));
import { POST } from "./route";

describe("scene image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000000" });
    mocks.createAiServices.mockReturnValue({ queueSceneImage: mocks.queueSceneImage });
  });

  it("serializes queued image generation from the queue workflow", async () => {
    mocks.queueSceneImage.mockResolvedValue({ status: 202, generation: { id: "generation", sceneId: "scene", type: "image", status: "queued", assets: [], errorCode: null, createdAt: "2026-08-13T00:00:00.000Z", completedAt: null } });

    const response = await POST(new Request("https://visuala.test/api/ai/scenes/scene/image", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: "request-1", references: [] }) }), { params: Promise.resolve({ sceneId: "scene" }) });

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({ generation: { id: "generation", assets: [] } });
    expect(mocks.queueSceneImage).toHaveBeenCalledWith(expect.objectContaining({ ownerId: "00000000-0000-4000-8000-000000000000", sceneId: "scene" }));
  });
});
