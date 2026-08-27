import type { AiAssetRepository } from "@/domain/ai/contracts";
import type { AiGeneration } from "@/domain/ai/types";

export async function generationDto(generation: AiGeneration, assets: Pick<AiAssetRepository, "signAssets">) {
  return {
    id: generation.id,
    sceneId: generation.sceneId,
    type: generation.type,
    status: generation.status,
    assets: generation.status === "queued" ? [] : await assets.signAssets(generation.outputAssets),
    errorCode: generation.errorCode,
    createdAt: generation.createdAt,
    completedAt: generation.completedAt,
  };
}
