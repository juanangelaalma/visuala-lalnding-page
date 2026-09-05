"use server";

import { createAuthServices } from "@/application/auth/services";
import { GoogleGeminiTextProvider } from "@/infrastructure/ai/providers";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { productDemoStoryboardSchema } from "../schemas/product-demo-storyboard-schema";

export type ProductDemoStoryboardActionState = {
  error?: string;
};

export async function generateProductDemoStoryboardAction(projectId: string): Promise<ProductDemoStoryboardActionState> {
  const { authProvider } = await createAuthServices();
  const user = await authProvider.getCurrentUser();
  if (!user) return { error: "Please log in to continue." };

  const db = createSupabaseServiceRoleClient();
  const project = await db.from("product_demo_projects").select("name,brief,feature_name,target_audience,goal,duration,aspect_ratio,motion_style").eq("id", projectId).eq("user_id", user.id).single();
  if (project.error || !project.data) return { error: "Project not found." };
  if (!project.data.brief || !project.data.goal || !project.data.motion_style) return { error: "Complete the product brief and video plan first." };

  try {
    const generated = await new GoogleGeminiTextProvider().generateStructured({
      schema: productDemoStoryboardSchema,
      prompt: `Create a launch-ready SaaS product demo storyboard. Return JSON only. Product name: ${project.data.name || "Unnamed product"}. Brief: ${project.data.brief}. Feature: ${project.data.feature_name ?? "not provided"}. Audience: ${project.data.target_audience ?? "not provided"}. Goal: ${project.data.goal}. Duration: ${project.data.duration}. Aspect ratio: ${project.data.aspect_ratio}. Motion style: ${project.data.motion_style}. Write 3 to 7 scenes. Each scene needs title, headline, description, visual, durationSeconds. Scenes must tell a cohesive product marketing story.`,
    });
    const totalDuration = generated.value.scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
    if (totalDuration > 45) return { error: "Generated storyboard exceeds the supported duration." };

    const deleted = await db.from("product_demo_scenes").delete().eq("project_id", projectId);
    if (deleted.error) throw deleted.error;
    const inserted = await db.from("product_demo_scenes").insert(generated.value.scenes.map((scene, position) => ({ project_id: projectId, position, title: scene.title, headline: scene.headline, description: scene.description, visual: scene.visual, duration_seconds: scene.durationSeconds })));
    if (inserted.error) throw inserted.error;
    const updated = await db.from("product_demo_projects").update({ status: "storyboard_ready" }).eq("id", projectId).eq("user_id", user.id);
    if (updated.error) throw updated.error;
  } catch {
    return { error: "Could not generate storyboard." };
  }

  return {};
}
