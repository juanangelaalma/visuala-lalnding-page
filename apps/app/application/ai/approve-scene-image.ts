import type { AiGenerationRepository, AiSceneRepository } from "@/domain/ai/contracts";
import { AiDomainError } from "@/domain/ai/errors";

type Input = { ownerId: string; sceneId: string; generationId: string };
type Dependencies = { scenes: AiSceneRepository; generations: AiGenerationRepository };

export async function approveSceneImage(input: Input, deps: Dependencies): Promise<{ scene: { id: string; approvedImageGenerationId: string } }> {
  const generation = await deps.generations.findById(input.generationId);
  if (
    !generation ||
    generation.sceneId !== input.sceneId ||
    generation.type !== "image" ||
    generation.status !== "succeeded" ||
    generation.outputAssets.length === 0
  ) {
    throw new AiDomainError(409, "NOT_APPROVABLE", "Only a completed durable scene image can be approved");
  }

  const scene = await deps.scenes.findOwnedById(input.sceneId, input.ownerId);
  if (!scene) throw new AiDomainError(404, "NOT_FOUND", "Scene not found");

  const updated = await deps.scenes.update(input.sceneId, { approvedImageGenerationId: input.generationId });

  return { scene: { id: updated.id, approvedImageGenerationId: input.generationId } };
}
