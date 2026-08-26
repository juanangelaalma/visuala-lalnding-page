import { describe, expect, it, vi } from "vitest";
import type { AiGeneration, AiProject, AiScene } from "@/domain/ai/types";
import { queueSceneImage } from "./queue-scene-image";

const project: AiProject = {
  id: "project-id", userId: "user-id", product: { name: "Coffee", description: "Dark", category: "Drink", audience: "Fans", sellingPoint: "Flavor", offer: "", cta: "Buy", keyMessage: "Fresh", concept: "Morning" }, creator: "Creator", durationSeconds: 12, quality: "standard", referenceAssets: [], status: "storyboard_ready", idempotencyKey: "project-key", createdAt: "2026-08-26T00:00:00.000Z", updatedAt: "2026-08-26T00:00:00.000Z",
};
const scene: AiScene = { id: "scene-id", projectId: project.id, position: 0, title: "Hook", sceneType: "hook_light_motion", motionComplexity: "low", imagePrompt: "Coffee", videoPrompt: "Coffee video", negativePrompt: "Text", dialogue: "Try", duration: 4, approvedImageGenerationId: null, createdAt: "2026-08-26T00:00:00.000Z" };
const generation: AiGeneration = { id: "generation-id", projectId: project.id, sceneId: scene.id, parentGenerationId: null, type: "image", logicalModelKey: "image_storyboard_economy", provider: "atlas", providerModelId: "model", status: "queued", attemptNumber: 1, prompt: scene.imagePrompt, negativePrompt: scene.negativePrompt, inputAssets: [], outputAssets: [], estimatedCostUsd: 0.01, creditsCharged: 0, idempotencyKey: "request-key", errorCode: null, errorMessage: null, createdAt: "2026-08-26T00:00:00.000Z", completedAt: null };

function dependencies() {
  return {
    projects: { findOwnedById: vi.fn().mockResolvedValue(project), findOwnedByIdempotencyKey: vi.fn(), create: vi.fn(), updateStatus: vi.fn() },
    scenes: { findOwnedById: vi.fn().mockResolvedValue(scene), listByProjectId: vi.fn(), createMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    generations: { findByProjectIdempotencyKey: vi.fn().mockResolvedValue(generation), findById: vi.fn(), findLatestBySceneIdAndTypes: vi.fn(), hasGenerationHistoryForScene: vi.fn(), listByProjectId: vi.fn(), create: vi.fn(), updateStatus: vi.fn(), reserveCredits: vi.fn() },
    assets: { upload: vi.fn(), signAssets: vi.fn() },
  };
}

describe("queueSceneImage", () => {
  it("reuses existing image generation for idempotency key", async () => {
    const deps = dependencies();

    await expect(queueSceneImage({ ownerId: "user-id", sceneId: scene.id, idempotencyKey: "request-key", references: [], maxEstimatedCostUsd: 0.1 }, deps)).resolves.toMatchObject({ status: 200, generation: { id: "generation-id", assets: [] } });
    expect(deps.generations.create).not.toHaveBeenCalled();
  });

  it("retries credits for an awaiting-credit idempotent generation", async () => {
    const deps = dependencies();
    deps.generations.findByProjectIdempotencyKey.mockResolvedValue({ ...generation, status: "awaiting_credit" });

    await expect(queueSceneImage({ ownerId: "user-id", sceneId: scene.id, idempotencyKey: "request-key", references: [], maxEstimatedCostUsd: 0.1 }, deps)).resolves.toMatchObject({ status: 200, generation: { status: "queued" } });
    expect(deps.generations.reserveCredits).toHaveBeenCalledWith({ generationId: "generation-id", projectId: "project-id", userId: "user-id", amount: 1 });
  });

  it("rejects unowned reference paths before creating an image generation", async () => {
    const deps = dependencies();
    deps.generations.findByProjectIdempotencyKey.mockResolvedValue(null);

    await expect(queueSceneImage({ ownerId: "user-id", sceneId: scene.id, idempotencyKey: "request-key", references: ["ai/other-user/references/file.png"], maxEstimatedCostUsd: 0.1 }, deps)).rejects.toMatchObject({ status: 403, code: "REFERENCE_ASSET_FORBIDDEN" });
    expect(deps.generations.create).not.toHaveBeenCalled();
  });

  it("rejects image requests below the model estimate", async () => {
    const deps = dependencies();
    deps.generations.findByProjectIdempotencyKey.mockResolvedValue(null);

    await expect(queueSceneImage({ ownerId: "user-id", sceneId: scene.id, idempotencyKey: "request-key", references: [], maxEstimatedCostUsd: 0.01 }, deps)).rejects.toMatchObject({ status: 422, code: "COST_LIMIT_EXCEEDED" });
    expect(deps.generations.create).not.toHaveBeenCalled();
  });

  it("signs private assets for a succeeded idempotent generation", async () => {
    const deps = dependencies();
    deps.generations.findByProjectIdempotencyKey.mockResolvedValue({ ...generation, status: "succeeded", outputAssets: ["ai/project/generation/0"] });
    deps.assets.signAssets.mockResolvedValue(["https://signed.example/output"]);

    await expect(queueSceneImage({ ownerId: "user-id", sceneId: scene.id, idempotencyKey: "request-key", references: [], maxEstimatedCostUsd: 0.1 }, deps)).resolves.toMatchObject({ generation: { assets: ["https://signed.example/output"] } });
  });

  it("reuses a raced image generation and retries its credits", async () => {
    const deps = dependencies();
    deps.generations.findByProjectIdempotencyKey.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...generation, status: "awaiting_credit" });
    deps.generations.create.mockRejectedValue(new Error("unique conflict"));

    await expect(queueSceneImage({ ownerId: "user-id", sceneId: scene.id, idempotencyKey: "request-key", references: [], maxEstimatedCostUsd: 0.1 }, deps)).resolves.toMatchObject({ status: 200, generation: { status: "queued" } });
    expect(deps.generations.reserveCredits).toHaveBeenCalledTimes(1);
  });
});
