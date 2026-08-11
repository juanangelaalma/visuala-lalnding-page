import type { QualityTier, StoryboardScene, VisualaModelKey } from "./types";
import { z } from "zod";

const videoConfigSchema = z.object({
  modelId: z.string().min(1),
  estimatedCostUsdPerSecond: z.number().positive(),
  fields: z.object({
    prompt: z.string().min(1),
    image: z.string().min(1),
    duration: z.string().min(1).optional(),
    resolution: z.string().min(1).optional(),
    aspectRatio: z.string().min(1).optional(),
    audio: z.string().min(1).optional(),
  }),
  capabilities: z.object({ duration: z.boolean(), resolution: z.boolean(), aspectRatio: z.boolean(), audio: z.boolean() }),
});
const registrySchema = z.object({
  video_i2v_economy: videoConfigSchema,
  video_i2v_default: videoConfigSchema,
  video_i2v_complex: videoConfigSchema,
  video_talking_head: videoConfigSchema,
  video_i2v_premium: videoConfigSchema,
}).strict();
export type AtlasVideoConfig = z.infer<typeof videoConfigSchema>;

export function atlasVideoRegistry(raw = process.env.ATLAS_VIDEO_MODELS_JSON) {
  if (!raw) throw new Error("AI configuration missing: ATLAS_VIDEO_MODELS_JSON");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error("AI configuration invalid: ATLAS_VIDEO_MODELS_JSON"); }
  const parsed = registrySchema.safeParse(value);
  if (!parsed.success) throw new Error("AI configuration invalid: ATLAS_VIDEO_MODELS_JSON");
  return parsed.data;
}
const animated = new Set(["product_close_up", "benefit", "price_promo", "cta"]);
export function selectImageModel(references: string[]): VisualaModelKey { return references.length ? "image_reference_default" : "image_storyboard_economy"; }
export function selectVideoModel(scene: Pick<StoryboardScene, "sceneType" | "motionComplexity">, quality: QualityTier): VisualaModelKey {
  if (animated.has(scene.sceneType)) return "video_animated_image";
  if (quality === "economy" && scene.motionComplexity !== "high") return "video_i2v_economy";
  if (scene.sceneType === "talking_to_camera") return "video_talking_head";
  if (scene.sceneType === "complex_hand_interaction" || scene.motionComplexity === "high") return quality === "premium" ? "video_i2v_premium" : "video_i2v_complex";
  return "video_i2v_default";
}
export function providerModelId(key: VisualaModelKey): string {
  const fixed: Partial<Record<VisualaModelKey, string>> = { image_storyboard_economy: "bytedance/seedream-v4", image_reference_default: "bytedance/seedream-v4.5/edit", image_reference_fallback: "alibaba/qwen-image/edit-plus", video_animated_image: "remotion-animated-image-v1", voice_default: "google/gemini-2.5-flash-tts", voice_premium: "elevenlabs/v3/text-to-speech" };
  if (fixed[key]) return fixed[key]!;
  if (key === "text_brain_default") return process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  if (key.startsWith("video_") && key !== "video_animated_image") return atlasVideoRegistry()[key as keyof ReturnType<typeof atlasVideoRegistry>].modelId;
  throw new Error(`Unsupported model key: ${key}`);
}
export const resolutionFor = (quality: QualityTier): "720p" | "1080p" => quality === "premium" ? "1080p" : "720p";

export function estimatedImageCostUsd(key: VisualaModelKey) {
  if (key === "image_storyboard_economy") return 0.027;
  if (key === "image_reference_default") return 0.036;
  throw new Error(`No image cost configured for ${key}`);
}

export function estimatedVideoCostUsd(key: VisualaModelKey, durationSeconds: number) {
  if (key === "video_animated_image") return 0;
  const config = atlasVideoRegistry()[key as keyof ReturnType<typeof atlasVideoRegistry>];
  return config.estimatedCostUsdPerSecond * durationSeconds;
}
