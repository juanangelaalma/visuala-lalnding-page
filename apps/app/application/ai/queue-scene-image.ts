import { estimatedImageCostUsd, providerModelId, selectImageModel } from "@/domain/ai/model-registry";
import type { AiAssetRepository, AiGenerationRepository, AiProjectRepository, AiSceneRepository } from "@/domain/ai/contracts";
import { AiDomainError } from "@/domain/ai/errors";
import { generationDto } from "./generation-dto";

export type QueueSceneImageInput = { ownerId: string; sceneId: string; idempotencyKey: string; references: string[]; maxEstimatedCostUsd: number };
type Dependencies = { projects: AiProjectRepository; scenes: AiSceneRepository; generations: AiGenerationRepository; assets: AiAssetRepository };

export async function queueSceneImage(input: QueueSceneImageInput, deps: Dependencies) {
  const scene = await deps.scenes.findOwnedById(input.sceneId, input.ownerId);
  if (!scene) throw new AiDomainError(404, "NOT_FOUND", "Scene not found");
  const project = await deps.projects.findOwnedById(scene.projectId, input.ownerId);
  if (!project) throw new AiDomainError(404, "NOT_FOUND", "Scene not found");
  const existing = await deps.generations.findByProjectIdempotencyKey(project.id, input.idempotencyKey);
  if (existing) return queuedExistingGeneration(existing, project.id, input.ownerId, deps);
  const references = input.references.length ? input.references : project.referenceAssets;
  if (!references.every((path) => path.startsWith(`ai/${input.ownerId}/references/`))) throw new AiDomainError(403, "REFERENCE_ASSET_FORBIDDEN", "Reference assets must belong to the authenticated user");
  const model = selectImageModel(references);
  const estimatedCostUsd = estimatedImageCostUsd(model);
  if (estimatedCostUsd > input.maxEstimatedCostUsd) throw new AiDomainError(422, "COST_LIMIT_EXCEEDED", "Estimated image cost exceeds the request limit");
  const previous = await deps.generations.findLatestBySceneIdAndTypes(scene.id, ["image"]);
  let generation;
  try {
    generation = await deps.generations.create({ projectId: project.id, sceneId: scene.id, parentGenerationId: previous?.id ?? null, attemptNumber: (previous?.attemptNumber ?? 0) + 1, type: "image", logicalModelKey: model, provider: "atlas", providerModelId: providerModelId(model), status: "awaiting_credit", prompt: scene.imagePrompt, negativePrompt: scene.negativePrompt, inputAssets: references, estimatedCostUsd, creditsCharged: 0, idempotencyKey: input.idempotencyKey });
  } catch {
    generation = await deps.generations.findByProjectIdempotencyKey(project.id, input.idempotencyKey);
    if (!generation) throw new Error("Could not queue image generation");
    return queuedExistingGeneration(generation, project.id, input.ownerId, deps);
  }
  if (generation.status === "awaiting_credit") await reserve(generation.id, project.id, input.ownerId, 1, deps.generations);
  return { status: 202, generation: await generationDto({ ...generation, status: "queued" }, deps.assets) };
}

async function queuedExistingGeneration(generation: Awaited<ReturnType<AiGenerationRepository["findById"]>> & {}, projectId: string, userId: string, deps: Dependencies) {
  if (!generation) throw new Error("Generation missing");
  if (generation.status === "awaiting_credit") await reserve(generation.id, projectId, userId, 1, deps.generations);
  return { status: 200, generation: await generationDto({ ...generation, status: generation.status === "awaiting_credit" ? "queued" : generation.status }, deps.assets) };
}

async function reserve(generationId: string, projectId: string, userId: string, amount: number, generations: AiGenerationRepository) {
  try { await generations.reserveCredits({ generationId, projectId, userId, amount }); } catch (error) { if (error instanceof Error && error.message.includes("INSUFFICIENT_CREDITS")) throw new AiDomainError(402, "INSUFFICIENT_CREDITS", "Insufficient credits"); throw error; }
}
