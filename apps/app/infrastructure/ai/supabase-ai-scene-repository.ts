import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiSceneRepository, CreateAiSceneInput } from "@/domain/ai/contracts";
import type { AiScene } from "@/domain/ai/types";
import type { Database } from "@/infrastructure/supabase/database.types";

type SceneRow = Database["public"]["Tables"]["ai_scenes"]["Row"];

export class SupabaseAiSceneRepository implements AiSceneRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findOwnedById(id: string, userId: string): Promise<AiScene | null> {
    const { data, error } = await this.supabase.from("ai_scenes").select("*, ai_projects!inner(user_id)").eq("id", id).eq("ai_projects.user_id", userId).maybeSingle();
    if (error) throw error;
    return data ? mapScene(data as SceneRow) : null;
  }

  async listByProjectId(projectId: string): Promise<AiScene[]> {
    const { data, error } = await this.supabase.from("ai_scenes").select("*").eq("project_id", projectId).order("position");
    if (error) throw error;
    return data.map(mapScene);
  }

  async createMany(inputs: CreateAiSceneInput[]): Promise<AiScene[]> {
    const { data, error } = await this.supabase.from("ai_scenes").insert(inputs.map((input) => ({ project_id: input.projectId, position: input.position, title: input.title, scene_type: input.sceneType, motion_complexity: input.motionComplexity, image_prompt: input.imagePrompt, video_prompt: input.videoPrompt, negative_prompt: input.negativePrompt, dialogue: input.dialogue, duration_seconds: input.duration, approved_image_generation_id: input.approvedImageGenerationId }))).select("*");
    if (error) throw error;
    return data.map(mapScene);
  }

  async update(id: string, input: Parameters<AiSceneRepository["update"]>[1]): Promise<AiScene> {
    const { data, error } = await this.supabase.from("ai_scenes").update({ title: input.title, scene_type: input.sceneType, motion_complexity: input.motionComplexity, image_prompt: input.imagePrompt, video_prompt: input.videoPrompt, negative_prompt: input.negativePrompt, dialogue: input.dialogue, duration_seconds: input.duration, approved_image_generation_id: input.approvedImageGenerationId }).eq("id", id).select("*").single();
    if (error) throw error;
    return mapScene(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("ai_scenes").delete().eq("id", id);
    if (error) throw error;
  }
}

export function mapScene(row: SceneRow): AiScene {
  return { id: row.id, projectId: row.project_id, position: row.position, title: row.title, sceneType: row.scene_type as AiScene["sceneType"], motionComplexity: row.motion_complexity as AiScene["motionComplexity"], imagePrompt: row.image_prompt, videoPrompt: row.video_prompt, negativePrompt: row.negative_prompt, dialogue: row.dialogue, duration: row.duration_seconds, approvedImageGenerationId: row.approved_image_generation_id, createdAt: row.created_at };
}
