"use server";

import { createAuthServices } from "@/application/auth/services";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { productDemoSetupSchema } from "../schemas/product-demo-setup-schema";

export type ProductDemoActionState = {
  error?: string;
  message?: string;
};

export async function saveProductDemoSetupAction(input: unknown): Promise<ProductDemoActionState> {
  const parsed = productDemoSetupSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your project details." };

  const { authProvider } = await createAuthServices();
  const user = await authProvider.getCurrentUser();
  if (!user) return { error: "Please log in to continue." };

  const db = createSupabaseServiceRoleClient();
  const { error } = await db.from("product_demo_projects").update({
    brief: parsed.data.brief,
    name: parsed.data.name ?? "",
    product_url: parsed.data.productUrl,
    feature_name: parsed.data.featureName,
    target_audience: parsed.data.targetAudience,
    brand: parsed.data.brand,
    goal: parsed.data.goal,
    duration: parsed.data.duration,
    aspect_ratio: parsed.data.aspectRatio,
    motion_style: parsed.data.motionStyle,
  }).eq("id", parsed.data.projectId).eq("user_id", user.id);

  if (error) return { error: "Could not save product demo setup." };
  return { message: "Product demo saved." };
}
