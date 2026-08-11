import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { ApiError, authenticated, failure, generationDto, sceneDto } from "../../../_shared";

type Context = { params: Promise<{ projectId: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const user = await authenticated();
    const { projectId } = await context.params;
    const db = createSupabaseServiceRoleClient();
    const project = await db.from("ai_projects").select("id,status,duration_seconds,quality,created_at,updated_at").eq("id",projectId).eq("user_id",user.id).single();
    if (project.error) throw new ApiError(404,"NOT_FOUND","Project not found");
    const scenes = await db.from("ai_scenes").select("id,position,title,scene_type,motion_complexity,image_prompt,video_prompt,negative_prompt,dialogue,duration_seconds,approved_image_generation_id").eq("project_id",projectId).order("position");
    const generations = await db.from("ai_generations").select("id,scene_id,type,status,output_assets,error_code,created_at,completed_at").eq("project_id",projectId).order("created_at");
    if(scenes.error||generations.error)throw new Error("status query failed");
    return Response.json({project:{id:project.data.id,status:project.data.status,durationSeconds:project.data.duration_seconds,quality:project.data.quality,createdAt:project.data.created_at,updatedAt:project.data.updated_at},scenes:scenes.data.map(sceneDto),generations:generations.data.map(generationDto),finalComposition:{status:"waiting_for_composer",processed:false}});
  } catch(error) { return failure(error); }
}
