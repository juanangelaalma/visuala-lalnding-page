import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiAssetRepository } from "@/domain/ai/contracts";
import type { AiAsset } from "@/domain/ai/types";
import type { Database } from "@/infrastructure/supabase/database.types";

const BUCKET = "ai-assets";
const MAX_BYTES = 100 * 1024 * 1024;
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm", "audio/mpeg", "audio/wav"]);

export class SupabaseAiAssetRepository implements AiAssetRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async upload(input: { userId: string; contentType: string; body: Uint8Array; path: string }): Promise<AiAsset> {
    rejectInvalidAsset(input.body, input.contentType);
    const { error } = await this.supabase.storage.from(BUCKET).upload(input.path, input.body, { contentType: input.contentType, upsert: false });
    if (error) throw new Error("Could not store asset");
    return { path: input.path, contentType: input.contentType };
  }

  async createSignedUrl(path: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from(BUCKET).createSignedUrl(path, 900);
    if (error || !data?.signedUrl) throw new Error("Could not sign asset");
    return data.signedUrl;
  }
}

function rejectInvalidAsset(body: Uint8Array, contentType: string) {
  if (!allowed.has(contentType) || body.byteLength > MAX_BYTES) throw new Error("Asset rejected");
}
