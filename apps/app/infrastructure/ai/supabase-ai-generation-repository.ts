import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiGenerationRepository, CreateAiGenerationInput } from "@/domain/ai/contracts";
import type { AiGeneration, GenerationStatus } from "@/domain/ai/types";
import type { Database } from "@/infrastructure/supabase/database.types";

type GenerationRow = Database["public"]["Tables"]["ai_generations"]["Row"];

export class SupabaseAiGenerationRepository implements AiGenerationRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findByProjectIdempotencyKey(projectId: string, idempotencyKey: string): Promise<AiGeneration | null> {
    const { data, error } = await this.supabase.from("ai_generations").select("*").eq("project_id", projectId).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (error) throw error;
    return data ? mapGeneration(data) : null;
  }

  async findById(id: string): Promise<AiGeneration | null> {
    const { data, error } = await this.supabase.from("ai_generations").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? mapGeneration(data) : null;
  }

  async findLatestBySceneIdAndTypes(sceneId: string, types: AiGeneration["type"][]): Promise<AiGeneration | null> {
    const { data, error } = await this.supabase.from("ai_generations").select("*").eq("scene_id", sceneId).in("type", types).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data ? mapGeneration(data) : null;
  }

  async hasGenerationHistoryForScene(sceneId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("ai_generations").select("id").eq("scene_id", sceneId).limit(1).maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async listByProjectId(projectId: string): Promise<AiGeneration[]> {
    const { data, error } = await this.supabase.from("ai_generations").select("*").eq("project_id", projectId).order("created_at");
    if (error) throw error;
    return data.map(mapGeneration);
  }

  async create(input: CreateAiGenerationInput): Promise<AiGeneration> {
    const { data, error } = await this.supabase.from("ai_generations").insert({ project_id: input.projectId, scene_id: input.sceneId, parent_generation_id: input.parentGenerationId, type: input.type, logical_model_key: input.logicalModelKey, provider: input.provider, provider_model_id: input.providerModelId, status: input.status, attempt_number: input.attemptNumber, prompt: input.prompt, negative_prompt: input.negativePrompt, input_assets: input.inputAssets, output_assets: input.outputAssets, estimated_cost_usd: input.estimatedCostUsd, credits_charged: input.creditsCharged, idempotency_key: input.idempotencyKey, error_code: input.errorCode, error_message: input.errorMessage }).select("*").single();
    if (error) throw error;
    return mapGeneration(data);
  }

  async reserveCredits(input: { userId: string; projectId: string; generationId: string; amount: number }): Promise<void> {
    const { error } = await this.supabase.rpc("reserve_ai_generation_credits", {
      p_user_id: input.userId,
      p_project_id: input.projectId,
      p_generation_id: input.generationId,
      p_idempotency_key: `ai:${input.generationId}`,
      p_amount: input.amount,
    } as never);
    if (error) throw error;
  }

  async updateStatus(id: string, status: GenerationStatus, input?: { errorCode?: string | null; errorMessage?: string | null; outputAssets?: string[]; completedAt?: string | null }): Promise<void> {
    const { error } = await this.supabase.from("ai_generations").update({ status, error_code: input?.errorCode, error_message: input?.errorMessage, output_assets: input?.outputAssets, completed_at: input?.completedAt }).eq("id", id);
    if (error) throw error;
  }
}

export function mapGeneration(row: GenerationRow): AiGeneration {
  return { id: row.id, projectId: row.project_id, sceneId: row.scene_id, parentGenerationId: row.parent_generation_id, type: row.type as AiGeneration["type"], logicalModelKey: row.logical_model_key as AiGeneration["logicalModelKey"], provider: row.provider, providerModelId: row.provider_model_id, status: row.status, attemptNumber: row.attempt_number, prompt: row.prompt, negativePrompt: row.negative_prompt, inputAssets: row.input_assets, outputAssets: row.output_assets, estimatedCostUsd: row.estimated_cost_usd, creditsCharged: row.credits_charged, idempotencyKey: row.idempotency_key, errorCode: row.error_code, errorMessage: row.error_message, createdAt: row.created_at, completedAt: row.completed_at };
}
