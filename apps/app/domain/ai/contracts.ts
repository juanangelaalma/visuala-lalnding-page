import type { AtlasImageProvider, AtlasVideoProvider } from "./providers";
import type { AiAsset, AiGeneration, AiProject, AiScene, GenerationStatus, VisualaModelKey } from "./types";

export type CreateAiProjectInput = Omit<AiProject, "id" | "createdAt" | "updatedAt">;
export type CreateAiSceneInput = Omit<AiScene, "id" | "createdAt" | "approvedImageGenerationId"> & { approvedImageGenerationId?: string | null };
export type CreateAiGenerationInput = Omit<AiGeneration, "id" | "createdAt" | "completedAt" | "outputAssets" | "errorCode" | "errorMessage"> & { outputAssets?: string[]; errorCode?: string | null; errorMessage?: string | null };

export interface AiAssetRepository {
  upload(input: { userId: string; contentType: string; body: Uint8Array; path: string }): Promise<AiAsset>;
  signAssets(paths: string[]): Promise<string[]>;
}

export interface AiProjectRepository {
  findOwnedById(id: string, userId: string): Promise<AiProject | null>;
  findOwnedByIdempotencyKey(userId: string, idempotencyKey: string): Promise<AiProject | null>;
  create(input: CreateAiProjectInput): Promise<AiProject>;
  updateStatus(id: string, status: AiProject["status"]): Promise<void>;
}

export interface AiSceneRepository {
  findOwnedById(id: string, userId: string): Promise<AiScene | null>;
  listByProjectId(projectId: string): Promise<AiScene[]>;
  createMany(inputs: CreateAiSceneInput[]): Promise<AiScene[]>;
  update(id: string, input: Partial<Pick<AiScene, "title" | "sceneType" | "motionComplexity" | "imagePrompt" | "videoPrompt" | "negativePrompt" | "dialogue" | "duration" | "approvedImageGenerationId">>): Promise<AiScene>;
  delete(id: string): Promise<void>;
}

export type AiWorkerWork = {
  id: string;
  projectId: string;
  type: "image" | "video" | "composition";
  logicalModelKey: VisualaModelKey;
  providerGenerationId: string | null;
  prompt: string | null;
  negativePrompt: string | null;
  inputAssets: string[];
  requestedDurationSeconds: number | null;
  resolution: string | null;
};

export interface AiWorkerRepository {
  claimWork(worker: string, limit: number): Promise<AiWorkerWork[]>;
  listExpiredSubmissionProjectIds(): Promise<string[]>;
  saveSubmission(input: { id: string; worker: string; providerGenerationId: string; status: GenerationStatus; providerResponse: unknown }): Promise<void>;
  savePollingResult(input: { id: string; worker: string; status: GenerationStatus; outputAssets: string[]; providerResponse: unknown; actualCostUsd: number | null; errorCode: string | null; completedAt: string | null }): Promise<void>;
  reverseFailedWork(id: string, worker: string, code: "PROVIDER_REJECTED" | "PROVIDER_NOT_SENT"): Promise<void>;
  recordFailure(input: { id: string; worker: string; code: "POLL_FAILED" | "SUBMISSION_UNKNOWN"; unknownAfterSend: boolean }): Promise<void>;
  refreshProjectStatus(projectId: string): Promise<void>;
}

export type AiWorkerDependencies = {
  generations: AiWorkerRepository;
  assets: Pick<AiAssetRepository, "signAssets"> & { copyRemoteAsset(url: string, path: string): Promise<string> };
  imageProvider: AtlasImageProvider;
  videoProvider: AtlasVideoProvider;
};

export interface AiGenerationRepository {
  findByProjectIdempotencyKey(projectId: string, idempotencyKey: string): Promise<AiGeneration | null>;
  findById(id: string): Promise<AiGeneration | null>;
  findLatestBySceneIdAndTypes(sceneId: string, types: AiGeneration["type"][]): Promise<AiGeneration | null>;
  hasGenerationHistoryForScene(sceneId: string): Promise<boolean>;
  listByProjectId(projectId: string): Promise<AiGeneration[]>;
  create(input: CreateAiGenerationInput): Promise<AiGeneration>;
  reserveCredits(input: { userId: string; projectId: string; generationId: string; amount: number }): Promise<void>;
  updateStatus(id: string, status: GenerationStatus, input?: { errorCode?: string | null; errorMessage?: string | null; outputAssets?: string[]; completedAt?: string | null }): Promise<void>;
}
