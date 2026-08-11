import { sceneUpdateSchema } from "@/application/ai/schemas";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { ApiError, authenticated, failure, sceneDto } from "../../_shared";

type Context = { params: Promise<{ sceneId: string }> };
const sceneColumns = "id,position,title,scene_type,motion_complexity,image_prompt,video_prompt,negative_prompt,dialogue,duration_seconds,approved_image_generation_id";

async function ownedScene(sceneId: string, userId: string) {
  const db = createSupabaseServiceRoleClient();
  const scene = await db.from("ai_scenes").select("id,project_id").eq("id", sceneId).single();
  if (scene.error) throw new ApiError(404, "NOT_FOUND", "Scene not found");
  const project = await db.from("ai_projects").select("id").eq("id", scene.data.project_id).eq("user_id", userId).single();
  if (project.error) throw new ApiError(404, "NOT_FOUND", "Scene not found");
  return { db, projectId: project.data.id };
}

export async function PATCH(request: Request, context: Context) {
  try {
    const user = await authenticated();
    const { sceneId } = await context.params;
    const input = sceneUpdateSchema.parse(await request.json());
    const { db, projectId } = await ownedScene(sceneId, user.id);
    const imageChanged = input.imagePrompt !== undefined || input.negativePrompt !== undefined;
    const updated = await db.from("ai_scenes").update({
      title: input.title,
      image_prompt: input.imagePrompt,
      video_prompt: input.videoPrompt,
      negative_prompt: input.negativePrompt,
      dialogue: input.dialogue,
      duration_seconds: input.durationSeconds,
      ...(imageChanged ? { approved_image_generation_id: null } : {}),
    }).eq("id", sceneId).eq("project_id", projectId).select(sceneColumns).single();
    if (updated.error) throw updated.error;
    return Response.json({ scene: sceneDto(updated.data) });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const user = await authenticated();
    const { sceneId } = await context.params;
    const { db, projectId } = await ownedScene(sceneId, user.id);
    const generation = await db.from("ai_generations").select("id").eq("scene_id", sceneId).limit(1).maybeSingle();
    if (generation.error) throw generation.error;
    if (generation.data) {
      throw new ApiError(409, "SCENE_HAS_GENERATIONS", "A scene with generation history cannot be deleted");
    }
    const deleted = await db.from("ai_scenes").delete().eq("id", sceneId).eq("project_id", projectId);
    if (deleted.error) throw deleted.error;
    return new Response(null, { status: 204 });
  } catch (error) {
    return failure(error);
  }
}
