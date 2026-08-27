import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiWorkerRepository } from "@/domain/ai/contracts";
import type { Database } from "@/infrastructure/supabase/database.types";

export class SupabaseAiWorkerRepository implements AiWorkerRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async claimWork(worker: string, limit: number) {
    const { data, error } = await this.supabase.rpc("claim_ai_generation_work", { p_worker: worker, p_limit: limit, p_lease_seconds: 300 });
    if (error) throw error;
    return data.map((row) => ({ id: row.id, projectId: row.project_id, type: row.type as "image" | "video" | "composition", logicalModelKey: row.logical_model_key as import("@/domain/ai/types").VisualaModelKey, providerGenerationId: row.provider_generation_id, prompt: row.prompt, negativePrompt: row.negative_prompt, inputAssets: row.input_assets, requestedDurationSeconds: row.requested_duration_seconds, resolution: row.resolution }));
  }

  async listExpiredSubmissionProjectIds() {
    const { data, error } = await this.supabase.from("ai_generations").select("project_id").eq("status", "unknown").eq("error_code", "SUBMISSION_LEASE_EXPIRED").limit(25);
    if (error) throw error;
    return data.map((row) => row.project_id);
  }

  async saveSubmission({ id, worker, providerGenerationId, status, providerResponse }: Parameters<AiWorkerRepository["saveSubmission"]>[0]) {
    const { error } = await this.supabase.from("ai_generations").update({ provider_generation_id: providerGenerationId, status, provider_response: providerResponse, lease_owner: null, lease_expires_at: null, next_attempt_at: new Date(Date.now() + 15_000).toISOString() }).eq("id", id).eq("lease_owner", worker);
    if (error) throw error;
  }

  async savePollingResult({ id, worker, status, outputAssets, providerResponse, actualCostUsd, errorCode, completedAt }: Parameters<AiWorkerRepository["savePollingResult"]>[0]) {
    const { error } = await this.supabase.from("ai_generations").update({ status, output_assets: outputAssets, provider_response: providerResponse, actual_cost_usd: actualCostUsd, error_code: errorCode, completed_at: completedAt, lease_owner: null, lease_expires_at: null, next_attempt_at: new Date(Date.now() + 30_000).toISOString() }).eq("id", id).eq("lease_owner", worker);
    if (error) throw error;
  }

  async reverseFailedWork(id: string, worker: string, code: "PROVIDER_REJECTED" | "PROVIDER_NOT_SENT") {
    const { data, error } = await this.supabase.rpc("fail_and_reverse_ai_generation", { p_generation_id: id, p_worker: worker, p_code: code });
    if (error || !data) throw error ?? new Error("Could not reverse failed AI generation");
  }

  async recordFailure({ id, worker, code, unknownAfterSend }: Parameters<AiWorkerRepository["recordFailure"]>[0]) {
    const { error } = await this.supabase.rpc("record_ai_work_failure", { p_id: id, p_worker: worker, p_code: code, p_message: "Provider operation failed", p_unknown_after_send: unknownAfterSend });
    if (error) throw error;
  }

  async refreshProjectStatus(projectId: string) {
    const { data, error } = await this.supabase.from("ai_generations").select("type,provider,status").eq("project_id", projectId).in("type", ["video", "composition"]);
    if (error || !data.length) return;
    const terminalFailure = data.some((item) => ["failed", "dead_letter", "unknown", "cancelled"].includes(item.status));
    const atlasPending = data.some((item) => item.provider === "atlas" && !["succeeded", "failed", "dead_letter", "cancelled", "unknown"].includes(item.status));
    const { error: updateError } = await this.supabase.from("ai_projects").update({ status: terminalFailure ? "failed" : atlasPending ? "generating_scenes" : "composition_waiting" }).eq("id", projectId);
    if (updateError) throw updateError;
  }
}
