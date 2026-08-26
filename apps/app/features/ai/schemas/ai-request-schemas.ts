import { z } from "zod";
import { productSchema } from "@/domain/ai/types";

const assetPathSchema = z.string().regex(/^ai\/[0-9a-f-]{36}\/references\/[\w.-]+$/i);

export const storyboardRequestSchema = z.object({
  product: productSchema,
  creator: z.string().min(1).max(80),
  duration: z.union([z.literal(12), z.literal(18), z.literal(25)]),
  quality: z.enum(["economy", "standard", "premium"]).default("standard"),
  referenceAssets: z.array(assetPathSchema).max(8).default([]),
});

export const imageRequestSchema = z.object({
  references: z.array(assetPathSchema).max(8).default([]),
  idempotencyKey: z.string().min(8).max(200),
  maxEstimatedCostUsd: z.number().positive().max(10).default(0.1),
});

export const videoRequestSchema = z.object({
  idempotencyKey: z.string().min(8).max(200),
  maxEstimatedCostUsd: z.number().positive().max(100).default(5),
});

export const approveSceneImageSchema = z.object({
  generationId: z.string().uuid(),
});

export const sceneUpdateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  imagePrompt: z.string().min(1).max(4000).optional(),
  videoPrompt: z.string().min(1).max(4000).optional(),
  negativePrompt: z.string().max(2000).optional(),
  dialogue: z.string().max(2000).optional(),
  durationSeconds: z.number().int().min(1).max(10).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one scene field is required");
