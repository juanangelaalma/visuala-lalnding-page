import { describe, expect, it, vi } from "vitest";
import { AiDomainError } from "@/domain/ai/errors";
import type { AiScene } from "@/domain/ai/types";
import { approveSceneImage } from "./approve-scene-image";
import { deleteScene } from "./delete-scene";
import { updateScene } from "./update-scene";

const scene: AiScene = {
  id: "scene-id",
  projectId: "project-id",
  position: 0,
  title: "Hook",
  sceneType: "hook_light_motion",
  motionComplexity: "low",
  imagePrompt: "coffee",
  videoPrompt: "coffee video",
  negativePrompt: "text",
  dialogue: "Try it",
  duration: 4,
  approvedImageGenerationId: "old-generation",
  createdAt: "2026-08-26T00:00:00.000Z",
};

function dependencies() {
  return {
    scenes: {
      findOwnedById: vi.fn().mockResolvedValue(scene),
      listByProjectId: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn().mockResolvedValue(scene),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    generations: {
      findByProjectIdempotencyKey: vi.fn(),
      findById: vi.fn(),
      hasGenerationHistoryForScene: vi.fn().mockResolvedValue(false),
      listByProjectId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
    },
  };
}

describe("scene workflows", () => {
  it("clears approved image when image prompt changes", async () => {
    const deps = dependencies();

    await updateScene({ ownerId: "user-id", sceneId: scene.id, imagePrompt: "new coffee" }, deps);

    expect(deps.scenes.update).toHaveBeenCalledWith(scene.id, expect.objectContaining({ approvedImageGenerationId: null }));
  });

  it("rejects deleting scene with generation history", async () => {
    const deps = dependencies();
    deps.generations.hasGenerationHistoryForScene.mockResolvedValue(true);

    await expect(deleteScene({ ownerId: "user-id", sceneId: scene.id }, deps)).rejects.toMatchObject({ code: "SCENE_HAS_GENERATIONS", status: 409 });
  });

  it("rejects approval for incomplete generation", async () => {
    const deps = dependencies();
    deps.generations.findById.mockResolvedValue({ id: "generation-id", sceneId: scene.id, type: "image", status: "processing", outputAssets: ["ai/path"] });

    await expect(approveSceneImage({ ownerId: "user-id", sceneId: scene.id, generationId: "generation-id" }, deps)).rejects.toBeInstanceOf(AiDomainError);
  });
});
