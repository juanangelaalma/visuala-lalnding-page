import { GoogleGeminiTextProvider } from "@/infrastructure/ai/providers";
import { SupabaseAiAssetRepository } from "@/infrastructure/ai/supabase-ai-asset-repository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";
import { analyzeProduct } from "./analyze-product";
import { uploadReferenceAssets } from "./upload-reference-assets";

export function createAiServices() {
  return {
    analyzeProduct: (input: Parameters<typeof analyzeProduct>[0]) => analyzeProduct(input, { textProvider: new GoogleGeminiTextProvider() }),
    uploadReferenceAssets: (input: Parameters<typeof uploadReferenceAssets>[0]) => uploadReferenceAssets(input, { assets: new SupabaseAiAssetRepository(createSupabaseServiceRoleClient()) }),
  };
}
