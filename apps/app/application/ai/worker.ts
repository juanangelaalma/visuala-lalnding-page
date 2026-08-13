import "server-only";
import { randomUUID } from "node:crypto";
import type { VisualaModelKey } from "@/domain/ai/types";
import { AtlasImageAdapter, AtlasOperationError, AtlasVideoAdapter } from "@/infrastructure/ai/providers";
import { copyRemoteAsset, createSignedAssetUrls } from "@/infrastructure/ai/supabase-assets";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";

type Work = {
  id: string;
  project_id: string;
  type: string;
  logical_model_key: string;
  provider_generation_id: string | null;
  prompt: string | null;
  negative_prompt: string | null;
  input_assets: string[];
  requested_duration_seconds: number | null;
  resolution: string | null;
};

async function updateProjectStatus(db: ReturnType<typeof createSupabaseServiceRoleClient>, projectId: string) {
  const generations = await db
    .from("ai_generations")
    .select("type,provider,status")
    .eq("project_id", projectId)
    .in("type", ["video", "composition"]);
  if (generations.error || !generations.data.length) return;

  const terminalFailure = generations.data.some((item) => ["failed", "dead_letter", "unknown", "cancelled"].includes(item.status));
  const atlasPending = generations.data.some((item) => item.provider === "atlas" && !["succeeded", "failed", "dead_letter", "cancelled", "unknown"].includes(item.status));
  const status = terminalFailure ? "failed" : atlasPending ? "generating_scenes" : "composition_waiting";
  await db.from("ai_projects").update({ status }).eq("id", projectId);
}

export async function runAiWorker(limit = 3) {
  const db = createSupabaseServiceRoleClient();
  const worker = randomUUID();
  const claimed = await db.rpc("claim_ai_generation_work", {
    p_worker: worker,
    p_limit: Math.min(Math.max(limit, 1), 10),
    p_lease_seconds: 300,
  } as never);
  if (claimed.error) throw claimed.error;

  let processed = 0;
  const projectIds = new Set<string>();
  const stale = await db.from("ai_generations").select("project_id").eq("status", "unknown").eq("error_code", "SUBMISSION_LEASE_EXPIRED").limit(25);
  for (const row of stale.data ?? []) projectIds.add(row.project_id);
  for (const row of (claimed.data ?? []) as Work[]) {
    projectIds.add(row.project_id);
    let acceptedButUnpersisted = false;
    try {
      const adapter = row.type === "image" ? new AtlasImageAdapter() : new AtlasVideoAdapter();
      if (!row.provider_generation_id) {
        const references = await createSignedAssetUrls(row.input_assets);
        const result = row.type === "image"
          ? await new AtlasImageAdapter().generate({
              logicalModelKey: row.logical_model_key as VisualaModelKey,
              prompt: [row.prompt, row.negative_prompt ? `Avoid: ${row.negative_prompt}` : null].filter(Boolean).join("\n"),
              references,
            })
          : await new AtlasVideoAdapter().generate({
              logicalModelKey: row.logical_model_key as VisualaModelKey,
              prompt: row.prompt ?? "",
              image: references[0],
              duration: row.requested_duration_seconds ?? 5,
              resolution: row.resolution === "1080p" ? "1080p" : "720p",
            });
        acceptedButUnpersisted = true;

        const updated = await db.from("ai_generations").update({
          provider_generation_id: result.externalId,
          status: result.status,
          provider_response: result.raw,
          lease_owner: null,
          lease_expires_at: null,
          next_attempt_at: new Date(Date.now() + 15_000).toISOString(),
        }).eq("id", row.id).eq("lease_owner", worker);
        if (updated.error) throw updated.error;
        processed++;
        continue;
      }

      const result = await adapter.getStatus(row.provider_generation_id);
      const assets = result.status === "succeeded"
        ? await Promise.all(result.outputs.map((url, index) => copyRemoteAsset(url, `ai/${row.project_id}/${row.id}/${index}`)))
        : [];
      const updated = await db.from("ai_generations").update({
        status: result.status,
        output_assets: assets,
        provider_response: result.raw,
        actual_cost_usd: result.actualCostUsd ?? null,
        error_code: result.status === "failed" ? "PROVIDER_GENERATION_FAILED" : result.status === "cancelled" ? "PROVIDER_GENERATION_CANCELLED" : null,
        completed_at: ["succeeded", "failed", "cancelled"].includes(result.status) ? new Date().toISOString() : null,
        lease_owner: null,
        lease_expires_at: null,
        next_attempt_at: new Date(Date.now() + 30_000).toISOString(),
      }).eq("id", row.id).eq("lease_owner", worker);
      if (updated.error) throw updated.error;
      processed++;
    } catch (error) {
      const outcome = acceptedButUnpersisted ? "ambiguous" : error instanceof AtlasOperationError ? error.outcome : "not_sent";
      if (!row.provider_generation_id && outcome !== "ambiguous") {
        const failed = await db.rpc("fail_and_reverse_ai_generation", {
          p_generation_id: row.id,
          p_worker: worker,
          p_code: outcome === "rejected" ? "PROVIDER_REJECTED" : "PROVIDER_NOT_SENT",
        } as never);
        if (failed.error || !failed.data) throw failed.error ?? new Error("Could not reverse failed AI generation");
      } else {
        await db.rpc("record_ai_work_failure", {
          p_id: row.id,
          p_worker: worker,
          p_code: row.provider_generation_id ? "POLL_FAILED" : "SUBMISSION_UNKNOWN",
          p_message: "Provider operation failed",
          p_unknown_after_send: !row.provider_generation_id,
        } as never);
      }
    }
  }

  await Promise.all([...projectIds].map((projectId) => updateProjectStatus(db, projectId)));
  return { claimed: (claimed.data ?? []).length, processed };
}
