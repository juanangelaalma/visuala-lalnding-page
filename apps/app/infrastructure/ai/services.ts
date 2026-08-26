import { analyzeProduct } from "@/application/ai/analyze-product";
import { createStoryboard } from "@/application/ai/create-storyboard";
import { getProjectStatus } from "@/application/ai/get-project-status";
import { uploadReferenceAssets } from "@/application/ai/upload-reference-assets";
import { GoogleGeminiTextProvider } from "./providers";
import { SupabaseAiAssetRepository } from "./supabase-ai-asset-repository";
import { SupabaseAiGenerationRepository } from "./supabase-ai-generation-repository";
import { SupabaseAiProjectRepository } from "./supabase-ai-project-repository";
import { SupabaseAiSceneRepository } from "./supabase-ai-scene-repository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/supabase/service-role-client";

export function createAiServices() {
  const client = createSupabaseServiceRoleClient();
  const assets = new SupabaseAiAssetRepository(client);
  const projects = new SupabaseAiProjectRepository(client);
  const scenes = new SupabaseAiSceneRepository(client);
  const generations = new SupabaseAiGenerationRepository(client);
  const textProvider = new GoogleGeminiTextProvider();
  return {
    analyzeProduct: (input: Parameters<typeof analyzeProduct>[0]) => analyzeProduct(input, { textProvider }),
    createStoryboard: (input: Parameters<typeof createStoryboard>[0]) => createStoryboard(input, { projects, scenes, generations, textProvider }),
    getProjectStatus: (input: Parameters<typeof getProjectStatus>[0]) => getProjectStatus(input, { projects, scenes, generations, assets }),
    uploadReferenceAssets: (input: Parameters<typeof uploadReferenceAssets>[0]) => uploadReferenceAssets(input, { assets }),
  };
}
