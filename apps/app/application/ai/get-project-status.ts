import type { AiAssetRepository, AiGenerationRepository, AiProjectRepository, AiSceneRepository } from "@/domain/ai/contracts";
import { AiDomainError } from "@/domain/ai/errors";
import type { AiGeneration, AiProject, AiScene } from "@/domain/ai/types";

type Dependencies = { projects: AiProjectRepository; scenes: AiSceneRepository; generations: AiGenerationRepository; assets: AiAssetRepository };

export async function getProjectStatus(input: { ownerId: string; projectId: string }, deps: Dependencies) {
  const project = await deps.projects.findOwnedById(input.projectId, input.ownerId);
  if (!project) throw new AiDomainError(404, "NOT_FOUND", "Project not found");
  const [scenes, generations] = await Promise.all([deps.scenes.listByProjectId(project.id), deps.generations.listByProjectId(project.id)]);
  return { project: projectDto(project), scenes: scenes.map(sceneDto), generations: await Promise.all(generations.map((generation) => generationDto(generation, deps.assets))), finalComposition: { status: "waiting_for_composer", processed: false } };
}

async function generationDto(generation: AiGeneration, assets: AiAssetRepository) {
  return { id: generation.id, sceneId: generation.sceneId, type: generation.type, status: generation.status, assets: generation.status === "queued" ? [] : await assets.signAssets(generation.outputAssets), errorCode: generation.errorCode, createdAt: generation.createdAt, completedAt: generation.completedAt };
}

function projectDto(project: AiProject) {
  return { id: project.id, status: project.status, durationSeconds: project.durationSeconds, quality: project.quality, createdAt: project.createdAt, updatedAt: project.updatedAt };
}

function sceneDto(scene: AiScene) {
  return { id: scene.id, position: scene.position, title: scene.title, sceneType: scene.sceneType, motionComplexity: scene.motionComplexity, imagePrompt: scene.imagePrompt, videoPrompt: scene.videoPrompt, negativePrompt: scene.negativePrompt, dialogue: scene.dialogue, durationSeconds: scene.duration, approvedImageGenerationId: scene.approvedImageGenerationId };
}
