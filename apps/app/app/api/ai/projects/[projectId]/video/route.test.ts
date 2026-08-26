import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), queueProjectVideo: vi.fn(), createAiServices: vi.fn() }));
vi.mock("@/infrastructure/ai/services", () => ({ createAiServices: mocks.createAiServices }));
vi.mock("../../../_shared", () => ({ authenticated: mocks.authenticated, failure: vi.fn() }));
import { POST } from "./route";

describe("project video route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockResolvedValue({ id: "user" });
    mocks.createAiServices.mockReturnValue({ queueProjectVideo: mocks.queueProjectVideo });
  });

  it("serializes project video queue result", async () => {
    mocks.queueProjectVideo.mockResolvedValue({ status: 202, generations: [{ id: "generation", sceneId: "scene", type: "video", status: "queued", assets: [], errorCode: null, createdAt: "2026-08-13T00:00:00.000Z", completedAt: null }], batch: { complete: true }, composition: { status: "waiting_for_composer", processed: false } });

    const response = await POST(new Request("https://visuala.test/api/ai/projects/project/video", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idempotencyKey: "request-1", maxEstimatedCostUsd: 10 }) }), { params: Promise.resolve({ projectId: "project" }) });

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toMatchObject({ generations: [{ id: "generation", assets: [] }], batch: { complete: true } });
    expect(mocks.queueProjectVideo).toHaveBeenCalledWith(expect.objectContaining({ ownerId: "user", projectId: "project" }));
  });
});
