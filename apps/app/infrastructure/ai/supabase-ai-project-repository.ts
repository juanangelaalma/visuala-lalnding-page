import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiProjectRepository, CreateAiProjectInput } from "@/domain/ai/contracts";
import type { AiProject } from "@/domain/ai/types";
import type { Database } from "@/infrastructure/supabase/database.types";

type ProjectRow = Database["public"]["Tables"]["ai_projects"]["Row"];

export class SupabaseAiProjectRepository implements AiProjectRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findOwnedById(id: string, userId: string): Promise<AiProject | null> {
    const { data, error } = await this.supabase.from("ai_projects").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    if (error) throw error;
    return data ? mapProject(data) : null;
  }

  async findOwnedByIdempotencyKey(userId: string, idempotencyKey: string): Promise<AiProject | null> {
    const { data, error } = await this.supabase.from("ai_projects").select("*").eq("user_id", userId).eq("idempotency_key", idempotencyKey).maybeSingle();
    if (error) throw error;
    return data ? mapProject(data) : null;
  }

  async create(input: CreateAiProjectInput): Promise<AiProject> {
    const { data, error } = await this.supabase.from("ai_projects").insert({ user_id: input.userId, product: input.product, creator: input.creator, duration_seconds: input.durationSeconds, quality: input.quality, reference_assets: input.referenceAssets, status: input.status, idempotency_key: input.idempotencyKey }).select("*").single();
    if (error) throw error;
    return mapProject(data);
  }

  async updateStatus(id: string, status: AiProject["status"]): Promise<void> {
    const { error } = await this.supabase.from("ai_projects").update({ status }).eq("id", id);
    if (error) throw error;
  }
}

export function mapProject(row: ProjectRow): AiProject {
  return { id: row.id, userId: row.user_id, product: row.product as AiProject["product"], creator: row.creator, durationSeconds: row.duration_seconds, quality: row.quality, referenceAssets: row.reference_assets, status: row.status as AiProject["status"], idempotencyKey: row.idempotency_key, createdAt: row.created_at, updatedAt: row.updated_at };
}
