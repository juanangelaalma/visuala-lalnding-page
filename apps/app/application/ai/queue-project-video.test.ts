import { describe, expect, it, vi } from "vitest";
import type { AiGeneration, AiProject, AiScene } from "@/domain/ai/types";
import { queueProjectVideo } from "./queue-project-video";

const project: AiProject = {
  id: "project-id", userId: "user-id", product: { name: "Coffee", description: "Dark", category: "Drink", audience: "Fans", sellingPoint: "Flavor", offer: "", cta: "Buy", keyMessage: "Fresh", concept: "Morning" }, creator: "Creator", durationSeconds: 12, quality: "standard", referenceAssets: [], status: "storyboard_ready", idempotencyKey: "project-key", createdAt: "2026-08-26T00:00:00.000Z", updatedAt: "2026-08-26T00:00:00.000Z",
};
const scene: AiScene = { id: "scene-id", projectId: project.id, position: 0, title: "Hook", sceneType: "hook_light_motion", motionComplexity: "low", imagePrompt: "Coffee", videoPrompt: "Coffee video", negativePrompt: "Text", dialogue: "Try", duration: 4, approvedImageGenerationId: "image-id", createdAt: "2026-08-26T00:00:00.000Z" };
const image: AiGeneration = { id: "image-id", projectId: project.id, sceneId: scene.id, parentGenerationId: null, type: "image", logicalModelKey: "image_storyboard_economy", provider: "atlas", providerModelId: "model", status: "succeeded", attemptNumber: 1, prompt: scene.imagePrompt, negativePrompt: scene.negativePrompt, inputAssets: [], outputAssets: ["ai/project/image/0"], estimatedCostUsd: 0.01, creditsCharged: 1, idempotencyKey: "image-key", errorCode: null, errorMessage: null, createdAt: "2026-08-26T00:00:00.000Z", completedAt: null };
const video: AiGeneration = { ...image, id: "video-id", type: "video", logicalModelKey: "video_i2v_economy", status: "awaiting_credit", idempotencyKey: "request-key:scene-id" };

function dependencies() {
  return {
    projects: { findOwnedById: vi.fn().mockResolvedValue(project), findOwnedByIdempotencyKey: vi.fn(), create: vi.fn(), updateStatus: vi.fn() },
    scenes: { findOwnedById: vi.fn(), listByProjectId: vi.fn().mockResolvedValue([scene]), createMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    generations: { findByProjectIdempotencyKey: vi.fn().mockResolvedValue(null), findById: vi.fn(), findLatestBySceneIdAndTypes: vi.fn().mockResolvedValue(null), hasGenerationHistoryForScene: vi.fn(), listByProjectId: vi.fn().mockResolvedValue([image]), create: vi.fn().mockResolvedValue(video), updateStatus: vi.fn(), reserveCredits: vi.fn().mockRejectedValue(new Error("INSUFFICIENT_CREDITS")) },
    assets: { upload: vi.fn(), signAssets: vi.fn() },
  };
}

describe("queueProjectVideo", () => {
  it("returns insufficient credits when reservation fails", async () => {
    vi.stubEnv("ATLAS_VIDEO_MODELS_JSON", JSON.stringify({
      video_i2v_economy: { modelId: "economy", estimatedCostUsdPerSecond: 0.01, fields: { prompt: "prompt", image: "image" }, capabilities: { duration: true, resolution: true, aspectRatio: false, audio: false } },
      video_i2v_default: { modelId: "default", estimatedCostUsdPerSecond: 0.01, fields: { prompt: "prompt", image: "image" }, capabilities: { duration: true, resolution: true, aspectRatio: false, audio: false } },
      video_i2v_complex: { modelId: "complex", estimatedCostUsdPerSecond: 0.01, fields: { prompt: "prompt", image: "image" }, capabilities: { duration: true, resolution: true, aspectRatio: false, audio: false } },
      video_talking_head: { modelId: "talking", estimatedCostUsdPerSecond: 0.01, fields: { prompt: "prompt", image: "image" }, capabilities: { duration: true, resolution: true, aspectRatio: false, audio: false } },
      video_i2v_premium: { modelId: "premium", estimatedCostUsdPerSecond: 0.01, fields: { prompt: "prompt", image: "image" }, capabilities: { duration: true, resolution: true, aspectRatio: false, audio: false } },
    }));
    const deps = dependencies();

    await expect(queueProjectVideo({ ownerId: "user-id", projectId: project.id, idempotencyKey: "request-key", maxEstimatedCostUsd: 5 }, deps)).rejects.toMatchObject({ status: 402, code: "INSUFFICIENT_CREDITS" });
  });

  it("rejects an unowned project before loading scenes", async () => {
    const deps = dependencies();
    deps.projects.findOwnedById.mockResolvedValue(null);

    await expect(queueProjectVideo({ ownerId: "user-id", projectId: project.id, idempotencyKey: "request-key", maxEstimatedCostUsd: 5 }, deps)).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(deps.scenes.listByProjectId).not.toHaveBeenCalled();
  });

  it("retries credits for an awaiting-credit idempotent video", async () => {
    const deps = dependencies();
    deps.generations.findByProjectIdempotencyKey.mockResolvedValue({ ...video, status: "awaiting_credit" });
    deps.generations.reserveCredits.mockResolvedValue(undefined);

    await expect(queueProjectVideo({ ownerId: "user-id", projectId: project.id, idempotencyKey: "request-key", maxEstimatedCostUsd: 5 }, deps)).resolves.toMatchObject({ generations: [{ status: "queued" }] });
    expect(deps.generations.reserveCredits).toHaveBeenCalledWith({ generationId: "video-id", projectId: "project-id", userId: "user-id", amount: 10 });
  });

  it("signs private assets for a succeeded idempotent video", async () => {
    const deps = dependencies();
    deps.generations.findByProjectIdempotencyKey.mockResolvedValue({ ...video, status: "succeeded", outputAssets: ["ai/project/video/0"] });
    deps.assets.signAssets.mockResolvedValue(["https://signed.example/video"]);

    await expect(queueProjectVideo({ ownerId: "user-id", projectId: project.id, idempotencyKey: "request-key", maxEstimatedCostUsd: 5 }, deps)).resolves.toMatchObject({ generations: [{ assets: ["https://signed.example/video"] }] });
  });

  it("rejects a video request below the scene estimate", async () => {
    const deps = dependencies();
    deps.generations.reserveCredits.mockResolvedValue(undefined);

    await expect(queueProjectVideo({ ownerId: "user-id", projectId: project.id, idempotencyKey: "request-key", maxEstimatedCostUsd: 0.01 }, deps)).rejects.toMatchObject({ status: 422, code: "COST_LIMIT_EXCEEDED" });
    expect(deps.generations.create).not.toHaveBeenCalled();
  });

  it("reuses a raced video generation and retries its credits", async () => {
    const deps = dependencies();
    deps.generations.findByProjectIdempotencyKey.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...video, status: "awaiting_credit" });
    deps.generations.create.mockRejectedValue(new Error("unique conflict"));
    deps.generations.reserveCredits.mockResolvedValue(undefined);

    await expect(queueProjectVideo({ ownerId: "user-id", projectId: project.id, idempotencyKey: "request-key", maxEstimatedCostUsd: 5 }, deps)).resolves.toMatchObject({ generations: [{ status: "queued" }] });
    expect(deps.generations.reserveCredits).toHaveBeenCalledTimes(1);
  });
});
