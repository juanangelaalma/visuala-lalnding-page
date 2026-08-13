import { videoRequestSchema } from "@/application/ai/schemas";
import { estimatedVideoCostUsd, providerModelId, resolutionFor, selectVideoModel } from "@/domain/ai/model-registry";
import type { QualityTier, StoryboardScene } from "@/domain/ai/types";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { ApiError, authenticated, failure, generationDto } from "../../../_shared";

type Context = { params: Promise<{ projectId: string }> };
const generationColumns = "id,scene_id,type,status,output_assets,error_code,created_at,completed_at";

export async function POST(request: Request, context: Context) {
  try {
    const user = await authenticated();
    const { projectId } = await context.params;
    const input = videoRequestSchema.parse(await request.json());
    const db = createSupabaseServiceRoleClient();

    const project = await db.from("ai_projects").select("id,quality").eq("id", projectId).eq("user_id", user.id).single();
    if (project.error) throw new ApiError(404, "NOT_FOUND", "Project not found");

    const scenes = await db
      .from("ai_scenes")
      .select("id,scene_type,motion_complexity,video_prompt,duration_seconds,approved_image_generation_id")
      .eq("project_id", projectId)
      .order("position");
    if (scenes.error || !scenes.data.length) throw new ApiError(409, "NO_SCENES", "Project has no scenes");
    if (scenes.data.some((scene) => !scene.approved_image_generation_id)) {
      throw new ApiError(409, "IMAGES_NOT_APPROVED", "Approve every scene image first");
    }

    const images = await db
      .from("ai_generations")
      .select("id,output_assets,status")
      .in("id", scenes.data.map((scene) => scene.approved_image_generation_id!))
      .eq("status", "succeeded");
    if (images.error || images.data.length !== scenes.data.length || images.data.some((image) => !image.output_assets[0])) {
      throw new ApiError(409, "IMAGES_UNAVAILABLE", "Approved images are unavailable");
    }

    const results = [];
    let hasAtlasGeneration = false;
    for (const scene of scenes.data) {
      const idempotencyKey = `${input.idempotencyKey}:${scene.id}`;
      const model = selectVideoModel(
        { sceneType: scene.scene_type, motionComplexity: scene.motion_complexity } as StoryboardScene,
        project.data.quality as QualityTier,
      );
      const local = model === "video_animated_image";
      const charge = project.data.quality === "premium" ? 15 : 10;
      if (!local) hasAtlasGeneration = true;
      const existing = await db.from("ai_generations").select(generationColumns).eq("project_id", projectId).eq("idempotency_key", idempotencyKey).maybeSingle();
      if (existing.data) {
        if (!local && existing.data.status === "awaiting_credit") {
          const reservation = await db.rpc("reserve_ai_generation_credits", {
            p_user_id: user.id,
            p_project_id: projectId,
            p_generation_id: existing.data.id,
            p_idempotency_key: `ai:${existing.data.id}`,
            p_amount: charge,
          } as never);
          if (reservation.error) throw reservation.error;
          existing.data.status = "queued";
        }
        results.push(await generationDto(existing.data));
        continue;
      }

      const estimatedCostUsd = estimatedVideoCostUsd(model, scene.duration_seconds);
      if (estimatedCostUsd > input.maxEstimatedCostUsd) {
        throw new ApiError(422, "COST_LIMIT_EXCEEDED", `Estimated cost for scene ${scene.id} exceeds the request limit`);
      }
      const image = images.data.find((candidate) => candidate.id === scene.approved_image_generation_id)!;
      const previous = await db
        .from("ai_generations")
        .select("id,attempt_number")
        .eq("scene_id", scene.id)
        .in("type", ["video", "composition"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (previous.error) throw previous.error;

      const row = await db.from("ai_generations").insert({
        project_id: projectId,
        scene_id: scene.id,
        parent_generation_id: previous.data?.id ?? null,
        attempt_number: (previous.data?.attempt_number ?? 0) + 1,
        type: local ? "composition" : "video",
        logical_model_key: model,
        provider: local ? "local" : "atlas",
        provider_model_id: providerModelId(model),
        status: local ? "queued" : "awaiting_credit",
        prompt: scene.video_prompt,
        input_assets: [image.output_assets[0]],
        provider_request: local
          ? { boundary: "waiting_for_composer" }
          : { duration: scene.duration_seconds, resolution: resolutionFor(project.data.quality as QualityTier) },
        resolution: resolutionFor(project.data.quality as QualityTier),
        requested_duration_seconds: scene.duration_seconds,
        estimated_cost_usd: estimatedCostUsd,
        credits_charged: 0,
        idempotency_key: idempotencyKey,
      }).select().single();

      if (row.error) {
        const raced = await db.from("ai_generations").select(generationColumns).eq("project_id", projectId).eq("idempotency_key", idempotencyKey).single();
        if (raced.error) throw row.error;
        if (!local && raced.data.status === "awaiting_credit") {
          const reservation = await db.rpc("reserve_ai_generation_credits", {
            p_user_id: user.id,
            p_project_id: projectId,
            p_generation_id: raced.data.id,
            p_idempotency_key: `ai:${raced.data.id}`,
            p_amount: charge,
          } as never);
          if (reservation.error) throw reservation.error;
          raced.data.status = "queued";
        }
        results.push(await generationDto(raced.data));
        continue;
      }

      if (!local) {
        const reservation = await db.rpc("reserve_ai_generation_credits", {
          p_user_id: user.id,
          p_project_id: projectId,
          p_generation_id: row.data.id,
          p_idempotency_key: `ai:${row.data.id}`,
          p_amount: charge,
        } as never);
        if (reservation.error) {
          throw reservation.error;
        }
      }

      results.push(await generationDto({ ...row.data, status: "queued" }));
    }

    await db.from("ai_projects").update({ status: hasAtlasGeneration ? "generating_scenes" : "composition_waiting" }).eq("id", projectId);
    return Response.json({
      generations: results,
      batch: { complete: results.length === scenes.data.length },
      composition: { status: "waiting_for_composer", processed: false },
    }, { status: 202 });
  } catch (error) {
    return failure(error);
  }
}
