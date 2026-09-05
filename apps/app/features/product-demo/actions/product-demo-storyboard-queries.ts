"use server";

import { createAuthServices } from "@/application/auth/services";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";

export type ProductDemoStoryboardScene = {
  id: string;
  title: string;
  duration: number;
  headline: string;
  description: string;
  visual: string;
};

export async function getProductDemoStoryboard(projectId: string): Promise<ProductDemoStoryboardScene[]> {
  const { authProvider } = await createAuthServices();
  const user = await authProvider.getCurrentUser();
  if (!user) return [];

  const db = createSupabaseServiceRoleClient();
  const project = await db.from("product_demo_projects").select("id").eq("id", projectId).eq("user_id", user.id).maybeSingle();
  if (!project.data) return [];
  const scenes = await db.from("product_demo_scenes").select("id,title,headline,description,visual,duration_seconds").eq("project_id", projectId).order("position");
  if (scenes.error) return [];
  return scenes.data.map((scene) => ({ id: scene.id, title: scene.title, headline: scene.headline, description: scene.description, visual: scene.visual, duration: scene.duration_seconds }));
}
