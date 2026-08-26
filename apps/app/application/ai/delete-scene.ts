import type { AiGenerationRepository, AiSceneRepository } from "@/domain/ai/contracts";
import { AiDomainError } from "@/domain/ai/errors";

type Input = { ownerId: string; sceneId: string };
type Dependencies = { scenes: AiSceneRepository; generations: AiGenerationRepository };

export async function deleteScene(input: Input, deps: Dependencies): Promise<void> {
  const scene = await deps.scenes.findOwnedById(input.sceneId, input.ownerId);
  if (!scene) throw new AiDomainError(404, "NOT_FOUND", "Scene not found");

  const hasHistory = await deps.generations.hasGenerationHistoryForScene(input.sceneId);
  if (hasHistory) throw new AiDomainError(409, "SCENE_HAS_GENERATIONS", "A scene with generation history cannot be deleted");

  await deps.scenes.delete(input.sceneId);
}
