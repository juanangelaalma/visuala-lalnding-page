import "server-only";
import { randomUUID } from "node:crypto";
import type { AtlasImageProvider, AtlasVideoProvider } from "@/domain/ai/providers";
import type { GenerationStatus, VisualaModelKey } from "@/domain/ai/types";

type Work = {
  id: string;
  projectId: string;
  type: "image" | "video" | "composition";
  logicalModelKey: string;
  providerGenerationId: string | null;
  prompt: string | null;
  negativePrompt: string | null;
  inputAssets: string[];
  requestedDurationSeconds: number | null;
  resolution: string | null;
};

type WorkerDependencies = {
  generations: {
    claimWork(worker: string, limit: number): Promise<Work[]>;
    listExpiredSubmissionProjectIds(): Promise<string[]>;
    saveSubmission(input: { id: string; worker: string; providerGenerationId: string; status: GenerationStatus; providerResponse: unknown }): Promise<void>;
    savePollingResult(input: { id: string; worker: string; status: GenerationStatus; outputAssets: string[]; providerResponse: unknown; actualCostUsd: number | null; errorCode: string | null; completedAt: string | null }): Promise<void>;
    reverseFailedWork(id: string, worker: string, code: "PROVIDER_REJECTED" | "PROVIDER_NOT_SENT"): Promise<void>;
    recordFailure(input: { id: string; worker: string; code: "POLL_FAILED" | "SUBMISSION_UNKNOWN"; unknownAfterSend: boolean }): Promise<void>;
  };
  assets: { signAssets(paths: string[]): Promise<string[]>; copyRemoteAsset(url: string, path: string): Promise<string> };
  imageProvider: AtlasImageProvider;
  videoProvider: AtlasVideoProvider;
  refreshProjectStatus(projectId: string): Promise<void>;
};

export async function runAiWorker({ limit = 3 }: { limit?: number } = {}, dependencies: WorkerDependencies) {
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
  await Promise.all([...projectIds].map((projectId) => dependencies.refreshProjectStatus(projectId)));
  return { claimed: claimed.length, processed };
}

async function processWork(work: Work, worker: string, dependencies: WorkerDependencies) {
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

async function submitWork(work: Work, worker: string, dependencies: WorkerDependencies) {
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

async function recordWorkFailure(work: Work, worker: string, error: unknown, dependencies: WorkerDependencies) {
  const outcome = error && typeof error === "object" && "outcome" in error ? error.outcome : "not_sent";
  if (!work.providerGenerationId && outcome !== "ambiguous") {
    await dependencies.generations.reverseFailedWork(work.id, worker, outcome === "rejected" ? "PROVIDER_REJECTED" : "PROVIDER_NOT_SENT");
    return;
  }
  await dependencies.generations.recordFailure({ id: work.id, worker, code: work.providerGenerationId ? "POLL_FAILED" : "SUBMISSION_UNKNOWN", unknownAfterSend: !work.providerGenerationId });
}
