import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { authenticated, failure } from "../_shared";

function productName(product: unknown) {
  if (typeof product !== "object" || product === null || !("name" in product)) return "";
  return typeof product.name === "string" ? product.name : "";
}

export async function GET() {
  try {
    const user = await authenticated();
    const db = createSupabaseServiceRoleClient();
    const projects = await db
      .from("ai_projects")
      .select("id,product,duration_seconds,status,created_at,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (projects.error) throw projects.error;

    return Response.json({
      projects: projects.data.map((project) => ({
        id: project.id,
        name: productName(project.product),
        durationSeconds: project.duration_seconds,
        status: project.status,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      })),
    });
  } catch (error) {
    return failure(error);
  }
}
