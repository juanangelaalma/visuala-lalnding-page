import { z } from "zod";

export const productDemoStoryboardSchema = z.object({
  scenes: z.array(z.object({
    title: z.string().min(1).max(120),
    headline: z.string().min(1).max(240),
    description: z.string().min(1).max(400),
    visual: z.string().min(1).max(400),
    durationSeconds: z.number().int().min(1).max(10),
  })).min(3).max(7),
});
