import "server-only";
import { randomUUID } from "node:crypto";
import type { AiWorkerDependencies, AiWorkerWork } from "@/domain/ai/contracts";
import type { VisualaModelKey } from "@/domain/ai/types";

export async function runAiWorker({ limit = 3 }: { limit?: number } = {}, dependencies: AiWorkerDependencies) {
  const worker = randomUUID();
  const [claimed, staleProjectIds] = await Promise.all([
    dependencies.generations.claimWork(worker, Math.min(Math.max(limit, 1), 10)),
    dependencies.generations.listExpiredSubmissionProjectIds(),
  ]);
  const projectIds = new Set(staleProjectIds);
  let processed = 0;
  for (const work of claimed) {
    projectIds.add(work.projectId);
    try {
      await processWork(work, worker, dependencies);
      processed++;
    } catch (error) {
      await recordWorkFailure(work, worker, error, dependencies);
    }
  }
  await Promise.all([...projectIds].map((projectId) => dependencies.generations.refreshProjectStatus(projectId)));
  return { claimed: claimed.length, processed };
}

async function processWork(work: AiWorkerWork, worker: string, dependencies: AiWorkerDependencies) {
  if (!work.providerGenerationId) return submitWork(work, worker, dependencies);
  const provider = work.type === "image" ? dependencies.imageProvider : dependencies.videoProvider;
  const result = await provider.getStatus(work.providerGenerationId);
  const outputAssets = result.status === "succeeded"
    ? await Promise.all(result.outputs.map((url, index) => dependencies.assets.copyRemoteAsset(url, `ai/${work.projectId}/${work.id}/${index}`)))
    : [];
  await dependencies.generations.savePollingResult({
    id: work.id,
    worker,
    status: result.status,
    outputAssets,
    providerResponse: result.raw,
    actualCostUsd: result.actualCostUsd ?? null,
    errorCode: result.status === "failed" ? "PROVIDER_GENERATION_FAILED" : result.status === "cancelled" ? "PROVIDER_GENERATION_CANCELLED" : null,
    completedAt: ["succeeded", "failed", "cancelled"].includes(result.status) ? new Date().toISOString() : null,
  });
}

async function submitWork(work: AiWorkerWork, worker: string, dependencies: AiWorkerDependencies) {
  const references = await dependencies.assets.signAssets(work.inputAssets);
  const result = work.type === "image"
    ? await dependencies.imageProvider.generate({ logicalModelKey: work.logicalModelKey as VisualaModelKey, prompt: [work.prompt, work.negativePrompt ? `Avoid: ${work.negativePrompt}` : null].filter(Boolean).join("\n"), references })
    : await dependencies.videoProvider.generate({ logicalModelKey: work.logicalModelKey as VisualaModelKey, prompt: work.prompt ?? "", image: references[0], duration: work.requestedDurationSeconds ?? 5, resolution: work.resolution === "1080p" ? "1080p" : "720p" });
  try {
    await dependencies.generations.saveSubmission({ id: work.id, worker, providerGenerationId: result.externalId, status: result.status, providerResponse: result.raw });
  } catch {
    throw { outcome: "ambiguous" };
  }
}

async function recordWorkFailure(work: AiWorkerWork, worker: string, error: unknown, dependencies: AiWorkerDependencies) {
  const outcome = error && typeof error === "object" && "outcome" in error ? error.outcome : "not_sent";
  if (!work.providerGenerationId && outcome !== "ambiguous") {
    await dependencies.generations.reverseFailedWork(work.id, worker, outcome === "rejected" ? "PROVIDER_REJECTED" : "PROVIDER_NOT_SENT");
    return;
  }
  await dependencies.generations.recordFailure({ id: work.id, worker, code: work.providerGenerationId ? "POLL_FAILED" : "SUBMISSION_UNKNOWN", unknownAfterSend: !work.providerGenerationId });
}
