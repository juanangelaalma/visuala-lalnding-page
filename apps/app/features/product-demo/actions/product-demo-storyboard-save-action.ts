"use server";

import { createAuthServices } from "@/application/auth/services";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { z } from "zod";

const sceneSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  headline: z.string().trim().min(1).max(240),
  description: z.string().trim().min(1).max(400),
  visual: z.string().trim().min(1).max(400),
  duration: z.number().int().min(1).max(10),
});

const storyboardSchema = z.object({
  projectId: z.string().uuid(),
  scenes: z.array(sceneSchema).min(1).max(12),
});

export type ProductDemoStoryboardSaveState = {
  error?: string;
};

export async function saveProductDemoStoryboardAction(input: unknown): Promise<ProductDemoStoryboardSaveState> {
  const parsed = storyboardSchema.safeParse(input);
  if (!parsed.success) return { error: "Check your storyboard scenes." };

  const { authProvider } = await createAuthServices();
  const user = await authProvider.getCurrentUser();
  if (!user) return { error: "Please log in to continue." };

  const db = createSupabaseServiceRoleClient();
  const project = await db.from("product_demo_projects").select("id").eq("id", parsed.data.projectId).eq("user_id", user.id).maybeSingle();
  if (!project.data) return { error: "Project not found." };

  const deleted = await db.from("product_demo_scenes").delete().eq("project_id", parsed.data.projectId);
  if (deleted.error) return { error: "Could not save storyboard." };
  const inserted = await db.from("product_demo_scenes").insert(parsed.data.scenes.map((scene, position) => ({ project_id: parsed.data.projectId, position, title: scene.title, headline: scene.headline, description: scene.description, visual: scene.visual, duration_seconds: scene.duration })));
  if (inserted.error) return { error: "Could not save storyboard." };

  return {};
}
