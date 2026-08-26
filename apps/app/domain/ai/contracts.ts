import type { AiAsset, AiGeneration, AiProject, AiScene, GenerationStatus } from "./types";

export type CreateAiProjectInput = Omit<AiProject, "id" | "createdAt" | "updatedAt">;
export type CreateAiSceneInput = Omit<AiScene, "id" | "createdAt" | "approvedImageGenerationId"> & { approvedImageGenerationId?: string | null };
export type CreateAiGenerationInput = Omit<AiGeneration, "id" | "createdAt" | "completedAt" | "outputAssets" | "errorCode" | "errorMessage"> & { outputAssets?: string[]; errorCode?: string | null; errorMessage?: string | null };

export interface AiAssetRepository {
  upload(input: { userId: string; contentType: string; body: Uint8Array; path: string }): Promise<AiAsset>;
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
  update(id: string, input: Partial<Pick<AiScene, "title" | "imagePrompt" | "videoPrompt" | "negativePrompt" | "dialogue" | "duration" | "approvedImageGenerationId">>): Promise<AiScene>;
  delete(id: string): Promise<void>;
}

export interface AiGenerationRepository {
  findByProjectIdempotencyKey(projectId: string, idempotencyKey: string): Promise<AiGeneration | null>;
  findById(id: string): Promise<AiGeneration | null>;
  listByProjectId(projectId: string): Promise<AiGeneration[]>;
  create(input: CreateAiGenerationInput): Promise<AiGeneration>;
  updateStatus(id: string, status: GenerationStatus, input?: { errorCode?: string | null; errorMessage?: string | null; outputAssets?: string[]; completedAt?: string | null }): Promise<void>;
}
