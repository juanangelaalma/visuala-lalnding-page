import { describe, expect, it, vi } from "vitest";
import type { AiGeneration, AiProject, AiScene, Product } from "@/domain/ai/types";
import { createStoryboard } from "./create-storyboard";

const product: Product = {
  name: "Coffee",
  description: "Dark roast",
  category: "Drink",
  audience: "Coffee fans",
  sellingPoint: "Rich flavor",
  offer: "",
  cta: "Buy now",
  keyMessage: "Fresh coffee",
  concept: "Morning routine",
};

const project: AiProject = {
  id: "project-id",
  userId: "user-id",
  product,
  creator: "Creator",
  durationSeconds: 12,
  quality: "standard",
  referenceAssets: [],
  status: "storyboard_processing",
  idempotencyKey: "idempotency-key",
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
};

const generation: AiGeneration = {
  id: "generation-id",
  projectId: project.id,
  sceneId: null,
  parentGenerationId: null,
  type: "text",
  logicalModelKey: "text_brain_default",
  provider: "gemini",
  providerModelId: "gemini-2.5-flash",
  status: "processing",
  attemptNumber: 1,
  prompt: null,
  negativePrompt: null,
  inputAssets: [],
  outputAssets: [],
  estimatedCostUsd: null,
  creditsCharged: 0,
  idempotencyKey: "idempotency-key:text",
  errorCode: null,
  errorMessage: null,
  createdAt: "2026-08-26T00:00:00.000Z",
  completedAt: null,
};

const scene = (position: number): AiScene => ({
  id: `scene-${position}`,
  projectId: project.id,
  position,
  title: "Hook",
  sceneType: "hook_light_motion",
  motionComplexity: "low",
  imagePrompt: "Coffee",
  videoPrompt: "Coffee video",
  negativePrompt: "text",
  dialogue: "Try this",
  duration: 4,
  approvedImageGenerationId: null,
  createdAt: "2026-08-26T00:00:00.000Z",
});

const input = { ownerId: "user-id", idempotencyKey: "idempotency-key", product, creator: "Creator", duration: 12 as const, quality: "standard" as const, referenceAssets: [] };

function dependencies() {
  return {
    projects: { findOwnedById: vi.fn(), findOwnedByIdempotencyKey: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue(project), updateStatus: vi.fn().mockResolvedValue(undefined) },
    scenes: { listByProjectId: vi.fn(), createMany: vi.fn().mockResolvedValue([scene(0), scene(1), scene(2)]), findOwnedById: vi.fn(), update: vi.fn(), delete: vi.fn() },
    generations: { create: vi.fn().mockResolvedValue(generation), updateStatus: vi.fn().mockResolvedValue(undefined), findByProjectIdempotencyKey: vi.fn(), findById: vi.fn(), hasGenerationHistoryForScene: vi.fn(), listByProjectId: vi.fn() },
    textProvider: { generateStructured: vi.fn().mockRejectedValue(new Error("provider rejected")) },
  };
}

describe("createStoryboard", () => {
  it("marks storyboard generation and project failed when provider rejects", async () => {
    const deps = dependencies();

    await expect(createStoryboard(input, deps)).rejects.toMatchObject({ code: "STORYBOARD_FAILED" });

    expect(deps.generations.updateStatus).toHaveBeenCalledWith("generation-id", "failed", expect.objectContaining({ errorCode: "STORYBOARD_FAILED" }));
    expect(deps.projects.updateStatus).toHaveBeenCalledWith("project-id", "storyboard_failed");
  });

  it("returns existing project and scenes for idempotent requests", async () => {
    const deps = dependencies();
    deps.projects.findOwnedByIdempotencyKey.mockResolvedValue(project);
    deps.scenes.listByProjectId.mockResolvedValue([scene(0)]);

    await expect(createStoryboard(input, deps)).resolves.toMatchObject({ status: 200, project: { id: "project-id" }, scenes: [{ id: "scene-0" }] });
  });
});
