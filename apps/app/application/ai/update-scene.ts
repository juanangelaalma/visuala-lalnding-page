import type { AiSceneRepository } from "@/domain/ai/contracts";
import { AiDomainError } from "@/domain/ai/errors";
import type { AiScene } from "@/domain/ai/types";

type Input = {
  ownerId: string;
  sceneId: string;
  title?: string;
  imagePrompt?: string;
  videoPrompt?: string;
  negativePrompt?: string;
  dialogue?: string;
  durationSeconds?: number;
};

type Dependencies = { scenes: AiSceneRepository };

export async function updateScene(input: Input, deps: Dependencies): Promise<{ scene: AiScene }> {
  const existing = await deps.scenes.findOwnedById(input.sceneId, input.ownerId);
  if (!existing) throw new AiDomainError(404, "NOT_FOUND", "Scene not found");

  const imageChanged = input.imagePrompt !== undefined || input.negativePrompt !== undefined;

  const scene = await deps.scenes.update(input.sceneId, {
    title: input.title,
    imagePrompt: input.imagePrompt,
    videoPrompt: input.videoPrompt,
    negativePrompt: input.negativePrompt,
    dialogue: input.dialogue,
    duration: input.durationSeconds,
    ...(imageChanged ? { approvedImageGenerationId: null } : {}),
  });

  return { scene };
}
