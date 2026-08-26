import { analyzeProduct } from "@/application/ai/analyze-product";
import { uploadReferenceAssets } from "@/application/ai/upload-reference-assets";
import { GoogleGeminiTextProvider } from "./providers";
import { SupabaseAiAssetRepository } from "./supabase-ai-asset-repository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";

export function createAiServices() {
  return {
    analyzeProduct: (input: Parameters<typeof analyzeProduct>[0]) => analyzeProduct(input, { textProvider: new GoogleGeminiTextProvider() }),
    uploadReferenceAssets: (input: Parameters<typeof uploadReferenceAssets>[0]) => uploadReferenceAssets(input, { assets: new SupabaseAiAssetRepository(createSupabaseServiceRoleClient()) }),
  };
}
