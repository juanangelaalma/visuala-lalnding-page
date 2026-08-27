import { describe, expect, it, vi } from "vitest";
import { generationDto } from "./generation-dto";
import { getProjectStatus } from "./get-project-status";

describe("getProjectStatus", () => {
  it("keeps queued generation assets empty", async () => {
    const signAssets = vi.fn();

    await expect(generationDto({ id: "generation-id", projectId: "project-id", sceneId: "scene-id", parentGenerationId: null, type: "image", logicalModelKey: "image_fast", provider: "atlas", providerModelId: "model", status: "queued", attemptNumber: 1, prompt: null, negativePrompt: null, inputAssets: [], outputAssets: ["ai/project/generation/0"], estimatedCostUsd: null, actualCostUsd: null, creditsCharged: 0, errorCode: null, errorMessage: null, idempotencyKey: "key", createdAt: "2026-08-13T00:00:00.000Z", completedAt: null }, { signAssets })).resolves.toEqual({ id: "generation-id", sceneId: "scene-id", type: "image", status: "queued", assets: [], errorCode: null, createdAt: "2026-08-13T00:00:00.000Z", completedAt: null });
    expect(signAssets).not.toHaveBeenCalled();
  });

  it("does not sign output assets until owned project exists", async () => {
    const signAssets = vi.fn();
    const deps = {
      projects: { findOwnedById: vi.fn().mockResolvedValue(null), findOwnedByIdempotencyKey: vi.fn(), create: vi.fn(), updateStatus: vi.fn() },
      scenes: { listByProjectId: vi.fn(), createMany: vi.fn(), findOwnedById: vi.fn(), update: vi.fn(), delete: vi.fn() },
      generations: { listByProjectId: vi.fn(), findByProjectIdempotencyKey: vi.fn(), findById: vi.fn(), hasGenerationHistoryForScene: vi.fn(), create: vi.fn(), updateStatus: vi.fn() },
      assets: { upload: vi.fn(), signAssets },
    };

    await expect(getProjectStatus({ ownerId: "user-id", projectId: "project-id" }, deps)).rejects.toMatchObject({ status: 404 });

    expect(signAssets).not.toHaveBeenCalled();
  });
});
