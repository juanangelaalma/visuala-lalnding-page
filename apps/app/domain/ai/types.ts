import { z } from "zod";

export const productSchema = z.object({ name: z.string().min(1), description: z.string().min(1), category: z.string().min(1), audience: z.string().min(1), sellingPoint: z.string().min(1), offer: z.string(), cta: z.string().min(1), keyMessage: z.string().min(1), concept: z.string().min(1) });
export type Product = z.infer<typeof productSchema>;
export const sceneTypeSchema = z.enum(["hook_light_motion", "product_showcase", "talking_to_camera", "complex_hand_interaction", "product_close_up", "benefit", "price_promo", "cta", "premium_render"]);
export const storyboardSceneSchema = z.object({
  title: z.string().min(1),
  sceneType: sceneTypeSchema,
  motionComplexity: z.enum(["low", "medium", "high"]),
  imagePrompt: z.string().min(1),
  videoPrompt: z.string().min(1),
  negativePrompt: z.string().default("text, captions, logos, watermarks, distorted hands, duplicate products"),
  dialogue: z.string(),
  duration: z.number().int().min(1).max(10),
});
export const storyboardSchema = z.object({ scenes: z.array(storyboardSceneSchema).min(3).max(7) });
export type StoryboardScene = z.infer<typeof storyboardSceneSchema>;
export type VisualaModelKey = "text_brain_default" | "image_storyboard_economy" | "image_reference_default" | "image_reference_fallback" | "video_animated_image" | "video_i2v_economy" | "video_i2v_default" | "video_i2v_complex" | "video_talking_head" | "video_i2v_premium" | "voice_default" | "voice_premium";
export type QualityTier = "economy" | "standard" | "premium";
export type GenerationStatus = "awaiting_credit" | "queued" | "submitting" | "unknown" | "processing" | "succeeded" | "failed" | "cancelled" | "dead_letter";
export type AiProjectStatus = "storyboard_processing" | "storyboard_ready" | "storyboard_failed" | "generating_scenes" | "composition_waiting";
export type AiGenerationType = "text" | "image" | "video" | "composition";

export type AiAsset = {
  path: string;
  contentType: string;
};

export type AiProject = {
  id: string;
  userId: string;
  product: Product;
  creator: string;
  durationSeconds: number;
  quality: QualityTier;
  referenceAssets: string[];
  status: AiProjectStatus;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
};

export type AiScene = StoryboardScene & {
  id: string;
  projectId: string;
  position: number;
  approvedImageGenerationId: string | null;
  createdAt: string;
};

export type AiGeneration = {
  id: string;
  projectId: string;
  sceneId: string | null;
  parentGenerationId: string | null;
  type: AiGenerationType;
  logicalModelKey: VisualaModelKey;
  provider: string;
  providerModelId: string;
  status: GenerationStatus;
  attemptNumber: number;
  prompt: string | null;
  negativePrompt: string | null;
  inputAssets: string[];
  outputAssets: string[];
  estimatedCostUsd: number | null;
  creditsCharged: number;
  idempotencyKey: string;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export function normalizeSceneDurations(scenes: StoryboardScene[], total: number): StoryboardScene[] {
  const current = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  if (current === total) return scenes;

  const scaled = scenes.map((scene) => Math.max(1, Math.floor((scene.duration * total) / current)));
  let remainder = total - scaled.reduce((sum, duration) => sum + duration, 0);
  for (let index = 0; remainder > 0; index = (index + 1) % scaled.length) {
    if (scaled[index] < 10) {
      scaled[index]++;
      remainder--;
    }
  }

  if (remainder !== 0 || scaled.some((duration) => duration > 10)) {
    throw new Error("Storyboard durations cannot be normalized");
  }

  return scenes.map((scene, index) => ({ ...scene, duration: scaled[index] }));
}
