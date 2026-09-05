import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { authenticated, failure } from "../../ai/_shared";

export async function POST() {
  try {
    const user = await authenticated();
    const db = createSupabaseServiceRoleClient();
    const project = await db.from("product_demo_projects").insert({ user_id: user.id }).select("id").single();

    if (project.error) throw project.error;
    return Response.json({ project: project.data }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

export async function GET() {
  try {
    const user = await authenticated();
    const db = createSupabaseServiceRoleClient();
    const projects = await db
      .from("product_demo_projects")
      .select("id,name,duration,aspect_ratio,motion_style,status,created_at,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (projects.error) throw projects.error;

    return Response.json({
      projects: projects.data.map((project) => ({
        id: project.id,
        name: project.name,
        duration: project.duration,
        aspectRatio: project.aspect_ratio,
        motionStyle: project.motion_style,
        status: project.status,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      })),
    });
  } catch (error) {
    return failure(error);
  }
}
