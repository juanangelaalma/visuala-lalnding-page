import { providerModelId } from "@/domain/ai/model-registry";
import type { AiGenerationRepository, AiProjectRepository, AiSceneRepository } from "@/domain/ai/contracts";
import { AiDomainError } from "@/domain/ai/errors";
import type { GeminiTextProvider } from "@/domain/ai/providers";
import { normalizeSceneDurations, storyboardSchema, type AiProject, type AiScene, type Product, type QualityTier } from "@/domain/ai/types";

type Input = { ownerId: string; idempotencyKey: string; product: Product; creator: string; duration: 12 | 18 | 25; quality: QualityTier; referenceAssets: string[] };
type Dependencies = { projects: AiProjectRepository; scenes: AiSceneRepository; generations: AiGenerationRepository; textProvider: GeminiTextProvider };

export async function createStoryboard(input: Input, deps: Dependencies) {
  assertOwnedReferenceAssets(input.referenceAssets, input.ownerId);
  const existing = await deps.projects.findOwnedByIdempotencyKey(input.ownerId, input.idempotencyKey);
  if (existing) return existingStoryboard(existing, deps.scenes);

  const project = await createProject(input, deps.projects);
  if (!project) return racedStoryboard(input, deps);
  const generation = await deps.generations.create(textGeneration(project.id, input.idempotencyKey));

  try {
    const generated = await deps.textProvider.generateStructured({ schema: storyboardSchema, prompt: storyboardPrompt(input) });
    const scenes = await deps.scenes.createMany(normalizeSceneDurations(generated.value.scenes, input.duration).map((scene, position) => ({ ...scene, projectId: project.id, position })));
    await deps.generations.updateStatus(generation.id, "succeeded", { completedAt: new Date().toISOString() });
    await deps.projects.updateStatus(project.id, "storyboard_ready");
    return { status: 201, project: projectDto({ ...project, status: "storyboard_ready" }), scenes: scenes.map(sceneDto) };
  } catch {
    await deps.generations.updateStatus(generation.id, "failed", { errorCode: "STORYBOARD_FAILED", errorMessage: "Storyboard generation failed", completedAt: new Date().toISOString() });
    await deps.projects.updateStatus(project.id, "storyboard_failed");
    throw new AiDomainError(500, "STORYBOARD_FAILED", "Storyboard generation failed");
  }
}

async function createProject(input: Input, projects: AiProjectRepository) {
  try {
    return await projects.create({ userId: input.ownerId, product: input.product, creator: input.creator, durationSeconds: input.duration, quality: input.quality, referenceAssets: input.referenceAssets, idempotencyKey: input.idempotencyKey, status: "storyboard_processing" });
  } catch {
    return null;
  }
}

async function racedStoryboard(input: Input, deps: Dependencies) {
  const project = await deps.projects.findOwnedByIdempotencyKey(input.ownerId, input.idempotencyKey);
  if (!project) throw new Error("Could not create storyboard project");
  return { status: 202, project: { id: project.id, status: project.status }, scenes: [] };
}

async function existingStoryboard(project: AiProject, scenes: AiSceneRepository) {
  return { status: 200, project: projectDto(project), scenes: (await scenes.listByProjectId(project.id)).map(sceneDto) };
}

function assertOwnedReferenceAssets(paths: string[], ownerId: string) {
  if (!paths.every((path) => path.startsWith(`ai/${ownerId}/references/`))) throw new AiDomainError(403, "REFERENCE_ASSET_FORBIDDEN", "Reference assets must belong to authenticated user");
}

function textGeneration(projectId: string, idempotencyKey: string) {
  return { projectId, sceneId: null, parentGenerationId: null, type: "text" as const, logicalModelKey: "text_brain_default" as const, provider: "gemini", providerModelId: providerModelId("text_brain_default"), status: "processing" as const, attemptNumber: 1, prompt: null, negativePrompt: null, inputAssets: [], estimatedCostUsd: null, creditsCharged: 0, idempotencyKey: `${idempotencyKey}:text` };
}

function storyboardPrompt(input: Input) {
  return `Create a ${input.duration}s vertical 9:16 Indonesian UGC affiliate storyboard. Product: ${JSON.stringify(input.product)}. Creator: ${input.creator}. Return valid scenes with a shared visual style, imagePrompt, videoPrompt, negativePrompt, dialogue, and durations totaling ${input.duration}. Do not render promotional copy inside images.`;
}

function projectDto(project: AiProject) {
  return { id: project.id, status: project.status, durationSeconds: project.durationSeconds, quality: project.quality, createdAt: project.createdAt };
}

function sceneDto(scene: AiScene) {
  return { id: scene.id, position: scene.position, title: scene.title, sceneType: scene.sceneType, motionComplexity: scene.motionComplexity, imagePrompt: scene.imagePrompt, videoPrompt: scene.videoPrompt, negativePrompt: scene.negativePrompt, dialogue: scene.dialogue, durationSeconds: scene.duration, approvedImageGenerationId: scene.approvedImageGenerationId };
}
