import { analyzeProduct } from "@/application/ai/analyze-product";
import { createStoryboard } from "@/application/ai/create-storyboard";
import { getProjectStatus } from "@/application/ai/get-project-status";
import { uploadReferenceAssets } from "@/application/ai/upload-reference-assets";
import { approveSceneImage } from "@/application/ai/approve-scene-image";
import { deleteScene } from "@/application/ai/delete-scene";
import { updateScene } from "@/application/ai/update-scene";
import { queueSceneImage } from "@/application/ai/queue-scene-image";
import { queueProjectVideo } from "@/application/ai/queue-project-video";
import { runAiWorker } from "@/application/ai/worker";
import { AtlasImageAdapter, AtlasVideoAdapter, GoogleGeminiTextProvider } from "./providers";
import { copyRemoteAsset } from "./supabase-assets";
import { SupabaseAiAssetRepository } from "./supabase-ai-asset-repository";
import { SupabaseAiGenerationRepository } from "./supabase-ai-generation-repository";
import { SupabaseAiProjectRepository } from "./supabase-ai-project-repository";
import { SupabaseAiSceneRepository } from "./supabase-ai-scene-repository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";

export function createAiServices() {
  const client = createSupabaseServiceRoleClient();
  const assets = new SupabaseAiAssetRepository(client);
  const projects = new SupabaseAiProjectRepository(client);
  const scenes = new SupabaseAiSceneRepository(client);
  const generations = new SupabaseAiGenerationRepository(client);
  const textProvider = new GoogleGeminiTextProvider();
  return {
    analyzeProduct: (input: Parameters<typeof analyzeProduct>[0]) => analyzeProduct(input, { textProvider }),
    createStoryboard: (input: Parameters<typeof createStoryboard>[0]) => createStoryboard(input, { projects, scenes, generations, textProvider }),
    getProjectStatus: (input: Parameters<typeof getProjectStatus>[0]) => getProjectStatus(input, { projects, scenes, generations, assets }),
    uploadReferenceAssets: (input: Parameters<typeof uploadReferenceAssets>[0]) => uploadReferenceAssets(input, { assets }),
    updateScene: (input: Parameters<typeof updateScene>[0]) => updateScene(input, { scenes }),
    deleteScene: (input: Parameters<typeof deleteScene>[0]) => deleteScene(input, { scenes, generations }),
    approveSceneImage: (input: Parameters<typeof approveSceneImage>[0]) => approveSceneImage(input, { scenes, generations }),
    queueSceneImage: (input: Parameters<typeof queueSceneImage>[0]) => queueSceneImage(input, { projects, scenes, generations, assets }),
    queueProjectVideo: (input: Parameters<typeof queueProjectVideo>[0]) => queueProjectVideo(input, { projects, scenes, generations, assets }),
    runAiWorker: (input = {}) => runAiWorker(input, {
      generations: {
        claimWork: async (worker, limit) => {
          const { data, error } = await client.rpc("claim_ai_generation_work", { p_worker: worker, p_limit: limit, p_lease_seconds: 300 });
          if (error) throw error;
          return data.map((row) => ({ id: row.id, projectId: row.project_id, type: row.type as "image" | "video" | "composition", logicalModelKey: row.logical_model_key, providerGenerationId: row.provider_generation_id, prompt: row.prompt, negativePrompt: row.negative_prompt, inputAssets: row.input_assets, requestedDurationSeconds: row.requested_duration_seconds, resolution: row.resolution }));
        },
        listExpiredSubmissionProjectIds: async () => {
          const { data, error } = await client.from("ai_generations").select("project_id").eq("status", "unknown").eq("error_code", "SUBMISSION_LEASE_EXPIRED").limit(25);
          if (error) throw error;
          return data.map((row) => row.project_id);
        },
        saveSubmission: async ({ id, worker, providerGenerationId, status, providerResponse }) => {
          const { error } = await client.from("ai_generations").update({ provider_generation_id: providerGenerationId, status, provider_response: providerResponse, lease_owner: null, lease_expires_at: null, next_attempt_at: new Date(Date.now() + 15_000).toISOString() }).eq("id", id).eq("lease_owner", worker);
          if (error) throw error;
        },
        savePollingResult: async ({ id, worker, status, outputAssets, providerResponse, actualCostUsd, errorCode, completedAt }) => {
          const { error } = await client.from("ai_generations").update({ status, output_assets: outputAssets, provider_response: providerResponse, actual_cost_usd: actualCostUsd, error_code: errorCode, completed_at: completedAt, lease_owner: null, lease_expires_at: null, next_attempt_at: new Date(Date.now() + 30_000).toISOString() }).eq("id", id).eq("lease_owner", worker);
          if (error) throw error;
        },
        reverseFailedWork: async (id, worker, code) => {
          const { data, error } = await client.rpc("fail_and_reverse_ai_generation", { p_generation_id: id, p_worker: worker, p_code: code });
          if (error || !data) throw error ?? new Error("Could not reverse failed AI generation");
        },
        recordFailure: async ({ id, worker, code, unknownAfterSend }) => {
          const { error } = await client.rpc("record_ai_work_failure", { p_id: id, p_worker: worker, p_code: code, p_message: "Provider operation failed", p_unknown_after_send: unknownAfterSend });
          if (error) throw error;
        },
      },
      assets: { signAssets: (paths) => assets.signAssets(paths), copyRemoteAsset },
      imageProvider: new AtlasImageAdapter(),
      videoProvider: new AtlasVideoAdapter(),
      refreshProjectStatus: async (projectId) => {
        const { data, error } = await client.from("ai_generations").select("type,provider,status").eq("project_id", projectId).in("type", ["video", "composition"]);
        if (error || !data.length) return;
        const terminalFailure = data.some((item) => ["failed", "dead_letter", "unknown", "cancelled"].includes(item.status));
        const atlasPending = data.some((item) => item.provider === "atlas" && !["succeeded", "failed", "dead_letter", "cancelled", "unknown"].includes(item.status));
        const { error: updateError } = await client.from("ai_projects").update({ status: terminalFailure ? "failed" : atlasPending ? "generating_scenes" : "composition_waiting" }).eq("id", projectId);
        if (updateError) throw updateError;
      },
    }),
  };
}
