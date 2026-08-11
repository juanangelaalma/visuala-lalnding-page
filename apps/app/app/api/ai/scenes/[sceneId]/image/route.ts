import { imageRequestSchema } from "@/application/ai/schemas";
import { estimatedImageCostUsd, providerModelId, selectImageModel } from "@/domain/ai/model-registry";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { ApiError, authenticated, failure, generationDto } from "../../../_shared";

type Context={params:Promise<{sceneId:string}>};
export async function POST(request: Request, context: Context) {
  try {
    const user = await authenticated();
    const { sceneId } = await context.params;
    const input = imageRequestSchema.parse(await request.json());
    const db = createSupabaseServiceRoleClient();
    const scene = await db.from("ai_scenes").select("id,project_id,image_prompt,negative_prompt").eq("id", sceneId).single();
    if (scene.error) throw new ApiError(404, "NOT_FOUND", "Scene not found");

    const project = await db.from("ai_projects").select("id,reference_assets").eq("id", scene.data.project_id).eq("user_id", user.id).single();
    if (project.error) throw new ApiError(404, "NOT_FOUND", "Scene not found");

    const existing = await db.from("ai_generations").select("id,scene_id,type,status,output_assets,error_code,created_at,completed_at").eq("project_id", project.data.id).eq("idempotency_key", input.idempotencyKey).maybeSingle();
    if (existing.data) {
      if (existing.data.status === "awaiting_credit") {
        const reservation = await db.rpc("reserve_ai_generation_credits", {
          p_user_id: user.id,
          p_project_id: project.data.id,
          p_generation_id: existing.data.id,
          p_idempotency_key: `ai:${existing.data.id}`,
          p_amount: 1,
        } as never);
        if (reservation.error) throw reservation.error;
        existing.data.status = "queued";
      }
      return Response.json({ generation: generationDto(existing.data) });
    }

    const previous = await db.from("ai_generations").select("id,attempt_number").eq("scene_id", sceneId).eq("type", "image").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (previous.error) throw previous.error;

    const references = input.references.length ? input.references : project.data.reference_assets;
    const model = selectImageModel(references);
    const estimatedCostUsd = estimatedImageCostUsd(model);
    if (estimatedCostUsd > input.maxEstimatedCostUsd) {
      throw new ApiError(422, "COST_LIMIT_EXCEEDED", "Estimated image cost exceeds the request limit");
    }
    const row = await db.from("ai_generations").insert({
      project_id: project.data.id,
      scene_id: sceneId,
      parent_generation_id: previous.data?.id ?? null,
      attempt_number: (previous.data?.attempt_number ?? 0) + 1,
      type: "image",
      logical_model_key: model,
      provider: "atlas",
      provider_model_id: providerModelId(model),
      status: "awaiting_credit",
      prompt: scene.data.image_prompt,
      negative_prompt: scene.data.negative_prompt,
      input_assets: references,
      provider_request: { prompt: scene.data.image_prompt, negativePrompt: scene.data.negative_prompt, references },
      estimated_cost_usd: estimatedCostUsd,
      credits_charged: 0,
      idempotency_key: input.idempotencyKey,
    }).select().single();

    if (row.error) {
      const raced = await db.from("ai_generations").select("id,scene_id,type,status,output_assets,error_code,created_at,completed_at").eq("project_id", project.data.id).eq("idempotency_key", input.idempotencyKey).single();
      if (raced.error) throw row.error;
      if (raced.data.status === "awaiting_credit") {
        const reservation = await db.rpc("reserve_ai_generation_credits", {
          p_user_id: user.id,
          p_project_id: project.data.id,
          p_generation_id: raced.data.id,
          p_idempotency_key: `ai:${raced.data.id}`,
          p_amount: 1,
        } as never);
        if (reservation.error) throw reservation.error;
        raced.data.status = "queued";
      }
      return Response.json({ generation: generationDto(raced.data) });
    }

    const spent = await db.rpc("reserve_ai_generation_credits", {
      p_user_id: user.id,
      p_project_id: project.data.id,
      p_generation_id: row.data.id,
      p_idempotency_key: `ai:${row.data.id}`,
      p_amount: 1,
    } as never);
    if (spent.error) {
      throw spent.error;
    }

    return Response.json({ generation: generationDto({ ...row.data, status: "queued" }) }, { status: 202 });
  } catch (error) {
    return failure(error);
  }
}
