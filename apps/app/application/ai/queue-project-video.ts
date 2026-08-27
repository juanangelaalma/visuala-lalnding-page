import { estimatedVideoCostUsd, providerModelId, selectVideoModel } from "@/domain/ai/model-registry";
import type { AiAssetRepository, AiGenerationRepository, AiProjectRepository, AiSceneRepository } from "@/domain/ai/contracts";
import { AiDomainError } from "@/domain/ai/errors";
import { generationDto } from "./generation-dto";

export type QueueProjectVideoInput = { ownerId: string; projectId: string; idempotencyKey: string; maxEstimatedCostUsd: number };
type Dependencies = { projects: AiProjectRepository; scenes: AiSceneRepository; generations: AiGenerationRepository; assets: AiAssetRepository };

export async function queueProjectVideo(input: QueueProjectVideoInput, deps: Dependencies) {
  const project = await deps.projects.findOwnedById(input.projectId, input.ownerId);
  if (!project) throw new AiDomainError(404, "NOT_FOUND", "Project not found");
  const scenes = await deps.scenes.listByProjectId(project.id);
  if (!scenes.length) throw new AiDomainError(409, "NO_SCENES", "Project has no scenes");
  if (scenes.some((scene) => !scene.approvedImageGenerationId)) throw new AiDomainError(409, "IMAGES_NOT_APPROVED", "Approve every scene image first");
  const images = await deps.generations.listByProjectId(project.id);
  const approvedImages = scenes.map((scene) => images.find((image) => image.id === scene.approvedImageGenerationId));
  if (approvedImages.some((image) => !image || image.status !== "succeeded" || !image.outputAssets[0])) throw new AiDomainError(409, "IMAGES_UNAVAILABLE", "Approved images are unavailable");
  const generations = [];
  let hasAtlasGeneration = false;
  for (const scene of scenes) {
    const idempotencyKey = `${input.idempotencyKey}:${scene.id}`;
    const model = selectVideoModel(scene, project.quality);
    const local = model === "video_animated_image";
    const charge = project.quality === "premium" ? 15 : 10;
    if (!local) hasAtlasGeneration = true;
    let generation = await deps.generations.findByProjectIdempotencyKey(project.id, idempotencyKey);
    if (!generation) {
      const estimatedCostUsd = estimatedVideoCostUsd(model, scene.duration);
      if (estimatedCostUsd > input.maxEstimatedCostUsd) throw new AiDomainError(422, "COST_LIMIT_EXCEEDED", `Estimated cost for scene ${scene.id} exceeds the request limit`);
      const previous = await deps.generations.findLatestBySceneIdAndTypes(scene.id, ["video", "composition"]);
      try { generation = await deps.generations.create({ projectId: project.id, sceneId: scene.id, parentGenerationId: previous?.id ?? null, attemptNumber: (previous?.attemptNumber ?? 0) + 1, type: local ? "composition" : "video", logicalModelKey: model, provider: local ? "local" : "atlas", providerModelId: providerModelId(model), status: local ? "queued" : "awaiting_credit", prompt: scene.videoPrompt, negativePrompt: null, inputAssets: [approvedImages[scenes.indexOf(scene)]!.outputAssets[0]], estimatedCostUsd, creditsCharged: 0, idempotencyKey }); }
      catch { generation = await deps.generations.findByProjectIdempotencyKey(project.id, idempotencyKey); if (!generation) throw new Error("Could not queue video generation"); }
    }
    if (!local && generation.status === "awaiting_credit") await reserve(generation.id, project.id, input.ownerId, charge, deps.generations);
    generations.push(await generationDto({ ...generation, status: generation.status === "awaiting_credit" ? "queued" : generation.status }, deps.assets));
  }
  await deps.projects.updateStatus(project.id, hasAtlasGeneration ? "generating_scenes" : "composition_waiting");
  return { status: 202, generations, batch: { complete: generations.length === scenes.length }, composition: { status: "waiting_for_composer", processed: false } };
}

async function reserve(generationId: string, projectId: string, userId: string, amount: number, generations: AiGenerationRepository) {
  try { await generations.reserveCredits({ generationId, projectId, userId, amount }); } catch (error) { if (error instanceof Error && error.message.includes("INSUFFICIENT_CREDITS")) throw new AiDomainError(402, "INSUFFICIENT_CREDITS", "Insufficient credits"); throw error; }
}
